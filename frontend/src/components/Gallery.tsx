import * as React from "react"
import { cn } from "@/lib/utils"

export interface GalleryProps {
  images: string[]
  onSelect: (url: string) => void
}

export function Gallery({ images, onSelect }: GalleryProps) {
  if (images.length === 0) {
    return null
  }

  const reversed = [...images].reverse()

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex gap-2 pb-2">
        {reversed.map((url, index) => (
          <button
            key={`${url}-${index}`}
            type="button"
            onClick={() => onSelect(url)}
            className={cn(
              "flex-shrink-0 h-16 w-16 rounded-md overflow-hidden border border-border",
              "transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            )}
          >
            <img
              src={url}
              alt={`Generated image ${images.length - index}`}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
