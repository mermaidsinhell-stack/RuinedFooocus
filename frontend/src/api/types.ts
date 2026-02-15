export interface GenerateRequest {
  prompt: string
  negative_prompt: string
  base_model_name: string
  loras: LoraEntry[]
  style_selection: string[]
  performance_selection: string
  custom_steps: number
  cfg: number
  sampler_name: string
  scheduler: string
  clip_skip: number
  aspect_ratios_selection: string
  custom_width: number
  custom_height: number
  seed: number
  image_number: number
  auto_negative_prompt: boolean
  cn_selection: string | null
  cn_type: string | null
  input_image: string | null
  cn_edge_low: number
  cn_edge_high: number
  cn_start: number
  cn_stop: number
  cn_strength: number
  cn_upscale: string
}

export interface LoraEntry {
  name: string
  weight: number
  hash?: string
}

export interface GenerateResponse {
  task_id: number
}

export interface TaskStatus {
  task_id: number
  status: 'pending' | 'running' | 'complete' | 'error'
  images?: string[]
  error?: string
}

export interface ProgressMessage {
  type: 'progress' | 'complete' | 'error'
  percent: number
  status: string
  preview: string | null
  images?: string[]
  error?: string
}

export interface ModelInfo {
  name: string
  thumbnail: string | null
}

export interface LoraInfo {
  name: string
  thumbnail: string | null
  keywords: string[]
}

export interface StyleInfo {
  name: string
  prompt: string
  negative_prompt: string
}

export interface PerformancePreset {
  name: string
  custom_steps: number
  cfg: number
  sampler_name: string
  scheduler: string
  clip_skip: number
}

export interface ResolutionPreset {
  label: string
  width: number
  height: number
}

export interface ControlNetPreset {
  name: string
  type: string
  edge_low?: number | null
  edge_high?: number | null
  start?: number | null
  stop?: number | null
  strength?: number | null
  upscaler?: string | null
}

export interface OBPGenerateRequest {
  insanitylevel: number
  subject: string
  artist: string
  imagetype: string
  antistring: string
  prefixprompt: string
  suffixprompt: string
  givensubject: string
  smartsubject: boolean
  giventypeofimage: string
  imagemodechance: number
  chosengender: string
  chosensubjectsubtypeobject: string
  chosensubjectsubtypehumanoid: string
  chosensubjectsubtypeconcept: string
  givenoutfit: string
  obp_preset: string
  promptenhance: string
  modeltype: string
}

export interface OBPPreset {
  insanitylevel: number
  subject: string
  artist: string
  imagetype: string
  imagemodechance: number
  chosengender: string
  chosensubjectsubtypeobject: string
  chosensubjectsubtypehumanoid: string
  chosensubjectsubtypeconcept: string
  givensubject: string
  smartsubject: boolean
  givenoutfit: string
  prefixprompt: string
  suffixprompt: string
  giventypeofimage: string
  antistring: string
}

export interface OBPOptions {
  subjects: string[]
  artists: string[]
  imagetypes: string[]
  genders: string[]
  model_types: string[]
  prompt_enhance: string[]
  subtype_object: string[]
  subtype_humanoid: string[]
  subtype_concept: string[]
  preset_names: string[]
  presets: Record<string, OBPPreset>
}

export interface BrowseImageItem {
  url: string
  fullpath: string
  filename: string
}

export interface BrowseImagesResponse {
  images: BrowseImageItem[]
  page: number
  total_pages: number
  total_images: number
  range_text: string
}

export interface ImageMetadata {
  raw: Record<string, unknown>
  formatted: Record<string, unknown>
  formatted_string: string
}

export interface UpdateDBResponse {
  status: string
  image_count: number
  message: string
}

// ---------------------------------------------------------------------------
// Evolve
// ---------------------------------------------------------------------------

export interface EvolveMutateRequest {
  prompt: string
  button: number
  mode: string
  strength: number
}

export interface EvolveMutateResponse {
  prompt: string
  mode: string
}

// ---------------------------------------------------------------------------
// Llama / Chat
// ---------------------------------------------------------------------------

export interface LlamaPreset {
  name: string
  file: string
}

export interface ChatMessage {
  role: string
  content: string
}

export interface AssistantListItem {
  name: string
  path: string
}

export interface AssistantInfo {
  name: string
  greeting: string
  avatar_url: string
  system: string
  embed: string
}

export interface ChatSendRequest {
  system: string
  embed: string
  history: ChatMessage[]
}

export interface ChatSendResponse {
  task_id: number
}

export interface ChatStreamMessage {
  type: 'stream' | 'complete' | 'error'
  history?: ChatMessage[]
  message?: string
}

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

export interface PresetMetadata {
  Prompt?: string
  Negative?: string
  steps?: number
  cfg?: number
  width?: number
  height?: number
  seed?: number
  sampler_name?: string
  scheduler?: string
  base_model_name?: string
  base_model_hash?: string
  loras?: [string, string][]
  clip_skip?: number
  software?: string
}

export interface PresetInfo {
  name: string
  filename: string
  metadata: PresetMetadata | null
}

export interface PresetsResponse {
  presets: PresetInfo[]
}

export interface PathsData {
  [key: string]: string | string[]
}

export interface ModelFilesData {
  clip: string[]
  clip_vision: string[]
  vae: string[]
  llm: string[]
}

export interface SettingsData {
  samplers: string[]
  schedulers: string[]
  performance_presets: PerformancePreset[]
  resolutions: ResolutionPreset[]
  styles: StyleInfo[]
  default_settings: Record<string, unknown>
  controlnet_presets: ControlNetPreset[]
  controlnet_types: string[]
  upscalers: string[]
}
