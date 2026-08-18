// Batch-3 (impl-collectors lane) — collector-fact tests for items 12, 14, 16b, 18, 19c, 20, 22.
// Every fixture is INVENTED (distinctive strings grepped against eval/ + annotations/ — zero hits); every
// fact is exercised in BOTH polarities: the shape that must fire, and the near-miss that must not.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const puppeteer = require('puppeteer');

const { collectActPage } = require('../../lib/act-page-collect.js');
const { familiesFor } = require('../../lib/applicability-oracle.js');
const { expectedFamilies } = require('../../lib/coverage-registry.js');
const { BROWSER_ARGS } = require('../../lib/browser-args.js');

const CHROME = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — batch3-collector-facts SKIPPED');

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'b3fx-'));
const writeFx = (name, html) => { fs.writeFileSync(path.join(DIR, name), html); return 'file://' + path.join(DIR, name); };

let browser;
test.before(async () => { if (chromeOK) browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: BROWSER_ARGS }); });
test.after(async () => { if (browser) await browser.close(); });
const collect = async (url) => {
  const page = await browser.newPage();
  try { return await collectActPage(page, { url, elementCap: 200, file: 'fx' }); }
  finally { await page.close().catch(() => {}); }
};

// ── item 12: muted live-region admission ────────────────────────────────────────────────────────────────
const FX_MUTED = writeFx('muted-region.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Quillbrook Orchard Supply</title></head><body>
  <h1>Quillbrook Orchard Supply</h1>
  <form><button type="submit">Save orchard notes</button>
    <span id="qb-saved" aria-live="off" aria-atomic="true" style="opacity:0"></span>
    <span id="qb-hidden" aria-live="off" aria-hidden="true" style="opacity:0"></span>
    <span id="qb-real" aria-live="polite" style="opacity:0"></span>
  </form>
</body></html>`);

test('item 12: a muted (aria-live=off) invisible span is admitted and mints status-message; aria-hidden stays out', { skip: !chromeOK, concurrency: false }, async () => {
  const out = await collect(FX_MUTED);
  // tag-scoped finder: an ANCESTOR's htmlSnippet also contains the id, so match the spans only
  const byId = (id) => out.elements.find((e) => e.tag === 'span' && e.htmlSnippet && e.htmlSnippet.includes(`id="${id}"`));
  const muted = byId('qb-saved');
  assert.ok(muted, 'the muted live-region span is in the inventory despite opacity:0 + empty');
  assert.equal(muted.liveRegion, false, 'it is NOT a real live region (aria-live=off)');
  assert.ok(familiesFor(muted).includes('status-message'), 'the oracle mints status-message via mutedLiveRegionShape');
  assert.ok([...expectedFamilies(muted)].includes('status-message'), 'coverage-registry twin agrees (Rule 16)');
  assert.equal(byId('qb-hidden'), undefined, 'an aria-hidden muted span is NOT admitted (outside the a11y tree)');
  const real = byId('qb-real');
  assert.ok(real && real.liveRegion === true, 'a genuinely-live region still rides its own carve-out');
});

// ── item 14: nearbyText ancestor climb ──────────────────────────────────────────────────────────────────
const FX_NEARBY = writeFx('nearby-climb.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Bramblewick Ferry Times</title></head><body>
  <div class="crest-row">
    <span class="crest-wrap"><svg aria-hidden="true" width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="14" fill="#2b6"/></svg></span>
    <span>Verified harbour operator since 1931</span>
  </div>
  <figure>
    <img src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" alt="" width="40" height="40">
    <figcaption>Departures chart for the Bramblewick crossing</figcaption>
  </figure>
  <p>An svg with its own live text keeps subtracting itself:</p>
  <div class="lone"><svg width="120" height="30"><text x="4" y="20">Pier 9 badge</text></svg></div>
</body></html>`);

