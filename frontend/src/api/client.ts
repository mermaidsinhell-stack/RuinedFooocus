import type {
  GenerateRequest,
  GenerateResponse,
  ModelInfo,
  LoraInfo,
  SettingsData,
  ControlNetPreset,
  OBPGenerateRequest,
  OBPOptions,
  OBPPreset,
  BrowseImagesResponse,
  ImageMetadata,
  UpdateDBResponse,
  EvolveMutateRequest,
  EvolveMutateResponse,
  LlamaPreset,
  AssistantListItem,
  AssistantInfo,
  ChatSendRequest,
  ChatSendResponse,
  PathsData,
  ModelFilesData,
} from './types'

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API error ${res.status}: ${text}`)
  }
  return res.json()
}

export const api = {
  generate(data: GenerateRequest): Promise<GenerateResponse> {
    return request('/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  stopGeneration(): Promise<void> {
    return request('/generate/stop', { method: 'POST' })
  },

  getCheckpoints(): Promise<ModelInfo[]> {
    return request('/models/checkpoints')
  },

  getLoras(): Promise<LoraInfo[]> {
    return request('/models/loras')
  },

  refreshModels(): Promise<void> {
    return request('/models/refresh', { method: 'POST' })
  },

  getSettings(): Promise<SettingsData> {
    return request('/settings')
  },

  saveControlNetPreset(preset: Omit<ControlNetPreset, 'name'> & { name: string }): Promise<{ status: string; presets: ControlNetPreset[] }> {
    return request('/controlnet/presets', {
      method: 'POST',
      body: JSON.stringify(preset),
    })
  },

  deleteControlNetPreset(name: string): Promise<{ status: string; presets: ControlNetPreset[] }> {
    return request(`/controlnet/presets/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    })
  },

  getOBPOptions(): Promise<OBPOptions> {
    return request('/obp/options')
  },

  generateOBPPrompt(data: OBPGenerateRequest): Promise<{ prompt: string }> {
    return request('/obp/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  saveOBPPreset(data: { name: string } & OBPPreset): Promise<{ status: string; preset_names: string[] }> {
    return request('/obp/presets', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getBrowserImages(page: number = 1, search: string = ''): Promise<BrowseImagesResponse> {
    const params = new URLSearchParams({ page: String(page), search })
    return request(`/browser/images?${params}`)
  },

  getImageMetadata(fullpath: string): Promise<ImageMetadata> {
    const params = new URLSearchParams({ fullpath })
    return request(`/browser/metadata?${params}`)
  },

  updateBrowserDB(): Promise<UpdateDBResponse> {
    return request('/browser/update', { method: 'POST' })
  },

  // Evolve
  evolveMutate(data: EvolveMutateRequest): Promise<EvolveMutateResponse> {
    return request('/evolve/mutate', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Llama
  getLlamaPresets(): Promise<LlamaPreset[]> {
    return request('/llama/presets')
  },

  llamaRewrite(data: { system_file: string; prompt: string }): Promise<{ prompt: string }> {
    return request('/llama/rewrite', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Chat
  getChatAssistants(): Promise<AssistantListItem[]> {
    return request('/chat/assistants')
  },

  selectAssistant(path: string): Promise<AssistantInfo> {
    return request('/chat/select-assistant', {
      method: 'POST',
      body: JSON.stringify({ path }),
    })
  },

  chatSend(data: ChatSendRequest): Promise<ChatSendResponse> {
    return request('/chat/send', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  chatStop(): Promise<{ status: string }> {
    return request('/chat/stop', { method: 'POST' })
  },

  // Settings management
  saveSettings(data: { settings: Record<string, unknown>; paths?: Record<string, unknown> }): Promise<{ status: string }> {
    return request('/settings/save', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getPaths(): Promise<{ paths: PathsData }> {
    return request('/settings/paths')
  },

  getModelFiles(): Promise<ModelFilesData> {
    return request('/settings/model-files')
  },
}
