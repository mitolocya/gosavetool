# GoSaveTool

Open source tools from [GoSaveTool](https://www.gosavetool.com/), free online tools for creators: subtitles, images, video and text, right in the browser.

This repository holds the libraries and the editor extension built from the same code as the site.

| Folder | Package | What it does |
| --- | --- | --- |
| [`browser`](browser) | Chrome and Firefox extension | Save image as PNG, JPG or WebP, compress and resize, word and character counter |
| [`vscode`](vscode) | [VS Code extension](https://marketplace.visualstudio.com/items?itemName=gosavetool.gosavetool) | SRT ↔ WebVTT, subtitle shift and repair, image compress and WebP, word count, case changes |
| [`npm/subtitles`](npm/subtitles) | [`@gosavetool/subtitles`](https://www.npmjs.com/package/@gosavetool/subtitles) | Parse, convert, shift and repair SRT and WebVTT in JavaScript, with a CLI |
| [`npm/text`](npm/text) | [`@gosavetool/text`](https://www.npmjs.com/package/@gosavetool/text) | Word count, reading time, social media limits, Title Case, slugs |
| [`python/subtitles`](python/subtitles) | [`gosavetool-subtitles`](https://pypi.org/project/gosavetool-subtitles/) | The subtitle library for Python, with a CLI |
| [`php/subtitles`](php/subtitles) | [`gosavetool/subtitles`](https://packagist.org/packages/gosavetool/subtitles) | The subtitle library for PHP 8 |

All of them are MIT licensed and have no dependencies.

## Online tools

- Subtitles: [VTT Subtitle Generator](https://www.gosavetool.com/vtt-subtitle-generator), [Auto Captions Generator](https://www.gosavetool.com/auto-captions-generator), [Video to Text](https://www.gosavetool.com/video-to-text)
- Images: [Image Compressor](https://www.gosavetool.com/image-compressor), [WebP Converter](https://www.gosavetool.com/webp-converter), [Convert Image Format](https://www.gosavetool.com/convert-image-format), [Resize Image for Social Media](https://www.gosavetool.com/resize-image-for-social-media)
- Text: [Character Counter](https://www.gosavetool.com/character-counter), [Cool Text Generator](https://www.gosavetool.com/cool-text-generator)

## Tests

```bash
node npm/subtitles/test/run.js
node npm/text/test/run.js
node vscode/test/run.js
python -m unittest discover -s python/subtitles/tests
php php/subtitles/tests/run.php
```

## Feedback

Open an [issue](https://github.com/mitolocya/gosavetool/issues) or write to us on the [contact page](https://www.gosavetool.com/contact).
