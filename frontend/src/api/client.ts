import type {
  GenerateRequest,
  GenerateResponse,
  ModelInfo,
  LoraInfo,
  SettingsData,
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
}
