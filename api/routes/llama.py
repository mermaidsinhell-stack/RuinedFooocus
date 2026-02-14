"""Llama (simple rewrite) and Chat API routes."""

import asyncio
import json
from pathlib import Path

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from PIL import Image
import base64

import modules.async_worker as worker
from modules.llama_pipeline import run_llama, llama_names
from fastapi import HTTPException
from api.schemas import (
    LlamaPresetInfo,
    LlamaRewriteRequest,
    SelectAssistantRequest,
    AssistantListItem,
    AssistantInfo,
    ChatSendRequest,
    ChatSendResponse,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# Character card parsing (ported from modules/ui/ui_llama_chat.py)
# ---------------------------------------------------------------------------

def _info_from_char(file: Path) -> dict | None:
    """Parse character card data from a PNG file (Chara Card v1/v2/v3)."""
    with Image.open(str(file)) as img:
        img.getexif()
        if "chara" not in img.info:
            return None
        d = img.info["chara"]

    b = base64.b64decode(d)
    j = json.loads(b)
    spec = j.get("spec", "")

    if spec in ("chara_card_v3", "chara_card_v2"):
        name = j["data"]["name"]
        greeting = j["data"]["first_mes"]
        personality = j["data"]["personality"]
        scenario = j["data"]["scenario"]
        summary = j["data"]["description"]
    elif all(key in j for key in ("name", "first_mes", "personality", "scenario")):
        # chara_card_v1
        name = j["name"]
        greeting = j["first_mes"]
        personality = j["personality"]
        scenario = j["scenario"]
        summary = j.get("summary", "")
    else:
        return None

    return {
        "name": name,
        "greeting": greeting,
        "avatar": str(file),
        "system": f"Your name is {name}.\nYou are: {personality}\nScenario: {scenario}",
        "embed": json.dumps([["text", f"Summary: {summary}"]]),
    }


def _get_assistants() -> list[tuple[str, str]]:
    """List all available chatbot assistants (ported from ui_llama_chat.py)."""
    names = []
    folder_path = Path("chatbots")
    if not folder_path.exists():
        return names

    for path in folder_path.rglob("*"):
        if path.is_dir():
            try:
                with open(path / "info.json", "r", encoding="utf-8") as f:
                    info = json.load(f)
                names.append((info["name"], str(path)))
            except Exception:
                pass
        else:
            if path.suffix.lower() == ".png" and not (path.parent / "info.json").exists():
                try:
                    character = _info_from_char(path)
                    if character is not None:
                        names.append((character.get("name", "???"), str(path)))
                except Exception:
                    pass

    names.sort(key=lambda x: x[0].casefold())
    return names


def _select_assistant(path_str: str) -> dict:
    """Load full assistant info by path (ported from ui_llama_chat.py)."""
    # Validate path is within the chatbots directory
    safe_base = Path("chatbots").resolve()
    character = Path(path_str).resolve()
    if not str(character).startswith(str(safe_base)):
        raise ValueError(f"Invalid assistant path: must be within chatbots/")
    try:
        if character.is_dir():
            with open(character / "info.json", "r", encoding="utf-8") as f:
                info = json.load(f)
            if "avatar" not in info:
                info["avatar"] = str(character / "avatar.png")
            else:
                info["avatar"] = str(character / info["avatar"])
            if "embed" in info:
                info["embed"] = json.dumps(info["embed"])
            else:
                info["embed"] = json.dumps([])
        else:
            info = _info_from_char(character)
            if info is None:
                raise ValueError(f"Could not parse character card: {path_str}")
    except Exception as e:
        info = {
            "name": "Error",
            "greeting": f"Error loading assistant: {e}",
            "avatar": "html/error.png",
            "system": "Everything is broken.",
            "embed": json.dumps([]),
        }

    return info


def _avatar_to_url(avatar_path: str) -> str:
    """Convert a local avatar path to an API-accessible URL."""
    try:
        p = Path(avatar_path)
        if str(p).startswith("chatbots"):
            return f"/api/chatbot-avatars/{p.relative_to('chatbots')}"
    except (ValueError, TypeError):
        pass
    return f"/api/chatbot-avatars/{Path(avatar_path).name}"


# ---------------------------------------------------------------------------
# Llama simple rewrite endpoints
# ---------------------------------------------------------------------------

@router.get("/llama/presets", response_model=list[LlamaPresetInfo])
async def get_llama_presets():
    """List available llama system prompt presets."""
    names = llama_names()
    return [LlamaPresetInfo(name=n, file=f) for n, f in names]


@router.post("/llama/rewrite")
async def llama_rewrite(req: LlamaRewriteRequest):
    """Rewrite a prompt using a llama system prompt (blocking, runs in executor)."""
    # Validate system_file is within the llamas directory
    safe_base = Path("llamas").resolve()
    sys_path = Path(req.system_file).resolve()
    if not str(sys_path).startswith(str(safe_base)):
        raise HTTPException(status_code=400, detail="Invalid system file path")
    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(None, run_llama, req.system_file, req.prompt)
    return {"prompt": result}


# ---------------------------------------------------------------------------
# Chat assistant endpoints
# ---------------------------------------------------------------------------

@router.get("/chat/assistants", response_model=list[AssistantListItem])
async def get_chat_assistants():
    """List available chatbot assistants."""
    assistants = _get_assistants()
    return [AssistantListItem(name=n, path=p) for n, p in assistants]


@router.post("/chat/select-assistant", response_model=AssistantInfo)
async def select_assistant(req: SelectAssistantRequest):
    """Load full details for a chatbot assistant."""
    try:
        info = _select_assistant(req.path)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return AssistantInfo(
        name=info["name"],
        greeting=info["greeting"],
        avatar_url=_avatar_to_url(info.get("avatar", "")),
        system=info["system"],
        embed=info["embed"],
    )


@router.post("/chat/send", response_model=ChatSendResponse)
async def chat_send(req: ChatSendRequest):
    """Create a chat task and return a task_id for WebSocket streaming."""
    gen_data = {
        "task_type": "llama",
        "system": req.system,
        "embed": req.embed,
        "history": [{"role": m.role, "content": m.content} for m in req.history],
    }
    task_id = worker.add_task(gen_data.copy())
    return ChatSendResponse(task_id=task_id)


@router.post("/chat/stop")
async def chat_stop():
    """Interrupt the current chat generation."""
    worker.interrupt_ruined_processing = True
    return {"status": "stopping"}


@router.websocket("/ws/chat/{task_id}")
async def ws_chat(websocket: WebSocket, task_id: int):
    """
    Stream chat responses for a given task_id.

    Messages sent to the client:
      - {"type": "stream", "history": [...]}   -- partial assistant response
      - {"type": "complete", "history": [...]}  -- final complete history
      - {"type": "error", "message": str}
    """
    await websocket.accept()
    loop = asyncio.get_running_loop()
    last_history = []

    try:
        while True:
            flag, product = await loop.run_in_executor(
                None, worker.task_result, task_id
            )

            if flag == "preview":
                # The llama pipeline sends the full history array as the preview
                # product (history + partial assistant response appended)
                last_history = product
                await websocket.send_json({
                    "type": "stream",
                    "history": product,
                })

            elif flag == "results":
                # The pipeline returns the final assistant text as the product.
                # Append it to the history we've been tracking.
                if isinstance(product, str):
                    last_history.append({"role": "assistant", "content": product})
                    final_history = last_history
                else:
                    final_history = product

                await websocket.send_json({
                    "type": "complete",
                    "history": final_history,
                })
                await websocket.close()
                break

    except WebSocketDisconnect:
        pass
    except Exception as exc:
        try:
            await websocket.send_json({"type": "error", "message": str(exc)})
            await websocket.close()
        except Exception:
            pass
