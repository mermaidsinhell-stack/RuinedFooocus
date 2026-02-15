import * as React from "react"
import { useState, useCallback, useRef } from "react"
import { Upload, Loader2 } from "lucide-react"
import { api } from "@/api/client"
import { cn } from "@/lib/utils"

export interface ImageOutputProps {
  images: string[]
  preview: string | null
  isGenerating: boolean
  onInterrogateResult?: (prompt: string) => void
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function ImageOutput({ images, preview, isGenerating, onInterrogateResult }: ImageOutputProps) {
  const [dragOver, setDragOver] = useState(false)
  const [interrogating, setInterrogating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const displayImage = isGenerating && preview
    ? preview
    : images.length > 0
      ? images[0]
      : null

  const handleInterrogate = useCallback(async (file: File) => {
    if (!onInterrogateResult || !file.type.startsWith('image/')) return

    setInterrogating(true)
    try {
      const b64 = await fileToBase64(file)
      const result = await api.interrogate(b64)
      onInterrogateResult(result.prompt)
    } catch (e) {
      console.error('Interrogation failed:', e)
    } finally {
      setInterrogating(false)
    }
  }, [onInterrogateResult])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleInterrogate(file)
  }, [handleInterrogate])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleInterrogate(file)
    e.target.value = ''
  }, [handleInterrogate])

  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        "w-full aspect-square rounded-2xl bg-[#f4f0ec] shadow-sm overflow-hidden",
        dragOver && "ring-2 ring-primary ring-offset-2"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
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
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <p className="text-[15px]">
            Generated images will appear here
          </p>
          {onInterrogateResult && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-[12px] text-primary hover:text-primary/80 transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              Drop image to interrogate
            </button>
          )}
        </div>
      )}

      {interrogating && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex items-center gap-2 text-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-[13px] font-medium">Interrogating...</span>
          </div>
        </div>
      )}

      {dragOver && !interrogating && (
        <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm flex items-center justify-center">
          <div className="flex items-center gap-2 text-primary">
            <Upload className="h-5 w-5" />
            <span className="text-[13px] font-medium">Drop to interrogate</span>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
