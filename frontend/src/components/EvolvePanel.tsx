import { useState } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select } from '@/components/ui/select'
import { api } from '@/api/client'

const MODE_OPTIONS = [
  { value: 'Tokens', label: 'Tokens' },
  { value: 'Words', label: 'Words' },
  { value: 'OBP Variant', label: 'OBP Variant' },
  { value: 'Copy to Prompt...', label: 'Copy to Prompt...' },
]

export interface EvolvePanelProps {
  prompt: string
  onPromptChange: (prompt: string) => void
  onTriggerGenerate?: () => void
}

export function EvolvePanel({ prompt, onPromptChange, onTriggerGenerate }: EvolvePanelProps) {
  const [mode, setMode] = useState('Tokens')
  const [strength, setStrength] = useState(10)
  const [loading, setLoading] = useState(false)

  const handleClick = async (button: number) => {
    if (!prompt.trim()) return
    setLoading(true)
    try {
      const res = await api.evolveMutate({ prompt, button, mode, strength })
      onPromptChange(res.prompt)
      if (mode !== 'Copy to Prompt...' && onTriggerGenerate) {
        onTriggerGenerate()
      }
    } catch (err) {
      console.error('Evolve error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* 3x3 Grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {Array.from({ length: 9 }, (_, i) => (
          <Button
            key={i + 1}
            variant="outline"
            size="sm"
            disabled={loading || !prompt.trim()}
            onClick={() => handleClick(i + 1)}
            className="text-xs h-8 rounded-lg"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : i + 1}
          </Button>
        ))}
      </div>

      {/* Mode */}
      <div className="space-y-1">
        <Label className="text-[13px]">Mode</Label>
        <Select
          value={mode}
          onValueChange={setMode}
          options={MODE_OPTIONS}
          className="h-8 text-xs"
        />
      </div>

      {/* Strength */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-[13px]">Strength</Label>
          <span className="text-[13px] text-muted-foreground">{strength}%</span>
        </div>
        <Slider
          min={0}
          max={100}
          step={1}
          value={strength}
          onValueChange={setStrength}
        />
      </div>
    </div>
  )
}
