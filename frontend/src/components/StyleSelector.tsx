import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { StyleInfo } from "@/api/types"

export interface StyleSelectorProps {
  styles: StyleInfo[]
  selectedStyles: string[]
  onStylesChange: (styles: string[]) => void
  onSendToPrompt?: () => void
}

export function StyleSelector({
  styles,
  selectedStyles,
  onStylesChange,
  onSendToPrompt,
}: StyleSelectorProps) {
  const [filter, setFilter] = React.useState("")

  const filtered = React.useMemo(() => {
    if (!filter.trim()) return styles
    const query = filter.toLowerCase()
    return styles.filter((s) => s.name.toLowerCase().includes(query))
  }, [styles, filter])

  const selectedSet = React.useMemo(
    () => new Set(selectedStyles),
    [selectedStyles]
  )

  function toggleStyle(name: string) {
    if (selectedSet.has(name)) {
      onStylesChange(selectedStyles.filter((s) => s !== name))
    } else {
      onStylesChange([...selectedStyles, name])
    }
  }

  function removeStyle(name: string) {
    onStylesChange(selectedStyles.filter((s) => s !== name))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-[15px]">Styles</Label>
        {selectedStyles.length > 0 && onSendToPrompt && (
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="h-6 px-2 text-[12px]"
            onClick={onSendToPrompt}
          >
            Send to Prompt
          </Button>
        )}
      </div>

      {selectedStyles.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedStyles.map((name) => (
            <Badge
              key={name}
              variant="default"
              className="cursor-pointer gap-1"
              onClick={() => removeStyle(name)}
            >
              {name}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-0.5"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </Badge>
          ))}
        </div>
      )}

      <Input
        placeholder="Filter styles..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      <div className="max-h-48 overflow-y-auto glass-card rounded-xl">
        {filtered.map((style) => (
          <button
            key={style.name}
            type="button"
            onClick={() => toggleStyle(style.name)}
            className={cn(
              "flex w-full items-center gap-2 px-3 py-2.5 text-[15px] text-left transition-colors",
              "hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              "border-b border-border/40 last:border-b-0",
              selectedSet.has(style.name) && "bg-primary/10 text-primary"
            )}
          >
            <span
              className={cn(
                "h-4 w-4 shrink-0 rounded-full border border-muted-foreground/30 flex items-center justify-center",
                selectedSet.has(style.name) && "bg-primary border-primary"
              )}
            >
              {selectedSet.has(style.name) && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="text-primary-foreground"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </span>
            <span className="truncate">{style.name}</span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No styles found
          </p>
        )}
      </div>
    </div>
  )
}
