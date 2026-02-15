import * as React from "react"
import { cn } from "@/lib/utils"

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  disabled?: boolean
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ value, onValueChange, options, placeholder, className, disabled }, ref) => {
    return (
      <select
        ref={ref}
        value={value}
        disabled={disabled}
        onChange={(e) => onValueChange?.(e.target.value)}
        className={cn(
          "flex h-11 w-full rounded-lg glass-input px-3 py-2 text-[15px] transition-colors",
          "text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-40",
          "appearance-none bg-no-repeat bg-[length:12px_12px] bg-[right_12px_center]",
          "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23999%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')]",
          "pr-9",
          className
        )}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )
  }
)
Select.displayName = "Select"

export { Select }
