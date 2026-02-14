from fastapi import APIRouter, HTTPException

import modules.controlnet as controlnet
from api.schemas import ControlNetPresetInfo, ControlNetPresetSave

router = APIRouter()


def _presets_list() -> list[ControlNetPresetInfo]:
    """Load current presets and return as a list of ControlNetPresetInfo."""
    raw = controlnet.load_cnsettings()
    presets = []
    for name, opts in raw.items():
        presets.append(
            ControlNetPresetInfo(
                name=name,
                type=opts.get("type", ""),
                edge_low=opts.get("edge_low"),
                edge_high=opts.get("edge_high"),
                start=opts.get("start"),
                stop=opts.get("stop"),
                strength=opts.get("strength"),
                upscaler=opts.get("upscaler"),
            )
        )
    return presets


@router.post("/controlnet/presets")
async def save_preset(preset: ControlNetPresetSave):
    """Save or update a ControlNet preset."""
    if not preset.name.strip():
        raise HTTPException(status_code=400, detail="Preset name is required")

    current = controlnet.load_cnsettings()
    opts: dict = {"type": preset.type.lower()}
    if preset.start is not None:
        opts["start"] = preset.start
    if preset.stop is not None:
        opts["stop"] = preset.stop
    if preset.strength is not None:
        opts["strength"] = preset.strength
    if preset.type.lower() == "canny":
        if preset.edge_low is not None:
            opts["edge_low"] = preset.edge_low
        if preset.edge_high is not None:
            opts["edge_high"] = preset.edge_high
    if preset.upscaler is not None:
        opts["upscaler"] = preset.upscaler

    current[preset.name] = opts
    controlnet.save_cnsettings(current)
    return {"status": "saved", "presets": _presets_list()}


@router.delete("/controlnet/presets/{name}")
async def delete_preset(name: str):
    """Delete a ControlNet preset by name."""
    current = controlnet.load_cnsettings()
    if name not in current:
        raise HTTPException(status_code=404, detail=f"Preset '{name}' not found")
    del current[name]
    controlnet.save_cnsettings(current)
    return {"status": "deleted", "presets": _presets_list()}
