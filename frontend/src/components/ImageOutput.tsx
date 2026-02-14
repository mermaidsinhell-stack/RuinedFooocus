import * as React from "react"
import { cn } from "@/lib/utils"

export interface ImageOutputProps {
  images: string[]
  preview: string | null
  isGenerating: boolean
}

export function ImageOutput({ images, preview, isGenerating }: ImageOutputProps) {
  const displayImage = isGenerating && preview
    ? preview
    : images.length > 0
      ? images[images.length - 1]
      : null

  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        "w-full aspect-square rounded-lg bg-zinc-900 border border-border overflow-hidden"
      )}
    >
      {displayImage ? (
        <img
          src={displayImage}
          alt="Generated image"
          className={cn(
            "max-w-full max-h-full object-contain",
            isGenerating && preview && "animate-pulse opacity-80"
          )}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Generated images will appear here
        </p>
      )}
    </div>
  )
}
