# @gosavetool/subtitles

Parse, convert, shift and repair **SRT** and **WebVTT** subtitles. Zero dependencies, works in Node and the browser, and comes with a small CLI.

Made by [GoSaveTool](https://www.gosavetool.com/). Prefer a visual editor? The [VTT Subtitle Generator](https://www.gosavetool.com/vtt-subtitle-generator) times captions against the video in your browser.

## Install

```bash
npm install @gosavetool/subtitles
```

## Convert SRT to WebVTT

```js
const { convert } = require('@gosavetool/subtitles');

const vtt = convert(fs.readFileSync('movie.srt', 'utf8'), 'vtt');
const srt = convert(fs.readFileSync('movie.vtt', 'utf8'), 'srt');
```

## Work with cues

```js
const { parse, shift, repair, toSrt, toVtt } = require('@gosavetool/subtitles');

const cues = parse(text);           // [{ start: 1000, end: 3500, settings: '', text: 'Hello' }, …]
const later = shift(cues, 1500);    // every cue 1.5 s later (negative = earlier)
const { cues: fixed, fixed: n } = repair(cues); // sort, fix overlaps and bad end times, drop empty cues
fs.writeFileSync('out.srt', toSrt(fixed));
```

| Function | Returns |
| --- | --- |
| `parse(text)` | Cues of an SRT or WebVTT text, times in milliseconds |
| `toSrt(cues)` / `toVtt(cues)` | Subtitle text; SRT is renumbered from 1 |
| `convert(text, 'srt' \| 'vtt')` | Converted text in one call |
| `shift(cues, ms)` | Cues moved by `ms`; cues before 0 are clipped or dropped |
| `repair(cues, { minDuration })` | `{ cues, fixed }` with the number of changes |
| `isVtt(text)` | `true` when the text starts with `WEBVTT` |
| `toMs('00:01:02,500')` / `fromMs(62500, '.')` | Timestamp ↔ milliseconds |

TypeScript types are included.

## CLI

```bash
npx @gosavetool/subtitles convert movie.srt --to vtt
npx @gosavetool/subtitles shift movie.srt -1.5
npx @gosavetool/subtitles repair movie.vtt
npx @gosavetool/subtitles info movie.srt
```

`-o out.vtt` writes to another file, `--stdout` prints the result.

## Related

- [Auto Captions Generator](https://www.gosavetool.com/auto-captions-generator): captions from speech
- [Video to Text](https://www.gosavetool.com/video-to-text): transcribe a video
- Python: [`gosavetool-subtitles`](https://pypi.org/project/gosavetool-subtitles/) · PHP: [`gosavetool/subtitles`](https://packagist.org/packages/gosavetool/subtitles)
- VS Code: [GoSaveTool extension](https://marketplace.visualstudio.com/items?itemName=gosavetool.gosavetool)

## License

MIT