test('item 14: single-child wrappers climb to real nearby text; level-0 reads are unchanged; own text is subtracted', { skip: !chromeOK, concurrency: false }, async () => {
  const out = await collect(FX_NEARBY);
  const svg = out.elements.find((e) => e.tag === 'svg' && e.htmlSnippet.includes('aria-hidden'));
  assert.ok(svg, 'the badge svg is collected');
  assert.ok(svg.nearbyText && svg.nearbyText.includes('Verified harbour operator'),
    `span>svg climbs to the wrapper's sibling text, got: ${svg.nearbyText}`);
  const img = out.elements.find((e) => e.tag === 'img');
  assert.ok(img.nearbyText && img.nearbyText.includes('Departures chart'), 'figcaption still contributes at level 0');
  const liveSvg = out.elements.find((e) => e.tag === 'svg' && e.svgLiveText === true);
  assert.ok(liveSvg, 'the text-carrying svg is collected');
  assert.ok(!(liveSvg.nearbyText || '').includes('Pier 9 badge'),
    `the subject's OWN text never supplies its nearby text, got: ${liveSvg.nearbyText}`);
});

// ── item 16b: captionText for complexImageHint images ───────────────────────────────────────────────────
const FX_CAPTION = writeFx('caption-fact.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Saltmarsh Kite Census</title></head><body>
  <figure>
    <svg role="img" aria-label="Kite sightings by month" aria-describedby="km-note" width="300" height="120">
      <rect x="0" y="0" width="300" height="120" fill="#eef"/><rect x="10" y="40" width="30" height="70" fill="#47a"/>
    </svg>
    <figcaption>Sightings peak in April; the survey counted 214 kites at Saltmarsh spit.</figcaption>
  </figure>
  <p id="km-note">Counts exclude the two rehabilitation releases in June.</p>
  <img src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" alt="Plain marsh logo" width="40" height="40">
</body></html>`);

test('item 16b: captionText carries figcaption + aria-describedby target; simple images get none', { skip: !chromeOK, concurrency: false }, async () => {
  const out = await collect(FX_CAPTION);
  const complex = out.elements.find((e) => e.tag === 'svg');
  assert.equal(complex.complexImageHint, true);
  assert.ok(complex.captionText && complex.captionText.includes('Sightings peak in April'), 'figcaption text is stated directly');
  assert.ok(complex.captionText.includes('rehabilitation releases'), 'aria-describedby target text is stated too');
  const simple = out.elements.find((e) => e.tag === 'img');
  assert.equal(simple.complexImageHint, false);
  assert.equal(simple.captionText, undefined, 'a bare logo gets no captionText key at all');
});

// ── item 18: emulatedControlFocusable (focusable role-less F42 sub-case) ────────────────────────────────
const FX_ECF = writeFx('emulated-focusable.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Gullwing Pottery Kiln Log</title></head><body>
  <div id="pk-inline" tabindex="0" onclick="void 0">Fire the raku kiln</div>
  <div id="pk-listener" tabindex="0">Open the glaze ledger</div>
  <div id="pk-nohandler" tabindex="0">Scrollable firing notes</div>
  <div id="pk-roled" role="button" tabindex="0" onclick="void 0">Proper button</div>
  <div id="pk-wrapper" tabindex="0" onclick="void 0">Card wrapping a real control <a href="#pk">ledger link</a></div>
  <p id="pk">anchor</p>
  <script>document.getElementById('pk-listener').addEventListener('click', function () {});</script>
</body></html>`);

test('item 18: focusable role-less activation targets fire (inline AND listener halves); shapes without activation, with a role, or wrapping a real control do not', { skip: !chromeOK, concurrency: false }, async () => {
  const out = await collect(FX_ECF);
  const byId = (id) => out.elements.find((e) => e.tag === 'div' && e.htmlSnippet && e.htmlSnippet.startsWith(`<div id="${id}"`));
  const inline = byId('pk-inline');
  assert.equal(inline.emulatedControlFocusable, true, 'inline half fires in-page');
  assert.ok(familiesFor(inline).includes('control-semantics'), 'oracle mints control-semantics');
  assert.ok([...expectedFamilies(inline)].includes('control-semantics'), 'coverage twin agrees (Rule 16)');
  const listener = byId('pk-listener');
  assert.equal(listener.emulatedControlFocusable, true, 'addEventListener half fires via the CDP pass');
  assert.notEqual(byId('pk-nohandler').emulatedControlFocusable, true, 'no activation handler ⇒ shape only, no fact');
  assert.notEqual(byId('pk-roled').emulatedControlFocusable, true, 'a declared interactive role is not emulated');
  assert.notEqual(byId('pk-wrapper').emulatedControlFocusable, true, 'wrapping a native control is enhancement, not replacement');
  // the original non-focusable F42 fact is untouched by the twin
  assert.equal(inline.emulatedControl, false, 'the focusable sub-case never leaks into the non-focusable fact');
});

