#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const sub = require('./index');

const HELP = `Usage: subtitles <command> <file> [options]

Commands:
  convert <file> --to srt|vtt     Write name.srt or name.vtt next to the file
  shift <file> <seconds>          Move every cue (1.5 = later, -2 = earlier), in place
  repair <file>                   Sort, fix overlaps and bad times, renumber, in place
  info <file>                     Number of cues and the total duration

Options:
  -o, --out <file>                Write to this file instead
  --stdout                        Print the result instead of writing a file

Online editor: https://www.gosavetool.com/vtt-subtitle-generator`;

function fail(msg) {
    console.error(msg + '\n\n' + HELP);
    process.exit(1);
}

const args = process.argv.slice(2);
const opt = name => { const i = args.findIndex(a => name.includes(a)); return i < 0 ? undefined : args.splice(i, 2)[1]; };
const flag = name => { const i = args.indexOf(name); return i >= 0 && args.splice(i, 1).length > 0; };

if (!args.length || flag('-h') || flag('--help')) { console.log(HELP); process.exit(0); }
const to = opt(['--to']), out = opt(['-o', '--out']), stdout = flag('--stdout');
const [cmd, file, value] = args;
if (!file) fail('Missing file.');
if (!fs.existsSync(file)) fail('File not found: ' + file);

const src = fs.readFileSync(file, 'utf8');
const vtt = sub.isVtt(src);
const cues = sub.parse(src);
if (!cues.length) fail('No subtitle cues found in ' + file);

function save(text, target) {
    if (stdout) { process.stdout.write(text); return; }
    fs.writeFileSync(out || target, text);
    console.log('Wrote ' + (out || target));
}

switch (cmd) {
    case 'convert': {
        if (to !== 'srt' && to !== 'vtt') fail('convert needs --to srt or --to vtt');
        const p = path.parse(file);
        save(to === 'vtt' ? sub.toVtt(cues) : sub.toSrt(cues), path.join(p.dir, p.name + '.' + to));
        break;
    }
    case 'shift': {
        const sec = parseFloat(String(value).replace(',', '.'));
        if (!isFinite(sec)) fail('shift needs a number of seconds, like 1.5 or -2');
        save((vtt ? sub.toVtt : sub.toSrt)(sub.shift(cues, Math.round(sec * 1000))), file);
        break;
    }
    case 'repair': {
        const r = sub.repair(cues);
        save((vtt ? sub.toVtt : sub.toSrt)(r.cues), file);
        if (!stdout) console.log(r.fixed ? r.fixed + ' problems fixed' : 'No problems found');
        break;
    }
    case 'info': {
        const end = Math.max(...cues.map(c => c.end));
        console.log((vtt ? 'WebVTT' : 'SRT') + ', ' + cues.length + ' cues, ends at ' + sub.fromMs(end, vtt ? '.' : ','));
        break;
    }
    default:
        fail('Unknown command: ' + cmd);
}
