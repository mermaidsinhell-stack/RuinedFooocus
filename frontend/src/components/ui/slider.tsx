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
    const percent = ((Number(value ?? min) - min) / (max - min)) * 100

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
          "w-full h-[4px] rounded-full appearance-none cursor-pointer",
          "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0.5px_4px_rgba(0,0,0,0.12),0_0.5px_1px_rgba(0,0,0,0.08)] [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-black/5 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:active:scale-110",
          "[&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-black/5 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-[0_0.5px_4px_rgba(0,0,0,0.12)]",
          "[&::-moz-range-track]:rounded-full [&::-moz-range-track]:h-[4px]",
          "disabled:pointer-events-none disabled:opacity-40",
          "focus-visible:outline-none",
          className
        )}
        style={{
          background: `linear-gradient(to right, hsl(211 100% 50%) 0%, hsl(211 100% 50%) ${percent}%, hsl(240 6% 90%) ${percent}%, hsl(240 6% 90%) 100%)`,
        }}
      />
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
