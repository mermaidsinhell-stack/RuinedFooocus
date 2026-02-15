import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { ModelInfo } from "@/api/types"

export interface ModelSelectorProps {
  checkpoints: ModelInfo[]
  selectedModel: string
  onModelChange: (name: string) => void
  onRefresh: () => void
}

export function ModelSelector({
  checkpoints,
  selectedModel,
  onModelChange,
  onRefresh,
}: ModelSelectorProps) {
  const [search, setSearch] = React.useState("")

  const filtered = React.useMemo(() => {
    if (!search.trim()) return checkpoints
    const query = search.toLowerCase()
    return checkpoints.filter((m) => m.name.toLowerCase().includes(query))
  }, [checkpoints, search])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Model</Label>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          Refresh
        </Button>
      </div>

      <Input
        placeholder="Search models..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
        {filtered.map((model) => (
          <button
            key={model.name}
            type="button"
            onClick={() => onModelChange(model.name)}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl glass-card text-left transition-all",
              "hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              selectedModel === model.name
                ? "ring-2 ring-primary bg-accent/30"
                : ""
            )}
          >
            {model.thumbnail ? (
              <img
                src={model.thumbnail}
                alt={model.name}
                className="w-full aspect-square rounded object-cover bg-secondary"
              />
            ) : (
              <div className="w-full aspect-square rounded bg-secondary flex items-center justify-center">
                <span className="text-xs text-muted-foreground">No preview</span>
              </div>
            )}
            <span className="text-[13px] text-foreground truncate w-full text-center">
              {model.name}
            </span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-3 text-[15px] text-muted-foreground text-center py-4">
            No models found
          </p>
        )}
      </div>
    </div>
  )
}
