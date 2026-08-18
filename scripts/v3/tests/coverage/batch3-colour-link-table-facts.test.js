// Batch-3 (impl-collectors lane) — collector-fact tests for items 5 (ariaTable header-mirror tell),
// 27 (linkCueParity facts), 29 (fieldColourState.colourKeyText), 32 (token-lane narrowing prep).
// Every fixture is INVENTED; every fact is exercised in BOTH polarities.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const puppeteer = require('puppeteer');

const { collectTables } = require('../../lib/collect-tables.js');
const { collectColourPeers, collectFieldColourState } = require('../../lib/collect-colour-peers.js');
const { collectLinkTargetFacts } = require('../../lib/collect-link-facts.js');
const { collectActPage } = require('../../lib/act-page-collect.js');
const { PATTERNS, PROPER_NOUN_PAIR } = require('../../lib/color-reference-lexicon.js');
const { BROWSER_ARGS } = require('../../lib/browser-args.js');

const CHROME = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — batch3-colour-link-table-facts SKIPPED');

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'b3clt-'));
const writeFx = (name, html) => { fs.writeFileSync(path.join(DIR, name), html); return 'file://' + path.join(DIR, name); };
const LEX_ARG = { colourKeyPatterns: PATTERNS.map((p) => ({ id: p.id, source: p.re.source })), properNounGuard: PROPER_NOUN_PAIR.source };

let browser;
test.before(async () => { if (chromeOK) browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: BROWSER_ARGS }); });
test.after(async () => { if (browser) await browser.close(); });
const onPage = async (url, fn, arg) => {
  const page = await browser.newPage();
  try { await page.goto(url, { waitUntil: 'load' }); return arg === undefined ? await page.evaluate(fn) : await page.evaluate(fn, arg); }
  finally { await page.close().catch(() => {}); }
};

