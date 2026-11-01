# gosavetool/subtitles

Parse, convert, shift and repair **SRT** and **WebVTT** subtitles in PHP 8. No dependencies.

Made by [GoSaveTool](https://www.gosavetool.com/). Prefer a visual editor? The [VTT Subtitle Generator](https://www.gosavetool.com/vtt-subtitle-generator) times captions against the video in your browser.

## Install

```bash
composer require gosavetool/subtitles
```

## Convert SRT to WebVTT

```php
use GoSaveTool\Subtitles\Subtitles;

file_put_contents('movie.vtt', Subtitles::convert(file_get_contents('movie.srt'), 'vtt'));
```

Serving captions for an HTML5 `<track>`? Send the result with `Content-Type: text/vtt`.

## Work with cues

```php
use GoSaveTool\Subtitles\Subtitles;

$cues  = Subtitles::parse($text);          // Cue objects: start, end (ms), text, settings
$later = Subtitles::shift($cues, 1500);    // every cue 1.5 s later (negative = earlier)
$r     = Subtitles::repair($cues);         // ['cues' => [...], 'fixed' => 3]
file_put_contents('out.srt', Subtitles::toSrt($r['cues']));
```

| Method | Returns |
| --- | --- |
| `parse($text)` | `Cue[]` of an SRT or WebVTT text, times in milliseconds |
| `toSrt($cues)` / `toVtt($cues)` | Subtitle text; SRT is renumbered from 1 |
| `convert($text, 'srt' \| 'vtt')` | Converted text in one call |
| `shift($cues, $ms)` | Cues moved by `$ms`; cues before 0 are clipped or dropped |
| `repair($cues, $minDuration = 2000)` | `['cues' => Cue[], 'fixed' => int]` |
| `isVtt($text)` | `true` when the text starts with `WEBVTT` |
| `toMs('00:01:02,500')` / `fromMs(62500, '.')` | Timestamp and milliseconds |

## Related

- [Auto Captions Generator](https://www.gosavetool.com/auto-captions-generator): captions from speech, in the browser
- [Video to Text](https://www.gosavetool.com/video-to-text): transcribe a video
- JavaScript: [`@gosavetool/subtitles`](https://www.npmjs.com/package/@gosavetool/subtitles) · Python: [`gosavetool-subtitles`](https://pypi.org/project/gosavetool-subtitles/)

## License

MIT
