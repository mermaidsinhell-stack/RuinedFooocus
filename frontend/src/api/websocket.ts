import type { ProgressMessage, ChatStreamMessage } from './types'

export function connectTaskWebSocket(
  taskId: number,
  onMessage: (msg: ProgressMessage) => void,
  onClose?: () => void,
): WebSocket {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = window.location.host
  const ws = new WebSocket(`${protocol}//${host}/api/ws/generate/${taskId}`)

  ws.onmessage = (event) => {
    try {
      const msg: ProgressMessage = JSON.parse(event.data)
      onMessage(msg)
    } catch {
      // ignore malformed messages
    }
  }

  ws.onclose = () => {
    onClose?.()
  }

  return ws
}

export function connectChatWebSocket(
  taskId: number,
  onMessage: (msg: ChatStreamMessage) => void,
  onClose?: () => void,
): WebSocket {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = window.location.host
  const ws = new WebSocket(`${protocol}//${host}/api/ws/chat/${taskId}`)

  ws.onmessage = (event) => {
    try {
      const msg: ChatStreamMessage = JSON.parse(event.data)
      onMessage(msg)
    } catch {
      // ignore malformed messages
    }
  }

  ws.onclose = () => {
    onClose?.()
  }

  return ws
}