// ── item 5: ariaTable header-side fabrication tell ──────────────────────────────────────────────────────
const WIDGET_CELL = (k, v, d) => `<div class="wid"><div class="k">${k}</div><div class="v">${v}</div><div class="d">${d}</div></div>`;
const FX_MIRROR = writeFx('aria-widget-board.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Peatmoor Turbine Board</title>
<style>[role=row]{display:flex;gap:8px}.wid{border:1px solid #ccc;padding:8px;width:150px}</style></head><body>
  <div role="table" aria-label="Turbine metrics">
    <div role="row">
      <div role="columnheader">${'<div class="k">Blade Sweep</div><div class="v">61 m</div><div class="d">nominal</div>'}</div>
      <div role="columnheader">${'<div class="k">Yaw Drift</div><div class="v">0.4°</div><div class="d">steady</div>'}</div>
    </div>
    <div role="row">${WIDGET_CELL('Cut-in wind', '3.1 m/s', 'rising').replace('class="wid"', 'class="wid" role="cell"')}${WIDGET_CELL('Gearbox temp', '61 °C', 'steady').replace('class="wid"', 'class="wid" role="cell"')}</div>
  </div>
</body></html>`);
const FX_GENUINE = writeFx('aria-genuine-grid.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Peatmoor Turbine Roster</title>
<style>[role=row]{display:flex;gap:8px}[role=columnheader],[role=cell]{width:150px}</style></head><body>
  <div role="table" aria-label="Turbine roster">
    <div role="row">
      <div role="columnheader"><span>Turbine</span><button>sort</button></div>
      <div role="columnheader"><span>Output</span><button>sort</button></div>
    </div>
    <div role="row"><div role="cell">T-114 Peatmoor East</div><div role="cell">2.1 MW</div></div>
    <div role="row"><div role="cell">T-115 Peatmoor West</div><div role="cell">1.8 MW</div></div>
  </div>
</body></html>`);

test('item 5: columnheaders that mirror the data cells\' widget stacks fire the tell; a genuine grid with label+sort headers does not', { skip: !chromeOK, concurrency: false }, async () => {
  const mirrored = (await onPage(FX_MIRROR, collectTables)).find((t) => t.ariaTable === true);
  assert.ok(mirrored, 'the aria table record exists');
  assert.equal(mirrored.headerCellsMirrorData, true, 'both value-widget headers mirror the data stacks');
  assert.equal(mirrored.dataShapedHeaderCells, 2);
  assert.equal(mirrored.fabricatedTableSemantics, true, 'the tell folds into the existing LAYOUT_STRUCTURE_SUSPECT channel');
  const genuine = (await onPage(FX_GENUINE, collectTables)).find((t) => t.ariaTable === true);
  assert.equal(genuine.headerCellsMirrorData, false, 'inline label+sort header stacks never mirror');
  assert.equal(genuine.fabricatedTableSemantics, false, 'the genuine grid stays clean');
});

// ── item 5, SOUNDNESS FIX F2 (batch-3 adversarial review): the tell needs POSITIVE value-ness, not a
// structural mirror. These three are the everyday div-grid header idioms the mirror-only rule fired on
// (reviewer probe, 2026-08-17) — permanent regression fixtures, all INVENTED.
//   · ORDINARY  two-line `name / unit` headers over two-line `value / delta` data cells: div>div both
//     sides, but no header block is a measured value.
//   · SORTABLE  `label / sort-state` headers over `name / detail` data cells: same shape, same absence.
//   · PERIOD    the converse idiom — headers ARE values (`2024` + `actual`) over value-only data cells,
//     so there is no data-side LABEL block for the header's caption to mirror.
const FX_ORDINARY = writeFx('aria-ordinary-grid.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Wharfedale Regional Revenue</title>
<style>[role=row]{display:flex;gap:8px}[role=columnheader],[role=cell]{width:150px}</style></head><body>
  <div role="table" aria-label="Quarterly revenue by region">
    <div role="row">
      <div role="columnheader"><div>Region</div><div>market</div></div>
      <div role="columnheader"><div>Revenue</div><div>GBP k</div></div>
    </div>
    <div role="row">
      <div role="cell"><div>EMEA</div><div>12 countries</div></div>
      <div role="cell"><div>1,240</div><div>+3.1%</div></div>
    </div>
    <div role="row">
      <div role="cell"><div>APAC</div><div>9 countries</div></div>
      <div role="cell"><div>980</div><div>-1.4%</div></div>
    </div>
  </div>
</body></html>`);
const FX_SORTABLE = writeFx('aria-sortable-grid.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Wharfedale File Store</title>
<style>[role=row]{display:flex;gap:8px}[role=columnheader],[role=gridcell]{width:150px}</style></head><body>
  <div role="grid" aria-label="Stored files">
    <div role="row">
      <div role="columnheader"><div>Name</div><div>sorted A to Z</div></div>
      <div role="columnheader"><div>Size</div><div>unsorted</div></div>
    </div>
    <div role="row"><div role="gridcell"><div>report.pdf</div><div>print-ready file</div></div><div role="gridcell"><div>1.2 MB</div><div>in the archive</div></div></div>
    <div role="row"><div role="gridcell"><div>notes.txt</div><div>Text file</div></div><div role="gridcell"><div>4 KB</div><div>in the archive</div></div></div>
  </div>
</body></html>`);
const FX_PERIOD = writeFx('aria-period-grid.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Wharfedale Revenue by Year</title>
<style>[role=row]{display:flex;gap:8px}[role=columnheader],[role=cell]{width:150px}</style></head><body>
  <div role="table" aria-label="Revenue by year">
    <div role="row">
      <div role="columnheader"><div>2024</div><div>actual</div></div>
      <div role="columnheader"><div>2025</div><div>forecast</div></div>
    </div>
    <div role="row"><div role="cell"><div>1,240</div><div>+3.1%</div></div><div role="cell"><div>1,310</div><div>+5.6%</div></div></div>
    <div role="row"><div role="cell"><div>980</div><div>-1.4%</div></div><div role="cell"><div>1,020</div><div>+4.1%</div></div></div>
  </div>
</body></html>`);

test('item 5 (F2): ordinary two-line-label, sortable and period-header div grids all mirror structurally and MUST NOT fire', { skip: !chromeOK, concurrency: false }, async () => {
  for (const [name, fx] of [['ordinary', FX_ORDINARY], ['sortable', FX_SORTABLE], ['period', FX_PERIOD]]) {
    const t = (await onPage(fx, collectTables)).find((x) => x.ariaTable === true);
    assert.ok(t, `${name}: the aria table record exists`);
    assert.equal(t.ownedContractHolds, true, `${name}: the owned-element contract holds — nothing else could be suppressing the tell`);
    assert.equal(t.dataShapedHeaderCells, 0, `${name}: no header cell reproduces a data cell's label+value pattern`);
    assert.equal(t.headerCellsMirrorData, false, `${name}: a structural mirror alone is not fabrication evidence`);
    assert.equal(t.fabricatedTableSemantics, false, `${name}: and nothing reaches LAYOUT_STRUCTURE_SUSPECT`);
  }
});

