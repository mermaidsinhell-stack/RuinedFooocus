import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface AccordionProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
  className?: string
}

function Accordion({ title, defaultOpen = false, children, className }: AccordionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  return (
    <div className={cn("border border-border rounded-md", className)}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground transition-colors",
          "hover:bg-accent/50",
          isOpen && "border-b border-border"
        )}
      >
        {title}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
      {isOpen && (
        <div className="px-4 py-3 text-sm text-foreground">
          {children}
        </div>
      )}
    </div>
  )
}

export { Accordion }
