"""
FastAPI backend for RuinedFooocus.

This module replaces Gradio as the HTTP server.  It wires together the API
routers, serves static assets (outputs, thumbnails, React build), and
configures CORS for local development.

Usage:
    uvicorn api_server:app --host 0.0.0.0 --port 8000
"""

import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

import shared
from api.routes.generate import router as generate_router
from api.routes.models import router as models_router
from api.routes.settings import router as settings_router
from api.routes.controlnet import router as controlnet_router
from api.routes.obp import router as obp_router
from api.routes.browser import router as browser_router
from api.routes.evolve import router as evolve_router
from api.routes.llama import router as llama_router
from modules.imagebrowser import ImageBrowser

app = FastAPI(
    title="RuinedFooocus API",
    description="Backend API for the RuinedFooocus image generation application.",
)

# ---------------------------------------------------------------------------
# CORS -- allow the Vite dev server during development
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# API routers
# ---------------------------------------------------------------------------
app.include_router(generate_router, prefix="/api")
app.include_router(models_router, prefix="/api")
app.include_router(settings_router, prefix="/api")
app.include_router(controlnet_router, prefix="/api")
app.include_router(obp_router, prefix="/api")
app.include_router(browser_router, prefix="/api")
app.include_router(evolve_router, prefix="/api")
app.include_router(llama_router, prefix="/api")

# Ensure browser singleton is available for the API
if "browser" not in shared.shared_cache:
    shared.shared_cache["browser"] = ImageBrowser()

# ---------------------------------------------------------------------------
# Static file mounts -- order matters: more specific paths first
# ---------------------------------------------------------------------------
# Output images
outputs_path = shared.path_manager.model_paths["temp_outputs_path"]
outputs_dir = str(outputs_path)
if os.path.isdir(outputs_dir):
    app.mount(
        "/api/outputs",
        StaticFiles(directory=outputs_dir),
        name="outputs",
    )

# Thumbnail caches
checkpoint_cache = shared.models.cache_paths["checkpoints"]
if Path(checkpoint_cache).is_dir():
    app.mount(
        "/api/thumbnails/checkpoints",
        StaticFiles(directory=str(checkpoint_cache)),
        name="thumbnails_checkpoints",
    )

lora_cache = shared.models.cache_paths["loras"]
if Path(lora_cache).is_dir():
    app.mount(
        "/api/thumbnails/loras",
        StaticFiles(directory=str(lora_cache)),
        name="thumbnails_loras",
    )

# Chatbot avatars
_chatbots_dir = Path("chatbots")
if _chatbots_dir.is_dir():
    app.mount(
        "/api/chatbot-avatars",
        StaticFiles(directory=str(_chatbots_dir)),
        name="chatbot_avatars",
    )

# ---------------------------------------------------------------------------
# React production build -- serve index.html as catch-all for client-side
# routing.  Mount the static assets first, then add a fallback route.
# ---------------------------------------------------------------------------
_frontend_dist = Path(__file__).parent / "frontend" / "dist"

if _frontend_dist.is_dir():
    # Serve JS/CSS/images/etc. that Vite outputs with hashed filenames
    app.mount(
        "/assets",
        StaticFiles(directory=str(_frontend_dist / "assets")),
        name="frontend_assets",
    )

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """
        Catch-all route: return the requested file from the React build if it
        exists, otherwise fall back to index.html so that client-side routing
        works.
        """
        file = _frontend_dist / full_path
        if full_path and file.is_file():
            return FileResponse(str(file))
        return FileResponse(str(_frontend_dist / "index.html"))
