// #10 fix — captureVision/captureStateVision resolved every xpath via a plain `document.evaluate(x, document, ...)`
// against the TOP-LEVEL document only. act-page-collect.js namespaces an in-frame element's xpath as
// `<frameXpath>>/<in-frame xpath>` (see frame-structure-collection.test.js) — a plain document.evaluate on that
// '>>'-bearing string throws an invalid-XPath SyntaxError, silently swallowed by this file's blanket .catch()
// wrappers, so an in-frame subject got ZERO vision evidence (no element-crop, no surrounding-region, not even
// the `__nonVisual` marker — a complete, silent drop). This pins the fix on a self-contained frameset fixture
// (mirroring frame-structure-collection.test.js's pattern), using collectActPage to get a REAL, byte-identical
// namespaced xpath rather than hand-constructing one.
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
const { captureVision } = require('../../lib/vision-capture.js');

const FRAME_MAIN = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>frame content</title></head><body>
<button id="target" style="width:220px;height:90px;background:#c00;color:#fff;font-size:20px;">Click me</button>
</body></html>`;
const FRAMESET_INDEX = `<!doctype html><html><head><title>frameset shell</title></head>
<frameset rows="*,50px"><frame src="frame-main.html"><frame src="frame-footer.html"></frameset></html>`;
const FRAME_FOOTER = `<!doctype html><html><body><p>footer</p></body></html>`;

function writeFixture(dirName, files) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), dirName));
  for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(tmp, name), content);
  return tmp;
}

test('vision-capture #10 FIX: an in-frame element (namespaced xpath from collectActPage) gets element-crop/surrounding-region evidence, not a silent drop', { skip: !chromeOK, concurrency: false }, async () => {
  const tmp = writeFixture('frame-vision-', { 'index.html': FRAMESET_INDEX, 'frame-main.html': FRAME_MAIN, 'frame-footer.html': FRAME_FOOTER });
  const url = 'file://' + path.join(tmp, 'index.html');
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: BROWSER_ARGS });
  try {
    const alloc = createTabAllocator({ browser, maxTabs: 2 });
    const lease = await alloc.acquire();
    let inFrameXpath;
    try {
      const collected = normalizeCollectRoles(await collectActPage(lease.page, { url, elementCap: 40, file: 'p', runId: 'p', sourceUrl: url }));
      const target = (collected.elements || []).find((e) => e.inFrame && /target/.test(e.xpath || ''));
      // fall back to any in-frame element if the id-based xpath match misses (xpathOfInDoc is positional, not id-based)
      const el = target || (collected.elements || []).find((e) => e.inFrame);
      assert.ok(el, 'collectActPage found the in-frame <button> as an element with inFrame:true');
      assert.match(el.xpath, />>/, 'the collected xpath is namespaced with the frame separator, proving this test exercises the real bug shape');
      inFrameXpath = el.xpath;
    } finally { await lease.release(); await alloc.close(); }

    // fresh page for captureVision (mirrors captureVisionForUrl's real usage: load, then capture)
    const page2 = await browser.newPage();
    try {
      await page2.goto(url, { waitUntil: 'load' });
      const out = await captureVision(page2, [inFrameXpath], { states: ['element-crop', 'surrounding-region'] });
      assert.ok(out[inFrameXpath], 'the in-frame xpath key is present in the output at all (pre-fix: silently absent)');
      assert.ok(out[inFrameXpath]['element-crop'], 'element-crop was captured for the in-frame button');
      assert.ok(out[inFrameXpath]['surrounding-region'], 'surrounding-region was captured for the in-frame button');
    } finally { await page2.close().catch(() => {}); }
  } finally {
    await browser.close().catch(() => {});
  }
});

test('vision-capture #10 REGRESSION GUARD: a plain top-level (non-framed) element still resolves correctly (no over-correction)', { skip: !chromeOK, concurrency: false }, async () => {
  const tmp = writeFixture('plain-vision-', { 'index.html': `<!doctype html><html><body><button id="b" style="width:200px;height:80px;">Plain</button></body></html>` });
  const url = 'file://' + path.join(tmp, 'index.html');
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: BROWSER_ARGS });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'load' });
    const out = await captureVision(page, ['/html/body/button'], { states: ['element-crop'] });
    assert.ok(out['/html/body/button'], 'a plain, non-namespaced xpath still resolves after the fix');
    assert.ok(out['/html/body/button']['element-crop']);
  } finally {
    await browser.close().catch(() => {});
  }
});
