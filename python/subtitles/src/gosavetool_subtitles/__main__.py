"""Command line: python -m gosavetool_subtitles convert movie.srt --to vtt"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from . import convert, from_ms, is_vtt, parse, repair, shift, to_srt, to_vtt


def main(argv=None) -> int:
    p = argparse.ArgumentParser(
        prog="gosavetool-subtitles",
        description="Convert, shift and repair SRT and WebVTT subtitles.",
        epilog="Online editor: https://www.gosavetool.com/vtt-subtitle-generator",
    )
    sub = p.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("convert", help="write name.srt or name.vtt next to the file")
    c.add_argument("file")
    c.add_argument("--to", choices=["srt", "vtt"], required=True)
    s = sub.add_parser("shift", help="move every cue by N seconds (negative = earlier), in place")
    s.add_argument("file")
    s.add_argument("seconds", type=float)
    r = sub.add_parser("repair", help="sort, fix overlaps and bad times, renumber, in place")
    r.add_argument("file")
    i = sub.add_parser("info", help="number of cues and the total duration")
    i.add_argument("file")
    for x in (c, s, r):
        x.add_argument("-o", "--out", help="write to this file instead")
        x.add_argument("--stdout", action="store_true", help="print the result instead of writing a file")
    a = p.parse_args(argv)

    path = Path(a.file)
    if not path.is_file():
        p.error("file not found: %s" % path)
    # newline="": the parser sees the line endings as they are (universal newlines would turn "\r\r\n" into a blank line)
    with open(path, encoding="utf-8-sig", newline="") as fh:
        src = fh.read()
    cues = parse(src)
    if not cues:
        p.error("no subtitle cues found in %s" % path)
    write = to_vtt if is_vtt(src) else to_srt

    if a.cmd == "info":
        stamp = from_ms(max(c.end for c in cues), "." if is_vtt(src) else ",")
        print("%s, %d cues, ends at %s" % ("WebVTT" if is_vtt(src) else "SRT", len(cues), stamp))
        return 0
    if a.cmd == "convert":
        out, target = convert(src, a.to), path.with_suffix("." + a.to)
    elif a.cmd == "shift":
        out, target = write(shift(cues, int(round(a.seconds * 1000)))), path
    else:
        fixed_cues, n = repair(cues)
        out, target = write(fixed_cues), path
        if not a.stdout:
            print("%d problems fixed" % n if n else "No problems found")
    if a.stdout:
        sys.stdout.write(out)
    else:
        target = Path(a.out) if a.out else target
        target.write_text(out, encoding="utf-8")
        print("Wrote %s" % target)
    return 0


if __name__ == "__main__":
    sys.exit(main())
