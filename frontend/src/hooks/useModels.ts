import { useState, useEffect, useCallback } from 'react'
import { api } from '@/api/client'
import type { ModelInfo, LoraInfo } from '@/api/types'

interface UseModelsReturn {
  checkpoints: ModelInfo[]
  loras: LoraInfo[]
  loading: boolean
  refresh: () => void
}

export function useModels(): UseModelsReturn {
  const [checkpoints, setCheckpoints] = useState<ModelInfo[]>([])
  const [loras, setLoras] = useState<LoraInfo[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const fetchModels = useCallback(async () => {
    try {
      setLoading(true)
      const [checkpointData, loraData] = await Promise.all([
        api.getCheckpoints(),
        api.getLoras(),
      ])
      setCheckpoints(checkpointData)
      setLoras(loraData)
    } catch (err) {
      console.error('Failed to fetch models:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchModels()
  }, [fetchModels])

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      await api.refreshModels()
      await fetchModels()
    } catch (err) {
      console.error('Failed to refresh models:', err)
      setLoading(false)
    }
  }, [fetchModels])

  return { checkpoints, loras, loading, refresh }
}
