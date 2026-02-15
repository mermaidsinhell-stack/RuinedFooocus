import * as React from "react"
import { cn } from "@/lib/utils"

export interface CheckboxProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  label?: string
  id?: string
  className?: string
  disabled?: boolean
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ checked, onCheckedChange, label, id, className, disabled }, ref) => {
    const inputId = id || React.useId()

    return (
      <div className={cn("flex items-center justify-between gap-3", className)}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "text-[15px] leading-none text-foreground cursor-pointer select-none",
              disabled && "cursor-not-allowed opacity-40"
            )}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          type="checkbox"
          id={inputId}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className="ios-toggle"
        />
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
