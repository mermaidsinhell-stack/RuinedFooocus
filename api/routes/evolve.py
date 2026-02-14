"""Evolve (prompt mutation) API routes."""

import random
import re
from pathlib import Path

from fastapi import APIRouter

from shared import tokenizer
from random_prompt.build_dynamic_prompt import createpromptvariant
from api.schemas import EvolveMutateRequest, EvolveMutateResponse

router = APIRouter()

# Cache the word list (loaded once on first use)
_word_list: list[str] | None = None


def _get_word_list() -> list[str]:
    global _word_list
    if _word_list is None:
        with open("wildcards_official/words.txt", "r", encoding="utf-8") as f:
            _word_list = f.read().lower().splitlines()
    return _word_list


def _tokenize_and_randomize(prompt: str, strength: int) -> str:
    """Randomly replace CLIP tokens at the given strength percentage."""
    all_tokens = list(tokenizer.get_vocab().keys())
    tokens = tokenizer.tokenize(prompt)
    res = []
    for token in tokens:
        if random.random() < float(strength / 100.0):
            res.append(all_tokens[random.randint(0, len(all_tokens) - 3)])
        else:
            res.append(token)
    return tokenizer.convert_tokens_to_string(res).strip()


def _randomize_words(prompt: str, strength: int) -> str:
    """Randomly replace dictionary words at the given strength percentage."""
    word_list = _get_word_list()
    words = re.split(r"\b", prompt)
    res = []
    for word in words:
        if (
            not word.isdigit()
            and word.lower() in word_list
            and random.random() < float(strength / 100.0)
        ):
            res.append(word_list[random.randint(0, len(word_list) - 1)])
        else:
            res.append(word)
    return "".join(res).strip()


def _four_evolved(prompt: str, mode: str, strength: int) -> list[str]:
    """Generate 4 mutated variants of a prompt."""
    res = []
    for _ in range(4):
        if mode == "Words":
            res.append(_randomize_words(prompt, strength))
        elif mode == "OBP Variant":
            res.append(
                createpromptvariant(prompt, max(int(strength / 10), 3), advancedprompting=False)
            )
        else:  # "Tokens" or default
            res.append(_tokenize_and_randomize(prompt, strength))
    return res


@router.post("/evolve/mutate", response_model=EvolveMutateResponse)
async def evolve_mutate(req: EvolveMutateRequest):
    """Mutate a prompt using the Evolve system."""
    prompts = req.prompt.split("---")
    idx = min(req.button, len(prompts)) - 1
    in_txt = prompts[idx]

    if req.mode == "Copy to Prompt...":
        return EvolveMutateResponse(prompt=in_txt.strip(), mode=req.mode)

    variants = _four_evolved(in_txt, req.mode, req.strength) + [in_txt] + _four_evolved(in_txt, req.mode, req.strength)
    return EvolveMutateResponse(
        prompt="\n---\n".join(variants),
        mode=req.mode,
    )
