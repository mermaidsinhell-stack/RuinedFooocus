import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { api } from '@/api/client'

export interface MetadataViewerProps {
  imageUrl: string | null
}

export function MetadataViewer({ imageUrl }: MetadataViewerProps) {
  const [metadata, setMetadata] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!imageUrl) {
      setMetadata(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setMetadata(null)

    api
      .getImageMetadataByUrl(imageUrl)
      .then((res) => {
        if (!cancelled) setMetadata(res.formatted ?? res.raw ?? null)
      })
      .catch((e) => {
        console.warn('Failed to load metadata:', e)
        if (!cancelled) setMetadata(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [imageUrl])

  if (!imageUrl) {
    return (
      <p className="text-[15px] text-muted-foreground py-4 text-center">
        Generate an image to view its metadata
      </p>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-[13px]">Loading...</span>
      </div>
    )
  }

  if (!metadata) {
    return (
      <p className="text-[13px] text-muted-foreground py-4 text-center">
        No metadata available
      </p>
    )
  }

  return (
    <div className="space-y-2 text-[13px]">
      {Object.entries(metadata).map(([key, val]) => (
        <div key={key} className="glass-card rounded-lg p-2.5">
          <p className="font-medium text-muted-foreground mb-0.5">{key}</p>
          <p className="break-words whitespace-pre-wrap text-foreground">
            {typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val)}
          </p>
        </div>
      ))}
    </div>
  )
}
