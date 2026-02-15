"""Wildcard file listing endpoint."""

from fastapi import APIRouter

import shared

router = APIRouter()


@router.get("/wildcards")
async def list_wildcards():
    """Return list of available wildcard names."""
    return {"wildcards": list(shared.wildcards or [])}
