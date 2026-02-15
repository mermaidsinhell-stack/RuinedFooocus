import { Textarea } from "@/components/ui/textarea"

export interface PromptInputProps {
  prompt: string
  onPromptChange: (value: string) => void
}

export function PromptInput({ prompt, onPromptChange }: PromptInputProps) {
  return (
    <Textarea
      id="prompt"
      rows={5}
      placeholder="Type prompt here."
      value={prompt}
      onChange={(e) => onPromptChange(e.target.value)}
      className="resize-none"
      autoFocus
    />
  )
}
