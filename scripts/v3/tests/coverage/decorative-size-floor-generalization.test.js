// Generalization + adversarial guards for the #10 decorative size-floor fix: WCAG 1.1.1 / ACT e88epe carry NO size
// floor, so the oracle's min-dim>=24 square wall must not silently clear a sub-24px ELONGATED informative image
// (a 320×20 image-of-text given alt="" is a real 1.1.1/1.4.5 failure the old gate zero-enumerated). Every fixture is
// SYNTHETIC (data: URL) and NOT a member of the ACT corpus — the point is to prove the CONDITION matches the RULE,
// not the corpus geometry the 24px constant was tuned on. The recall case is paired with OVER-FIRE guards (true
// spacer geometry — square icons/shims — must stay excluded), per the full-corpus generalization method.
'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const puppeteer = require('puppeteer');
const { CHROME } = require('../../lib/run-experiments.js');
const { collectActPage, normalizeCollectRoles } = require('../../lib/act-page-collect.js');
const oracle = require('../../lib/applicability-oracle.js');

const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — decorative-size-floor-generalization suite SKIPPED');

let browser;
before(async () => { if (chromeOK) browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] }); });
after(async () => { if (browser) await browser.close(); });

async function collectHtml(html) {
  const page = await browser.newPage();
  try {
    const url = 'data:text/html,' + encodeURIComponent('<!doctype html><html lang="en"><body>' + html + '</body></html>');
    return normalizeCollectRoles(await collectActPage(page, { url, elementCap: 80, file: 't', runId: 't', sourceUrl: url, runAxe: false, autoUpdateWindowMs: 0 }));
  } finally { await page.close(); }
}

// A 320×20 IMAGE-OF-TEXT decorated away with alt="" — informative content removed from the a11y tree. The SVG
// actually renders text so the fixture is visually what the finding describes (screenshot-verified during the fix).
const TEXT_STRIP_SVG = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="20"><rect width="320" height="20" fill="#fff"/>' +
  '<text x="4" y="15" font-family="sans-serif" font-size="14" fill="#111">SALE ENDS FRIDAY — 25% OFF SITEWIDE</text></svg>'
).toString('base64');
const STRIP_IMG = `<img src="data:image/svg+xml;base64,${TEXT_STRIP_SVG}" alt="" width="320" height="20">`;
// True spacer geometry: a stretched 1×1 gif shim and a small square icon, both alt="" (genuinely decorative shapes).
const GIF_1PX = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const SPACER_IMG = `<img src="data:image/gif;base64,${GIF_1PX}" alt="" width="8" height="8">`;
const ICON_SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="7" fill="#39f"/></svg>').toString('base64');
const ICON_IMG = `<img src="data:image/svg+xml;base64,${ICON_SVG}" alt="" width="16" height="16">`;

const removedImgs = (c) => (c.elements || []).filter((e) => e.tag === 'img' && e.removedFromA11yTree === true);
const scsFor = (c, xpath) => oracle.deriveObligations(c).filter((o) => o.xpath === xpath).map((o) => o.sc);

test('#10 RECALL: a 320x20 alt="" image-of-text is collected removed-from-tree and MINTS 1.1.1 + 1.4.5 obligations', { skip: !chromeOK }, async () => {
  const c = await collectHtml(`<p>Storewide promotions:</p>${STRIP_IMG}`);
  const strip = removedImgs(c)[0];
  assert.ok(strip, 'the alt="" image is collected as removed-from-tree');
  assert.equal(oracle.decorativeSuspect(strip), true, 'sub-24px but text-shaped (16:1) ⇒ a decorative-suspect, not a silent clear');
  const scs = scsFor(c, strip.xpath);
  assert.ok(scs.includes('1.1.1'), 'owes the 1.1.1 decorative-verification obligation (e88epe has no size floor)');
  assert.ok(scs.includes('1.4.5'), 'and 1.4.5 — the elongated strip is exactly the image-of-text shape');
});

test('#10 OVER-FIRE guard: an 8x8 spacer.gif and a 16x16 square icon (alt="") stay excluded end-to-end', { skip: !chromeOK }, async () => {
  const c = await collectHtml(`<p>Some content.</p>${SPACER_IMG}${ICON_IMG}`);
  const imgs = removedImgs(c);
  assert.equal(imgs.length, 2, 'both decorative images are collected as removed-from-tree');
  for (const el of imgs) {
    assert.equal(oracle.decorativeSuspect(el), false, `spacer geometry must NOT become a suspect (box ${JSON.stringify(el.box)})`);
    const scs = scsFor(c, el.xpath); // 1.4.11 (non-text-contrast, any isImage) is a different, pre-existing lane — only the 1.1.1/1.4.5 clear is under test
    assert.ok(!scs.includes('1.1.1') && !scs.includes('1.4.5'), 'and mints NO 1.1.1/1.4.5 obligation (true spacers are the only size-clearable images)');
  }
});

test('#10 OVER-FIRE guard: a 600x2 divider rule (alt="") is a sliver below the glyph floor — excluded despite 300:1 aspect', { skip: !chromeOK }, async () => {
  const c = await collectHtml(`<p>Above the rule.</p><img src="data:image/gif;base64,${GIF_1PX}" alt="" width="600" height="2"><p>Below the rule.</p>`);
  const el = removedImgs(c)[0];
  assert.ok(el, 'the divider is collected as removed-from-tree');
  assert.equal(oracle.decorativeSuspect(el), false, 'a 2px-tall strip cannot render a glyph — spacer floor holds');
  const scs = scsFor(c, el.xpath);
  assert.ok(!scs.includes('1.1.1') && !scs.includes('1.4.5'), 'no 1.1.1/1.4.5 obligation minted');
});
