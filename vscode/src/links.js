'use strict';
// Links to the browser tools on gosavetool.com, tagged so visits from the extension can be told apart.

const SITE = 'https://www.gosavetool.com/';

function url(page, content) {
    return SITE + (page || '') + '?utm_source=vscode&utm_medium=extension' + (content ? '&utm_content=' + encodeURIComponent(content) : '');
}

module.exports = { SITE, url };
