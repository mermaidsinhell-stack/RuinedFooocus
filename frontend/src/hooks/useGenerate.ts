import { useState, useRef, useEffect, useCallback } from 'react'
import { api } from '@/api/client'
import { connectTaskWebSocket } from '@/api/websocket'
import type { GenerateRequest, ProgressMessage } from '@/api/types'

interface ProgressState {
  percent: number
  status: string
  preview: string | null
}

interface UseGenerateReturn {
  isGenerating: boolean
  progress: ProgressState | null
  images: string[]
  error: string | null
  generate: (params: GenerateRequest) => Promise<void>
  stop: () => Promise<void>
}

export function useGenerate(): UseGenerateReturn {
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [progress, setProgress] = useState<ProgressState | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)

  // Close WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [])

  const generate = useCallback(async (params: GenerateRequest) => {
    // Clean up any existing WebSocket
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    setIsGenerating(true)
    setProgress({ percent: 0, status: 'Starting...', preview: null })
    setError(null)

    try {
      const { task_id } = await api.generate(params)

      const ws = connectTaskWebSocket(
        task_id,
        (msg: ProgressMessage) => {
          switch (msg.type) {
            case 'progress':
              setProgress({
                percent: msg.percent,
                status: msg.status,
                preview: msg.preview,
              })
              break

            case 'complete':
              setProgress(null)
              setIsGenerating(false)
              if (msg.images) {
                setImages((prev) => [...msg.images!, ...prev])
              }
              wsRef.current = null
              break

            case 'error':
              setProgress(null)
              setIsGenerating(false)
              setError(msg.error ?? 'Generation failed')
              wsRef.current = null
              break
          }
        },
        () => {
          // onClose - if the WebSocket closes unexpectedly while still generating
          if (wsRef.current) {
            wsRef.current = null
            setIsGenerating((current) => {
              if (current) {
                setError('Connection lost during generation')
                setProgress(null)
              }
              return false
            })
          }
        },
      )

      wsRef.current = ws
    } catch (err) {
      setIsGenerating(false)
      setProgress(null)
      setError(err instanceof Error ? err.message : 'Failed to start generation')
    }
  }, [])

  const stop = useCallback(async () => {
    try {
      await api.stopGeneration()
    } catch (err) {
      console.error('Failed to stop generation:', err)
    }
  }, [])

  return { isGenerating, progress, images, error, generate, stop }
}
