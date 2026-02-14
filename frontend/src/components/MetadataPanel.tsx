import { Loader2 } from "lucide-react"
import type { BrowseImageItem, ImageMetadata } from "@/api/types"

export interface MetadataPanelProps {
  image: BrowseImageItem | null
  metadata: ImageMetadata | null
  loading: boolean
}

export function MetadataPanel({ image, metadata, loading }: MetadataPanelProps) {
  if (!image) {
    return (
      <p className="text-sm text-muted-foreground">
        Click an image to view its metadata
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {/* Preview */}
      <div className="rounded-md overflow-hidden border border-border">
        <img
          src={image.url}
          alt={image.filename}
          className="w-full object-contain max-h-64"
        />
      </div>

      {/* Filename */}
      <p className="text-xs text-muted-foreground break-all">{image.filename}</p>

      {/* Metadata */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading metadata...
        </div>
      ) : metadata ? (
        <MetadataDisplay metadata={metadata} />
      ) : (
        <p className="text-xs text-muted-foreground">No metadata available</p>
      )}
    </div>
  )
}

function MetadataDisplay({ metadata }: { metadata: ImageMetadata }) {
  const f = metadata.formatted as Record<string, unknown>

  return (
    <div className="space-y-2 text-sm">
      {f["Prompt"] ? (
        <MetadataField label="Prompt" value={String(f["Prompt"])} />
      ) : null}
      {f["Negative Prompt"] ? (
        <MetadataField label="Negative" value={String(f["Negative Prompt"])} />
      ) : null}
      {f["Model"] ? (
        <MetadataField label="Model" value={String(f["Model"])} />
      ) : null}
      {typeof f["Settings"] === "object" && f["Settings"] !== null ? (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Settings</p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(f["Settings"] as Record<string, unknown>).map(([key, val]) => (
              <span
                key={key}
                className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-xs"
              >
                <span className="text-muted-foreground mr-1">{key}:</span>
                <span>{String(val)}</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {Array.isArray(f["LoRAs"]) && (f["LoRAs"] as string[]).length > 0 ? (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">LoRAs</p>
          <div className="space-y-0.5">
            {(f["LoRAs"] as string[]).map((lora, i) => (
              <p key={i} className="text-xs break-all">{String(lora)}</p>
            ))}
          </div>
        </div>
      ) : null}
      {f["Software"] ? (
        <p className="text-xs text-muted-foreground">{String(f["Software"])}</p>
      ) : null}
    </div>
  )
}

function MetadataField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm break-words whitespace-pre-wrap">{value}</p>
    </div>
  )
}
