import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export interface BrowserPaginationProps {
  page: number
  totalPages: number
  totalImages: number
  rangeText: string
  onPageChange: (page: number) => void
}

export function BrowserPagination({
  page,
  totalPages,
  totalImages,
  rangeText,
  onPageChange,
}: BrowserPaginationProps) {
  return (
    <div className="glass-bar glass-bar-edge-top px-3 py-2.5 flex items-center gap-3 shrink-0">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="rounded-lg"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-[15px] text-foreground tabular-nums">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-lg"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <div className="flex-1" />
      <span className="text-[13px] text-muted-foreground">
        {totalImages} images
      </span>
      {rangeText && (
        <span className="text-[13px] text-muted-foreground truncate max-w-xs">
          {rangeText}
        </span>
      )}
    </div>
  )
}
