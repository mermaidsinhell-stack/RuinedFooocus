# RuinedFooocus: Gradio to React Migration Plan

## Architecture Overview

**Replace Gradio entirely** with:
- **Backend:** FastAPI (Python) with WebSocket support for real-time progress
- **Frontend:** Vite + React 19 + TypeScript + shadcn/ui + Tailwind CSS

**Migration strategy:** Progressive - ship core generation first, add features incrementally.

---

## Phase 1: Foundation & Core Generation (This Phase)

### Step 1: FastAPI Backend API (`/api/`)

Create a FastAPI application that wraps the existing pipeline infrastructure. Gradio is removed; FastAPI takes over HTTP serving.

**New file:** `api_server.py` (root) - FastAPI app entry point
**New directory:** `api/` with:
- `api/__init__.py`
- `api/routes/generate.py` - Image generation endpoints
- `api/routes/models.py` - Model listing/selection endpoints
- `api/routes/settings.py` - Settings read/write endpoints
- `api/schemas.py` - Pydantic request/response models
- `api/websocket.py` - WebSocket for generation progress streaming
- `api/dependencies.py` - Shared dependencies (settings, path manager, etc.)

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/generate` | Start image generation (returns task_id) |
| GET | `/api/generate/{task_id}` | Poll task status/result |
| WS | `/api/ws/generate/{task_id}` | Stream progress updates (preview images, step count) |
| POST | `/api/generate/stop` | Interrupt current generation |
| GET | `/api/models/checkpoints` | List available checkpoint models (with thumbnails) |
| GET | `/api/models/loras` | List available LoRA models (with thumbnails) |
| GET | `/api/models/styles` | List available styles |
| POST | `/api/models/refresh` | Refresh model lists |
| GET | `/api/settings` | Get current settings |
| GET | `/api/settings/performance` | List performance presets |
| GET | `/api/settings/resolutions` | List resolution presets |
| GET | `/api/settings/samplers` | List available samplers/schedulers |
| GET | `/api/outputs/{filename}` | Serve generated images |

**Key approach:** Reuse existing `async_worker.py` task queue, `shared.py` state, and all pipeline code. FastAPI just becomes a new front door to the same internals.

### Step 2: Scaffold React Frontend

Replace the CRA scaffold in `frontend/` with Vite + TypeScript:

```
frontend/
├── index.html
├── vite.config.ts          # Vite config with API proxy to FastAPI
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── components.json          # shadcn/ui config
├── package.json
├── src/
│   ├── main.tsx             # Entry point
│   ├── App.tsx              # Root with layout
│   ├── api/
│   │   ├── client.ts        # Fetch wrapper / API client
│   │   ├── types.ts         # API response types
│   │   └── websocket.ts     # WebSocket client for progress
│   ├── components/
│   │   ├── ui/              # shadcn/ui components (Button, Slider, Select, etc.)
│   │   ├── PromptInput.tsx
│   │   ├── GenerateButton.tsx
│   │   ├── ImageOutput.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── ModelSelector.tsx
│   │   ├── LoraSelector.tsx
│   │   ├── GenerationSettings.tsx  # Steps, CFG, sampler, scheduler, etc.
│   │   ├── ResolutionPicker.tsx
│   │   ├── StyleSelector.tsx
│   │   ├── SeedControl.tsx
│   │   └── Gallery.tsx       # Previous generations thumbnail strip
│   ├── hooks/
│   │   ├── useGenerate.ts    # Generation state + WebSocket progress
│   │   ├── useModels.ts      # Model list fetching
│   │   └── useSettings.ts    # Settings state
│   ├── lib/
│   │   └── utils.ts          # shadcn/ui utility (cn helper)
│   └── styles/
│       └── globals.css       # Tailwind directives + custom styles
```

### Step 3: Core Generation UI

Replicate the main generation tab functionality:

**Left panel (image output):**
- Large image display area (generated image / preview during generation)
- Progress bar with step count during generation
- Thumbnail gallery strip of recent generations

**Right panel (controls):**
- Prompt textarea (multiline, with placeholder)
- Negative prompt textarea (collapsible)
- Generate / Stop buttons
- Model selector (searchable gallery grid with thumbnails)
- LoRA selector (add/remove multiple, weight sliders)
- Performance preset dropdown (Speed, Quality, Balanced, Custom)
- Custom settings panel (steps, CFG, sampler, scheduler, clip skip) - shown when "Custom" selected
- Resolution picker (preset dropdown + custom width/height)
- Style multi-select
- Seed control (random checkbox + manual seed input)
- Image count slider

### Step 4: Launch Integration

Modify `launch.py` to start FastAPI instead of Gradio, serving:
- API routes at `/api/`
- React static build at `/` (in production)
- Dev mode: React dev server proxies API calls to FastAPI

---

## Phase 2: ControlNet / PowerUp (Future)

- Image upload for ControlNet input
- ControlNet type selector (Canny, Img2Img, Upscale, Faceswap, Rembg)
- Inpainting editor (canvas-based)
- ControlNet parameter sliders (strength, start/stop, edge thresholds)
- ControlNet preset save/load
- API endpoints for ControlNet config

## Phase 3: One Button Prompt (Future)

- OBP controls panel (insanity level, subject, artist, etc.)
- Instant OBP / Random Prompt buttons
- OBP preset management
- Prompt enhancement integration (hyperprompt, llama)

## Phase 4: Image Browser (Future)

- Paginated image gallery
- Metadata display
- Search functionality
- API endpoints for image browsing/search

## Phase 5: Chat Bots (Future)

- Chat interface with streaming responses
- Bot/assistant selection
- System prompt configuration

## Phase 6: Settings (Future)

- Full settings editor
- Model path configuration
- Default value management
- CLIP/VAE model selection
- Settings save/load

---

## Technical Notes

- **Existing code reuse:** All pipeline code (`sdxl_pipeline.py`, `async_worker.py`, model loading, prompt processing) stays unchanged. FastAPI wraps the same functions Gradio called.
- **Static file serving:** FastAPI serves the React build output + generated images from the outputs directory.
- **WebSocket protocol:** During generation, the server streams JSON messages: `{"type": "progress", "step": 5, "total": 20, "preview": "/api/outputs/preview.png"}` and `{"type": "complete", "images": [...]}`.
- **CORS:** Configure for dev (localhost:5173 -> localhost:7865).
- **Proxy:** Vite dev server proxies `/api` to FastAPI backend.
