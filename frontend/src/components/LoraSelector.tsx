import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { LoraInfo, LoraEntry } from "@/api/types"

export interface LoraSelectorProps {
  loras: LoraInfo[]
  activeLoras: LoraEntry[]
  onLorasChange: (loras: LoraEntry[]) => void
}

export function LoraSelector({
  loras,
  activeLoras,
  onLorasChange,
}: LoraSelectorProps) {
  const [showBrowser, setShowBrowser] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const filtered = React.useMemo(() => {
    if (!search.trim()) return loras
    const query = search.toLowerCase()
    return loras.filter((l) => l.name.toLowerCase().includes(query))
  }, [loras, search])

  const activeLoraNames = React.useMemo(
    () => new Set(activeLoras.map((l) => l.name)),
    [activeLoras]
  )

  function addLora(name: string) {
    if (activeLoraNames.has(name)) return
    onLorasChange([...activeLoras, { name, weight: 1.0 }])
  }

  function removeLora(name: string) {
    onLorasChange(activeLoras.filter((l) => l.name !== name))
  }

  function updateWeight(name: string, weight: number) {
    onLorasChange(
      activeLoras.map((l) => (l.name === name ? { ...l, weight } : l))
    )
  }

  function getKeywords(name: string): string[] {
    const info = loras.find((l) => l.name === name)
    return info?.keywords ?? []
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>LoRAs</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowBrowser((prev) => !prev)}
        >
          {showBrowser ? "Close" : "Add LoRA"}
        </Button>
      </div>

      {showBrowser && (
        <div className="space-y-2 rounded-md border border-border p-3">
          <Input
            placeholder="Search LoRAs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {filtered.map((lora) => (
              <button
                key={lora.name}
                type="button"
                onClick={() => addLora(lora.name)}
                disabled={activeLoraNames.has(lora.name)}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-md border border-border text-left transition-colors",
                  "hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  "disabled:opacity-50 disabled:pointer-events-none",
                  activeLoraNames.has(lora.name) && "border-primary bg-accent/30"
                )}
              >
                {lora.thumbnail ? (
                  <img
                    src={lora.thumbnail}
                    alt={lora.name}
                    className="w-full aspect-square rounded object-cover bg-secondary"
                  />
                ) : (
                  <div className="w-full aspect-square rounded bg-secondary flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">No preview</span>
                  </div>
                )}
                <span className="text-xs text-foreground truncate w-full text-center">
                  {lora.name}
                </span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="col-span-3 text-sm text-muted-foreground text-center py-4">
                No LoRAs found
              </p>
            )}
          </div>
        </div>
      )}

      {activeLoras.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Active LoRAs</Label>
          {activeLoras.map((entry) => {
            const keywords = getKeywords(entry.name)
            return (
              <div
                key={entry.name}
                className="rounded-md border border-border p-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-foreground truncate flex-1">
                    {entry.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => removeLora(entry.name)}
                  >
                    <span className="sr-only">Remove {entry.name}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <Slider
                    min={0}
                    max={2}
                    step={0.05}
                    value={entry.weight}
                    onValueChange={(val) => updateWeight(entry.name, val)}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">
                    {entry.weight.toFixed(2)}
                  </span>
                </div>
                {keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {keywords.map((kw) => (
                      <Badge key={kw} variant="secondary" className="text-xs">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {activeLoras.length === 0 && !showBrowser && (
        <p className="text-sm text-muted-foreground">No LoRAs selected</p>
      )}
    </div>
  )
}
