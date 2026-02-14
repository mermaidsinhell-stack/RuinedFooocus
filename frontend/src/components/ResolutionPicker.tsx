import * as React from "react"
import { Select } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import type { ResolutionPreset } from "@/api/types"

const CUSTOM_VALUE = "Custom..."

export interface ResolutionPickerProps {
  resolutions: ResolutionPreset[]
  selected: string
  customWidth: number
  customHeight: number
  onResolutionChange: (value: string) => void
  onWidthChange: (value: number) => void
  onHeightChange: (value: number) => void
}

export function ResolutionPicker({
  resolutions,
  selected,
  customWidth,
  customHeight,
  onResolutionChange,
  onWidthChange,
  onHeightChange,
}: ResolutionPickerProps) {
  const isCustom = selected === CUSTOM_VALUE

  const resolutionOptions = [
    ...resolutions.map((r) => ({ value: r.label, label: r.label })),
    { value: CUSTOM_VALUE, label: "Custom..." },
  ]

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Resolution</Label>
        <Select
          value={selected}
          onValueChange={onResolutionChange}
          options={resolutionOptions}
          placeholder="Select resolution..."
        />
      </div>

      {isCustom && (
        <div className="space-y-3 rounded-md border border-border p-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Width</Label>
              <span className="text-sm text-muted-foreground tabular-nums">
                {customWidth}px
              </span>
            </div>
            <Slider
              min={256}
              max={4096}
              step={2}
              value={customWidth}
              onValueChange={onWidthChange}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Height</Label>
              <span className="text-sm text-muted-foreground tabular-nums">
                {customHeight}px
              </span>
            </div>
            <Slider
              min={256}
              max={4096}
              step={2}
              value={customHeight}
              onValueChange={onHeightChange}
            />
          </div>
        </div>
      )}
    </div>
  )
}
