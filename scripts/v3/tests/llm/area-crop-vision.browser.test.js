// AREA CROPS (s11 wedged-run RCA) — the IN-BROWSER half of area-crop-vision.test.js: real `<map>`/`<area>`/
// `img[usemap]` geometry through the full captureVision pipeline. PENDING LEAD GATE: this file launches
// Chrome, so it must not run while a measurement run is in flight — it is named *.browser.test.js and was
// written but deliberately not executed by its author; the ordinary suite glob picks it up.
//
// Fixtures are invented and generic — none is derived from any corpus page.
'use strict';

const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const puppeteer = require('puppeteer');

const { captureVision } = require('../../lib/vision-capture.js');
const { BROWSER_ARGS } = require('../../lib/browser-args.js');

const CHROME = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — area-crop browser tests SKIPPED');

// A 300×150 image with a RED left half and BLUE right half (SVG data URI — no external fetch), mapped by
// areas of every shape plus a garbage-coords one. Colour halves let a crop PROVE which region it captured.
const SVG = encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150">'
  + '<rect x="0" y="0" width="150" height="150" fill="#cc0000"/>'
  + '<rect x="150" y="0" width="150" height="150" fill="#0066cc"/></svg>');
const PAGE = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Campus wings</title><style>
  body { margin: 0; font: 14px/1.4 Arial, sans-serif; }
  img { display: block; margin: 40px; }
</style></head><body>
  <h1>Campus wings</h1>
  <img src="data:image/svg+xml,${SVG}" usemap="#wings" alt="Campus map" width="300" height="150">
  <map name="wings">
    <area shape="rect"   coords="0,0,150,150"          href="#west"  alt="West wing">
    <area shape="rect"   coords="150,0,300,150"        href="#east"  alt="East wing">
    <area shape="circle" coords="75,75,30"             href="#atrium" alt="Atrium">
    <area shape="poly"   coords="160,10,290,10,225,140" href="#hall"  alt="Hall">
    <area shape="rect"   coords="nonsense,here"        href="#lost"  alt="Lost">
  </map>
