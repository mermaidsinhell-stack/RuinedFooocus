"""Preset image endpoints — list preset PNGs and read their embedded metadata."""

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from PIL import Image

import shared

router = APIRouter()


@router.get("/presets")
async def list_presets():
    """Return all preset PNG files with their embedded generation metadata."""
    preset_path = shared.path_manager.model_paths.get("preset_path")
    if not preset_path or not Path(preset_path).is_dir():
        return {"presets": []}

    presets = []
    for png in sorted(Path(preset_path).rglob("*.png")):
        name = png.with_suffix("").name
        if name.startswith("Place_preset") or name.startswith("."):
            continue

        metadata = None
        try:
            im = Image.open(png)
            raw = im.info.get("parameters", "")
            if raw:
                metadata = json.loads(raw)
        except Exception as e:
            print(f"WARNING: Failed to read preset metadata from {png.name}: {e}")

        presets.append({
            "name": name,
            "filename": png.name,
            "metadata": metadata,
        })

    return {"presets": presets}


@router.get("/presets/{filename}/image")
async def get_preset_image(filename: str):
    """Serve a preset PNG thumbnail."""
    preset_path = shared.path_manager.model_paths.get("preset_path")
    if not preset_path:
        raise HTTPException(status_code=404, detail="Preset path not configured")

    file = Path(preset_path) / filename
    if not file.is_file() or not str(file.resolve()).startswith(str(Path(preset_path).resolve())):
        raise HTTPException(status_code=404, detail="Preset not found")

    return FileResponse(str(file), media_type="image/png")
