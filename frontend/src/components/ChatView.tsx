import { useState, useRef, useEffect } from 'react'
import { Send, Square, Trash2, RefreshCw, Loader2, Bot, User } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { useChat } from '@/hooks/useChat'

export function ChatView() {
  const {
    assistants,
    selectedAssistant,
    history,
    isStreaming,
    selectAssistant,
    sendMessage,
    stopGeneration,
    clearHistory,
  } = useChat()

  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    sendMessage(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const selectedPath = assistants.find((a) => a.name === selectedAssistant?.name)?.path ?? ''

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left - Chat messages */}
      <div className="flex-[3] flex flex-col min-w-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {history.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">
                {assistants.length > 0
                  ? 'Select an assistant to start chatting'
                  : 'No assistants available'}
              </p>
            </div>
          )}
          {history.map((msg, i) => (
            <MessageBubble key={i} role={msg.role} content={msg.content} />
          ))}
          {isStreaming && history.length > 0 && history[history.length - 1].role !== 'assistant' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedAssistant ? 'Type a message...' : 'Select an assistant first'}
              disabled={!selectedAssistant || isStreaming}
              className="min-h-[44px] max-h-32 resize-none text-sm"
              rows={1}
            />
            {isStreaming ? (
              <Button
                variant="destructive"
                size="icon"
                onClick={stopGeneration}
                className="shrink-0"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || !selectedAssistant}
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Right - Assistant info */}
      <div className="flex-[1] border-l border-border overflow-y-auto p-4 space-y-4">
        {/* Assistant selector */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Assistant</label>
          <Select
            value={selectedPath}
            onValueChange={selectAssistant}
            options={assistants.map((a) => ({ value: a.path, label: a.name }))}
            placeholder="Select assistant..."
            className="h-8 text-xs"
          />
        </div>

        {/* Avatar */}
        {selectedAssistant && (
          <>
            <div className="rounded-lg overflow-hidden border border-border">
              <img
                src={selectedAssistant.avatar_url}
                alt={selectedAssistant.name}
                className="w-full object-cover aspect-square"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-semibold">{selectedAssistant.name}</h3>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={clearHistory}
            disabled={history.length === 0}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => {
              if (selectedPath) selectAssistant(selectedPath)
            }}
            disabled={!selectedAssistant}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Reload
          </Button>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ role, content }: { role: string; content: string }) {
  const isUser = role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        }`}
      >
        {content}
      </div>
    </div>
  )
}
