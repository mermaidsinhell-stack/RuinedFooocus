"""Image interrogation endpoint — generate prompts from uploaded images."""

import base64
import io
from concurrent.futures import ThreadPoolExecutor

from fastapi import APIRouter, HTTPException
from PIL import Image

from api.schemas import InterrogateRequest

router = APIRouter()

_executor = ThreadPoolExecutor(max_workers=1)


class GrStub:
    """Minimal stub matching the gr.Info interface used by interrogation functions."""
    @staticmethod
    def Info(msg: str):
        print(f"[interrogate] {msg}")


def _run_interrogate(image_data: str, method: str) -> str:
    from modules.interrogate import look

    # Decode base64 image
    if "," in image_data:
        image_data = image_data.split(",", 1)[1]

    img_bytes = base64.b64decode(image_data)
    image = Image.open(io.BytesIO(img_bytes))

    prompt = method if method else ""
    result = look(image, prompt, GrStub)
    return result


@router.post("/interrogate")
async def interrogate(req: InterrogateRequest):
    """Run image interrogation to generate a prompt from an image."""
    import asyncio

    if not req.image:
        raise HTTPException(status_code=400, detail="No image provided")

    loop = asyncio.get_event_loop()
    try:
        result = await loop.run_in_executor(_executor, _run_interrogate, req.image, req.method)
    except Exception as e:
        print(f"WARNING: Interrogation failed: {e}")
        raise HTTPException(status_code=500, detail="Interrogation failed")

    return {"prompt": result}
