// #10f fix — labelledText() (act-page-collect.js) computes an element's axName from aria-labelledby/`<label for>`
// via the bare `document` global. The frame-traversal loop (frame-structure-collection.test.js's sibling) calls
// this SAME function on in-frame elements (`name: labelledText(el, sampledRole)`), but `document` there is ALWAYS
// the TOP document, never the frame's own — so `document.getElementById`/`document.querySelectorAll` silently
// found nothing for an in-frame field's own label, losing a REAL, correctly-authored accessible name entirely.
// `el.closest('label')` (wrapped-label markup) still worked, masking the bug for that one pattern while explicit
// `for`-association — the DOMINANT real-world pattern — silently broke. Confirmed live on a real DHS
// Trusted-Tester page (401807-3): a form with 12 properly `<label for>`-associated fields collected axName:''
// for every one of them. This pins the fix on a self-contained frameset fixture mirroring
// frame-structure-collection.test.js, covering both association styles.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chromeOK = fs.existsSync(CHROME);

const { orchestrate, BROWSER_ARGS } = require('../../lib/orchestrator.js');
const { createTabAllocator } = require('../../lib/tab-allocator.js');
const { collectActPage, normalizeCollectRoles } = require('../../lib/act-page-collect.js');

const FRAME_MAIN = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>frame content</title></head><body>
<label for="fname">First Name</label><input id="fname" type="text">
<label for="femail">Email</label><input id="femail" type="text" aria-labelledby="femail-lbl">
<span id="femail-lbl">Email Address</span>
<label>Wrapped <input id="fcity" type="text"></label>
</body></html>`;
const FRAMESET_INDEX = `<!doctype html><html><head><title>frameset shell</title></head>
<frameset rows="*,50px"><frame src="frame-main.html"><frame src="frame-footer.html"></frameset></html>`;
const FRAME_FOOTER = `<!doctype html><html><body><p>footer</p></body></html>`;

function writeFixture(dirName, files) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), dirName));
  for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(tmp, name), content);
  return tmp;
}

async function collect(url) {
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: BROWSER_ARGS });
  try {
    const alloc = createTabAllocator({ browser, maxTabs: 2 });
    const lease = await alloc.acquire();
    let out;
    try { out = normalizeCollectRoles(await collectActPage(lease.page, { url, elementCap: 40, file: 'p', runId: 'p', sourceUrl: url, autoUpdateWindowMs: 0 })); }
    finally { await lease.release(); await alloc.close(); }
    return out;
  } finally {
    await browser.close().catch(() => {});
  }
}

test('frame-labelledText #10f FIX: an in-frame field\'s explicit <label for> association is collected as axName, not lost', { skip: !chromeOK, concurrency: false }, async () => {
  const tmp = writeFixture('frame-lbl-', { 'index.html': FRAMESET_INDEX, 'frame-main.html': FRAME_MAIN, 'frame-footer.html': FRAME_FOOTER });
  const out = await collect('file://' + path.join(tmp, 'index.html'));
  const els = (out.elements || []).filter((e) => e.inFrame && e.tag === 'input');
  assert.ok(els.length >= 3, 'collected the 3 in-frame inputs');
  const fname = els.find((e) => /fname/.test(e.xpath) || e.axName === 'First Name');
  assert.equal(fname && fname.axName, 'First Name', '<label for> association resolved (pre-fix: empty string)');
});

test('frame-labelledText #10f FIX: an in-frame field\'s aria-labelledby resolves to the referenced text, not empty', { skip: !chromeOK, concurrency: false }, async () => {
  const tmp = writeFixture('frame-lbl-aria-', { 'index.html': FRAMESET_INDEX, 'frame-main.html': FRAME_MAIN, 'frame-footer.html': FRAME_FOOTER });
  const out = await collect('file://' + path.join(tmp, 'index.html'));
  const els = (out.elements || []).filter((e) => e.inFrame && e.tag === 'input');
  const femail = els.find((e) => e.axName === 'Email Address');
  assert.ok(femail, 'aria-labelledby referencing an in-frame sibling resolved (pre-fix: empty — document.getElementById searched the TOP document)');
});

test('frame-labelledText #10f REGRESSION GUARD: wrapped-label markup (el.closest("label")) still works, in-frame and top-level', { skip: !chromeOK, concurrency: false }, async () => {
  const tmp = writeFixture('frame-lbl-wrap-', { 'index.html': FRAMESET_INDEX, 'frame-main.html': FRAME_MAIN, 'frame-footer.html': FRAME_FOOTER });
  const out = await collect('file://' + path.join(tmp, 'index.html'));
  const els = (out.elements || []).filter((e) => e.inFrame && e.tag === 'input');
  const fcity = els.find((e) => e.axName && e.axName.indexOf('Wrapped') !== -1);
  assert.ok(fcity, 'wrapped-label association (already working pre-fix) is unaffected');
});

test('frame-labelledText #10f REGRESSION GUARD: a top-level (non-framed) page\'s label association is unaffected', { skip: !chromeOK, concurrency: false }, async () => {
  const tmp = writeFixture('plain-lbl-', { 'index.html': `<!doctype html><html><body>${FRAME_MAIN.match(/<body>([\s\S]*)<\/body>/)[1]}</body></html>` });
  const out = await collect('file://' + path.join(tmp, 'index.html'));
  const els = (out.elements || []).filter((e) => !e.inFrame && e.tag === 'input');
  const fname = els.find((e) => e.axName === 'First Name');
  assert.ok(fname, 'top-level <label for> association still works after the fix (ownerDocument === document here)');
});

// #10g fix — the in-frame element loop never set htmlSnippet/enclosingHtml at all (the top-document loop always
// has), so every markup-driven rubric judged an in-frame subject with EMPTY raw HTML regardless of the HTML-
// evidence gate. Confirmed live: a 1.3.1 field-association rubric, shown a correct axName ("First Name*", #10f)
// but no markup, still claimed the field was "not programmatically associated" — the rubric verifies label
// association from raw markup, not axName alone (axName alone can't distinguish a genuine <label for> from the
// sibling 5_C-3 case's invalid <span for>, which also legitimately computes an empty/degraded axName).
test('frame-labelledText #10g FIX: an in-frame field\'s htmlSnippet/enclosingHtml are populated, not undefined', { skip: !chromeOK, concurrency: false }, async () => {
  const tmp = writeFixture('frame-html-', { 'index.html': FRAMESET_INDEX, 'frame-main.html': FRAME_MAIN, 'frame-footer.html': FRAME_FOOTER });
  const out = await collect('file://' + path.join(tmp, 'index.html'));
  const fname = (out.elements || []).find((e) => e.inFrame && e.axName === 'First Name');
  assert.ok(fname, 'the in-frame First Name field was collected');
  assert.match(fname.htmlSnippet || '', /id="fname"/, 'htmlSnippet is the element\'s own outerHTML (pre-fix: undefined)');
  assert.match(fname.enclosingHtml || '', /<label for="fname">/, 'enclosingHtml includes the SIBLING <label> — the exact evidence the field-association rubric needs (pre-fix: undefined)');
});

test('frame-labelledText #10g REGRESSION GUARD: a top-level (non-framed) field\'s htmlSnippet/enclosingHtml are unaffected', { skip: !chromeOK, concurrency: false }, async () => {
  const tmp = writeFixture('plain-html-', { 'index.html': `<!doctype html><html><body>${FRAME_MAIN.match(/<body>([\s\S]*)<\/body>/)[1]}</body></html>` });
  const out = await collect('file://' + path.join(tmp, 'index.html'));
  const fname = (out.elements || []).find((e) => !e.inFrame && e.axName === 'First Name');
  assert.ok(fname, 'the top-level First Name field was collected');
  assert.match(fname.htmlSnippet || '', /id="fname"/);
  assert.match(fname.enclosingHtml || '', /<label for="fname">/);
});
