import * as React from "react"
import { cn } from "@/lib/utils"

export interface SliderProps {
  min?: number
  max?: number
  step?: number
  value?: number
  onValueChange?: (value: number) => void
  className?: string
  disabled?: boolean
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ min = 0, max = 100, step = 1, value, onValueChange, className, disabled }, ref) => {
    return (
      <input
        ref={ref}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onValueChange?.(Number(e.target.value))}
        className={cn(
          "w-full h-2 rounded-full appearance-none cursor-pointer bg-secondary",
          "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-colors",
          "[&::-webkit-slider-thumb]:hover:bg-primary/80",
          "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow-sm [&::-moz-range-thumb]:transition-colors",
          "[&::-moz-range-thumb]:hover:bg-primary/80",
          "[&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-secondary",
          "disabled:pointer-events-none disabled:opacity-50",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          className
        )}
      />
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
