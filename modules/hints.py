import gradio as gr
import random
import glob


def get_hint():
    hintfiles = glob.glob("hints/*.txt")
    hints = []
    for hintfile in hintfiles:
        try:
            lines = open(hintfile, encoding='utf8').read().splitlines()
            hints += [line for line in lines if line.strip()]
        except OSError:
            continue

    if not hints:
        return ""

    hint = f"**LPT:** *{random.choice(hints)}*"
    return hint
