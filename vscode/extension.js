'use strict';
const vscode = require('vscode');
const path = require('path');
const sub = require('./src/subtitle');
const text = require('./src/text');
const image = require('./src/image');
const links = require('./src/links');

// browser tools offered by "GoSaveTool: More tools"
const TOOLS = [
    ['Image Compressor', 'image-compressor', 'Smaller JPEG, PNG and WebP files'],
    ['WebP Converter', 'webp-converter', 'Turn images into WebP and back'],
    ['Convert Image Format', 'convert-image-format', 'PNG, JPEG, WebP, AVIF'],
    ['Resize Image for Social Media', 'resize-image-for-social-media', 'Instagram, YouTube, TikTok sizes'],
    ['Image Cropper', 'image-cropper', 'Crop to any ratio'],
    ['VTT Subtitle Generator', 'vtt-subtitle-generator', 'Write and time WebVTT captions'],
    ['Auto Captions Generator', 'auto-captions-generator', 'Captions from speech'],
    ['Video to Text', 'video-to-text', 'Transcribe a video'],
    ['Character Counter', 'character-counter', 'Limits for every social platform'],
    ['Image to Text (OCR)', 'image-to-text-ocr', 'Read text from a picture'],
    ['All tools', '', 'Every free tool on gosavetool.com'],
];

const CASES = [
    ['UPPER CASE', 'upper'], ['lower case', 'lower'], ['Title Case', 'title'], ['Sentence case', 'sentence'],
    ['camelCase', 'camel'], ['snake_case', 'snake'], ['kebab-case', 'kebab'], ['slug-for-urls', 'slug'],
];

/** Replaces every selection (or the whole document when nothing is selected) with fn(text) */
async function replaceSelections(fn) {
    const ed = vscode.window.activeTextEditor;
    if (!ed) return;
    const doc = ed.document;
    const ranges = ed.selections.every(s => s.isEmpty)
        ? [new vscode.Range(doc.positionAt(0), doc.positionAt(doc.getText().length))]
        : ed.selections.filter(s => !s.isEmpty);
    await ed.edit(b => ranges.forEach(r => b.replace(r, fn(doc.getText(r)))));
}

function subtitleEditor() {
    const ed = vscode.window.activeTextEditor;
    if (!ed) { vscode.window.showWarningMessage('GoSaveTool: open an .srt or .vtt file first.'); return null; }
    const cues = sub.parse(ed.document.getText());
    if (!cues.length) { vscode.window.showWarningMessage('GoSaveTool: no subtitle cues were found in this file.'); return null; }
    return { ed, cues, vtt: sub.isVtt(ed.document.getText()) };
}

/** Writes the converted file next to the source (photo.srt → photo.vtt), or into a new tab for an unsaved file */
async function convert(toVtt) {
    const s = subtitleEditor();
    if (!s) return;
    const out = toVtt ? sub.toVtt(s.cues) : sub.toSrt(s.cues);
    const doc = s.ed.document;
    if (doc.isUntitled) {
        await vscode.window.showTextDocument(await vscode.workspace.openTextDocument({ content: out }));
    } else {
        const p = path.parse(doc.uri.fsPath);
        const target = vscode.Uri.file(path.join(p.dir, p.name + (toVtt ? '.vtt' : '.srt')));
        let exists = true;
        try { await vscode.workspace.fs.stat(target); } catch { exists = false; }
        if (exists && await vscode.window.showWarningMessage(path.basename(target.fsPath) + ' already exists. Replace it?', { modal: true }, 'Replace') !== 'Replace') return;
        await vscode.workspace.fs.writeFile(target, Buffer.from(out, 'utf8'));
        await vscode.window.showTextDocument(target);
    }
    note((toVtt ? 'Converted ' + s.cues.length + ' cues to WebVTT.' : 'Converted ' + s.cues.length + ' cues to SRT.'), 'vtt-subtitle-generator');
}

async function shift() {
    const s = subtitleEditor();
    if (!s) return;
    const v = await vscode.window.showInputBox({
        title: 'Shift subtitles',
        prompt: 'Seconds to move every cue: 1.5 = later, -2 = earlier',
        placeHolder: '-0.5',
        validateInput: x => /^\s*[-+]?\d+([.,]\d+)?\s*$/.test(x) ? null : 'Enter a number of seconds, like 1.5 or -2',
    });
    if (v === undefined) return;
    const ms = Math.round(parseFloat(v.replace(',', '.')) * 1000);
    const cues = sub.shift(s.cues, ms);
    await replaceAll(s.ed, sub.write(cues, s.vtt));
    note('Moved ' + cues.length + ' cues by ' + (ms / 1000) + ' s.', 'vtt-subtitle-generator');
}

async function repair() {
    const s = subtitleEditor();
    if (!s) return;
    const r = sub.repair(s.cues);
    await replaceAll(s.ed, sub.write(r.cues, s.vtt));
    note(r.fixed ? 'Fixed ' + r.fixed + ' timing problems and renumbered ' + r.cues.length + ' cues.' : 'No timing problems found; ' + r.cues.length + ' cues renumbered.', 'vtt-subtitle-generator');
}

