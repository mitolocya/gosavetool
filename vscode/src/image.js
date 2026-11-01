'use strict';
// Image panel: compress, convert (WebP / JPEG / PNG) and resize with the canvas of a webview.
// The picture never leaves the computer: the extension reads the file, the webview encodes it
// and sends the bytes back to be saved next to the original.

const vscode = require('vscode');
const path = require('path');
const crypto = require('crypto');

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.bmp': 'image/bmp' };
const EXT = { 'image/webp': '.webp', 'image/jpeg': '.jpg', 'image/png': '.png' };

/** A free name next to the original: photo.webp, then photo-1.webp, photo-2.webp … */
async function freeName(dir, base, ext) {
    for (let i = 0; ; i++) {
        const uri = vscode.Uri.joinPath(dir, base + (i ? '-' + i : '') + ext);
        try { await vscode.workspace.fs.stat(uri); } catch { return uri; }
    }
}

async function open(context, uri, preset) {
    const ext = path.extname(uri.fsPath).toLowerCase();
    if (!MIME[ext]) {
        vscode.window.showWarningMessage('GoSaveTool: PNG, JPEG, WebP, GIF and BMP images can be opened.');
        return;
    }
    const bytes = await vscode.workspace.fs.readFile(uri);
    const name = path.basename(uri.fsPath);
    const panel = vscode.window.createWebviewPanel('gosavetool.image', 'Image: ' + name, vscode.ViewColumn.Active, { enableScripts: true, retainContextWhenHidden: true });
    panel.iconPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'icon.png');
    panel.webview.html = html(panel.webview, name, bytes.length, preset);

    panel.webview.onDidReceiveMessage(async msg => {
        if (msg.type === 'ready') {
            panel.webview.postMessage({ type: 'load', src: 'data:' + MIME[ext] + ';base64,' + Buffer.from(bytes).toString('base64') });
        } else if (msg.type === 'save') {
            const dir = vscode.Uri.file(path.dirname(uri.fsPath));
            const base = path.basename(uri.fsPath, path.extname(uri.fsPath)) + (EXT[msg.mime] === ext ? '-min' : '');
            const target = await freeName(dir, base, EXT[msg.mime]);
            await vscode.workspace.fs.writeFile(target, Buffer.from(msg.data, 'base64'));
            const pick = await vscode.window.showInformationMessage('Saved ' + path.basename(target.fsPath) + ' (' + kb(msg.size) + ', was ' + kb(bytes.length) + ').', 'Reveal', 'More image tools');
            if (pick === 'Reveal') vscode.commands.executeCommand('revealInExplorer', target);
            if (pick === 'More image tools') vscode.env.openExternal(vscode.Uri.parse(require('./links').url('image-compressor', 'image-panel')));
        } else if (msg.type === 'site') {
            vscode.env.openExternal(vscode.Uri.parse(require('./links').url(msg.page, 'image-panel')));
        }
    });
}

function kb(n) {
    return n >= 1048576 ? (n / 1048576).toFixed(2) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
}

