"""Hint endpoint — random tips during generation."""

from fastapi import APIRouter

from modules.hints import get_hint

router = APIRouter()


@router.get("/hint")
async def hint():
    """Return a random hint/tip."""
    return {"hint": get_hint()}
