import { Loader2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useImageBrowser } from "@/hooks/useImageBrowser"
import { ImageGrid } from "@/components/ImageGrid"
import { BrowserPagination } from "@/components/BrowserPagination"
import { MetadataPanel } from "@/components/MetadataPanel"

export function ImageBrowserView() {
  const browser = useImageBrowser()

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top bar: search + update */}
      <div className="border-b border-border px-4 py-2 flex gap-2 items-center shrink-0">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search metadata..."
            value={browser.search}
            onChange={(e) => browser.setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && browser.executeSearch()}
            className="pl-8"
          />
        </div>
        <Button variant="outline" size="sm" onClick={browser.executeSearch}>
          Search
        </Button>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={browser.updateDB}
          disabled={browser.updating}
        >
          {browser.updating ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : null}
          Update DB
        </Button>
        {browser.updateMessage && (
          <span className="text-xs text-muted-foreground max-w-xs truncate">
            {browser.updateMessage}
          </span>
        )}
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Image grid + pagination */}
        <div className="flex-[2] flex flex-col overflow-hidden">
          <ImageGrid
            images={browser.images}
            loading={browser.loading}
            selectedImage={browser.selectedImage}
            onSelect={browser.selectImage}
          />
          <BrowserPagination
            page={browser.page}
            totalPages={browser.totalPages}
            totalImages={browser.totalImages}
            rangeText={browser.rangeText}
            onPageChange={browser.setPage}
          />
        </div>

        {/* Right: Metadata panel */}
        <div className="flex-[1] border-l border-border overflow-y-auto p-4">
          <MetadataPanel
            image={browser.selectedImage}
            metadata={browser.metadata}
            loading={browser.metadataLoading}
          />
        </div>
      </div>
    </div>
  )
}
