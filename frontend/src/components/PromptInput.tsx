import * as React from "react"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Accordion } from "@/components/ui/accordion"

export interface PromptInputProps {
  prompt: string
  negativePrompt: string
  onPromptChange: (value: string) => void
  onNegativePromptChange: (value: string) => void
  autoNegativePrompt: boolean
  onAutoNegativePromptChange: (value: boolean) => void
}

export function PromptInput({
  prompt,
  negativePrompt,
  onPromptChange,
  onNegativePromptChange,
  autoNegativePrompt,
  onAutoNegativePromptChange,
}: PromptInputProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="prompt">Prompt</Label>
        <Textarea
          id="prompt"
          rows={5}
          placeholder="Enter your prompt..."
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
        />
      </div>

      <Accordion title="Negative Prompt">
        <div className="space-y-3">
          <Checkbox
            checked={autoNegativePrompt}
            onCheckedChange={onAutoNegativePromptChange}
            label="Auto negative prompt"
          />
          <Textarea
            id="negative-prompt"
            rows={3}
            placeholder="Enter negative prompt..."
            value={negativePrompt}
            onChange={(e) => onNegativePromptChange(e.target.value)}
            disabled={autoNegativePrompt}
          />
        </div>
      </Accordion>
    </div>
  )
}