// ── item 27: linkCueParity facts (deterministic style math only — no rubric clause) ─────────────────────
const FX_CUE = writeFx('cue-parity.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Mistleburn Reading Room</title>
<style>p a{color:#8c1d40;font-weight:700;text-decoration:none}p strong{color:#8c1d40;font-weight:700}nav a{color:#8c1d40}</style></head><body>
  <nav><a href="/mb/hours">Opening hours</a></nav>
  <p>The reading room keeps the <strong>only surviving folio</strong> under glass; request the
  <a href="/mb/folio">folio viewing slot</a> a week ahead, since demand is high in term time.</p>
</body></html>`);

test('item 27: an in-prose link gets cue-parity style math (incl. the same-styled <strong> census); a nav link gets none; the 2.4.4 payload is untouched', { skip: !chromeOK, concurrency: false }, async () => {
  const recs = await onPage(FX_CUE, collectLinkTargetFacts);
  const prose = recs.find((r) => r.href.includes('/mb/folio'));
  assert.ok(prose.cueParity, 'the in-prose link carries cueParity');
  assert.equal(prose.cueParity.underlined, false);
  assert.equal(prose.cueParity.linkWeight, '700');
  assert.ok(prose.cueParity.nonLinkSameStyleCount >= 1, 'the identically-styled <strong> is counted');
  assert.ok(prose.cueParity.nonLinkSameStyleSamples.some((s) => s.includes('only surviving folio')));
  assert.ok(typeof prose.cueParity.contrastLinkVsProse === 'number' && prose.cueParity.contrastLinkVsProse > 1,
    'link-vs-prose contrast is a measured number');
  const nav = recs.find((r) => r.href.includes('/mb/hours'));
  assert.equal(nav.cueParity, undefined, 'a nav link (no surrounding prose) states nothing');
  // attachment split: the element rides linkCueParity; linkTargetFacts (the 2.4.4 prompt payload) never carries it
  const page = await browser.newPage();
  try {
    const out = await collectActPage(page, { url: FX_CUE, elementCap: 100, file: 'fx' });
    const el = out.elements.find((e) => e.tag === 'a' && e.htmlSnippet.includes('/mb/folio'));
    assert.ok(el.linkCueParity, 'cueParity is attached as its own element key');
    assert.ok(el.linkTargetFacts && !('cueParity' in el.linkTargetFacts),
      'linkTargetFacts (spread into the 2.4.4 prompt) stays byte-identical');
  } finally { await page.close().catch(() => {}); }
});

// ── item 29: fieldColourState.colourKeyText ─────────────────────────────────────────────────────────────
const FX_KEY = writeFx('colour-key-form.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Duskwater Mooring Application</title>
<style>.rq label{color:#2f7d32}.op label{color:#20242b}label{display:block}</style></head><body>
  <p class="keynote">Required fields are shown in green; optional fields are charcoal.</p>
  <form>
    <div class="rq"><label for="dw-boat">Boat name</label><input id="dw-boat"></div>
    <div class="op"><label for="dw-notes">Notes</label><input id="dw-notes"></div>
  </form>
</body></html>`);
const FX_UNIFORM = writeFx('colour-uniform-form.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Duskwater Mooring Application</title></head><body>
  <p>Required fields are shown in green.</p>
  <form>
    <div><label for="dw-a">Boat name</label><input id="dw-a"></div>
    <div><label for="dw-b">Notes</label><input id="dw-b"></div>
  </form>
</body></html>`);

test('item 29: the scope\'s lexicon-matched colour key attaches to every member of a colour-coded set; uniform sets and lexicon-less calls attach nothing', { skip: !chromeOK, concurrency: false }, async () => {
  const recs = await onPage(FX_KEY, collectFieldColourState, LEX_ARG);
  assert.ok(recs.length >= 2, 'the two-label-colour set passes the gate');
  for (const r of recs) assert.ok(r.colourKeyText && r.colourKeyText.includes('shown in green'), `every member carries the key, got ${JSON.stringify(r.colourKeyText)}`);
  const uniform = await onPage(FX_UNIFORM, collectFieldColourState, LEX_ARG);
  assert.equal(uniform.length, 0, 'a colour-uniform set stays gated out — the key never un-gates anything');
  const noLex = await onPage(FX_KEY, collectFieldColourState);
  assert.ok(noLex.length >= 2 && noLex.every((r) => !('colourKeyText' in r)), 'without patterns the records are byte-identical (fail-closed)');
});

// F13 (soundness review round 2): colourKeyText used to clip the WHOLE candidate block by character count,
// not the sentence that actually states the key — so a multi-sentence paragraph could hand the judge
// irrelevant prose ahead of the key sentence, or (past the 220-char clip) drop the key sentence entirely
// when it did not sit near the start. This fixture's `<legend>` opens with an unrelated sentence, THEN
// states the key, THEN adds more unrelated prose — the whole block is well under 220 chars, so this
// specifically isolates the SENTENCE-boundary behavior (not the truncation-length behavior).
const FX_KEY_MULTI_SENTENCE = writeFx('colour-key-multi-sentence.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Fenwick Harbour Booking</title>
<style>.rq label{color:#2f7d32}.op label{color:#20242b}label{display:block}</style></head><body>
  <form>
    <fieldset>
      <legend>Berths are allocated on a first-come basis. Required fields are shown in green; optional fields are charcoal. Submit before the tide window closes.</legend>
      <div class="rq"><label for="fh-boat">Boat name</label><input id="fh-boat"></div>
      <div class="op"><label for="fh-notes">Notes</label><input id="fh-notes"></div>
    </fieldset>
  </form>
</body></html>`);

test('F13: colourKeyText clips to the MATCHED SENTENCE, not the whole multi-sentence candidate block', { skip: !chromeOK, concurrency: false }, async () => {
  const recs = await onPage(FX_KEY_MULTI_SENTENCE, collectFieldColourState, LEX_ARG);
  assert.ok(recs.length >= 2, 'the two-label-colour set passes the gate');
  for (const r of recs) {
    assert.ok(r.colourKeyText, `every member carries the key — got ${JSON.stringify(r)}`);
    assert.equal(r.colourKeyText, 'Required fields are shown in green; optional fields are charcoal.',
      `clipped to exactly the key sentence, not the surrounding prose — got ${JSON.stringify(r.colourKeyText)}`);
    assert.ok(!/first-come basis|tide window/.test(r.colourKeyText), 'the unrelated sentences are excluded');
    assert.equal(r.colourKeySource, 'legend', 'the source is recorded');
  }
});

// F13: source provenance across all three candidate kinds — legend / preceding-sibling[n] / leading-child.
const FX_KEY_PRECEDING_SIBLING = writeFx('colour-key-preceding-sibling.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Marrow Fen Survey</title>
<style>.rq label{color:#2f7d32}.op label{color:#20242b}label{display:block}</style></head><body>
  <p>Welcome to the survey.</p>
  <p>Please read the notes before you begin.</p>
  <p>Required fields are shown in green; optional fields are charcoal.</p>
  <form>
    <div class="rq"><label for="mf-a">Site name</label><input id="mf-a"></div>
    <div class="op"><label for="mf-b">Notes</label><input id="mf-b"></div>
  </form>
</body></html>`);

test('F13: a preceding-sibling candidate records its DISTANCE from the scope (preceding-sibling[n])', { skip: !chromeOK, concurrency: false }, async () => {
  const recs = await onPage(FX_KEY_PRECEDING_SIBLING, collectFieldColourState, LEX_ARG);
  assert.ok(recs.length >= 2, 'the two-label-colour set passes the gate');
  for (const r of recs) {
    assert.equal(r.colourKeyText, 'Required fields are shown in green; optional fields are charcoal.');
    // the key-bearing <p> is the FIRST element immediately before <form> — distance 1 — even though two
    // more distant siblings (also text blocks) sit further back and are scanned too.
    assert.equal(r.colourKeySource, 'preceding-sibling[1]', `got ${r.colourKeySource}`);
  }
});

const FX_KEY_LEADING_CHILD = writeFx('colour-key-leading-child.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Marrow Fen Intake</title>
<style>.rq label{color:#2f7d32}.op label{color:#20242b}label{display:block}</style></head><body>
  <form>
    <p>Please complete every section below.</p>
    <p>Required fields are shown in green; optional fields are charcoal.</p>
    <div class="rq"><label for="mf-c">Site name</label><input id="mf-c"></div>
    <div class="op"><label for="mf-d">Notes</label><input id="mf-d"></div>
  </form>
</body></html>`);

test('F13: a leading-child candidate (inside the scope, before the first field) is sourced as leading-child[n]', { skip: !chromeOK, concurrency: false }, async () => {
  const recs = await onPage(FX_KEY_LEADING_CHILD, collectFieldColourState, LEX_ARG);
  assert.ok(recs.length >= 2, 'the two-label-colour set passes the gate');
  for (const r of recs) {
    assert.equal(r.colourKeyText, 'Required fields are shown in green; optional fields are charcoal.');
    // the key sentence sits in the SECOND leading child (index 1) — the first is unrelated prose.
    assert.equal(r.colourKeySource, 'leading-child[1]', `got ${r.colourKeySource}`);
  }
});

// ── item 32: token-lane instance-predicate narrowing (flag stays OFF — this is code prep) ──────────────
const FX_TOKEN = writeFx('token-lane-narrowing.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Larkstone Aviary Status</title>
<style>.dot{display:inline-block;width:12px;height:12px;border-radius:6px}.ok{background:#2f7d32}.warn{background:#b26a00}.down{background:#8c1d40}
.sw{width:34px;height:18px;border-radius:9px;background:#bbb;border:0;position:relative}.sw .knob{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:7px;background:#fff}
.sw[aria-checked="true"]{background:#2f7d32}</style></head><body>
  <table><tr><td><span class="dot ok"></span> Finch wing</td><td><span class="dot warn"></span> Heron hall</td></tr>
  <tr><td><span class="dot down"></span> Owl annex</td><td><span class="dot ok"></span> Kestrel court</td></tr></table>
  <button class="sw" role="switch" aria-checked="true" aria-label="Feeder A"><span class="knob dot ok"></span></button>
  <button class="sw" role="switch" aria-checked="false" aria-label="Feeder B"><span class="knob dot warn"></span></button>
  <button class="sw" role="switch" aria-checked="false" aria-label="Feeder C"><span class="knob dot down"></span></button>
</body></html>`);

test('item 32: switch chrome never buckets; the labelled status-dot matrix still forms a token group; flag OFF stays byte-identical', { skip: !chromeOK, concurrency: false }, async () => {
  const on = await onPage(FX_TOKEN, collectColourPeers, { tokenLane: true });
  const tokenGroups = on.filter((g) => g.tokenLane === true);
  assert.ok(tokenGroups.length >= 1, 'the status-dot matrix still emits a token group');
  for (const g of tokenGroups) {
    assert.ok(g.members.every((m) => !m.xpath.includes('button')), `no switch-knob chrome in any group, got ${JSON.stringify(g.members.map((m) => m.xpath))}`);
  }
  const off = await onPage(FX_TOKEN, collectColourPeers, { tokenLane: false });
  assert.equal(off.filter((g) => g.tokenLane === true).length, 0, 'flag off ⇒ no token groups at all');
});

test('item 32: background-image tokens differ on the marker axis; single-char content is surfaced as `char`', { skip: !chromeOK, concurrency: false }, async () => {
  const FX_MARK = writeFx('token-marker.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Larkstone Aviary Legend</title>
<style>.pip{display:inline-block;width:12px;height:12px}.a{background:#2f7d32}.b{background:#b26a00}
.c{background:#8c1d40 url('data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==')}</style></head><body>
  <p><span class="pip a"></span> open</p><p><span class="pip b"></span> partial</p><p><span class="pip c"></span> shut</p>
  <p><span class="pip a">✚</span> aided</p>
</body></html>`);
  const groups = await onPage(FX_MARK, collectColourPeers, { tokenLane: true });
  const tg = groups.find((g) => g.tokenLane === true && g.key.includes('.pip'));
  assert.equal(tg, undefined, 'a bg-image member breaks marker uniformity — the group is (correctly) not emitted');
  const FX_CHAR = writeFx('token-char.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Larkstone Aviary Chars</title>
<style>.pip{display:inline-block;width:12px;height:12px}.a{background:#2f7d32}.b{background:#b26a00}.d{background:#20507d}</style></head><body>
  <p><span class="pip a">✚</span> aided</p><p><span class="pip b">✚</span> partial</p><p><span class="pip d">✚</span> night</p>
</body></html>`);
  const chars = await onPage(FX_CHAR, collectColourPeers, { tokenLane: true });
  const cg = chars.find((g) => g.tokenLane === true);
  assert.ok(cg, 'single-char tokens still bucket');
  assert.ok(cg.members.every((m) => m.char === '✚'), `the single character is surfaced as a field, got ${JSON.stringify(cg.members)}`);
});
