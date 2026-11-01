'use strict';
// Background: the right-click menus. "Save image as" converts the picture here (OffscreenCanvas) and
// downloads it; the other entries open a page of the extension. Nothing is sent anywhere.

const SITE = 'https://www.gosavetool.com/';
const site = (page, content) => SITE + page + '?utm_source=browser-extension&utm_medium=extension&utm_content=' + content;

const FORMATS = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' };

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({ id: 'img', title: 'GoSaveTool', contexts: ['image'] });
        chrome.contextMenus.create({ id: 'save-png', parentId: 'img', title: 'Save image as PNG', contexts: ['image'] });
        chrome.contextMenus.create({ id: 'save-jpg', parentId: 'img', title: 'Save image as JPG', contexts: ['image'] });
        chrome.contextMenus.create({ id: 'save-webp', parentId: 'img', title: 'Save image as WebP', contexts: ['image'] });
        chrome.contextMenus.create({ id: 'sep', parentId: 'img', type: 'separator', contexts: ['image'] });
        chrome.contextMenus.create({ id: 'edit', parentId: 'img', title: 'Compress or resize image…', contexts: ['image'] });
        chrome.contextMenus.create({ id: 'count', title: 'Count words and characters', contexts: ['selection'] });
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'count') {
        chrome.storage.local.set({ selection: info.selectionText || '' }).then(() =>
            chrome.windows.create({ url: chrome.runtime.getURL('popup.html?from=selection'), type: 'popup', width: 420, height: 640 }));
        return;
    }
    const src = info.srcUrl;
    if (!src) return;
    // asked here, inside the click (a user action), and only once: reading images from other sites needs it
    const allowed = /^(data|blob):/.test(src) ? Promise.resolve(true) : chrome.permissions.request({ origins: ['<all_urls>'] });
    if (info.menuItemId === 'edit') {
        allowed.then(() => chrome.tabs.create({ url: chrome.runtime.getURL('image.html?src=' + encodeURIComponent(src)), index: tab ? tab.index + 1 : undefined }));
        return;
    }
    const fmt = String(info.menuItemId).replace('save-', '');
    allowed.then(ok => ok ? saveAs(src, fmt) : notify('Permission needed', 'Allow GoSaveTool to read images so it can convert them. Nothing is uploaded.'))
        .catch(e => notify('Could not save the image', e.message + ' Try the online converter at gosavetool.com.'));
});

/** Fetches the image, draws it on a canvas, encodes it as fmt and downloads it under the original name */
async function saveAs(src, fmt) {
    const res = await fetch(src);
    if (!res.ok) throw new Error('The site answered ' + res.status + '.');
    const blob = await res.blob();
    let bmp;
    try {
        bmp = await createImageBitmap(blob);
    } catch {
        throw new Error('This image type (' + (blob.type || 'unknown') + ') cannot be read.');
    }
    const canvas = new OffscreenCanvas(bmp.width, bmp.height);
    const ctx = canvas.getContext('2d');
    if (fmt === 'jpg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, bmp.width, bmp.height); } // JPG has no transparency
    ctx.drawImage(bmp, 0, 0);
    bmp.close();
    const out = await canvas.convertToBlob({ type: FORMATS[fmt], quality: 0.92 });
    await chrome.downloads.download({ url: await downloadUrl(out), filename: fileName(src, fmt) });
}

/** An object URL where the background has one (Firefox), a data URL in a Chrome service worker */
async function downloadUrl(blob) {
    if (typeof URL.createObjectURL === 'function') return URL.createObjectURL(blob);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return 'data:' + blob.type + ';base64,' + btoa(bin);
}

/** "https://cdn.x.com/a/photo.webp?w=800" → "photo.png" */
function fileName(src, fmt) {
    let base = 'image';
    try {
        if (!/^(data|blob):/.test(src)) base = decodeURIComponent(new URL(src).pathname.split('/').pop() || '') || base;
    } catch { /* keep "image" */ }
    base = base.replace(/\.[a-z0-9]{2,5}$/i, '').replace(/[\\/:*?"<>|\x00-\x1f]+/g, '_').slice(0, 120) || 'image';
    return base + '.' + fmt;
}

function notify(title, message) {
    chrome.notifications.create('gst-' + Date.now(), { type: 'basic', iconUrl: 'icons/128.png', title, message });
}

chrome.notifications.onClicked.addListener(() => chrome.tabs.create({ url: site('convert-image-format', 'error') }));
