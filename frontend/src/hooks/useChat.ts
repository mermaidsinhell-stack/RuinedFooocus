import { useState, useEffect, useRef, useCallback } from 'react'

import { api } from '@/api/client'
import { connectChatWebSocket } from '@/api/websocket'
import type {
  AssistantListItem,
  AssistantInfo,
  ChatMessage,
  ChatStreamMessage,
} from '@/api/types'

export function useChat() {
  const [assistants, setAssistants] = useState<AssistantListItem[]>([])
  const [selectedAssistant, setSelectedAssistant] = useState<AssistantInfo | null>(null)
  const [history, setHistory] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  // Load assistants on mount
  useEffect(() => {
    api.getChatAssistants().then(setAssistants).catch(console.error)
  }, [])

  const selectAssistant = useCallback(async (path: string) => {
    try {
      const info = await api.selectAssistant(path)
      setSelectedAssistant(info)
      // Reset history with greeting
      setHistory(
        info.greeting
          ? [{ role: 'assistant', content: info.greeting }]
          : [],
      )
    } catch (err) {
      console.error('Failed to select assistant:', err)
    }
  }, [])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!selectedAssistant || isStreaming) return

      const userMsg: ChatMessage = { role: 'user', content: text }
      const newHistory = [...history, userMsg]
      setHistory(newHistory)
      setIsStreaming(true)

      try {
        const { task_id } = await api.chatSend({
          system: selectedAssistant.system,
          embed: selectedAssistant.embed,
          history: newHistory,
        })

        wsRef.current = connectChatWebSocket(
          task_id,
          (msg: ChatStreamMessage) => {
            if (msg.type === 'stream' && msg.history) {
              setHistory(msg.history)
            } else if (msg.type === 'complete' && msg.history) {
              setHistory(msg.history)
              setIsStreaming(false)
            } else if (msg.type === 'error') {
              console.error('Chat error:', msg.message)
              setIsStreaming(false)
            }
          },
          () => {
            setIsStreaming(false)
          },
        )
      } catch (err) {
        console.error('Failed to send message:', err)
        setIsStreaming(false)
      }
    },
    [selectedAssistant, history, isStreaming],
  )

  const stopGeneration = useCallback(async () => {
    try {
      await api.chatStop()
    } catch {
      // ignore
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsStreaming(false)
  }, [])

  const clearHistory = useCallback(() => {
    if (selectedAssistant?.greeting) {
      setHistory([{ role: 'assistant', content: selectedAssistant.greeting }])
    } else {
      setHistory([])
    }
  }, [selectedAssistant])

  return {
    assistants,
    selectedAssistant,
    history,
    isStreaming,
    selectAssistant,
    sendMessage,
    stopGeneration,
    clearHistory,
  }
}
