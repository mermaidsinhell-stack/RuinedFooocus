from pydantic import BaseModel, Field
from typing import Optional


class LoraWeight(BaseModel):
    name: str
    weight: float = 1.0
    hash: Optional[str] = None


class GenerateRequest(BaseModel):
    prompt: str = ""
    negative_prompt: str = ""
    base_model_name: Optional[str] = None
    loras: list[LoraWeight] = Field(default_factory=list)
    style_selection: list[str] = Field(default_factory=list)
    performance_selection: str = "Speed"
    custom_steps: int = 30
    cfg: float = 8.0
    sampler_name: str = "dpmpp_2m_sde_gpu"
    scheduler: str = "karras"
    clip_skip: int = 1
    aspect_ratios_selection: str = "1152x896 (4:3)"
    custom_width: int = 1152
    custom_height: int = 896
    seed: int = -1
    image_number: int = 1
    auto_negative_prompt: bool = False
    cn_selection: str = "None"
    cn_type: str = "None"
    input_image: Optional[str] = None
    cn_edge_low: float = 0.2
    cn_edge_high: float = 0.8
    cn_start: float = 0.0
    cn_stop: float = 1.0
    cn_strength: float = 1.0


class GenerateResponse(BaseModel):
    task_id: int


class ModelInfo(BaseModel):
    name: str
    thumbnail: Optional[str] = None


class LoraInfo(BaseModel):
    name: str
    thumbnail: Optional[str] = None
    keywords: list[str] = Field(default_factory=list)


class StyleInfo(BaseModel):
    name: str
    prompt: str
    negative_prompt: str


class PerformancePresetInfo(BaseModel):
    name: str
    custom_steps: int
    cfg: float
    sampler_name: str
    scheduler: str
    clip_skip: int


class ResolutionInfo(BaseModel):
    label: str
    width: int
    height: int


class SettingsResponse(BaseModel):
    samplers: list[str]
    schedulers: list[str]
    performance_presets: list[PerformancePresetInfo]
    resolutions: list[ResolutionInfo]
    styles: list[StyleInfo]
    default_settings: dict