async function replaceAll(ed, out) {
    const doc = ed.document;
    await ed.edit(b => b.replace(new vscode.Range(doc.positionAt(0), doc.positionAt(doc.getText().length)), out));
}

/** A short result message with a link to the matching browser tool */
async function note(msg, page) {
    if (await vscode.window.showInformationMessage(msg, 'Open in browser') === 'Open in browser') {
        vscode.env.openExternal(vscode.Uri.parse(links.url(page, 'notice')));
    }
}

/** Status bar item: words, characters and reading time of the selection or the document */
function counter(context) {
    const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    item.command = 'gosavetool.textStats';
    context.subscriptions.push(item);
    const update = () => {
        const ed = vscode.window.activeTextEditor;
        if (!ed || !vscode.workspace.getConfiguration('gosavetool').get('statusBar', true)) { item.hide(); return; }
        const sel = ed.selections.filter(s => !s.isEmpty);
        const st = text.stats(sel.length ? sel.map(s => ed.document.getText(s)).join('\n') : ed.document.getText());
        item.text = '$(book) ' + st.words.toLocaleString() + ' words · ' + st.chars.toLocaleString() + ' chars';
        item.tooltip = (sel.length ? 'Selection' : 'Document') + ' · about ' + Math.max(1, Math.round(st.readSeconds / 60)) + ' min to read · GoSaveTool';
        item.show();
    };
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(update),
        vscode.window.onDidChangeTextEditorSelection(update),
        vscode.workspace.onDidChangeTextDocument(e => { if (e.document === vscode.window.activeTextEditor?.document) update(); }),
        vscode.workspace.onDidChangeConfiguration(e => { if (e.affectsConfiguration('gosavetool')) update(); }),
    );
    update();
}

async function textStats() {
    const ed = vscode.window.activeTextEditor;
    if (!ed) return;
    const sel = ed.selections.filter(s => !s.isEmpty);
    const st = text.stats(sel.length ? sel.map(s => ed.document.getText(s)).join('\n') : ed.document.getText());
    const min = Math.floor(st.readSeconds / 60), sec = st.readSeconds % 60;
    const items = [
        ['Words', st.words], ['Characters', st.chars], ['Characters without spaces', st.charsNoSpaces],
        ['Sentences', st.sentences], ['Lines', st.lines], ['Reading time', (min ? min + ' min ' : '') + sec + ' s'],
    ].map(([label, v]) => ({ label: String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ','), description: label }));
    items.push({ label: '$(link-external) Check social media limits on gosavetool.com', description: '', page: 'character-counter' });
    const pick = await vscode.window.showQuickPick(items, { title: (sel.length ? 'Selection' : 'Document') + ' statistics' });
    if (pick && pick.page) vscode.env.openExternal(vscode.Uri.parse(links.url(pick.page, 'stats')));
}

async function changeCase() {
    const pick = await vscode.window.showQuickPick(CASES.map(([label, fn]) => ({ label, fn })), { title: 'Change case of the selection' });
    if (pick) await replaceSelections(text[pick.fn]);
}

async function moreTools() {
    const pick = await vscode.window.showQuickPick(TOOLS.map(([label, page, description]) => ({ label, page, description })), { title: 'Free GoSaveTool tools in your browser' });
    if (pick) vscode.env.openExternal(vscode.Uri.parse(links.url(pick.page, 'more-tools')));
}

/** The image under the right-click, or the one open in the editor, or one picked from a dialog */
async function imageUri(uri) {
    if (uri instanceof vscode.Uri) return uri;
    const tab = vscode.window.tabGroups.activeTabGroup.activeTab;
    if (tab && tab.input && tab.input.uri && /\.(png|jpe?g|webp|gif|bmp)$/i.test(tab.input.uri.fsPath)) return tab.input.uri;
    const picked = await vscode.window.showOpenDialog({ canSelectMany: false, filters: { Images: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'] } });
    return picked && picked[0];
}

function activate(context) {
    const reg = (id, fn) => context.subscriptions.push(vscode.commands.registerCommand('gosavetool.' + id, fn));
    // from the explorer the file arrives as an argument: open it first, then convert as from the editor
    const fromFile = fn => async uri => { if (uri instanceof vscode.Uri) await vscode.window.showTextDocument(uri); return fn(); };
    reg('srtToVtt', fromFile(() => convert(true)));
    reg('vttToSrt', fromFile(() => convert(false)));
    reg('shiftSubtitles', shift);
    reg('repairSubtitles', repair);
    reg('textStats', textStats);
    reg('changeCase', changeCase);
    for (const [, fn] of CASES) reg('case.' + fn, () => replaceSelections(text[fn]));
    reg('cleanWhitespace', () => replaceSelections(text.clean));
    reg('imageTools', async uri => { const u = await imageUri(uri); if (u) image.open(context, u); });
    reg('convertToWebp', async uri => { const u = await imageUri(uri); if (u) image.open(context, u, { format: 'image/webp' }); });
    reg('moreTools', moreTools);
    reg('openWebsite', () => vscode.env.openExternal(vscode.Uri.parse(links.url('', 'command'))));
    counter(context);
}

function deactivate() {}

module.exports = { activate, deactivate };
