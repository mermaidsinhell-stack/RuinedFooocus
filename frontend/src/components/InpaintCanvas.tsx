import * as React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export interface InpaintCanvasProps {
  /** The base64-encoded source image (no data:... prefix) */
  sourceImage: string | null
  /** Whether inpainting is enabled */
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  /**
   * Called with the composite RGBA base64 (raw, no prefix) whenever the mask
   * changes.  The alpha channel encodes the mask: painted = opaque black,
   * unpainted = transparent.
   */
  onMaskChange: (compositeBase64: string | null) => void
}

export function InpaintCanvas({
  sourceImage,
  enabled,
  onEnabledChange,
  onMaskChange,
}: InpaintCanvasProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const maskCanvasRef = React.useRef<HTMLCanvasElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [painting, setPainting] = React.useState(false)
  const [brushSize, setBrushSize] = React.useState(30)
  const [imgSize, setImgSize] = React.useState<{ w: number; h: number } | null>(null)

  // Load the source image and set canvas dimensions
  React.useEffect(() => {
    if (!sourceImage || !enabled) return
    const img = new Image()
    img.onload = () => {
      // Scale to fit within a max display height of 400px
      const maxH = 400
      const scale = Math.min(1, maxH / img.height)
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      setImgSize({ w, h })

      const canvas = canvasRef.current
      const maskCanvas = maskCanvasRef.current
      if (!canvas || !maskCanvas) return

      canvas.width = w
      canvas.height = h
      maskCanvas.width = w
      maskCanvas.height = h

      // Draw the source image
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, w, h)
        ctx.drawImage(img, 0, 0, w, h)
      }

      // Clear mask
      const maskCtx = maskCanvas.getContext("2d")
      if (maskCtx) {
        maskCtx.clearRect(0, 0, w, h)
      }
    }
    img.src = `data:image/png;base64,${sourceImage}`
  }, [sourceImage, enabled])

  function getCanvasPos(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  function paintAt(x: number, y: number) {
    const maskCanvas = maskCanvasRef.current
    if (!maskCanvas) return
    const ctx = maskCanvas.getContext("2d")
    if (!ctx) return

    ctx.globalCompositeOperation = "source-over"
    ctx.fillStyle = "rgba(255, 0, 0, 0.5)"
    ctx.beginPath()
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2)
    ctx.fill()
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    setPainting(true)
    const { x, y } = getCanvasPos(e)
    paintAt(x, y)
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!painting) return
    const { x, y } = getCanvasPos(e)
    paintAt(x, y)
  }

  function handleMouseUp() {
    if (painting) {
      setPainting(false)
      exportMask()
    }
  }

  function exportMask() {
    const canvas = canvasRef.current
    const maskCanvas = maskCanvasRef.current
    if (!canvas || !maskCanvas || !imgSize) return

    // Create a composite: source image with mask alpha channel
    const exportCanvas = document.createElement("canvas")
    exportCanvas.width = imgSize.w
    exportCanvas.height = imgSize.h
    const ctx = exportCanvas.getContext("2d")
    if (!ctx) return

    // Draw source image
    ctx.drawImage(canvas, 0, 0)

    // Now get the mask pixels and apply as alpha
    const maskCtx = maskCanvas.getContext("2d")
    if (!maskCtx) return
    const maskData = maskCtx.getImageData(0, 0, imgSize.w, imgSize.h)
    const imgData = ctx.getImageData(0, 0, imgSize.w, imgSize.h)

    // Where mask has paint (red channel > 0), set alpha to 255 (masked area)
    // Where mask is clear, set alpha to 0 (unmasked)
    for (let i = 0; i < maskData.data.length; i += 4) {
      if (maskData.data[i] > 0) {
        // Painted - this is the inpaint region
        imgData.data[i + 3] = 255
      } else {
        imgData.data[i + 3] = 0
      }
    }
    ctx.putImageData(imgData, 0, 0)

    const dataUrl = exportCanvas.toDataURL("image/png")
    const base64 = dataUrl.split(",")[1]
    onMaskChange(base64)
  }

  function handleClear() {
    const maskCanvas = maskCanvasRef.current
    if (!maskCanvas || !imgSize) return
    const ctx = maskCanvas.getContext("2d")
    if (ctx) {
      ctx.clearRect(0, 0, imgSize.w, imgSize.h)
    }
    onMaskChange(null)
  }

  if (!sourceImage) {
    return (
      <div className="space-y-1.5">
        <Checkbox
          checked={false}
          onCheckedChange={() => {}}
          label="Inpainting"
          disabled
        />
        <p className="text-xs text-muted-foreground">Upload an image first to enable inpainting</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Checkbox
        checked={enabled}
        onCheckedChange={onEnabledChange}
        label="Inpainting"
      />

      {enabled && imgSize && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Label className="text-[15px] shrink-0">Brush</Label>
            <Slider min={5} max={100} step={1} value={brushSize} onValueChange={setBrushSize} />
            <span className="text-[13px] text-muted-foreground tabular-nums w-8">{brushSize}</span>
            <Button variant="outline" size="sm" className="rounded-lg" onClick={handleClear}>Clear</Button>
          </div>
          <div
            ref={containerRef}
            className="relative rounded-xl shadow-sm overflow-hidden inline-block"
            style={{ width: imgSize.w, height: imgSize.h }}
          >
            <canvas
              ref={canvasRef}
              className="absolute inset-0"
              style={{ width: imgSize.w, height: imgSize.h }}
            />
            <canvas
              ref={maskCanvasRef}
              className="absolute inset-0 cursor-crosshair"
              style={{ width: imgSize.w, height: imgSize.h }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>
        </div>
      )}
    </div>
  )
}
