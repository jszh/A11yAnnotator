// THE CONTRAST SIGNAL WAS A FALSE CONSTANT.
//
// WHAT WENT WRONG. `precomputeSignals` builds `s.contrast` — the one colour fact EVERY
// `color-and-visual-text` subject receives — out of six element keys: `color`, `effBg`, `contrastReliable`,
// `contrastSolid`, `contrastUnreliableReason`, `needsPixelContrast`. The v3 collector emitted none of them
// (they exist only on the older v2.9 per-element path), so for 100% of colour subjects the signal collapsed
// to a fixed stub asserting the backdrop could not be reduced to two flat colours and telling the judge to
// read the pixels instead. Measured over the corpus, the great majority of those subjects sit on a flat
// opaque colour, so the harness was shipping a false statement plus an instruction to trust a crop into
// every colour judgment it made — with nothing able to contradict a colour read off a rectangular crop that
// contains a neighbouring control's edge.
//
// WHAT THIS PINS. (§1) the collector's soundness rules, each on a fixture built for it; (§2) the ratio and
// the pass/fail verdict AGREE with the deterministic text-contrast-pixel runner wherever both compute, and
// the collector never contradicts a runner barrier — a disagreement between two harness lanes is worse than
// an abstention; (§3) act-page-collect joins the facts onto the right elements — the wiring whose silent
// failure has twice killed a whole lane; (§4) the signal reaches the prompt and the false stub is gone.
//
// No hunk is required for this lane: the six keys are the ones `precomputeSignals` already reads.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const puppeteer = require('puppeteer');

const { collectTextContrastFacts } = require('../../lib/collect-colour-peers.js');
const { collectActPage } = require('../../lib/act-page-collect.js');
const { RUNNERS } = require('../../lib/exp-runners.js');
const { BROWSER_ARGS } = require('../../lib/browser-args.js');
const llmAdj = require('../../lib/llm-adjudicator.js');

const CHROME = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — text-contrast-facts browser tests SKIPPED');

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'contrastfacts-fx-'));
const writeFx = (name, html) => { fs.writeFileSync(path.join(DIR, name), html); return 'file://' + path.join(DIR, name); };

// Every fixture is a generic page written for this test — a plain article, a plain form. None is derived
// from, or related to, any evaluated page.
const FLAT = writeFx('flat.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Flat</title><style>
  body { background: rgb(255,255,255); font: 16px/1.5 Arial, sans-serif; margin: 0; padding: 20px; }
  .dim { color: rgb(119,119,119); }
  .bad { color: rgb(200,200,200); }
  .big { font-size: 30px; color: rgb(140,140,140); }
</style></head><body>
  <p id="ok" style="color: rgb(0,0,0)">Black body text on the page canvas.</p>
  <p class="dim" id="dim">Grey body text that still clears the ratio.</p>
  <p class="bad" id="bad">Very light grey text that does not clear the ratio.</p>
  <p class="big" id="big">Large heading-sized grey text.</p>
</body></html>`);

const UNSOUND = writeFx('unsound.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Unsound</title><style>
  body { font: 16px/1.5 Arial, sans-serif; margin: 0; padding: 20px; background: #fff; }
  .grad { background: linear-gradient(90deg, #000, #fff); color: #888; padding: 10px; }
  .faded { opacity: .5; color: #333; }
  .shadowed { color: #666; text-shadow: 0 0 2px #fff; }
  .overlay { position: absolute; left: 20px; top: 240px; width: 300px; height: 40px; background: rgba(0,0,0,.6); }
  .under { position: absolute; left: 20px; top: 245px; color: #111; }
</style></head><body>
  <p class="grad" id="grad">Text over a gradient backdrop.</p>
  <p class="faded" id="faded">Text under an opacity group.</p>
  <p class="shadowed" id="shadowed">Text carrying a shadow halo.</p>
  <div class="under" id="under">Text with a separate box drawn across it.</div>
  <div class="overlay"></div>
  <p id="mixed" style="color:#000">Plain words plus <span style="color:#c00">words in another colour</span>.</p>
</body></html>`);

