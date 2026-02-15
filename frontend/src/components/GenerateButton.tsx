import { Button } from "@/components/ui/button"
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
}

export function GenerateButton({
  isGenerating,
  progress,
  onGenerate,
  onStop,
}: GenerateButtonProps) {
  return (
    <div className="space-y-2">
      {isGenerating ? (
        <Button
          variant="destructive"
          className="w-full rounded-xl text-[15px] font-semibold"
          onClick={onStop}
        >
          Stop
        </Button>
      ) : (
        <Button
          className="w-full rounded-xl bg-primary text-primary-foreground text-[15px] font-semibold hover:bg-primary/90"
          onClick={onGenerate}
        >
          Generate
        </Button>
      )}

      {isGenerating && progress && (
        <div className="space-y-1">
          <div className="h-2 w-full rounded-full bg-secondary/60 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full bg-primary transition-all duration-300 ease-out"
              )}
              style={{ width: `${Math.max(0, Math.min(100, progress.percent))}%` }}
            />
          </div>
          {progress.status && (
            <p className="text-[13px] text-muted-foreground text-center">
              {progress.status}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
