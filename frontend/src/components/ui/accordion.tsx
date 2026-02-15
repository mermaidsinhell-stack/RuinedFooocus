import * as React from "react"
import { ChevronRight } from "lucide-react"
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
    <div className={cn("glass-card rounded-xl overflow-hidden", className)}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "flex w-full items-center justify-between px-4 py-3 text-[15px] font-serif-display font-semibold text-foreground transition-colors",
          "active:bg-secondary/50"
        )}
      >
        {title}
        <ChevronRight
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-90"
          )}
        />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 text-[15px] text-foreground">
          {children}
        </div>
      )}
    </div>
  )
}

export { Accordion }
