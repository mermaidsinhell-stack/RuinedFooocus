from fastapi import APIRouter

from comfy.samplers import KSampler

import shared
from modules.sdxl_styles import load_styles
from api.schemas import (
    SettingsResponse,
    PerformancePresetInfo,
    ResolutionInfo,
    StyleInfo,
)

router = APIRouter()


@router.get("/settings", response_model=SettingsResponse)
async def get_settings():
    """
    Return all frontend-relevant configuration in a single payload:
    samplers, schedulers, performance presets, resolutions, styles,
    and the persisted default settings.
    """
    # Samplers and schedulers from ComfyUI
    samplers = sorted(KSampler.SAMPLERS)
    schedulers = sorted(KSampler.SCHEDULERS)

    # Performance presets
    performance_presets = []
    for name, opts in shared.performance_settings.performance_options.items():
        performance_presets.append(
            PerformancePresetInfo(
                name=name,
                custom_steps=opts.get("custom_steps", 30),
                cfg=opts.get("cfg", 8.0),
                sampler_name=opts.get("sampler_name", "dpmpp_2m_sde_gpu"),
                scheduler=opts.get("scheduler", "karras"),
                clip_skip=opts.get("clip_skip", 1),
            )
        )

    # Resolution presets
    resolutions = []
    for label, dims in shared.resolution_settings.aspect_ratios.items():
        resolutions.append(
            ResolutionInfo(label=label, width=dims[0], height=dims[1])
        )

    # Styles -- load_styles() returns a dict of {name: (prompt, negative_prompt)}
    raw_styles = load_styles()
    styles = []
    for name, (prompt, negative_prompt) in raw_styles.items():
        styles.append(
            StyleInfo(
                name=name,
                prompt=prompt,
                negative_prompt=negative_prompt,
            )
        )

    # Default settings from the SettingsManager
    default_settings = shared.settings.default_settings

    return SettingsResponse(
        samplers=samplers,
        schedulers=schedulers,
        performance_presets=performance_presets,
        resolutions=resolutions,
        styles=styles,
        default_settings=default_settings,
    )
