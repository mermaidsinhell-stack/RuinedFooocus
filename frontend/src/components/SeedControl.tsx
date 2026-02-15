import * as React from "react"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export interface SeedControlProps {
  seed: number
  randomSeed: boolean
  onSeedChange: (value: number) => void
  onRandomSeedChange: (value: boolean) => void
}

export function SeedControl({
  seed,
  randomSeed,
  onSeedChange,
  onRandomSeedChange,
}: SeedControlProps) {
  return (
    <div className="space-y-3">
      <Label className="text-[15px]">Seed</Label>
      <Checkbox
        checked={randomSeed}
        onCheckedChange={onRandomSeedChange}
        label="Random seed"
      />
      <Input
        type="number"
        value={seed}
        onChange={(e) => onSeedChange(Number(e.target.value))}
        disabled={randomSeed}
        min={0}
        placeholder="Enter seed..."
      />
    </div>
  )
}
