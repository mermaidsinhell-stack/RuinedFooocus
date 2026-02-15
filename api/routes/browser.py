"""Image browser API routes."""

import asyncio
import json
import os
import urllib.parse
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from PIL import Image

import shared
from modules.imagebrowser import ImageBrowser, format_metadata, format_metadata_string
from api.schemas import BrowseImageItem, BrowseImagesResponse, ImageMetadataResponse, UpdateDBResponse

router = APIRouter()


def _get_browser() -> ImageBrowser:
    """Get or create the browser singleton."""
    if "browser" not in shared.shared_cache:
        shared.shared_cache["browser"] = ImageBrowser()
    return shared.shared_cache["browser"]


def _path_to_url(fullpath: str, outputs_dir: str) -> str:
    """Convert an absolute image path to an API-accessible URL."""
    try:
        rel = os.path.relpath(fullpath, outputs_dir)
        if not rel.startswith(".."):
            return f"/api/outputs/{rel}"
    except (ValueError, TypeError):
        pass
    return f"/api/browser/image?path={urllib.parse.quote(fullpath)}"


@router.get("/browser/images", response_model=BrowseImagesResponse)
async def browse_images(
    page: int = Query(1, ge=1),
    search: str = Query(""),
):
    """Return a paginated list of images from the browser database."""
    browser = _get_browser()
    outputs_dir = str(shared.path_manager.model_paths["temp_outputs_path"])

    browser.filter = search
    total_images, total_pages = browser.num_images_pages()
    image_paths, range_text = browser.load_images(page)

    items = []
    for img_path in image_paths:
        fp = str(img_path)
        items.append(BrowseImageItem(
            url=_path_to_url(fp, outputs_dir),
            fullpath=fp,
            filename=Path(fp).name,
        ))

    return BrowseImagesResponse(
        images=items,
        page=page,
        total_pages=total_pages,
        total_images=total_images,
        range_text=range_text,
    )


@router.get("/browser/metadata", response_model=ImageMetadataResponse)
async def get_metadata(fullpath: str = Query(...)):
    """Return metadata for a specific image by its full path."""
    browser = _get_browser()

    result = browser.sql_conn.execute(
        "SELECT json FROM images WHERE fullpath = ?", (fullpath,)
    )
    row = result.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Image not found in database")

    raw = json.loads(row[0])
    formatted = format_metadata(raw)
    formatted_string = format_metadata_string(raw)

    return ImageMetadataResponse(
        raw=raw,
        formatted=formatted,
        formatted_string=formatted_string,
    )


@router.get("/browser/metadata-by-url")
async def get_metadata_by_url(url: str = Query(...)):
    """Return metadata for an image given its URL path (e.g., /api/outputs/date/file.png).
    Reads directly from the PNG file rather than the database."""
    outputs_dir = str(shared.path_manager.model_paths["temp_outputs_path"])

    # Strip the /api/outputs/ prefix to get the relative path
    rel = url
    for prefix in ("/api/outputs/", "api/outputs/"):
        if rel.startswith(prefix):
            rel = rel[len(prefix):]
            break

    filepath = Path(outputs_dir) / rel
    resolved = filepath.resolve()

    # Security: ensure the resolved path is within the outputs directory
    if not str(resolved).startswith(str(Path(outputs_dir).resolve())):
        raise HTTPException(status_code=403, detail="Access denied")

    if not resolved.is_file():
        raise HTTPException(status_code=404, detail="Image not found")

    try:
        im = Image.open(resolved)
        raw_str = im.info.get("parameters", "")
        if raw_str:
            raw = json.loads(raw_str)
        else:
            raw = {}
    except Exception:
        raw = {}

    formatted = format_metadata(raw) if raw else {}
    formatted_string = format_metadata_string(raw) if raw else ""

    return ImageMetadataResponse(
        raw=raw,
        formatted=formatted,
        formatted_string=formatted_string,
    )


@router.post("/browser/update", response_model=UpdateDBResponse)
async def update_db():
    """Re-scan the filesystem and rebuild the image database."""
    browser = _get_browser()
    loop = asyncio.get_running_loop()
    image_count, message = await loop.run_in_executor(None, browser._scan_and_rebuild)
    return UpdateDBResponse(
        status="complete",
        image_count=image_count,
        message=message,
    )


@router.get("/browser/image")
async def serve_image(path: str = Query(...)):
    """Serve an image by absolute path (for archive folder images)."""
    browser = _get_browser()

    # Validate path exists in the database to prevent directory traversal
    result = browser.sql_conn.execute(
        "SELECT fullpath FROM images WHERE fullpath = ?", (path,)
    )
    if not result.fetchone():
        raise HTTPException(status_code=404, detail="Image not found in database")
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="Image file not found on disk")

    return FileResponse(path)
