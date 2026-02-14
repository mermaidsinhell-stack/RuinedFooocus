from fastapi import APIRouter

from comfy.samplers import KSampler

import shared
import modules.controlnet as controlnet
from modules.sdxl_styles import load_styles
from api.schemas import (
    ControlNetPresetInfo,
    SettingsResponse,
    PerformancePresetInfo,
    ResolutionInfo,
    StyleInfo,
    SettingsSaveRequest,
    SettingsSaveResponse,
    PathsResponse,
    ModelFilesResponse,
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

    # ControlNet presets
    cn_raw = controlnet.load_cnsettings()
    cn_presets = []
    for name, opts in cn_raw.items():
        cn_presets.append(
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

    # ControlNet types (capitalized)
    cn_types = [t.capitalize() for t in controlnet.controlnet_models.keys()]

    # Upscaler model filenames
    upscalers = list(shared.path_manager.upscaler_filenames)

    return SettingsResponse(
        samplers=samplers,
        schedulers=schedulers,
        performance_presets=performance_presets,
        resolutions=resolutions,
        styles=styles,
        default_settings=default_settings,
        controlnet_presets=cn_presets,
        controlnet_types=cn_types,
        upscalers=upscalers,
    )


@router.post("/settings/save", response_model=SettingsSaveResponse)
async def save_settings(req: SettingsSaveRequest):
    """Save user settings and paths to disk."""
    # Update regular settings
    for key, val in req.settings.items():
        if val is None or val == "":
            shared.settings.default_settings.pop(key, None)
        else:
            shared.settings.default_settings[key] = val

    shared.settings.save_settings()

    # Update path settings if provided
    if req.paths:
        for key, val in req.paths.items():
            if val is None or val == "":
                continue
            shared.path_manager.paths[key] = val
        shared.path_manager.save_paths()

    return SettingsSaveResponse(status="saved")


@router.get("/settings/paths", response_model=PathsResponse)
async def get_paths():
    """Return current path settings."""
    return PathsResponse(paths=shared.path_manager.paths)


@router.get("/settings/model-files", response_model=ModelFilesResponse)
async def get_model_files():
    """Return available model files for CLIP, VAE, and LLM dropdowns."""
    return ModelFilesResponse(
        clip=shared.path_manager.get_folder_list("clip"),
        clip_vision=shared.path_manager.get_folder_list("clip_vision"),
        vae=shared.path_manager.get_folder_list("vae"),
        llm=shared.path_manager.get_folder_list("llm"),
    )
