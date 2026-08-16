// Regression suite for three defects found in the 2026-08-16 pass:
//
//   §1  HTMLFormElement's NAMED GETTER shadows every element-children read that can land on a <form>.
//       `<form><input name="children">` makes `form.children` the INPUT. Spread sites THREW
//       ("p.children is not iterable" — this crashed the real suite on
//       eval/act-augmented/1.4.1/pages/error-validation-color-only/case-05.html, whose form has a
//       "Number of children in household" field). `.length === 0` sites degraded to `undefined === 0`
//       ⇒ false and SILENTLY stopped firing.
//
//   §2  The F3 background-image nomination aperture was fitted to F3's canonical book-distributor
//       markup: a 16px "tracking-pixel" floor that is really an icon floor, and a "reserved area"
//       proxy that assumes the image sits BESIDE the text rather than badged OVER the control.
//
//   §3  The confusable-text detector (1.1.1 glyph substitution) had no mint loop, so its finding could
//       only ever attach to an obligation the oracle had already enumerated — and the oracle enumerates
//       1.1.1 for graphic surfaces, never for the <h1>/<p>/<span> that carries substituted glyphs.
//
// Assertions are OBSERVABLE consequences (the collector nominates; the ledger holds an obligation; the
// runner's verdict flips), never the presence of code — the repo has twice shipped correct prose that
// an unreachable gate above it made inert.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const puppeteer = require('puppeteer');

const { collectActPage } = require('../../lib/act-page-collect.js');
const { collectLists } = require('../../lib/collect-lists.js');
const { measureReflow } = require('../../lib/exp-runners.js');
const { measureReflow320 } = require('../../lib/reflow-runner.js');
const { collectNonTextFacts } = require('../../lib/nontext-contrast-runner.js');
const { probeVisualStructureDiscovery, probeAudioAutoplay } = require('../../lib/broad-scope-probes.js');
const { BROWSER_ARGS } = require('../../lib/browser-args.js');
const { buildV3 } = require('../../lib/build-v3.js');
const { withPipeline, promoted } = require('../helpers.js');

const CHROME = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — named-getter / bg-aperture browser tests SKIPPED');

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'named-getter-fx-'));
const writeFx = (name, html) => { const p = path.join(DIR, name); fs.writeFileSync(p, html); return { file: p, url: 'file://' + p }; };
const CORPUS = path.join(__dirname, '..', '..', '..', '..', 'eval', 'act-augmented');