</body></html>`;

// Same map bound to a HIDDEN img: every area is genuinely non-visual and must be flagged, not fabricated.
const HIDDEN = PAGE.replace('<img src=', '<img style="display:none" src=');

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'area-crop-fx-'));
const writeFx = (name, html) => { fs.writeFileSync(path.join(DIR, name), html); return 'file://' + path.join(DIR, name); };
const URL_VISIBLE = writeFx('map.html', PAGE);
const URL_HIDDEN = writeFx('hidden.html', HIDDEN);

const AREA = (i) => `/html/body/map[1]/area[${i}]`;

let browser = null;
async function getBrowser() {
  if (browser) return browser;
  let last = null;
  for (let i = 0; i < 3; i++) {
    try {
      browser = await puppeteer.launch({ headless: 'new', executablePath: CHROME, args: BROWSER_ARGS, timeout: 60000 });
      return browser;
    } catch (e) { last = e; if (!/WebSocket|ws endpoint|Timed out|timeout/i.test(String(e && e.message))) throw e; }
  }
  throw last;
}
after(async () => { if (browser) await browser.close(); });

async function captureOn(url, xpaths) {
  const b = await getBrowser();
  const page = await b.newPage();
  try {
    await page.setViewport({ width: 800, height: 600 });
    await page.goto(url, { waitUntil: 'load' });
    return await captureVision(page, xpaths, { states: ['element-crop', 'surrounding-region'] });
  } finally { await page.close(); }
}

// PNG IHDR: width/height are big-endian uint32 at byte offsets 16/20 — no decoder dependency needed for dims.
const pngDims = (b64) => { const b = Buffer.from(b64, 'base64'); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; };

// mean channel values over the whole crop, via a canvas in the SAME browser (mirrors the scroll-offset test).
async function meanColor(base64Png) {
  const b = await getBrowser();
  const page = await b.newPage();
  try {
    await page.setContent(`<img id="i" src="data:image/png;base64,${base64Png}">`);
    await page.waitForSelector('#i');
    return await page.evaluate(() => new Promise((resolve) => {
      const img = document.getElementById('i');
      const draw = () => {
        const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
        const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
        const d = ctx.getImageData(0, 0, c.width, c.height).data;
        let r = 0, g = 0, b2 = 0, n = 0;
        for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b2 += d[i + 2]; n++; }
        resolve({ r: r / n, g: g / n, b: b2 / n });
      };
      if (img.complete) draw(); else img.onload = draw;
    }));
  } finally { await page.close().catch(() => {}); }
}

test('a rect area crops ITS region of the img — the left (red) area is red, the right (blue) area is blue', { skip: !chromeOK, concurrency: false }, async () => {
  const out = await captureOn(URL_VISIBLE, [AREA(1), AREA(2)]);
  assert.ok(out[AREA(1)] && out[AREA(1)]['element-crop'], 'the west (red) area produced an element-crop at all — the 0×0 bail is gone');
  assert.ok(out[AREA(2)] && out[AREA(2)]['element-crop'], 'the east (blue) area produced an element-crop');
  const west = await meanColor(out[AREA(1)]['element-crop']);
  const east = await meanColor(out[AREA(2)]['element-crop']);
  assert.ok(west.r > west.b, `west crop is dominantly red (got r=${west.r.toFixed(0)} b=${west.b.toFixed(0)})`);
  assert.ok(east.b > east.r, `east crop is dominantly blue (got r=${east.r.toFixed(0)} b=${east.b.toFixed(0)})`);
  // and each crop is the AREA's half (~150+4 px wide with pad 2), not the whole 300px img
  const d1 = pngDims(out[AREA(1)]['element-crop']);
  assert.ok(d1.w >= 150 && d1.w <= 160, `west element-crop is area-sized, got ${d1.w}px wide`);
});

test('the surrounding-region for an area is the WHOLE owning img', { skip: !chromeOK, concurrency: false }, async () => {
  const out = await captureOn(URL_VISIBLE, [AREA(1)]);
  const sr = out[AREA(1)]['surrounding-region'];
  assert.ok(sr, 'surrounding-region exists');
  const d = pngDims(sr);
  assert.ok(d.w >= 300 && d.h >= 150, `contains the full 300×150 img (got ${d.w}×${d.h})`);
});

test('circle and poly coords crop their bounding boxes on the img', { skip: !chromeOK, concurrency: false }, async () => {
  const out = await captureOn(URL_VISIBLE, [AREA(3), AREA(4)]);
  const circle = pngDims(out[AREA(3)]['element-crop']);
  assert.ok(Math.abs(circle.w - 64) <= 2 && Math.abs(circle.h - 64) <= 2, `circle r=30 → ~64×64 with pad 2 (got ${circle.w}×${circle.h})`);
  const poly = pngDims(out[AREA(4)]['element-crop']);
  assert.ok(Math.abs(poly.w - 134) <= 2 && Math.abs(poly.h - 134) <= 2, `poly bbox 130×130 → ~134×134 with pad 2 (got ${poly.w}×${poly.h})`);
});

test('garbage coords fall back to the WHOLE img crop, never a bail and never a NaN clip', { skip: !chromeOK, concurrency: false }, async () => {
  const out = await captureOn(URL_VISIBLE, [AREA(5)]);
  const crop = out[AREA(5)] && out[AREA(5)]['element-crop'];
  assert.ok(crop, 'the unparseable-coords area still produced a crop');
  const d = pngDims(crop);
  assert.ok(d.w >= 300 && d.h >= 150, `the fallback is the whole img (got ${d.w}×${d.h})`);
});

test('an area whose owning img is HIDDEN is flagged __nonVisual — no fabricated pixels', { skip: !chromeOK, concurrency: false }, async () => {
  const out = await captureOn(URL_HIDDEN, [AREA(1)]);
  assert.equal(out[AREA(1)] && out[AREA(1)].__nonVisual, '1', 'flagged non-visual, exactly like any other imperceivable element');
  assert.ok(!(out[AREA(1)] || {})['element-crop'], 'and no element-crop was produced');
});

test('NO OVER-CORRECTION: an ordinary element on the same page keeps its padded-rectangle crops', { skip: !chromeOK, concurrency: false }, async () => {
  const out = await captureOn(URL_VISIBLE, ['/html/body/h1[1]']);
  assert.ok(out['/html/body/h1[1]'] && out['/html/body/h1[1]']['element-crop'], 'the heading still crops normally');
});