// ── item 19c: fieldset-with-no-controls structural fact ─────────────────────────────────────────────────
const FX_FIELDSET = writeFx('fieldset-promo.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Tidepool Lantern Rentals</title></head><body>
  <fieldset><legend>Lantern Match Week</legend><p>Every rental this week is matched by the harbour trust.</p></fieldset>
  <form><fieldset><legend>Pick a lantern size</legend>
    <label><input type="radio" name="sz" value="s"> Small</label>
    <label><input type="radio" name="sz" value="l"> Large</label>
  </fieldset></form>
</body></html>`);

test('item 19c: a control-less fieldset is stated; a fieldset holding controls is not', { skip: !chromeOK, concurrency: false }, async () => {
  const out = await collect(FX_FIELDSET);
  const fx = out.structure.fieldsetsWithoutControls;
  assert.equal(fx.length, 1, `exactly the promo fieldset is listed, got ${JSON.stringify(fx)}`);
  assert.equal(fx[0].legendText, 'Lantern Match Week');
  assert.ok(fx[0].textSample.includes('matched by the harbour trust'));
});

// ── item 20: labelGeometryMismatch (ported RCA probe predicate) ─────────────────────────────────────────
const GRID_CSS = '.g{display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;width:480px}label,input{display:block;width:200px}';
const FX_LGM_BAD = writeFx('label-grid-crossed.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Wrenfield Beekeeping Permit</title>
<style>${GRID_CSS}</style></head><body><form class="g">
  <label for="wf-hive">Hive count</label><label for="wf-apiary">Apiary name</label>
  <input id="wf-apiary" name="apiary"><input id="wf-hive" name="hives">
</form></body></html>`);
const FX_LGM_OK = writeFx('label-grid-straight.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Wrenfield Beekeeping Permit</title>
<style>${GRID_CSS}</style></head><body><form class="g">
  <label for="wf-hive">Hive count</label><label for="wf-apiary">Apiary name</label>
  <input id="wf-hive" name="hives"><input id="wf-apiary" name="apiary">
</form></body></html>`);

test('item 20: CSS-grid cross-pairing is stated per field; the straight grid yields nothing', { skip: !chromeOK, concurrency: false }, async () => {
  const bad = await collect(FX_LGM_BAD);
  const crossed = bad.elements.filter((e) => e.labelGeometryMismatch);
  assert.equal(crossed.length, 2, `both cross-paired inputs carry the fact, got ${crossed.length}`);
  const apiary = crossed.find((e) => e.htmlSnippet.includes('wf-apiary'));
  assert.equal(apiary.labelGeometryMismatch.ownLabelText, 'Apiary name');
  assert.equal(apiary.labelGeometryMismatch.visuallyAdjacentLabelText, 'Hive count');
  assert.equal(apiary.labelGeometryMismatch.visuallyAdjacentLabelFor, 'wf-hive');
  const ok = await collect(FX_LGM_OK);
  assert.equal(ok.elements.filter((e) => e.labelGeometryMismatch).length, 0, 'a correctly paired grid states nothing');
});

// ── item 22: titleInstanceConflict (year-token contradiction) ───────────────────────────────────────────
const FX_TIC_BAD = writeFx('title-year-stale.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Foglight Regatta 2031 | Skerry Sailing Club</title></head><body>
  <h1>The Foglight Regatta</h1>
  <h2>Course briefing for 9 May 2032</h2>
  <dl><dt>Date</dt><dd>Saturday, 9 May 2032</dd></dl>
  <p>Last year (the 2031 regatta) was cancelled for fog, fittingly.</p>
  <footer>Skerry Sailing Club — the regatta returns 9 May 2032. © 2031 Skerry SC.</footer>
</body></html>`);
const FX_TIC_OK = writeFx('title-year-current.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Foglight Regatta 2032 | Skerry Sailing Club</title></head><body>
  <h1>Foglight Regatta 2032</h1><h2>Course briefing for 9 May 2032</h2>
</body></html>`);
const FX_TIC_NOYEAR = writeFx('title-no-year.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Foglight Regatta | Skerry Sailing Club</title></head><body>
  <h1>Course briefing for 9 May 2032</h1>
</body></html>`);

