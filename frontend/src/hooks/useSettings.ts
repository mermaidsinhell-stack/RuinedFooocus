import { useState, useEffect } from 'react'
import { api } from '@/api/client'
import type { SettingsData } from '@/api/types'

interface UseSettingsReturn {
  settings: SettingsData | null
  loading: boolean
  error: string | null
}

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchSettings() {
      try {
        setLoading(true)
        setError(null)
        const data = await api.getSettings()
        if (!cancelled) {
          setSettings(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load settings')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchSettings()

    return () => {
      cancelled = true
    }
  }, [])

  return { settings, loading, error }
}
