import * as React from "react"
import { Select } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import type { PerformancePreset } from "@/api/types"

const CUSTOM_VALUE = "Custom..."

export interface GenerationSettingsProps {
  performancePresets: PerformancePreset[]
  performance: string
  onPerformanceChange: (value: string) => void
  customSteps: number
  cfg: number
  samplerName: string
  scheduler: string
  clipSkip: number
  samplers: string[]
  schedulers: string[]
  onStepsChange: (value: number) => void
  onCfgChange: (value: number) => void
  onSamplerChange: (value: string) => void
  onSchedulerChange: (value: string) => void
  onClipSkipChange: (value: number) => void
}

export function GenerationSettings({
  performancePresets,
  performance,
  onPerformanceChange,
  customSteps,
  cfg,
  samplerName,
  scheduler,
  clipSkip,
  samplers,
  schedulers,
  onStepsChange,
  onCfgChange,
  onSamplerChange,
  onSchedulerChange,
  onClipSkipChange,
}: GenerationSettingsProps) {
  const isCustom = performance === CUSTOM_VALUE

  const performanceOptions = [
    ...performancePresets.map((p) => ({ value: p.name, label: p.name })),
    { value: CUSTOM_VALUE, label: "Custom..." },
  ]

  const samplerOptions = samplers.map((s) => ({ value: s, label: s }))
  const schedulerOptions = schedulers.map((s) => ({ value: s, label: s }))

  function handlePerformanceChange(value: string) {
    onPerformanceChange(value)

    if (value !== CUSTOM_VALUE) {
      const preset = performancePresets.find((p) => p.name === value)
      if (preset) {
        onStepsChange(preset.custom_steps)
        onCfgChange(preset.cfg)
        onSamplerChange(preset.sampler_name)
        onSchedulerChange(preset.scheduler)
        onClipSkipChange(preset.clip_skip)
      }
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Performance</Label>
        <Select
          value={performance}
          onValueChange={handlePerformanceChange}
          options={performanceOptions}
          placeholder="Select performance..."
        />
      </div>

      {isCustom && (
        <div className="space-y-3 rounded-md border border-border p-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Steps</Label>
              <span className="text-sm text-muted-foreground tabular-nums">
                {customSteps}
              </span>
            </div>
            <Slider
              min={1}
              max={200}
              step={1}
              value={customSteps}
              onValueChange={onStepsChange}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>CFG Scale</Label>
              <span className="text-sm text-muted-foreground tabular-nums">
                {cfg.toFixed(1)}
              </span>
            </div>
            <Slider
              min={0}
              max={20}
              step={0.5}
              value={cfg}
              onValueChange={onCfgChange}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Sampler</Label>
            <Select
              value={samplerName}
              onValueChange={onSamplerChange}
              options={samplerOptions}
              placeholder="Select sampler..."
            />
          </div>

          <div className="space-y-1.5">
            <Label>Scheduler</Label>
            <Select
              value={scheduler}
              onValueChange={onSchedulerChange}
              options={schedulerOptions}
              placeholder="Select scheduler..."
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Clip Skip</Label>
              <span className="text-sm text-muted-foreground tabular-nums">
                {clipSkip}
              </span>
            </div>
            <Slider
              min={1}
              max={5}
              step={1}
              value={clipSkip}
              onValueChange={onClipSkipChange}
            />
          </div>
        </div>
      )}
    </div>
  )
}
