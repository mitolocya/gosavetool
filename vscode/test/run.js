// Plain Node checks of the subtitle and text helpers: node test/run.js
const assert = require('assert');
const sub = require('../src/subtitle');
const text = require('../src/text');

const srt = '1\r\n00:00:01,000 --> 00:00:03,500\r\nHello\r\nworld\r\n\r\n2\r\n00:00:03,000 --> 00:00:02,000\r\nSecond\r\n\r\n3\r\n00:00:00,500 --> 00:00:00,900\r\nFirst\r\n';
const cues = sub.parse(srt);
assert.strictEqual(cues.length, 3);
assert.strictEqual(cues[0].text, 'Hello\nworld');
const vtt = sub.toVtt(cues);
assert.ok(vtt.startsWith('WEBVTT\n\n00:00:01.000 --> 00:00:03.500\nHello'));
assert.deepStrictEqual(sub.parse(vtt).map(c => c.start), [1000, 3000, 500]);
assert.strictEqual(sub.toSrt(sub.parse('WEBVTT\n\nNOTE hi\n\n01:02.5 --> 01:04.000 align:start\nA\n')), '1\n00:01:02,500 --> 00:01:04,000\nA\n');
assert.deepStrictEqual(sub.shift(cues, -1000).map(c => [c.start, c.end]), [[0, 2500], [2000, 1000]]);
const r = sub.repair(cues);
assert.deepStrictEqual(r.cues.map(c => c.text), ['First', 'Hello\nworld', 'Second']);
assert.ok(r.cues.every((c, i, a) => c.end > c.start && (!a[i + 1] || c.end <= a[i + 1].start)));
assert.strictEqual(sub.fromMs(3723004, ','), '01:02:03,004');

const st = text.stats('Hello world. It’s 2026!\nSecond line.');
assert.deepStrictEqual([st.words, st.lines, st.sentences], [6, 2, 3]);
assert.strictEqual(text.title('the lord of the rings: return of the king'), 'The Lord of the Rings: Return of the King');
assert.strictEqual(text.sentence('HELLO WORLD. how ARE you?'), 'Hello world. How are you?');
assert.strictEqual(text.slug('Ölçü Birimi & Çeviri!'), 'olcu-birimi-ceviri');
assert.strictEqual(text.camel('best posting time'), 'bestPostingTime');
assert.strictEqual(text.snake('bestPostingTime'), 'best_posting_time');
assert.strictEqual(text.kebab('Best Posting_Time'), 'best-posting-time');
assert.strictEqual(text.clean('a   b  \n\n\n\nc\t'), 'a b\n\nc');
console.log('all checks passed');