test('item 22: a stale title year contradicted by every identity surface fires; corroborated and ABSENT year tokens never do; body prose and (c) years are not surfaces', { skip: !chromeOK, concurrency: false }, async () => {
  const bad = await collect(FX_TIC_BAD);
  const tic = bad.structure.titleInstanceConflict;
  assert.ok(tic && tic.conflict === true, 'the stale-instance title fires');
  assert.deepEqual(tic.titleYears, ['2031']);
  assert.ok(tic.surfaceYears.includes('2032') && !tic.surfaceYears.includes('2031'),
    `body prose ("last year 2031") and the (c) 2031 footer year are NOT identity surfaces, got ${JSON.stringify(tic.surfaceYears)}`);
  const ok = await collect(FX_TIC_OK);
  assert.equal(ok.structure.titleInstanceConflict, undefined, 'a corroborated title year states nothing');
  const noYear = await collect(FX_TIC_NOYEAR);
  assert.equal(noYear.structure.titleInstanceConflict, undefined, 'an ABSENT title token can never fire (anti-richness firewall)');
});

// ── item 22, SOUNDNESS FIX F3 (batch-3 adversarial review) ──────────────────────────────────────────────
// The mirror-image polarity: two ordinary pages whose title year is CORRECT and whose only other year is
// not an instance assertion at all. Both fired the first cut (reviewer probe, 2026-08-17). INVENTED.
//   · FOUNDING  a shop page titled with the current season, footer "established 1998" — a founding year,
//     stripped exactly like the © year beside it.
//   · COMPARE   a correctly titled article with ONE sub-heading referencing the prior year; a lone
//     non-primary heading that shares no wording with the title is not admitted as a surface at all.
const FX_TIC_FOUNDING = writeFx('title-year-founding.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Winter Range 2026 | Marlbrook Drapers</title></head><body>
  <h1>Winter Range</h1>
  <h2>Fresh in this week</h2>
  <p>Our winter pieces are in store now.</p>
  <footer><p>Marlbrook Drapers — established 1963. All rights reserved.</p></footer>
</body></html>`);
const FX_TIC_COMPARE = writeFx('title-year-compare.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Budget 2026: what changes for households</title></head><body>
  <h1>What the Budget means for you</h1>
  <h2>How it compares with 2025</h2>
  <dl><dt>2025 baseline</dt><dd>&pound;1,200 a year</dd></dl>
  <p>Rates were held last year.</p>
</body></html>`);
// …and the positive polarity for the narrowing itself: the conflicting year on a PRIMARY identity surface
// (a hero-sized named graphic) is enough on its own, which is the corpus target's shape.
const FX_TIC_HERO = writeFx('title-year-hero.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Tarnfoot Fell Race 2031 | Skerry Harriers</title></head><body>
  <svg width="520" height="120" role="img" aria-label="Sunday, 8 June 2032"><rect width="520" height="120" fill="#345"/></svg>
  <h1>The Tarnfoot Fell Race</h1>
  <p>Entries close a fortnight before race day.</p>
</body></html>`);

test('item 22 (F3): a founding-year footer and a lone comparison sub-heading are NOT instance contradictions; a hero graphic alone IS enough', { skip: !chromeOK, concurrency: false }, async () => {
  const founding = await collect(FX_TIC_FOUNDING);
  assert.equal(founding.structure.titleInstanceConflict, undefined, '"established 1963" states when the shop began, not which page this is');
  const compare = await collect(FX_TIC_COMPARE);
  assert.equal(compare.structure.titleInstanceConflict, undefined, 'a sub-heading/fact list that shares no wording with the title is not an identity surface');
  const hero = await collect(FX_TIC_HERO);
  const tic = hero.structure.titleInstanceConflict;
  assert.ok(tic && tic.conflict === true, 'one PRIMARY identity surface carrying the other year is corroboration enough');
  assert.equal(tic.conflictYear, '2032');
  assert.ok(tic.surfaces.some((s) => s.kind === 'graphic-label' && s.primary === true), `the hero graphic is marked primary, got ${JSON.stringify(tic.surfaces)}`);
});
