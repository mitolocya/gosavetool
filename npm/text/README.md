# @gosavetool/text

Small text helpers with no dependencies: word and character counts, reading time, social media character limits, case changes, URL slugs and whitespace cleanup.

Made by [GoSaveTool](https://www.gosavetool.com/). Need it without code? Try the [Character Counter](https://www.gosavetool.com/character-counter).

## Install

```bash
npm install @gosavetool/text
```

## Counts and reading time

```js
const { stats } = require('@gosavetool/text');

stats('Hello world. It’s 2026!');
// { words: 4, chars: 23, charsNoSpaces: 20, lines: 1, sentences: 2, readSeconds: 1 }
```

Reading time uses 238 words a minute, the average silent reading speed for non-fiction.

## Social media and SEO limits

```js
const { limits } = require('@gosavetool/text');

limits(caption, ['x-post', 'instagram-caption']);
// { 'x-post': { limit: 280, used: 312, left: -32, fits: false }, 'instagram-caption': { … fits: true } }
```

| Name | Limit |
| --- | --- |
| `x-post` | 280 |
| `instagram-caption` | 2,200 |
| `tiktok-caption` | 4,000 |
| `youtube-title` | 100 |
| `youtube-description` | 5,000 |
| `linkedin-post` | 3,000 |
| `pinterest-description` | 500 |
| `seo-title` | 60 |
| `meta-description` | 160 |

## Case and slugs

```js
const t = require('@gosavetool/text');

t.title('the lord of the rings: return of the king'); // 'The Lord of the Rings: Return of the King'
t.sentence('HELLO WORLD. how ARE you?');               // 'Hello world. How are you?'
t.slug('Ölçü Birimi & Çeviri!');                       // 'olcu-birimi-ceviri'
t.camel('best posting time');                          // 'bestPostingTime'
t.snake('bestPostingTime');                            // 'best_posting_time'
t.kebab('Best Posting_Time');                          // 'best-posting-time'
t.clean('a   b  \n\n\n\nc');                            // 'a b\n\nc'
```

`slug()` turns Turkish (ı, ş, ğ, ç, ö, ü), German (ß) and accented letters into plain ASCII.

TypeScript types are included.

## Related

- [Cool Text Generator](https://www.gosavetool.com/cool-text-generator): fancy Unicode fonts for bios
- [@gosavetool/subtitles](https://www.npmjs.com/package/@gosavetool/subtitles): SRT and WebVTT tools
- VS Code: [GoSaveTool extension](https://marketplace.visualstudio.com/items?itemName=gosavetool.gosavetool), word count in the status bar

## License

MIT
