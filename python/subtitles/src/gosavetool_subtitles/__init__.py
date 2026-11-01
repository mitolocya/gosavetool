"""Parse, convert, shift and repair SRT and WebVTT subtitles. No dependencies.

Made by GoSaveTool: https://www.gosavetool.com/vtt-subtitle-generator
"""
from __future__ import annotations

import re
from dataclasses import dataclass, replace
from typing import List, Tuple

__all__ = ["Cue", "to_ms", "from_ms", "parse", "is_vtt", "to_srt", "to_vtt", "convert", "shift", "repair"]
__version__ = "1.0.0"

_TIME = re.compile(r"(\d{1,2}:)?(\d{1,2}):(\d{1,2})[,.](\d{1,3})")
_STAMP = r"(?:\d{1,2}:)?\d{1,2}:\d{1,2}[,.]\d{1,3}"
_ARROW = re.compile(r"^\s*(" + _STAMP + r")\s*-->\s*(" + _STAMP + r")(.*)$")


@dataclass
class Cue:
    """One subtitle cue; times in milliseconds."""

    start: int
    end: int
    text: str
    settings: str = ""


def to_ms(stamp: str) -> int:
    """'00:01:02,500' or '01:02.5' -> 62500. Raises ValueError for anything else."""
    m = _TIME.search(stamp)
    if not m:
        raise ValueError("not a timestamp: %r" % stamp)
    h = int(m.group(1)[:-1]) if m.group(1) else 0
    return ((h * 60 + int(m.group(2))) * 60 + int(m.group(3))) * 1000 + int(m.group(4).ljust(3, "0"))


def from_ms(ms: float, sep: str = ",") -> str:
    """62500 -> '00:01:02,500' (sep ',', SRT) or '00:01:02.500' (sep '.', WebVTT)."""
    ms = max(0, int(round(ms)))
    return "%02d:%02d:%02d%s%03d" % (ms // 3600000, ms // 60000 % 60, ms // 1000 % 60, sep, ms % 1000)


def parse(src: str) -> List[Cue]:
    """Cues of an SRT or WebVTT text. Headers, NOTE and STYLE blocks are skipped."""
    # "\r\r\n" too: a file saved twice with Windows line endings
    text = re.sub(r"\r*\n|\r", "\n", src.lstrip("﻿"))
    cues = []
    for block in re.split(r"\n{2,}", text):
        lines = block.split("\n")
        at = next((i for i, line in enumerate(lines) if _ARROW.match(line)), -1)
        if at < 0:
            continue
        m = _ARROW.match(lines[at])
        cues.append(Cue(to_ms(m.group(1)), to_ms(m.group(2)), "\n".join(lines[at + 1:]).strip(), m.group(3).strip()))
    return cues


def is_vtt(src: str) -> bool:
    """True when the text starts with the WEBVTT signature."""
    return src.lstrip("﻿").startswith("WEBVTT")


def to_srt(cues: List[Cue]) -> str:
    """SRT text, numbered from 1."""
    return "\n\n".join(
        "%d\n%s --> %s\n%s" % (i + 1, from_ms(c.start, ","), from_ms(c.end, ","), c.text) for i, c in enumerate(cues)
    ) + "\n"


def to_vtt(cues: List[Cue]) -> str:
    """WebVTT text; cue settings are kept."""
    return "WEBVTT\n\n" + "\n\n".join(
        "%s --> %s%s\n%s" % (from_ms(c.start, "."), from_ms(c.end, "."), " " + c.settings if c.settings else "", c.text)
        for c in cues
    ) + "\n"


def convert(src: str, to: str) -> str:
    """Converts a subtitle text to 'srt' or 'vtt'."""
    if to not in ("srt", "vtt"):
        raise ValueError("the target format must be 'srt' or 'vtt'")
    return to_vtt(parse(src)) if to == "vtt" else to_srt(parse(src))


def shift(cues: List[Cue], ms: int) -> List[Cue]:
    """Moves every cue by ms (negative = earlier); cues pushed before zero are clipped or dropped."""
    out = [replace(c, start=max(0, c.start + ms), end=max(0, c.end + ms)) for c in cues]
    return [c for c in out if c.end > 0]


def repair(cues: List[Cue], min_duration: int = 2000) -> Tuple[List[Cue], int]:
    """Sorts cues, fixes end times before the start and overlaps, drops empty cues.

    Returns the repaired cues and the number of changes.
    """
    fixed = sum(1 for c in cues if not c.text)
    out = [replace(c) for c in cues if c.text]
    before = [c.start for c in out]
    out.sort(key=lambda c: c.start)
    if [c.start for c in out] != before:
        fixed += 1
    for i, c in enumerate(out):
        if not c.end > c.start:
            c.end = c.start + min_duration
            fixed += 1
        if i + 1 < len(out) and c.end > out[i + 1].start:
            c.end = max(c.start + 1, out[i + 1].start - 1)
            fixed += 1
    return out, fixed
