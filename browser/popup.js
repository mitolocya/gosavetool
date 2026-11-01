'use strict';
// Popup (and the window opened from "Count words and characters"): live counts, platform limits, case tools.

const $ = id => document.getElementById(id);
const t = $('t');
const SHOW = [['x-post', 'X post'], ['instagram-caption', 'Instagram caption'], ['tiktok-caption', 'TikTok caption'],
    ['youtube-title', 'YouTube title'], ['seo-title', 'SEO title'], ['meta-description', 'Meta description']];
const fmt = n => n.toLocaleString('en-US');

function update() {
    const s = GSTText.stats(t.value);
    $('words').textContent = fmt(s.words);
    $('chars').textContent = fmt(s.chars);
    $('sents').textContent = fmt(s.sentences);
    $('read').textContent = s.readSeconds < 60 ? s.readSeconds + 's' : Math.round(s.readSeconds / 60) + ' min';
    const l = GSTText.limits(t.value, SHOW.map(x => x[0]));
    const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; };
    $('limits').replaceChildren(...SHOW.map(([k, label]) => {
        const r = l[k], bar = el('span', 'bar'), fill = el('i', r.fits ? '' : 'over');
        fill.style.width = Math.min(100, r.used / r.limit * 100) + '%';
        bar.append(fill);
        const li = el('li');
        li.append(el('span', '', label + ' (' + fmt(r.limit) + ')'), bar, el('em', r.fits ? 'muted' : 'bad', r.fits ? fmt(r.left) + ' left' : fmt(-r.left) + ' over'));
        return li;
    }));
}

t.addEventListener('input', update);

$('tools').addEventListener('click', e => {
    const fn = e.target.dataset && e.target.dataset.fn;
    if (!fn) return;
    // only the selected part when there is a selection, else everything
    const a = t.selectionStart, b = t.selectionEnd;
    if (a !== b) t.setRangeText(GSTText[fn](t.value.slice(a, b)), a, b, 'select');
    else t.value = GSTText[fn](t.value);
    update();
    t.focus();
});

$('copy').addEventListener('click', async () => {
    await navigator.clipboard.writeText(t.value);
    $('copy').textContent = 'Copied';
    setTimeout(() => { $('copy').textContent = 'Copy'; }, 1200);
});

document.querySelectorAll('[data-page]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://www.gosavetool.com/' + a.dataset.page + '?utm_source=browser-extension&utm_medium=extension&utm_content=popup' });
}));

(async () => {
    if (new URLSearchParams(location.search).get('from') === 'selection') {
        document.body.classList.add('window');
        const { selection = '' } = await chrome.storage.local.get('selection');
        await chrome.storage.local.remove('selection');
        t.value = selection;
    } else {
        // the popup keeps the last text between openings
        const { draft = '' } = await chrome.storage.local.get('draft');
        t.value = draft;
        t.addEventListener('input', () => chrome.storage.local.set({ draft: t.value }));
    }
    update();
    t.focus();
})();
