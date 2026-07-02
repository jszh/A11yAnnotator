// #10d fix — `page.screenshot({clip})` (CDP Page.captureScreenshot) takes DOCUMENT-relative coordinates, but every
// clip in this file was built straight from `getBoundingClientRect()`, which is VIEWPORT-relative. The two are
// identical only when the page is unscrolled (scrollX/scrollY === 0) — but `scrollIntoView` is called specifically
// BECAUSE most sampled elements start below the fold, so the page is almost always scrolled by capture time. Before
// this fix, the crop silently captured whatever was rendered at the STALE (pre-scroll) viewport coordinates instead
// of the target element — confirmed live on a real DHS Trusted-Tester page (a 3-item book carousel): the crop for
// an <img alt="The Giving Three"> element (scrolled to document y:628) showed an entirely different, unrelated
// carousel banner ("Nineteen Eighty-Four", at document y:190) — the SAME viewport-relative y that the real target
// occupied BEFORE scrolling. DOM/layout were never wrong (getBoundingClientRect, elementFromPoint, and Puppeteer's
// own ElementHandle.screenshot() all agreed) — only the raw clip math was. This pins the fix on a minimal fixture:
// a page taller than the viewport with a marker element at the top and the REAL target far below the fold, so an
// un-scroll-adjusted clip provably grabs the wrong (top) content instead of the target.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chromeOK = fs.existsSync(CHROME);

const { BROWSER_ARGS } = require('../../lib/orchestrator.js');
const { captureVision, captureStateVision, buildStatePlan } = require('../../lib/vision-capture.js');

// a MARKER block sits at the very top (what a stale, unscrolled clip would wrongly capture) and the TARGET sits
// 1500px below the fold — scrollIntoView must move the page for the target to become visible at all.
const PAGE_HTML = `<!doctype html><html><head><style>
body { margin: 0; }
#marker { width: 300px; height: 200px; background: #c00; color: #fff; font-size: 24px; }
#spacer { height: 1500px; }
#target { width: 300px; height: 200px; background: #06c; color: #fff; font-size: 24px; }
</style></head><body>
<div id="marker">MARKER (top, wrong)</div>
<div id="spacer"></div>
<div id="target">TARGET (below fold, correct)</div>
</body></html>`;

function writeFixture(dirName, html) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), dirName));
  const file = path.join(tmp, 'index.html');
  fs.writeFileSync(file, html);
  return 'file://' + file;
}

// a crude PNG pixel-color check: does the crop's dominant color match blue (#06c, the target) rather than
// red (#c00, the marker)? Decodes via a headless page (loading the base64 PNG as an <img> onto a <canvas> and
// reading pixel data) — avoids adding a PNG-decoding dependency.
async function dominantColorIsBlue(browser, base64Png) {
  const page = await browser.newPage();
  try {
    await page.setContent(`<img id="i" src="data:image/png;base64,${base64Png}">`);
    await page.waitForSelector('#i');
    const { r, g, b } = await page.evaluate(() => new Promise((resolve) => {
      const img = document.getElementById('i');
      const draw = () => {
        const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
        const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
        const d = ctx.getImageData(0, 0, c.width, c.height).data;
        let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
        resolve({ r: r / n, g: g / n, b: b / n });
      };
      if (img.complete) draw(); else img.onload = draw;
    }));
    return b > r; // blue (#06c) dominant vs red (#c00) dominant
  } finally { await page.close().catch(() => {}); }
}

test('vision-capture #10d FIX: a below-the-fold element crop shows the SCROLLED target, not the pre-scroll marker at stale coordinates', { skip: !chromeOK, concurrency: false }, async () => {
  const url = writeFixture('scroll-offset-', PAGE_HTML);
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: BROWSER_ARGS });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 600 });
    await page.goto(url, { waitUntil: 'load' });
    const out = await captureVision(page, ['/html/body/div[3]'], { states: ['element-crop'] });
    const crop = out['/html/body/div[3]'] && out['/html/body/div[3]']['element-crop'];
    assert.ok(crop, 'the below-the-fold target produced a crop at all');
    assert.ok(await dominantColorIsBlue(browser, crop), 'the crop is blue (#target) — pre-fix this was red (#marker), captured from stale unscrolled coordinates');
  } finally { await browser.close().catch(() => {}); }
});

test('vision-capture #10d REGRESSION GUARD: an unscrolled (already-in-view) element still crops correctly (no over-correction)', { skip: !chromeOK, concurrency: false }, async () => {
  const url = writeFixture('scroll-offset-guard-', PAGE_HTML);
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: BROWSER_ARGS });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 600 });
    await page.goto(url, { waitUntil: 'load' });
    const out = await captureVision(page, ['/html/body/div[1]'], { states: ['element-crop'] }); // #marker, never needs scrolling
    const crop = out['/html/body/div[1]'] && out['/html/body/div[1]']['element-crop'];
    assert.ok(crop);
    assert.ok(!(await dominantColorIsBlue(browser, crop)), 'the marker crop is red, not blue — scrollX/scrollY were 0 here, so the fix must be a no-op');
  } finally { await browser.close().catch(() => {}); }
});

test('vision-capture #10d FIX (state pairs): captureStateVision\'s focus ring clip also lands on the scrolled target, not stale coordinates', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html><head><style>
body { margin: 0; }
#marker { width: 300px; height: 200px; background: #c00; }
#spacer { height: 1500px; }
button#target { width: 300px; height: 200px; background: #06c; border: none; }
</style></head><body>
<div id="marker">MARKER</div>
<div id="spacer"></div>
<button id="target">TARGET</button>
</body></html>`;
  const url = writeFixture('scroll-offset-state-', html);
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: BROWSER_ARGS });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 600 });
    await page.goto(url, { waitUntil: 'load' });
    const plan = buildStatePlan([{ xpath: '/html/body/button[1]', sc: '2.4.7' }]);
    const out = await captureStateVision(page, plan, {});
    const pair = out['/html/body/button[1]'];
    assert.ok(pair && pair['state-before'], 'a before-frame was captured for the below-the-fold focus target');
    assert.ok(await dominantColorIsBlue(browser, pair['state-before']), 'the focus-state clip is blue (#target), not red (#marker) — same clip-coordinate bug as the static crop path');
  } finally { await browser.close().catch(() => {}); }
});
