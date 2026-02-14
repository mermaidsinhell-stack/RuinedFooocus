import * as React from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export interface GenerateProgress {
  percent: number
  status: string
  preview: string | null
}

export interface GenerateButtonProps {
  isGenerating: boolean
  progress: GenerateProgress | null
  onGenerate: () => void
  onStop: () => void
  imageCount: number
  onImageCountChange: (count: number) => void
}

export function GenerateButton({
  isGenerating,
  progress,
  onGenerate,
  onStop,
  imageCount,
  onImageCountChange,
}: GenerateButtonProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>Image Count</Label>
          <span className="text-sm text-muted-foreground">{imageCount}</span>
        </div>
        <Slider
          min={1}
          max={50}
          step={1}
          value={imageCount}
          onValueChange={onImageCountChange}
        />
      </div>

      {isGenerating ? (
        <Button
          variant="destructive"
          className="w-full"
          onClick={onStop}
        >
          Stop
        </Button>
      ) : (
        <Button
          className="w-full"
          onClick={onGenerate}
        >
          Generate
        </Button>
      )}

      {isGenerating && progress && (
        <div className="space-y-1.5">
          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full bg-primary transition-all duration-300 ease-out"
              )}
              style={{ width: `${Math.max(0, Math.min(100, progress.percent))}%` }}
            />
          </div>
          {progress.status && (
            <p className="text-xs text-muted-foreground text-center">
              {progress.status}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
