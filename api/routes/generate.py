import asyncio
import base64
import io
import os
from pathlib import Path

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from PIL import Image

import modules.async_worker as worker
import shared
from api.schemas import GenerateRequest, GenerateResponse

router = APIRouter()


def _build_gen_data(req: GenerateRequest) -> dict:
    """Convert a GenerateRequest into the gen_data dict the async_worker expects."""
    # Use default base model from settings when not specified
    base_model = req.base_model_name
    if base_model is None:
        base_model = shared.settings.default_settings.get(
            "base_model", "sd_xl_base_1.0_0.9vae.safetensors"
        )

    # Format loras as list of (hash, "weight - name") tuples the worker expects.
    # The worker splits on " - " to separate weight from name, and uses the first
    # element as a potential SHA-256 hash.
    loras = []
    for lora in req.loras:
        hash_val = lora.hash if lora.hash else ""
        loras.append((hash_val, f"{lora.weight} - {lora.name}"))

    # Decode base64 input image if provided
    input_image = None
    if req.input_image:
        try:
            image_bytes = base64.b64decode(req.input_image)
            input_image = Image.open(io.BytesIO(image_bytes))
        except Exception:
            input_image = None

    gen_data = {
        "task_type": "process",
        "prompt": req.prompt,
        "negative": req.negative_prompt,
        "base_model_name": base_model,
        "loras": loras if loras else None,
        "style_selection": req.style_selection,
        "performance_selection": req.performance_selection,
        "custom_steps": req.custom_steps,
        "cfg": req.cfg,
        "sampler_name": req.sampler_name,
        "scheduler": req.scheduler,
        "clip_skip": req.clip_skip,
        "aspect_ratios_selection": req.aspect_ratios_selection,
        "custom_width": req.custom_width,
        "custom_height": req.custom_height,
        "seed": req.seed,
        "image_number": req.image_number,
        "auto_negative": req.auto_negative_prompt,
        "cn_selection": req.cn_selection,
        "cn_type": req.cn_type,
        "input_image": input_image,
        "cn_edge_low": req.cn_edge_low,
        "cn_edge_high": req.cn_edge_high,
        "cn_start": req.cn_start,
        "cn_stop": req.cn_stop,
        "cn_strength": req.cn_strength,
        "image_total": req.image_number,
        "generate_forever": False,
    }
    return gen_data


@router.post("/generate", response_model=GenerateResponse)
async def generate(req: GenerateRequest):
    """Submit a generation task and return a task_id for tracking via WebSocket."""
    gen_data = _build_gen_data(req)
    shared.state["interrupted"] = False
    task_id = worker.add_task(gen_data)
    return GenerateResponse(task_id=task_id)


@router.post("/generate/stop")
async def generate_stop():
    """Interrupt the current generation."""
    worker.interrupt_ruined_processing = True
    return {"status": "stopping"}


@router.websocket("/ws/generate/{task_id}")
async def ws_generate(websocket: WebSocket, task_id: int):
    """
    Stream generation progress for a given task_id.

    Messages sent to the client:
      - {"type": "progress", "percent": int, "status": str, "preview": str|null}
      - {"type": "complete", "images": [str, ...]}
      - {"type": "error", "message": str}
    """
    await websocket.accept()
    loop = asyncio.get_event_loop()

    try:
        while True:
            # worker.task_result() is BLOCKING -- run in a thread so we do not
            # block the asyncio event loop.
            flag, product = await loop.run_in_executor(
                None, worker.task_result, task_id
            )

            if flag == "preview":
                percent, status, preview_path = product

                # Encode the preview image as a data-URI so the frontend can
                # display it without a separate fetch.
                preview_data = None
                if preview_path is not None:
                    try:
                        preview_file = str(preview_path)
                        if os.path.isfile(preview_file):
                            with open(preview_file, "rb") as f:
                                raw = f.read()
                            preview_data = (
                                "data:image/jpeg;base64,"
                                + base64.b64encode(raw).decode("ascii")
                            )
                    except Exception:
                        preview_data = None

                await websocket.send_json(
                    {
                        "type": "progress",
                        "percent": percent,
                        "status": status,
                        "preview": preview_data,
                    }
                )

            elif flag == "results":
                # Convert absolute file paths to API-served URLs.
                images = []
                outputs_dir = str(
                    shared.path_manager.model_paths["temp_outputs_path"]
                )
                for img_path in product:
                    img_path = str(img_path)
                    try:
                        rel = os.path.relpath(img_path, outputs_dir)
                    except ValueError:
                        # On Windows different drives can cause relpath to fail
                        rel = Path(img_path).name
                    images.append(f"/api/outputs/{rel}")

                await websocket.send_json(
                    {
                        "type": "complete",
                        "images": images,
                    }
                )
                await websocket.close()
                break

    except WebSocketDisconnect:
        pass
    except Exception as exc:
        try:
            await websocket.send_json(
                {"type": "error", "message": str(exc)}
            )
            await websocket.close()
        except Exception:
            pass
