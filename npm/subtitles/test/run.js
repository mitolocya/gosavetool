// node test/run.js
const assert = require('assert');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const sub = require('..');

const srt = '1\r\n00:00:01,000 --> 00:00:03,500\r\nHello\r\nworld\r\n\r\n2\r\n00:00:03,000 --> 00:00:02,000\r\nSecond\r\n\r\n3\r\n00:00:00,500 --> 00:00:00,900\r\nFirst\r\n';
const cues = sub.parse(srt);
assert.strictEqual(cues.length, 3);
assert.strictEqual(cues[0].text, 'Hello\nworld');
assert.ok(sub.toVtt(cues).startsWith('WEBVTT\n\n00:00:01.000 --> 00:00:03.500\nHello'));
assert.strictEqual(sub.convert('WEBVTT\n\nNOTE hi\n\n01:02.5 --> 01:04.000 align:start\nA\n', 'srt'), '1\n00:01:02,500 --> 00:01:04,000\nA\n');
assert.ok(sub.convert(srt, 'vtt').includes('00:00:00.500 --> 00:00:00.900\nFirst'));
assert.throws(() => sub.convert(srt, 'ass'), TypeError);
assert.deepStrictEqual(sub.shift(cues, -1000).map(c => [c.start, c.end]), [[0, 2500], [2000, 1000]]);
const r = sub.repair(cues);
assert.deepStrictEqual(r.cues.map(c => c.text), ['First', 'Hello\nworld', 'Second']);
assert.ok(r.cues.every((c, i, a) => c.end > c.start && (!a[i + 1] || c.end <= a[i + 1].start)));
assert.strictEqual(r.fixed, 3); // order, Hello overlapping Second, Second ending before it starts
assert.strictEqual(sub.fromMs(3723004, ','), '01:02:03,004');
assert.strictEqual(sub.toMs('1:02:03.4'), 3723400);
assert.ok(Number.isNaN(sub.toMs('nope')));
assert.ok(sub.isVtt('﻿WEBVTT\n'));

// CLI
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'subs-'));
const file = path.join(dir, 'a.srt');
fs.writeFileSync(file, srt);
const cli = (...a) => execFileSync(process.execPath, [path.join(__dirname, '..', 'cli.js'), ...a], { encoding: 'utf8' });
cli('convert', file, '--to', 'vtt');
assert.ok(fs.readFileSync(path.join(dir, 'a.vtt'), 'utf8').startsWith('WEBVTT'));
assert.ok(cli('shift', file, '2', '--stdout').includes('00:00:03,000 --> 00:00:05,500'));
assert.match(cli('info', file), /SRT, 3 cues/);
cli('repair', file);
assert.ok(fs.readFileSync(file, 'utf8').startsWith('1\n00:00:00,500 --> 00:00:00,900\nFirst'));
fs.rmSync(dir, { recursive: true });
console.log('all checks passed');
