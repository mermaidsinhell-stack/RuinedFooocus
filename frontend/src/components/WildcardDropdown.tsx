import { useState, useEffect, useMemo } from 'react'
import { api } from '@/api/client'
import { cn } from '@/lib/utils'

export interface WildcardDropdownProps {
  prompt: string
  onPromptChange: (value: string) => void
}

function findUnclosedMarker(text: string): string | null {
  const parts = text.split('__')
  // If odd number of parts, there's an unclosed __ marker
  // parts.length = (number of __ separators) + 1
  // Unclosed means we have an odd count of __ markers
  if (parts.length >= 2 && parts.length % 2 === 0) {
    return parts[parts.length - 1]
  }
  return null
}

export function WildcardDropdown({ prompt, onPromptChange }: WildcardDropdownProps) {
  const [wildcards, setWildcards] = useState<string[]>([])

  useEffect(() => {
    api
      .getWildcards()
      .then((res) => setWildcards(res.wildcards))
      .catch((e) => { console.warn('Failed to load wildcards:', e); setWildcards([]) })
  }, [])

  const unclosed = useMemo(() => findUnclosedMarker(prompt), [prompt])

  const filtered = useMemo(() => {
    if (!unclosed || wildcards.length === 0) return []
    const lower = unclosed.toLowerCase()
    return wildcards.filter((w) => w.toLowerCase().includes(lower)).slice(0, 20)
  }, [unclosed, wildcards])

  if (!unclosed || filtered.length === 0) return null

  const handleSelect = (wildcard: string) => {
    const lastIdx = prompt.lastIndexOf('__')
    const newPrompt = `${prompt.slice(0, lastIdx)}__${wildcard}__`
    onPromptChange(newPrompt)
  }

  return (
    <div className="glass-card rounded-lg border border-primary/20 shadow-lg max-h-[200px] overflow-y-auto">
      {filtered.map((w) => (
        <button
          key={w}
          type="button"
          onClick={() => handleSelect(w)}
          className={cn(
            'w-full text-left px-3 py-1.5 text-[13px] text-foreground',
            'hover:bg-primary/10 transition-colors'
          )}
        >
          __{w}__
        </button>
      ))}
    </div>
  )
}
