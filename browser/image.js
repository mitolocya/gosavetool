'use strict';
// Compress / resize page, opened from the image right-click menu with ?src=<image url>.

const $ = id => document.getElementById(id);
const src = new URLSearchParams(location.search).get('src') || '';
const kb = n => n >= 1048576 ? (n / 1048576).toFixed(2) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
let img = null, blob = null, orig = 0, base = 'image', timer = 0;

function fail(msg) {
    $('tool').hidden = true;
    $('error').hidden = false;
    $('error').textContent = msg + ' ';
    const a = document.createElement('a');
    a.href = '#';
    a.dataset.page = 'image-compressor';
    a.textContent = 'Open the online Image Compressor and upload the file there.';
    $('error').append(a);
    a.addEventListener('click', openSite);
}

function render() {
    if (!img) return;
    const fmt = $('fmt').value, q = +$('q').value / 100;
    $('q').disabled = fmt === 'image/png';
    $('qv').textContent = fmt === 'image/png' ? '(lossless)' : $('q').value;
    const w = Math.min(img.naturalWidth, Math.max(16, +$('w').value || img.naturalWidth));
    const h = Math.round(img.naturalHeight * w / img.naturalWidth);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    if (fmt === 'image/jpeg') { x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); } // JPG has no transparency
    x.imageSmoothingQuality = 'high';
    x.drawImage(img, 0, 0, w, h);
    c.toBlob(b => {
        blob = b;
        $('save').disabled = !b;
        if (!b) return;
        $('ns').textContent = kb(b.size);
        $('dim').textContent = w + ' × ' + h + ' px';
        const p = Math.round((1 - b.size / orig) * 100);
        const d = document.createElement('b');
        d.className = p > 0 ? 'good' : 'bad';
        d.textContent = p > 0 ? p + '% smaller' : (-p) + '% larger';
        $('diff').replaceChildren(d);
        const u = URL.createObjectURL(b);
        $('out').onload = () => URL.revokeObjectURL(u);
        $('out').src = u;
    }, fmt, q);
}

function later() { clearTimeout(timer); timer = setTimeout(render, 120); }
['fmt', 'q', 'w'].forEach(id => $(id).addEventListener('input', later));

$('save').addEventListener('click', () => {
    if (!blob) return;
    const ext = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' }[blob.type];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = base + '-gosavetool.' + ext;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
});

function openSite(e) {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://www.gosavetool.com/' + e.currentTarget.dataset.page + '?utm_source=browser-extension&utm_medium=extension&utm_content=image-page' });
}
document.querySelectorAll('[data-page]').forEach(a => a.addEventListener('click', openSite));

(async () => {
    try {
        const u = new URL(src);
        if (!/^(data|blob):/.test(src)) base = decodeURIComponent(u.pathname.split('/').pop() || '').replace(/\.[a-z0-9]{2,5}$/i, '') || 'image';
    } catch {
        return fail('No image was given.');
    }
    $('name').textContent = base;
    let data;
    try {
        const res = await fetch(src);
        if (!res.ok) throw new Error('The site answered ' + res.status + '.');
        data = await res.blob();
    } catch (e) {
        return fail('The image could not be loaded. ' + (e.message || ''));
    }
    orig = data.size;
    $('os').textContent = kb(orig);
    const url = URL.createObjectURL(data);
    img = new Image();
    img.onload = render;
    img.onerror = () => fail('This image type (' + (data.type || 'unknown') + ') cannot be read.');
    img.src = url;
})();