async function withPage(fn, viewport) {
  const browser = await puppeteer.launch({ headless: 'new', executablePath: CHROME, args: BROWSER_ARGS });
  try {
    const page = await browser.newPage();
    await page.setViewport(viewport || { width: 1280, height: 800 });
    return await fn(page);
  } finally { await browser.close(); }
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §1 — the form named-getter shadow
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

// SCOPE NOTE (measured, not assumed): the named getter shadows EVERY inherited member — `tagName`,
// `querySelector`, `closest` and `nodeType` all return the control on a form that has one so named.
// Piecemeal immunity is therefore unbounded and repo-wide. The defended class is the one that is both
// PLAUSIBLE as a control name and DEMONSTRATED in production: `children` (a household form's "Number of
// children"). The fix reads through Node.prototype's `childNodes` getter, which costs nothing extra and
// takes `childNodes` off the surface as well — that matters because a naive
// `filter.call(e.childNodes, …)` fix silently returns [] on `<input name="childNodes">` rather than
// throwing, which is strictly worse than the crash it replaces.

// f1's element children are all <p> so the faux-list scan's dominant-tag pick is unambiguous;
// f2 carries the nested fill (nontext-contrast) and the <audio> (probeAudioAutoplay's ancestor walk).
const FX_SHADOW = writeFx('form-shadow.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><style>
  body { margin:0; font:16px/1.5 Arial, sans-serif; }
  form { border:1px solid #767676; background:#fff; padding:8px; }
  #fill { background:#0b3d91; width:120px; height:20px; }
</style></head><body>
  <form id="f1" action="#">
    <input name="children" value="1">
    <p>&bull; First list item text</p>
    <p>&bull; Second list item text</p>
    <p>&bull; Third list item text</p>
  </form>
  <form id="f2" action="#">
    <input name="children" value="2">
    <div id="fill"></div>
    <div><audio id="au" src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="></audio></div>
  </form>
</body></html>`);

// The SILENT shape. A form that has a named control necessarily has element children, so on the usual
// markup `undefined === 0` and `children.length === 0` agree (both false) and the bug is invisible. It
// becomes observable only when the form owns its control through the `form=` ATTRIBUTE from outside:
// the form then has ZERO element children while `form.children` is still shadowed by that control.
// Verified in Chromium before this fixture was written: buggy ⇒ false, fixed ⇒ true.
// No <button>/<a> anywhere, so the scroller is genuinely unreachable and the C33 carve-out is the only
// thing standing between this page and a reflow barrier.
const LONG_TOKEN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnop';
const FX_SILENT = writeFx('form-shadow-silent.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><style>
  body { margin:0; font:16px/1.5 Arial, sans-serif; }
  #sc { overflow-x:auto; width:120px; }
</style></head><body>
  <form id="sc" action="#">${LONG_TOKEN}</form>
  <input form="sc" name="children" type="hidden">
</body></html>`);

test('§1 the crash repro: on a form whose control is named "children", collectActPage completes and still collects',
  { skip: !chromeOK, concurrency: false }, async () => {
    const collect = await withPage((page) => collectActPage(page, { url: FX_SHADOW.url, file: 'ng:1', runId: 'R', autoUpdateWindowMs: 0 }));
    assert.ok(Array.isArray(collect.elements) && collect.elements.length > 0, 'the collector returned elements instead of throwing');
    assert.ok(collect.elements.some((e) => e.tag === 'form'), 'the <form> itself was collected');
  });

test('§1 the real page that crashed the suite (act-augmented 1.4.1 case-05) collects without throwing',
  { skip: !chromeOK, concurrency: false }, async () => {
    const real = path.join(CORPUS, '1.4.1/pages/error-validation-color-only/case-05.html');
    if (!fs.existsSync(real)) { console.log('# corpus page absent — skipped'); return; }
    const collect = await withPage((page) => collectActPage(page, { url: 'file://' + real, file: 'ng:2', runId: 'R', autoUpdateWindowMs: 0 }));
    assert.ok(collect.elements.length > 0, 'the page that threw "p.children is not iterable" now collects');
  });

test('§1 collect-lists still nominates a faux list whose PARENT IS THE SHADOWED FORM',
  { skip: !chromeOK, concurrency: false }, async () => {
    // The faux-list scan walks every parentElement of a p/div/span, so a <form> parent is routine. A
    // throw here is swallowed by the caller's `.catch(() => [])` — which is exactly why the bug was
    // silent at this site: the whole 1.3.1 list lane just returned nothing.
    const lists = await withPage(async (page) => { await page.goto(FX_SHADOW.url, { waitUntil: 'load' }); return page.evaluate(collectLists); });
    const faux = lists.filter((l) => l.kind === 'faux' && l.via === 'sibling-bulleted');
    assert.equal(faux.length, 1, `the three bullet-marked <p> children of the form are nominated: ${JSON.stringify(lists)}`);
    assert.equal(faux[0].itemCount, 3);
  });

test('§1 the SILENT sites: both C33 unbreakable-string carve-outs still fire when the culprit IS the shadowed form',
  { skip: !chromeOK, concurrency: false }, async () => {
    // `el.children.length === 0` on a shadowed form is `undefined === 0` ⇒ false: no throw, the leaf
    // test just stops answering, and an unreachable scroller holding an unavoidable long token is
    // reported as a reflow barrier instead of the C33 affordance it is. Both runners must clear it.
    const out = await withPage(async (page) => {
      await page.goto(FX_SILENT.url, { waitUntil: 'load' });
      return { a: await page.evaluate(measureReflow), b: await page.evaluate(measureReflow320) };
    }, { width: 320, height: 512 });
    assert.equal(out.a.horizontalScrollPresent, false, 'exp-runners measureReflow: the C33 token exempts the unreachable scroller');
    assert.equal(out.b.strandedFlowableScroller, null, 'reflow-runner measureReflow320: the scroller is unbreakable-string, not stranded flowable content');
  });

test('§1 nontext-contrast collectNonTextFacts reads a FORM\'s children (nestedFill) without throwing',
  { skip: !chromeOK, concurrency: false }, async () => {
    const facts = await withPage(async (page) => {
      await page.goto(FX_SHADOW.url, { waitUntil: 'load' });
      return page.evaluate(collectNonTextFacts, '#f2', {});
    });
    assert.ok(facts && typeof facts === 'object', 'facts returned for the bordered form');
    assert.equal(facts.nestedFill, true, 'the #fill child is seen through the shadowed accessor');
  });

test('§1 both broad-scope probes survive the shadowed form (pathOf ancestor walk + children scan)',
  { skip: !chromeOK, concurrency: false }, async () => {
    const out = await withPage(async (page) => {
      await page.goto(FX_SHADOW.url, { waitUntil: 'load' });
      return { audio: await probeAudioAutoplay(page, { waitMs: 60 }), struct: await probeVisualStructureDiscovery(page, { limit: 20 }) };
    });
    assert.ok(out.audio && typeof out.audio === 'object', 'probeAudioAutoplay returned instead of throwing');
    assert.ok(out.struct && typeof out.struct === 'object', 'probeVisualStructureDiscovery returned instead of throwing');
  });

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §2 — the F3 background-image aperture
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const PX = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const PX2 = 'data:image/gif;base64,R0lGODlhAQABAIAAAP8AAAAAACH5BAEAAAAAALAAAAAABAAEAAAICRAEAOw==';
const FX_BG = writeFx('bg-aperture.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><style>
  body { margin:0; font:16px/1.4 Arial, sans-serif; }
  /* (a) required-field asterisk painted as a 12x12 background on an EMPTY span — under the old 16px floor */
  .mark { display:inline-block; width:12px; height:12px; background:url(${PX}) no-repeat center/12px 12px; }
  /* (a-neg) a genuine tracking pixel and a hairline divider must stay out */
  .pixel { display:inline-block; width:1px; height:1px; background:url(${PX}) no-repeat; }
  .hairline { display:block; width:400px; height:4px; background:url(${PX}) no-repeat; }
  /* (b) seat-map shape: a TEXT-BEARING 46x46 control with a corner badge and NO padding at all */
  .seat { width:46px; height:46px; border:1px solid #999; background-repeat:no-repeat;
          background-position:right 3px bottom 3px; background-size:14px 14px; }
  .seat.exit { background-image:url(${PX2}); }
  /* (b-neg) a uniformly bulleted list: every row carries the SAME background beside its text */
  .bul { padding-left:20px; background:url(${PX}) no-repeat left center/12px 12px; }
  /* (b-neg) a text-bearing panel whose background IS its surface, not a discrete mark */
  .hero { width:300px; height:120px; background:url(${PX}) no-repeat center/cover; }
</style></head><body>
  <label id="lbl">First name<span id="mark" class="mark"></span></label>
  <span id="pixel" class="pixel"></span>
  <div id="hairline" class="hairline"></div>
  <div id="row1"><button id="s1" class="seat">10A</button><button class="seat">10B</button><button class="seat">10C</button><button class="seat">10D</button></div>
  <div id="row2"><button id="s2" class="seat exit">12A</button><button class="seat exit">12B</button><button class="seat exit">12C</button><button class="seat exit">12D</button></div>
  <ul><li id="b1" class="bul">Alpha item</li><li class="bul">Beta item</li><li class="bul">Gamma item</li></ul>
  <div id="hero" class="hero">Panel copy that sits over the surface</div>
</body></html>`);

// Cohort negatives live in their OWN document so no unrelated same-tag element can join the cohort.
const FX_BG_SOLO = writeFx('bg-solo.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><style>
  body { margin:0; font:16px/1.4 Arial, sans-serif; }
  .seat { width:46px; height:46px; display:inline-block; border:1px solid #999; background-repeat:no-repeat;
          background-position:right 3px bottom 3px; background-size:14px 14px; background-image:url(${PX2}); }
</style></head><body>
  <div id="wrap"><button id="lonely" class="seat">99Z</button></div>
  <div id="urow"><a id="u1" class="seat" href="#">A1</a><a class="seat" href="#">A2</a><a class="seat" href="#">A3</a></div>
</body></html>`);

async function bgHits(url) {
  return withPage(async (page) => {
    const collect = await collectActPage(page, { url, file: 'bg', runId: 'R', autoUpdateWindowMs: 0 });
    const ids = await page.evaluate((xps) => xps.map((xp) => { try { const n = document.evaluate(xp.split('>>')[0], document, null, 9, null).singleNodeValue; return n ? (n.id || null) : null; } catch (e) { return null; } }), collect.elements.map((e) => e.xpath));
    const by = {};
    collect.elements.forEach((e, i) => { if (ids[i]) by[ids[i]] = e; });
    return by;
  });
}

test('§2a a 12px required-field asterisk background nominates; a 1px tracking pixel and a 4px hairline do NOT',
  { skip: !chromeOK, concurrency: false }, async () => {
    const by = await bgHits(FX_BG.url);
    assert.equal(by.mark && by.mark.backgroundImageMeaningful, true, 'the 12x12 asterisk is nominated (the old floor was 16px)');
    assert.ok(!(by.pixel && by.pixel.backgroundImageMeaningful), 'a 1x1 tracking pixel is still excluded');
    assert.ok(!(by.hairline && by.hairline.backgroundImageMeaningful), 'a 400x4 hairline divider is still excluded — the floor is a MIN DIMENSION, not an area');
  });

test('§2b a text-bearing control BADGED with a corner icon nominates when the badge distinguishes it from its cohort',
  { skip: !chromeOK, concurrency: false }, async () => {
    const by = await bgHits(FX_BG.url);
    assert.equal(by.s2 && by.s2.backgroundImageMeaningful, true, 'the exit-row seat carries meaning only its background states');
    assert.ok(!(by.s1 && by.s1.backgroundImageMeaningful), 'a seat with NO background image is not nominated');
  });

test('§2 GUARD: a uniformly-bulleted list and a full-surface panel background stay OUT',
  { skip: !chromeOK, concurrency: false }, async () => {
    const by = await bgHits(FX_BG.url);
    // every row has the SAME bullet ⇒ the image carries no distinction ⇒ decorative; the peer gate holds it.
    assert.ok(!(by.b1 && by.b1.backgroundImageMeaningful), 'an identically-bulleted list row is NOT nominated (the peer gate)');
    // background-size:cover is the element's own surface, not a discrete mark placed on it.
    assert.ok(!(by.hero && by.hero.backgroundImageMeaningful), 'a text-bearing panel whose background COVERS it is NOT a badge');
  });

test('§2 GUARD: the badge branch needs a COHORT — a lone badged control and a uniformly-badged set stay OUT',
  { skip: !chromeOK, concurrency: false }, async () => {
    // This is the firehose the widening had to avoid: without the cohort requirement, ANY text-bearing
    // control with a small background icon would be nominated. Measured on 3562 held-out pages, dropping
    // the cohort gate fired on an unrelated 2.4.4 page; keeping it did not.
    const by = await bgHits(FX_BG_SOLO.url);
    assert.ok(!(by.lonely && by.lonely.backgroundImageMeaningful), 'a lone badged control has no peer cohort — nothing says the icon distinguishes anything');
    assert.ok(!(by.u1 && by.u1.backgroundImageMeaningful), 'three links carrying the IDENTICAL badge distinguish nothing from each other');
  });

test('§2 the two confirmed corpus misses are nominated end-to-end', { skip: !chromeOK, concurrency: false }, async () => {
  const base = path.join(CORPUS, '1.1.1/pages/informative-css-background-image');
  for (const [name, want] of [['case-03.html', 4], ['case-06.html', 4]]) {
    const p = path.join(base, name);
    if (!fs.existsSync(p)) { console.log(`# ${name} absent — skipped`); continue; }
    const collect = await withPage((page) => collectActPage(page, { url: 'file://' + p, file: 'bg:' + name, runId: 'R', autoUpdateWindowMs: 0 }));
    const hits = collect.elements.filter((e) => e.backgroundImageMeaningful);
    assert.equal(hits.length, want, `${name}: ${want} background-image candidates nominated, got ${hits.length}`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §3 — the confusable-text mint
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const PROMOTED = promoted([]);
const ID = { file: 'p', runId: 'R', pageDigest: 'sha256:d' };
const bundleWith = (elements) => withPipeline({
  collect: { ...ID, collectedAt: 1000, elements },
  experiments: { ...ID, catalogVersion: '3.0.0-phase0', startedAt: 2000, results: [] },
  claimProposals: { ...ID, proposals: [] },
});
const nonText = (r) => r.results.obligationLedger.filter((o) => o.sc === '1.1.1' && o.claimFamily === 'non-text-content');

test('§3 glyph-substituted TEXT mints its own 1.1.1 obligation (it had none: the oracle enumerates 1.1.1 for graphics)', () => {
  const r = buildV3(bundleWith([
    { xpath: '/html/body/h1[1]', tag: 'h1', text: '\u{1D5E6}\u{1D602}\u{1D5FA}\u{1D5F6}', nearestLang: 'en' }, // 𝗦𝘂𝗺𝗶 in math-styled glyphs
    { xpath: '/html/body/p[1]', tag: 'p', text: 'Ordinary ASCII prose', nearestLang: 'en' },
  ]), { authority: PROMOTED });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  const obls = nonText(r);
  assert.equal(obls.length, 1, 'exactly the substituted heading owes a non-text-content obligation');
  assert.equal(obls[0].xpath, '/html/body/h1[1]');
  assert.equal(obls[0].cleared, false, 'it lands as an unfilled question for the judge, never a clear');
});

test('§3 INNERMOST-ONLY: innerText propagates to ancestors, so only the leaf carrier mints', () => {
  // The raw detector fires on <section>, <h1> and <span> alike (measured on the corpus). Minting all
  // three would triple the aperture and point the judge at containers instead of the glyphs.
  const word = 'ϲоοk'; // WCAG F71's own normative look-alike example
  const r = buildV3(bundleWith([
    { xpath: '/html/body/section[1]', tag: 'section', text: `Anyone can ${word} tonight.`, nearestLang: 'en' },
    { xpath: '/html/body/section[1]/h1[1]', tag: 'h1', text: `Anyone can ${word} tonight.`, nearestLang: 'en' },
    { xpath: '/html/body/section[1]/h1[1]/span[1]', tag: 'span', text: word, nearestLang: 'en' },
  ]), { authority: PROMOTED });
  const obls = nonText(r);
  assert.equal(obls.length, 1, 'one barrier ⇒ one obligation');
  assert.equal(obls[0].xpath, '/html/body/section[1]/h1[1]/span[1]', 'the innermost carrier owns it');
});

test('§3 GUARD: the correctly-encoded near-miss SKU "RX-O0OO" (Latin O + digit 0) must NOT mint', () => {
  // text-lookalike-glyph-substitution/case-05 ships this distractor deliberately: it LOOKS like a
  // substitution and is entirely ASCII.
  const r = buildV3(bundleWith([
    { xpath: '/html/body/p[1]', tag: 'p', text: 'Model RX-O0OO', nearestLang: 'en' },
    { xpath: '/html/body/p[2]', tag: 'p', text: 'lIl0O 1234 - all ASCII lookalikes', nearestLang: 'en' },
  ]), { authority: PROMOTED });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.deepEqual(nonText(r), [], 'ASCII confusables are not glyph substitution — nothing to mint');
});

test('§3 GUARD: full-width CJK PUNCTUATION must not mint — it is correct Japanese typography, not a spoof', () => {
  // Found by measuring this mint's own held-out aperture: ungated, 9 of the 15 pages it fired on across
  // eval/act-augmented were Japanese pages whose only "substitution" was a full-width bracket, because
  // the detector's fullwidth lane folds the whole U+FF01–FF5E block. The mint requires the fold to
  // replace a codepoint with an ASCII LETTER — the shape 1.1.1 glyph substitution is actually about.
  const r = buildV3(bundleWith([
    { xpath: '/html/body/p[1]', tag: 'p', text: '中央病院（循環）／桜井駅前', nearestLang: 'ja' },
    { xpath: '/html/body/p[2]', tag: 'p', text: '０３００', nearestLang: 'ja' }, // full-width DIGITS read correctly
  ]), { authority: PROMOTED });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.deepEqual(nonText(r), [], 'full-width punctuation and digits are not letter substitution');
  // ...but full-width LATIN LETTERS still are.
  const r2 = buildV3(bundleWith([{ xpath: '/html/body/p[1]', tag: 'p', text: 'Ｌｏｇｉｎ', nearestLang: 'ja' }]), { authority: PROMOTED });
  assert.equal(nonText(r2).length, 1, 'full-width Latin letters still mint');
});

test('§3 GUARD: a native-script word under a matching declared lang does not mint (the detector\'s own exemption is inherited)', () => {
  const r = buildV3(bundleWith([
    { xpath: '/html/body/p[1]', tag: 'p', text: 'СОВА', nearestLang: 'ru' }, // СОВА = "owl" in Russian
  ]), { authority: PROMOTED });
  assert.deepEqual(nonText(r), [], 'a Russian word on a ru page is text, not a spoof');
});

test('§3 GUARD: the mint never DOUBLES an obligation the oracle already enumerated for the same element', () => {
  const r = buildV3(bundleWith([
    { xpath: '/html/body/img[1]', tag: 'img', isImage: true, alt: 'x', text: '', axName: '\u{1D5E6}\u{1D602}\u{1D5FA}\u{1D5F6}', nearestLang: 'en' },
  ]), { authority: PROMOTED });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(nonText(r).length, 1, 'the oracle-enumerated obligation is kept, not duplicated');
});
