import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BrowseImageItem } from "@/api/types"

export interface ImageGridProps {
  images: BrowseImageItem[]
  loading: boolean
  selectedImage: BrowseImageItem | null
  onSelect: (image: BrowseImageItem) => void
}

export function ImageGrid({ images, loading, selectedImage, onSelect }: ImageGridProps) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          No images found. Click "Update DB" to scan for images.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-3">
      <div className="grid grid-cols-4 gap-2">
        {images.map((image) => (
          <button
            key={image.fullpath}
            type="button"
            onClick={() => onSelect(image)}
            className={cn(
              "aspect-square rounded-md overflow-hidden border-2 transition-colors",
              "hover:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              selectedImage?.fullpath === image.fullpath
                ? "border-primary ring-2 ring-primary"
                : "border-border"
            )}
          >
            <img
              src={image.url}
              alt={image.filename}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
