// SVG <text> contrast measurement (exposed by the tagByXpath namespace fallback — ACT afw4f7
// Inapplicable Ex4 became a false BARRIER the moment the subject was resolvable).
//
// Two defects, both in the in-page halves of the pixel runner:
//  1. `setGlyphColor` drove only `color`/`-webkit-text-fill-color`, which do not paint SVG text ink —
//     the three backdrop shots were identical, the sentinel diff found no glyph geometry, and the
//     "backdrop" sample contained the glyphs themselves ⇒ fake non-uniform backdrop, ~1:1 worst case.
//  2. `measureContrast` read the fg from `color`; SVG ink is `fill`, which can diverge.
// Fixtures are INVENTED inline SVG — nothing from any eval corpus.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const puppeteer = require('puppeteer');
const { RUNNERS } = require('../../lib/exp-runners.js');
const { CHROME } = require('../../lib/run-experiments.js');
const { BROWSER_ARGS } = require('../../lib/browser-args.js');
const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — svg-text-contrast SKIPPED');

const PAGE = `<!doctype html><html lang="en"><body>
  <svg width="300" height="40"><text x="0" y="20">Quarterly totals</text></svg>
  <svg width="300" height="40"><text x="0" y="20" fill="#b8b8b8">Faint annotation text</text></svg>
</body></html>`;

test('SVG text: black-on-white clears at 21:1; a low-contrast fill FAILS via the fill-aware fg read', { skip: !chromeOK, concurrency: false }, async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: BROWSER_ARGS });
  try {
    const page = await browser.newPage();
    await page.setContent(PAGE, { waitUntil: 'load' });
    const run = (xp) => RUNNERS['text-contrast-pixel'](page, { candidateId: xp, targetXpath: xp, sc: '1.4.3' });

    const black = await run('/html/body/svg[1]/text[1]');
    assert.equal(black.outcome.contrastComputable, true, 'glyph hiding now works on SVG ⇒ backdrop is measurable');
    assert.equal(black.outcome.thresholdMet, true, `default black fill on white passes (ratio ${black.measurement.ratio})`);
    assert.equal(black.outcome.thresholdFailed, false, 'no fabricated barrier from glyph-polluted backdrop');
    assert.ok(black.measurement.pixelUniform, 'the true backdrop is uniform once glyphs actually hide');

    const faint = await run('/html/body/svg[2]/text[1]');
    assert.equal(faint.outcome.thresholdFailed, true, `#b8b8b8 on white genuinely fails (ratio ${faint.measurement.ratio})`);
    assert.ok(faint.measurement.ratio < 3, 'the fg came from the SVG fill, not the inherited CSS color (black)');
  } finally { await browser.close(); }
});
