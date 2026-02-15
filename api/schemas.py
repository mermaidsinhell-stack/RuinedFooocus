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
    cn_upscale: str = "None"


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


class ControlNetPresetInfo(BaseModel):
    name: str
    type: str
    edge_low: Optional[float] = None
    edge_high: Optional[float] = None
    start: Optional[float] = None
    stop: Optional[float] = None
    strength: Optional[float] = None
    upscaler: Optional[str] = None


class ControlNetPresetSave(BaseModel):
    name: str
    type: str
    edge_low: Optional[float] = None
    edge_high: Optional[float] = None
    start: Optional[float] = None
    stop: Optional[float] = None
    strength: Optional[float] = None
    upscaler: Optional[str] = None


class OBPGenerateRequest(BaseModel):
    insanitylevel: int = 5
    subject: str = "all"
    artist: str = "all"
    imagetype: str = "all"
    antistring: str = ""
    prefixprompt: str = ""
    suffixprompt: str = ""
    givensubject: str = ""
    smartsubject: bool = True
    giventypeofimage: str = ""
    imagemodechance: int = 20
    chosengender: str = "all"
    chosensubjectsubtypeobject: str = "all"
    chosensubjectsubtypehumanoid: str = "all"
    chosensubjectsubtypeconcept: str = "all"
    givenoutfit: str = ""
    obp_preset: str = "Standard"
    promptenhance: str = "none"
    modeltype: str = "SDXL"


class OBPPresetSave(BaseModel):
    name: str
    insanitylevel: int = 5
    subject: str = "all"
    artist: str = "all"
    imagetype: str = "all"
    imagemodechance: int = 20
    chosengender: str = "all"
    chosensubjectsubtypeobject: str = "all"
    chosensubjectsubtypehumanoid: str = "all"
    chosensubjectsubtypeconcept: str = "all"
    givensubject: str = ""
    smartsubject: bool = True
    givenoutfit: str = ""
    prefixprompt: str = ""
    suffixprompt: str = ""
    giventypeofimage: str = ""
    antistring: str = ""


class BrowseImageItem(BaseModel):
    url: str
    fullpath: str
    filename: str


class BrowseImagesResponse(BaseModel):
    images: list[BrowseImageItem]
    page: int
    total_pages: int
    total_images: int
    range_text: str


class ImageMetadataResponse(BaseModel):
    raw: dict
    formatted: dict
    formatted_string: str


class UpdateDBResponse(BaseModel):
    status: str
    image_count: int
    message: str


class EvolveMutateRequest(BaseModel):
    prompt: str
    button: int = Field(ge=1, le=9)
    mode: str = "Tokens"
    strength: int = Field(default=10, ge=0, le=100)


class EvolveMutateResponse(BaseModel):
    prompt: str
    mode: str


class LlamaPresetInfo(BaseModel):
    name: str
    file: str


class LlamaRewriteRequest(BaseModel):
    system_file: str
    prompt: str


class ChatMessage(BaseModel):
    role: str
    content: str


class AssistantListItem(BaseModel):
    name: str
    path: str


class SelectAssistantRequest(BaseModel):
    path: str


class AssistantInfo(BaseModel):
    name: str
    greeting: str
    avatar_url: str
    system: str
    embed: str


class ChatSendRequest(BaseModel):
    system: str
    embed: str = "[]"
    history: list[ChatMessage]


class ChatSendResponse(BaseModel):
    task_id: int


class SettingsResponse(BaseModel):
    samplers: list[str]
    schedulers: list[str]
    performance_presets: list[PerformancePresetInfo]
    resolutions: list[ResolutionInfo]
    styles: list[StyleInfo]
    default_settings: dict
    controlnet_presets: list[ControlNetPresetInfo] = Field(default_factory=list)
    controlnet_types: list[str] = Field(default_factory=list)
    upscalers: list[str] = Field(default_factory=list)


class SettingsSaveRequest(BaseModel):
    settings: dict = Field(default_factory=dict)
    paths: Optional[dict] = None


class SettingsSaveResponse(BaseModel):
    status: str


class PathsResponse(BaseModel):
    paths: dict


class ModelFilesResponse(BaseModel):
    clip: list[str] = Field(default_factory=list)
    clip_vision: list[str] = Field(default_factory=list)
    vae: list[str] = Field(default_factory=list)
    llm: list[str] = Field(default_factory=list)


class InterrogateRequest(BaseModel):
    image: str  # base64-encoded image data
    method: str = ""  # "brainblip", "clip", "florence", or "" for default


class InterrogateResponse(BaseModel):
    prompt: str


class HintResponse(BaseModel):
    hint: str


class StyleApplyRequest(BaseModel):
    styles: list[str]
    prompt: str = ""
    negative_prompt: str = ""


class StyleApplyResponse(BaseModel):
    prompt: str
    negative_prompt: str
