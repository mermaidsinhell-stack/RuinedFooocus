import * as React from "react"
import { Select } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { api } from "@/api/client"
import type { ControlNetPreset } from "@/api/types"

const CUSTOM_VALUE = "Custom..."

/** Which sliders are visible for each cn_type */
const SLIDER_VISIBILITY: Record<string, { start: boolean; stop: boolean; strength: boolean; edgeLow: boolean; edgeHigh: boolean; upscaler: boolean }> = {
  canny:    { start: true,  stop: true,  strength: true,  edgeLow: true,  edgeHigh: true,  upscaler: false },
  depth:    { start: true,  stop: true,  strength: true,  edgeLow: false, edgeHigh: false, upscaler: false },
  recolour: { start: true,  stop: true,  strength: true,  edgeLow: false, edgeHigh: false, upscaler: false },
  sketch:   { start: true,  stop: true,  strength: true,  edgeLow: false, edgeHigh: false, upscaler: false },
  img2img:  { start: false, stop: false, strength: true,  edgeLow: false, edgeHigh: false, upscaler: false },
  upscale:  { start: false, stop: false, strength: false, edgeLow: false, edgeHigh: false, upscaler: true },
  rembg:    { start: false, stop: false, strength: false, edgeLow: false, edgeHigh: false, upscaler: false },
  faceswap: { start: false, stop: false, strength: false, edgeLow: false, edgeHigh: false, upscaler: false },
}

function getVisibility(cnType: string) {
  return SLIDER_VISIBILITY[cnType.toLowerCase()] ?? SLIDER_VISIBILITY.depth
}

export interface ControlNetPanelProps {
  presets: ControlNetPreset[]
  types: string[]
  upscalers: string[]
  cnSelection: string
  cnType: string
  cnEdgeLow: number
  cnEdgeHigh: number
  cnStart: number
  cnStop: number
  cnStrength: number
  cnUpscale: string
  onSelectionChange: (value: string) => void
  onTypeChange: (value: string) => void
  onEdgeLowChange: (value: number) => void
  onEdgeHighChange: (value: number) => void
  onStartChange: (value: number) => void
  onStopChange: (value: number) => void
  onStrengthChange: (value: number) => void
  onUpscaleChange: (value: string) => void
  onPresetsUpdate: (presets: ControlNetPreset[]) => void
}

export function ControlNetPanel({
  presets,
  types,
  upscalers,
  cnSelection,
  cnType,
  cnEdgeLow,
  cnEdgeHigh,
  cnStart,
  cnStop,
  cnStrength,
  cnUpscale,
  onSelectionChange,
  onTypeChange,
  onEdgeLowChange,
  onEdgeHighChange,
  onStartChange,
  onStopChange,
  onStrengthChange,
  onUpscaleChange,
  onPresetsUpdate,
}: ControlNetPanelProps) {
  const [saveName, setSaveName] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  const isCustom = cnSelection === CUSTOM_VALUE
  const vis = getVisibility(cnType)

  const selectionOptions = [
    { value: "None", label: "None" },
    ...presets.map((p) => ({ value: p.name, label: p.name })),
    { value: CUSTOM_VALUE, label: "Custom..." },
  ]

  const typeOptions = types.map((t) => ({ value: t, label: t }))

  const upscalerOptions = [
    { value: "None", label: "None" },
    ...upscalers.map((u) => ({ value: u, label: u })),
  ]

  function handleSelectionChange(value: string) {
    onSelectionChange(value)

    // When a preset is selected, apply its values
    if (value !== "None" && value !== CUSTOM_VALUE) {
      const preset = presets.find((p) => p.name === value)
      if (preset) {
        onTypeChange(preset.type.charAt(0).toUpperCase() + preset.type.slice(1))
        if (preset.edge_low != null) onEdgeLowChange(preset.edge_low)
        if (preset.edge_high != null) onEdgeHighChange(preset.edge_high)
        if (preset.start != null) onStartChange(preset.start)
        if (preset.stop != null) onStopChange(preset.stop)
        if (preset.strength != null) onStrengthChange(preset.strength)
        if (preset.upscaler != null) onUpscaleChange(preset.upscaler)
      }
    }
  }

  async function handleSave() {
    if (!saveName.trim()) return
    setSaving(true)
    try {
      const result = await api.saveControlNetPreset({
        name: saveName.trim(),
        type: cnType,
        edge_low: cnEdgeLow,
        edge_high: cnEdgeHigh,
        start: cnStart,
        stop: cnStop,
        strength: cnStrength,
        upscaler: cnUpscale,
      })
      onPresetsUpdate(result.presets)
      onSelectionChange(saveName.trim())
      setSaveName("")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Cheat Code</Label>
        <Select
          value={cnSelection}
          onValueChange={handleSelectionChange}
          options={selectionOptions}
        />
      </div>

      {isCustom && (
        <div className="space-y-3 rounded-md border border-border p-3">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={cnType}
              onValueChange={onTypeChange}
              options={typeOptions}
            />
          </div>

          {vis.edgeLow && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Edge (low)</Label>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {cnEdgeLow.toFixed(2)}
                </span>
              </div>
              <Slider min={0} max={1} step={0.01} value={cnEdgeLow} onValueChange={onEdgeLowChange} />
            </div>
          )}

          {vis.edgeHigh && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Edge (high)</Label>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {cnEdgeHigh.toFixed(2)}
                </span>
              </div>
              <Slider min={0} max={1} step={0.01} value={cnEdgeHigh} onValueChange={onEdgeHighChange} />
            </div>
          )}

          {vis.start && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Start</Label>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {cnStart.toFixed(2)}
                </span>
              </div>
              <Slider min={0} max={1} step={0.01} value={cnStart} onValueChange={onStartChange} />
            </div>
          )}

          {vis.stop && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Stop</Label>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {cnStop.toFixed(2)}
                </span>
              </div>
              <Slider min={0} max={1} step={0.01} value={cnStop} onValueChange={onStopChange} />
            </div>
          )}

          {vis.strength && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Strength</Label>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {cnStrength.toFixed(2)}
                </span>
              </div>
              <Slider min={0} max={2} step={0.01} value={cnStrength} onValueChange={onStrengthChange} />
            </div>
          )}

          {vis.upscaler && (
            <div className="space-y-1.5">
              <Label>Upscaler</Label>
              <Select
                value={cnUpscale}
                onValueChange={onUpscaleChange}
                options={upscalerOptions}
              />
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Input
              placeholder="Preset name..."
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={!saveName.trim() || saving}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