function html(webview, name, size, preset) {
    const nonce = crypto.randomBytes(16).toString('base64');
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    return `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
<style>
body{font-family:var(--vscode-font-family);color:var(--vscode-foreground);padding:16px 20px;max-width:980px}
h1{font-size:1.2em;margin:0 0 4px}.sub{opacity:.75;margin:0 0 16px}
.row{display:flex;flex-wrap:wrap;gap:14px 22px;align-items:end;margin-bottom:14px}
label{display:grid;gap:4px;font-size:.92em}
select,input[type=number]{background:var(--vscode-input-background);color:var(--vscode-input-foreground);border:1px solid var(--vscode-input-border,transparent);padding:4px 6px;min-width:110px}
button{background:var(--vscode-button-background);color:var(--vscode-button-foreground);border:0;padding:6px 14px;cursor:pointer}
button:hover{background:var(--vscode-button-hoverBackground)}button:disabled{opacity:.5;cursor:default}
.stats{display:flex;gap:18px;flex-wrap:wrap;margin:6px 0 14px}.stats b{font-size:1.1em}
.good{color:var(--vscode-testing-iconPassed,#3fb950)}.bad{color:var(--vscode-errorForeground)}
.view{border:1px solid var(--vscode-panel-border);background:repeating-conic-gradient(#8882 0 25%,transparent 0 50%) 0 0/16px 16px;display:grid;place-items:center;min-height:200px;max-height:60vh;overflow:auto}
.view img{max-width:100%;max-height:60vh}
.foot{margin-top:18px;font-size:.88em;opacity:.8}a{color:var(--vscode-textLink-foreground);cursor:pointer}
</style></head><body>
<h1>${esc(name)}</h1><p class="sub">Compress, convert and resize on this computer. Nothing is uploaded.</p>
<div class="row">
<label>Format<select id="fmt"><option value="image/webp">WebP</option><option value="image/jpeg">JPEG</option><option value="image/png">PNG</option></select></label>
<label>Quality <span id="qv"></span><input id="q" type="range" min="10" max="100" value="80"></label>
<label>Max width (px)<input id="w" type="number" min="16" placeholder="original"></label>
<button id="save" disabled>Save copy</button>
</div>
<div class="stats"><span>Original <b>${esc(kb(size))}</b></span><span>New <b id="ns">…</b></span><span id="diff"></span><span id="dim"></span></div>
<div class="view"><img id="out" alt="Preview"></div>
<p class="foot">Made by <a data-site="">GoSaveTool</a>. In the browser: <a data-site="image-compressor">Image Compressor</a> · <a data-site="webp-converter">WebP Converter</a> · <a data-site="resize-image-for-social-media">Resize for social media</a></p>
<script nonce="${nonce}">
const vscode = acquireVsCodeApi(), $ = id => document.getElementById(id), ORIG = ${size};
const preset = ${JSON.stringify(preset || {})};
if (preset.format) $('fmt').value = preset.format;
let img = null, blob = null, timer = 0;
function kb(n){return n>=1048576?(n/1048576).toFixed(2)+' MB':Math.max(1,Math.round(n/1024))+' KB'}
function render(){
  if(!img) return;
  const fmt=$('fmt').value, q=+$('q').value/100, max=+$('w').value||img.naturalWidth;
  $('q').disabled = fmt==='image/png'; $('qv').textContent = fmt==='image/png' ? '(lossless)' : $('q').value;
  const w=Math.min(img.naturalWidth,Math.max(16,max)), h=Math.round(img.naturalHeight*w/img.naturalWidth);
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const x=c.getContext('2d');
  if(fmt==='image/jpeg'){x.fillStyle='#fff';x.fillRect(0,0,w,h)} // JPEG has no transparency
  x.imageSmoothingQuality='high'; x.drawImage(img,0,0,w,h);
  c.toBlob(b=>{
    blob=b; $('save').disabled=!b; if(!b) return;
    $('ns').textContent=kb(b.size); $('dim').textContent=w+' × '+h+' px';
    const p=Math.round((1-b.size/ORIG)*100);
    $('diff').innerHTML = p>0 ? '<b class="good">'+p+'% smaller</b>' : '<b class="bad">'+(-p)+'% larger</b>';
    const u=URL.createObjectURL(b); $('out').onload=()=>URL.revokeObjectURL(u); $('out').src=u;
  },fmt,q);
}
function later(){clearTimeout(timer);timer=setTimeout(render,120)}
['fmt','q','w'].forEach(id=>$(id).addEventListener('input',later));
$('save').onclick=()=>{
  if(!blob) return;
  const r=new FileReader();
  r.onload=()=>vscode.postMessage({type:'save',mime:blob.type,size:blob.size,data:String(r.result).split(',')[1]});
  r.readAsDataURL(blob);
};
document.querySelectorAll('[data-site]').forEach(a=>a.onclick=()=>vscode.postMessage({type:'site',page:a.dataset.site}));
window.addEventListener('message',e=>{
  if(e.data.type!=='load') return;
  img=new Image(); img.onload=()=>{ if(preset.maxWidth) $('w').value=preset.maxWidth; render(); }; img.src=e.data.src;
});
vscode.postMessage({type:'ready'});
</script></body></html>`;
}

module.exports = { open };
