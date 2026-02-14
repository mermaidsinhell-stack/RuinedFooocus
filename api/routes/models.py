from pathlib import Path

from fastapi import APIRouter

import shared
from api.schemas import ModelInfo, LoraInfo

router = APIRouter()


def _find_thumbnail(cache_dir: Path, model_name: str) -> str | None:
    """Return the API-relative URL for a model thumbnail, or None."""
    base = cache_dir / Path(model_name).name
    for suffix in (".jpeg", ".jpg", ".png", ".gif"):
        candidate = base.with_suffix(suffix)
        if candidate.is_file():
            return str(candidate.name)
    return None


def _read_keywords(cache_dir: Path, model_name: str) -> list[str]:
    """Read the .txt keywords file that CivitAI update workers create."""
    txt_path = (cache_dir / Path(model_name).name).with_suffix(".txt")
    if txt_path.is_file():
        try:
            text = txt_path.read_text().strip()
            if text:
                return [kw.strip() for kw in text.split(",") if kw.strip()]
        except Exception:
            pass
    return []


@router.get("/models/checkpoints", response_model=list[ModelInfo])
async def list_checkpoints():
    """Return all available checkpoint model names with optional thumbnail URLs."""
    cache_dir = shared.models.cache_paths["checkpoints"]
    names = shared.models.get_names("checkpoints")
    results = []
    for name in names:
        thumb_file = _find_thumbnail(cache_dir, name)
        thumb_url = (
            f"/api/thumbnails/checkpoints/{thumb_file}" if thumb_file else None
        )
        results.append(ModelInfo(name=name, thumbnail=thumb_url))
    return results


@router.get("/models/loras", response_model=list[LoraInfo])
async def list_loras():
    """Return all available LoRA names with optional thumbnails and keywords."""
    cache_dir = shared.models.cache_paths["loras"]
    names = shared.models.get_names("loras")
    results = []
    for name in names:
        thumb_file = _find_thumbnail(cache_dir, name)
        thumb_url = (
            f"/api/thumbnails/loras/{thumb_file}" if thumb_file else None
        )
        keywords = _read_keywords(cache_dir, name)
        results.append(LoraInfo(name=name, thumbnail=thumb_url, keywords=keywords))
    return results


@router.post("/models/refresh")
async def refresh_models():
    """Trigger a background refresh of all model lists (checkpoints, loras, inbox)."""
    shared.models.update_all_models()
    return {"status": "refreshing"}
