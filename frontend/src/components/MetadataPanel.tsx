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
      <p className="text-[15px] text-muted-foreground">
        Click an image to view its metadata
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {/* Preview */}
      <div className="rounded-xl overflow-hidden shadow-sm">
        <img
          src={image.url}
          alt={image.filename}
          className="w-full object-contain max-h-64"
        />
      </div>

      {/* Filename */}
      <p className="text-[13px] text-muted-foreground break-all">{image.filename}</p>

      {/* Metadata */}
      {loading ? (
        <div className="flex items-center gap-2 text-[15px] text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading metadata...
        </div>
      ) : metadata ? (
        <MetadataDisplay metadata={metadata} />
      ) : (
        <p className="text-[13px] text-muted-foreground">No metadata available</p>
      )}
    </div>
  )
}

function MetadataDisplay({ metadata }: { metadata: ImageMetadata }) {
  const f = metadata.formatted as Record<string, unknown>

  return (
    <div className="space-y-3 text-[15px]">
      {f["Prompt"] ? (
        <div className="glass-card rounded-xl p-3">
          <MetadataField label="Prompt" value={String(f["Prompt"])} />
        </div>
      ) : null}
      {f["Negative Prompt"] ? (
        <div className="glass-card rounded-xl p-3">
          <MetadataField label="Negative" value={String(f["Negative Prompt"])} />
        </div>
      ) : null}
      {f["Model"] ? (
        <div className="glass-card rounded-xl p-3">
          <MetadataField label="Model" value={String(f["Model"])} />
        </div>
      ) : null}
      {typeof f["Settings"] === "object" && f["Settings"] !== null ? (
        <div className="glass-card rounded-xl p-3">
          <p className="text-[13px] font-medium text-muted-foreground mb-1.5">Settings</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(f["Settings"] as Record<string, unknown>).map(([key, val]) => (
              <span
                key={key}
                className="inline-flex items-center rounded-lg bg-background px-2 py-0.5 text-[13px]"
              >
                <span className="text-muted-foreground mr-1">{key}:</span>
                <span>{String(val)}</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {Array.isArray(f["LoRAs"]) && (f["LoRAs"] as string[]).length > 0 ? (
        <div className="glass-card rounded-xl p-3">
          <p className="text-[13px] font-medium text-muted-foreground mb-1.5">LoRAs</p>
          <div className="space-y-0.5">
            {(f["LoRAs"] as string[]).map((lora, i) => (
              <p key={i} className="text-[13px] break-all">{String(lora)}</p>
            ))}
          </div>
        </div>
      ) : null}
      {f["Software"] ? (
        <p className="text-[13px] text-muted-foreground">{String(f["Software"])}</p>
      ) : null}
    </div>
  )
}

function MetadataField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
      <p className="text-[15px] break-words whitespace-pre-wrap">{value}</p>
    </div>
  )
}
