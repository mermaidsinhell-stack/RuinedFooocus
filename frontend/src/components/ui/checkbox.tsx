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
      <div className={cn("flex items-center gap-2", className)}>
        <input
          ref={ref}
          type="checkbox"
          id={inputId}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className={cn(
            "h-4 w-4 shrink-0 rounded-sm border border-border bg-background",
            "accent-primary cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        />
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "text-sm leading-none text-foreground cursor-pointer select-none",
              "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              disabled && "cursor-not-allowed opacity-70"
            )}
          >
            {label}
          </label>
        )}
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