// A rounded control with a flat opaque fill. A first implementation sampled the 1px-inset CORNERS of the ink
// rectangle, which on a rounded box fall outside its own hit region — every such control was reported as
// covered by something. It was the single largest abstention bucket on the corpus and none of it was real.
const ROUNDED = writeFx('rounded.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Rounded</title><style>
  body { background:#fff; font:16px Arial, sans-serif; padding:20px; }
  input { padding:10px 12px; border:1px solid #b9c9bf; border-radius:8px; background:#fbfdfb; color:#222; width:280px; }
</style></head><body>
  <form><label for="a">Reference</label><input id="a" value="AB-1024"></form>
</body></html>`);

async function withBrowser(fn) {
  const browser = await puppeteer.launch({ headless: 'new', executablePath: CHROME, args: BROWSER_ARGS });
  try { return await fn(browser); } finally { await browser.close(); }
}
const factsOn = async (browser, url) => {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(url, { waitUntil: 'load' });
    return await page.evaluate(collectTextContrastFacts);
  } finally { await page.close(); }
};
const byEnd = (recs, tail) => recs.find((r) => r.xpath.endsWith(tail));

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §1 — the collector, in a real browser
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

test('§1 collectTextContrastFacts RESOLVES in-page (self-contained under page.evaluate)', { skip: !chromeOK }, async () => {
  // The failure mode this guards is a ReferenceError from a helper declared in a DIFFERENT serialized
  // function: it throws IN THE PAGE, the guard returns [], and the lane reads as "this page has nothing".
  const recs = await withBrowser((b) => factsOn(b, FLAT));
  assert.ok(Array.isArray(recs) && recs.length >= 4, `all four paragraphs produced a record (got ${recs && recs.length})`);
});

test('§1 a flat opaque backdrop yields the REAL colours, a ratio, and NO abstention', { skip: !chromeOK }, async () => {
  const recs = await withBrowser((b) => factsOn(b, FLAT));
  const ok = byEnd(recs, '/p[1]');
  assert.equal(ok.contrastReliable, true);
  assert.equal(ok.needsPixelContrast, false);
  assert.equal(ok.color, 'rgb(0, 0, 0)');
  assert.equal(ok.effBg, 'rgb(255, 255, 255)', 'the canvas colour is resolved, not assumed absent');
  assert.equal(ok.contrastSolid, 21);
  assert.equal(ok.contrastThreshold, 4.5);
  assert.equal('contrastUnreliableReason' in ok, false, 'a sound resolution carries no abstention text at all');

  // ...and the ratio is a real measurement, not a constant: a failing element reports a failing number.
  const bad = byEnd(recs, '/p[3]');
  assert.equal(bad.contrastReliable, true);
  assert.ok(bad.contrastSolid < 4.5, `light grey on white fails its threshold (got ${bad.contrastSolid})`);
});

test('§1 WCAG large-text classification moves the threshold, and only for large text', { skip: !chromeOK }, async () => {
  const recs = await withBrowser((b) => factsOn(b, FLAT));
  assert.equal(byEnd(recs, '/p[4]').contrastThreshold, 3, '30px text is large scale');
  assert.equal(byEnd(recs, '/p[2]').contrastThreshold, 4.5, '16px text is not');
});

test('§1 each genuinely unsound backdrop abstains WITH ITS OWN REASON, keeps the pixel instruction, and keeps the foreground', { skip: !chromeOK }, async () => {
  const recs = await withBrowser((b) => factsOn(b, UNSOUND));
  const expect = [
    ['/p[1]', /background image or gradient/i],
    ['/p[2]', /ancestor opacity/i],
    ['/p[3]', /text-shadow/i],
    ['/p[4]', /split into runs of DIFFERENT colours/i],
    ['/div[1]', /not an ancestor of this text paints/i],
  ];
  for (const [tail, re] of expect) {
    const r = byEnd(recs, tail);
    assert.ok(r, `a record exists for ${tail}`);
    assert.equal(r.contrastReliable, false, `${tail} abstains`);
    assert.equal(r.needsPixelContrast, true, `${tail} keeps the pixel instruction`);
    assert.match(r.contrastUnreliableReason, re, `${tail} names its OWN reason`);
    assert.match(r.contrastUnreliableReason, /judge readability from the rendered pixels/,
      `${tail} still tells the judge where a sound answer can come from`);
    assert.equal('contrastSolid' in r, false, 'and never publishes a ratio it could not compute');
    assert.ok(typeof r.color === 'string' && /^rgb\(/.test(r.color),
      'the resolved foreground is still stated, so a judge cannot invent one');
  }
});

test('§1 a ROUNDED control with a flat fill is sound (the corner-sampling artifact)', { skip: !chromeOK }, async () => {
  const recs = await withBrowser((b) => factsOn(b, ROUNDED));
  const input = byEnd(recs, '/input[1]');
  assert.ok(input, 'the control produced a record');
  assert.equal(input.contrastReliable, true, 'a border-radius is not a covered backdrop');
  assert.equal(input.effBg, 'rgb(251, 253, 251)', 'and the fill it resolves is the control\'s own');
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §2 — LANE AGREEMENT. Two harness lanes disagreeing is worse than either abstaining.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

test('§2 where BOTH lanes compute a ratio they agree, and the collector never contradicts a runner barrier',
  { skip: !chromeOK, concurrency: false }, async () => {
    const runner = RUNNERS['text-contrast-pixel'];
    const rows = await withBrowser(async (browser) => {
      const page = await browser.newPage();
      try {
        await page.setViewport({ width: 1280, height: 800 });
        await page.goto(FLAT, { waitUntil: 'load' });
        const recs = await page.evaluate(collectTextContrastFacts);
        const out = [];
        for (const r of recs) {
          const res = await runner(page, { candidateId: 'agree-' + r.xpath.replace(/\W+/g, ''), targetXpath: r.xpath });
          out.push({
            xpath: r.xpath,
            mine: r.contrastReliable ? r.contrastSolid : null, myThr: r.contrastThreshold,
            runner: res && res.measurement && Number.isFinite(res.measurement.ratio) ? +res.measurement.ratio.toFixed(2) : null,
            runnerThr: res && res.measurement && res.measurement.threshold,
            runnerFailed: !!(res && res.outcome && res.outcome.thresholdFailed),
            runnerMet: !!(res && res.outcome && res.outcome.thresholdMet),
          });
        }
        return out;
      } finally { await page.close(); }
    });

    const both = rows.filter((r) => r.mine != null && r.runner != null);
    assert.ok(both.length >= 3, `both lanes produced a ratio for several elements (got ${both.length})`);
    for (const r of both) {
      assert.ok(Math.abs(r.mine - r.runner) <= 0.25, `${r.xpath}: ratios agree (mine ${r.mine}, runner ${r.runner})`);
      assert.equal(r.myThr, r.runnerThr, `${r.xpath}: same threshold`);
      assert.equal(r.mine >= r.myThr, r.runner >= r.runnerThr, `${r.xpath}: same pass/fail verdict`);
    }
    // The fail-safe direction, stated as its own assertion because it is the one that matters: the collector
    // must never clear an element the deterministic runner declared a barrier on.
    const contradictions = rows.filter((r) => r.runnerFailed && r.mine != null && r.mine >= r.myThr);
    assert.deepEqual(contradictions, [], 'the collector never passes an element the runner barriered');
  });

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §3 — the join. A collector that runs but is attached to nothing is the silent-lane failure mode.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

test('§3 act-page-collect attaches the six keys to the RIGHT element records', { skip: !chromeOK }, async () => {
  const collect = await withBrowser(async (browser) => {
    const page = await browser.newPage();
    try {
      await page.setViewport({ width: 1280, height: 800 });
      return await collectActPage(page, { url: FLAT, elementCap: 400, file: 'fx' });
    } finally { await page.close(); }
  });
  assert.ok((collect.collectorLiveness || []).every((f) => f.collector !== 'collectTextContrastFacts'),
    `the collector did not throw in the page: ${JSON.stringify(collect.collectorLiveness)}`);
  const withKeys = (collect.elements || []).filter((e) => e && e.contrastReliable !== undefined);
  assert.ok(withKeys.length >= 4, `the facts reached the element inventory (got ${withKeys.length})`);
  for (const el of withKeys) {
    assert.equal(typeof el.color, 'string');
    assert.equal(typeof el.needsPixelContrast, 'boolean');
    if (el.contrastReliable) {
      assert.equal(typeof el.contrastSolid, 'number');
      assert.equal(el.needsPixelContrast, false);
    }
  }
  // the join is BY XPATH, so a mismatched key would attach another element's colours to this one
  const black = withKeys.find((e) => e.xpath.endsWith('/p[1]'));
  assert.equal(black.color, 'rgb(0, 0, 0)');
  assert.equal(black.contrastSolid, 21);
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §4 — the prompt. The whole point: the stub is replaced by a true statement.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const STUB = /backdrop could not be reduced to two flat colors/;

test('§4 a flat subject no longer receives the false stub — it receives the ratio', () => {
  const el = {
    xpath: '/x', hasText: true, text: 'Hi',
    color: 'rgb(85, 85, 85)', effBg: 'rgb(255, 255, 255)',
    contrastReliable: true, contrastSolid: 7.46, contrastThreshold: 4.5, needsPixelContrast: false,
  };
  const s = llmAdj.precomputeSignals(el, 'color-and-visual-text', '1.4.3');
  assert.equal(s.contrast.computable, true);
  assert.equal(s.contrast.reliable, true);
  assert.equal(s.contrast.ratio, 7.46);
  assert.equal(s.contrast.threshold, 4.5);
  assert.equal(s.contrast.fg, 'rgb(85, 85, 85)');
  assert.equal(s.contrast.uncertainReason, undefined, 'no abstention text at all');
});

test('§4 an element with NO keys still gets the old stub — the regression this fixes, kept visible', () => {
  const s = llmAdj.precomputeSignals({ xpath: '/z', hasText: true, text: 'Hi' }, 'color-and-visual-text', '1.4.3');
  assert.match(String(s.contrast.uncertainReason), STUB,
    'an element the collector could not describe is unchanged — the fix is additive, not a rewrite of the fallback');
});

test('§4 an honestly unsound subject carries ITS OWN reason, not the generic one, and keeps needsPixelContrast', () => {
  const el = {
    xpath: '/y', hasText: true, text: 'Hi', color: 'rgb(255, 255, 255)',
    contrastReliable: false, contrastThreshold: 4.5, needsPixelContrast: true,
    contrastUnreliableReason: 'a background image or gradient is painted behind this text, so the backdrop is not a single flat colour — a sound contrast ratio is not computable from the styles here; judge readability from the rendered pixels',
  };
  const s = llmAdj.precomputeSignals(el, 'color-and-visual-text', '1.4.3');
  assert.equal(s.contrast.computable, false);
  assert.equal(s.contrast.needsPixelContrast, true);
  assert.doesNotMatch(String(s.contrast.uncertainReason), STUB);
  assert.match(String(s.contrast.uncertainReason), /background image or gradient/);
  assert.equal(s.contrast.fg, 'rgb(255, 255, 255)', 'and the foreground survives, so vision cannot invent one');
});
