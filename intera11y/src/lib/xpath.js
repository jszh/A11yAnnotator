'use strict';
// XPath conventions. InterA11y's XPaths index every step (`/html[1]/body[1]/div[2]`) and address shadow content
// as `hostXpath>>/innerPath` (window.__ia.xpathOf in the page). `key()` is the join key wherever two XPath
// sources meet — the expert-study normalisation: NFC, every `[1]` dropped, whitespace collapsed.
const key = (x) => String(x || '').normalize('NFC').replace(/\[1\]/g, '').replace(/\s+/g, ' ').trim();

// The v3 detectors write `/html/body/...` with explicit indices below body.
const toV3 = (x) => String(x || '').replace(/^\/html\[1\]\/body\[1\]/, '/html/body');
const fromV3 = (x) => String(x || '').replace(/^\/html\/body(?=\/|$)/, '/html[1]/body[1]');

module.exports = { key, toV3, fromV3 };
