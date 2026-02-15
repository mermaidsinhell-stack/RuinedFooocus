"""Style application endpoint — apply style templates to prompt text."""

from fastapi import APIRouter

from api.schemas import StyleApplyRequest, StyleApplyResponse
from modules.sdxl_styles import apply_style

router = APIRouter()


@router.post("/styles/apply", response_model=StyleApplyResponse)
async def apply_styles(req: StyleApplyRequest):
    """Apply selected styles to prompt/negative prompt text."""
    prompt, negative = apply_style(req.styles, req.prompt, req.negative_prompt, "")
    return {"prompt": prompt, "negative_prompt": negative}
