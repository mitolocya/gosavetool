# gosavetool-subtitles

Parse, convert, shift and repair **SRT** and **WebVTT** subtitles in Python. No dependencies, typed, with a command line tool.

Handy after speech-to-text: turn Whisper's SRT into WebVTT for the web, move captions that run late, and clean up overlaps.

Made by [GoSaveTool](https://www.gosavetool.com/). Prefer a visual editor? The [VTT Subtitle Generator](https://www.gosavetool.com/vtt-subtitle-generator) times captions against the video in your browser.

## Install

```bash
pip install gosavetool-subtitles
```

## Convert SRT to WebVTT

```python
from pathlib import Path
from gosavetool_subtitles import convert

Path("movie.vtt").write_text(convert(Path("movie.srt").read_text("utf-8"), "vtt"), "utf-8")
```

## Work with cues

```python
from gosavetool_subtitles import parse, shift, repair, to_srt

cues = parse(text)              # [Cue(start=1000, end=3500, text='Hello', settings=''), ...]
later = shift(cues, 1500)       # every cue 1.5 s later (negative = earlier)
fixed, changes = repair(cues)   # sort, fix overlaps and bad end times, drop empty cues
Path("out.srt").write_text(to_srt(fixed), "utf-8")
```

| Function | Returns |
| --- | --- |
| `parse(text)` | `Cue` list of an SRT or WebVTT text, times in milliseconds |
| `to_srt(cues)` / `to_vtt(cues)` | Subtitle text; SRT is renumbered from 1 |
| `convert(text, "srt" or "vtt")` | Converted text in one call |
| `shift(cues, ms)` | Cues moved by `ms`; cues before 0 are clipped or dropped |
| `repair(cues, min_duration=2000)` | `(cues, number_of_changes)` |
| `is_vtt(text)` | `True` when the text starts with `WEBVTT` |
| `to_ms("00:01:02,500")` / `from_ms(62500, ".")` | Timestamp and milliseconds |

## Command line

```bash
gosavetool-subtitles convert movie.srt --to vtt
gosavetool-subtitles shift movie.srt -1.5
gosavetool-subtitles repair movie.vtt
gosavetool-subtitles info movie.srt
```

`-o out.vtt` writes to another file, `--stdout` prints the result. `python -m gosavetool_subtitles` works too.

## Related

- [Auto Captions Generator](https://www.gosavetool.com/auto-captions-generator): captions from speech, in the browser
- [Video to Text](https://www.gosavetool.com/video-to-text): transcribe a video
- JavaScript: [`@gosavetool/subtitles`](https://www.npmjs.com/package/@gosavetool/subtitles) · PHP: [`gosavetool/subtitles`](https://packagist.org/packages/gosavetool/subtitles)

## License

MIT
