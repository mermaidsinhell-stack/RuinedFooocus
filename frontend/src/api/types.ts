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

export interface SettingsData {
  samplers: string[]
  schedulers: string[]
  performance_presets: PerformancePreset[]
  resolutions: ResolutionPreset[]
  styles: StyleInfo[]
  default_settings: Record<string, unknown>
}
