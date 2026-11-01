// node test/run.js
const assert = require('assert');
const t = require('..');

const st = t.stats('Hello world. It’s 2026!\nSecond line.');
assert.deepStrictEqual([st.words, st.lines, st.sentences], [6, 2, 3]);
assert.deepStrictEqual(t.stats('Hello world. It’s 2026!'), { words: 4, chars: 23, charsNoSpaces: 20, lines: 1, sentences: 2, readSeconds: 1 });
assert.strictEqual(t.stats('').lines, 0);
const l = t.limits('x'.repeat(300), ['x-post', 'instagram-caption']);
assert.deepStrictEqual(l['x-post'], { limit: 280, used: 300, left: -20, fits: false });
assert.strictEqual(l['instagram-caption'].fits, true);
assert.strictEqual(Object.keys(t.limits('a')).length, Object.keys(t.LIMITS).length);
assert.strictEqual(t.title('the lord of the rings: return of the king'), 'The Lord of the Rings: Return of the King');
assert.strictEqual(t.sentence('HELLO WORLD. how ARE you?'), 'Hello world. How are you?');
assert.strictEqual(t.slug('Ölçü Birimi & Çeviri!'), 'olcu-birimi-ceviri');
assert.strictEqual(t.slug('Straße café'), 'strasse-cafe');
assert.strictEqual(t.camel('best posting time'), 'bestPostingTime');
assert.strictEqual(t.snake('bestPostingTime'), 'best_posting_time');
assert.strictEqual(t.kebab('Best Posting_Time'), 'best-posting-time');
assert.strictEqual(t.clean('a   b  \n\n\n\nc\t'), 'a b\n\nc');
assert.strictEqual(t.clean('a  \r\n\r\n\r\n\r\nb'), 'a\r\n\r\nb');
console.log('all checks passed');
