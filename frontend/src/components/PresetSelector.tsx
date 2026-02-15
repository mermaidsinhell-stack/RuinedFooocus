import { useState, useEffect, useCallback } from 'react'
import { X, Loader2 } from 'lucide-react'
import { api } from '@/api/client'
import type { PresetInfo, PresetMetadata, GenerateRequest, LoraEntry } from '@/api/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface PresetSelectorProps {
  onApplyPreset: (overrides: Partial<GenerateRequest>) => void
  onClearPreset: () => void
  activePreset: string | null
  onActivePresetChange: (name: string | null) => void
}

export function PresetSelector({
  onApplyPreset,
  onClearPreset,
  activePreset,
  onActivePresetChange,
}: PresetSelectorProps) {
  const [presets, setPresets] = useState<PresetInfo[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    api
      .getPresets()
      .then((res) => setPresets(res.presets))
      .catch((e) => { console.warn('Failed to load presets:', e); setPresets([]) })
      .finally(() => setLoading(false))
  }, [])

  const handleSelect = useCallback(
    (preset: PresetInfo) => {
      if (!preset.metadata || preset.metadata.software !== 'RuinedFooocus') return

      const m = preset.metadata
      const overrides: Partial<GenerateRequest> = {}

      if (m.steps !== undefined) overrides.custom_steps = m.steps
      if (m.cfg !== undefined) overrides.cfg = m.cfg
      if (m.width !== undefined) overrides.custom_width = m.width
      if (m.height !== undefined) overrides.custom_height = m.height
      if (m.sampler_name !== undefined) overrides.sampler_name = m.sampler_name
      if (m.scheduler !== undefined) overrides.scheduler = m.scheduler
      if (m.clip_skip !== undefined) overrides.clip_skip = m.clip_skip
      if (m.base_model_name !== undefined) overrides.base_model_name = m.base_model_name

      if (m.loras && Array.isArray(m.loras)) {
        overrides.loras = m.loras
          .filter(([, desc]) => {
            const [, name] = desc.split(' - ', 2)
            return name && name !== 'None'
          })
          .map(([hash, desc]): LoraEntry => {
            const [weight, ...nameParts] = desc.split(' - ')
            return {
              name: nameParts.join(' - '),
              weight: parseFloat(weight) || 1.0,
              hash: hash || undefined,
            }
          })
      }

      onActivePresetChange(preset.name)
      onApplyPreset(overrides)
    },
    [onApplyPreset, onActivePresetChange]
  )

  const handleClear = useCallback(() => {
    onActivePresetChange(null)
    onClearPreset()
  }, [onActivePresetChange, onClearPreset])

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-4 flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-[13px]">Loading presets...</span>
      </div>
    )
  }

  if (presets.length === 0) return null

  return (
    <div className="glass-card rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-serif-display font-medium text-foreground">
          Preset
        </h3>
        {activePreset && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[12px] text-muted-foreground hover:text-foreground"
            onClick={handleClear}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {activePreset && (
        <p className="text-[12px] text-primary font-medium px-0.5">
          Active: {activePreset}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        {presets.map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => handleSelect(preset)}
            className={cn(
              'relative rounded-lg overflow-hidden border-2 transition-all duration-200 group',
              activePreset === preset.name
                ? 'border-primary shadow-sm'
                : 'border-transparent hover:border-primary/30'
            )}
          >
            <img
              src={`/api/presets/${encodeURIComponent(preset.filename)}/image`}
              alt={preset.name}
              className="w-full aspect-square object-cover"
              loading="lazy"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
              <p className="text-[11px] font-medium text-white truncate">
                {preset.name}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
