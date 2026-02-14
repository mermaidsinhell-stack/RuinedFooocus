import { useState, useEffect } from 'react'
import { Loader2, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { api } from '@/api/client'
import type { LlamaPreset } from '@/api/types'

export interface LlamaRewriteProps {
  prompt: string
  onPromptChange: (prompt: string) => void
}

export function LlamaRewrite({ prompt, onPromptChange }: LlamaRewriteProps) {
  const [presets, setPresets] = useState<LlamaPreset[]>([])
  const [selectedFile, setSelectedFile] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.getLlamaPresets().then((list) => {
      setPresets(list)
      if (list.length > 0) {
        setSelectedFile(list[0].file)
      }
    }).catch(console.error)
  }, [])

  const handleRewrite = async () => {
    if (!prompt.trim() || !selectedFile) return
    setLoading(true)
    try {
      const res = await api.llamaRewrite({ system_file: selectedFile, prompt })
      onPromptChange(res.prompt)
    } catch (err) {
      console.error('Llama rewrite error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (presets.length === 0) return null

  return (
    <div className="flex items-center gap-2">
      <Select
        value={selectedFile}
        onValueChange={setSelectedFile}
        options={presets.map((p) => ({ value: p.file, label: p.name }))}
        placeholder="Select preset..."
        className="h-8 text-xs flex-1"
      />
      <Button
        variant="outline"
        size="sm"
        disabled={loading || !prompt.trim()}
        onClick={handleRewrite}
        className="h-8 text-xs shrink-0"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin mr-1" />
        ) : (
          <Sparkles className="h-3 w-3 mr-1" />
        )}
        Rewrite
      </Button>
    </div>
  )
}
