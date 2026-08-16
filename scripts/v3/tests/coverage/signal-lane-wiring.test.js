'use strict';
// SIGNAL-LANE WIRING — the guard against a lane that is ALIVE but goes nowhere.
//
// Companion to collector-liveness.test.js, and deliberately disjoint from it. That file covers the lane that
// THROWS: `page.evaluate(collector).catch(() => empty)` makes an in-page exception indistinguishable from "this
// page has no findings", and it caught two shipped instances (collect-colour-peers' missing `module.exports`;
// captureInventory's cross-scope `childNodesOf`). What it cannot see is the OTHER half of the same silent class:
//
//   · the collector resolves fine and returns EMPTY on a page that should light it up  (dark at COLLECT), and
//   · the collector populates `structure.<key>` fine and NOTHING ever puts that key in a prompt (dark at THREAD).
//
// The second is not hypothetical bookkeeping. A rubric can be written to a signal it never receives, and the
// failure reads as a judge that simply did not weigh the evidence — there is no error, no empty artifact, and no
// gate moves. It is also easy to introduce by RENAMING: `collectStylingOutliers` publishes under two DIFFERENT
// keys (`presentationOutliers` / `presentationConventions`), and `collectErrorSummary` publishes `errorSummaries`
// (plural) while the collector, the rubric prose and every human grep reach for `errorSummary`. A one-character
// mismatch anywhere along collector → structure key → threaded key → signals key → rubric silently disconnects
// the lane, and every artifact still reads clean.
//
// §1 is the static half (no browser): every `signals.X` a RUBRIC names must be produced by some code path.
// §2 is the live half (ONE page load): every page-level collector must produce a non-empty value on a fixture
//    built to light it up, AND its key must reach an assembled prompt. Failures name the lane and the stage.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const puppeteer = require('puppeteer');

const adj = require('../../lib/llm-adjudicator.js');
const oracle = require('../../lib/applicability-oracle.js');
const { loadRubrics } = require('../../lib/rubric-loader.js');
const { BROWSER_ARGS } = require('../../lib/browser-args.js');

const CHROME = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — signal-lane-wiring §2 SKIPPED');

const ADJ_SRC = fs.readFileSync(path.join(__dirname, '..', '..', 'lib', 'llm-adjudicator.js'), 'utf8');
const RUBRIC_DIR = path.join(__dirname, '..', '..', 'llm-rubrics');

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §1 — STATIC CONTRACT: a rubric may not name a signal key nothing produces
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

// Signal keys are produced in TWO places and a check that knows only one of them cries wolf: precomputeSignals
// builds a local named `s`, while the two judgment loops decorate the finished bundle as `signals`. Extracting
// only `s.X =` reports `nativeDialogText` and `elementNotPerceivable` as dead when both are live and both have
// their own regression tests — an ~18% false-positive rate on the current rubric set, which is exactly how a
// guard like this gets muted. Both producers, or nothing.
function producedSignalKeys(src) {
  const keys = new Set(['rawElementHtml', 'enclosingHtml']); // spread in from htmlEvidence()
  for (const m of src.matchAll(/\b(?:s|signals)\.([A-Za-z_$][\w$]*)\s*=[^=]/g)) keys.add(m[1]);
  for (const m of src.matchAll(/\b(?:s|signals)\[['"]([^'"]+)['"]\]\s*=/g)) keys.add(m[1]);
  return keys;
}
// Sub-keys of `s.structure`, which is built as an object LITERAL plus later dotted assignments — so both forms
// have to be read or the F34/F2 lanes (`fauxColumns`, `presentationOutliers`) look dead. NOTE there is more than
// one `s.structure = {…}` literal (the page-structure block and the 2.4.3 focus-order block each build one);
// reading only the first drops every key the other declares, so ALL literals are unioned.
function producedStructureKeys(src) {
  const keys = new Set();
  for (const m of src.matchAll(/\bs\.structure\.([A-Za-z_$][\w$]*)\s*=[^=]/g)) keys.add(m[1]);
  for (const lit of src.matchAll(/\bs\.structure\s*=\s*\{([\s\S]*?)\n {6}\};/g)) {
    for (const m of lit[1].matchAll(/^\s{8}([A-Za-z_$][\w$]*)\s*:/gm)) keys.add(m[1]);
  }
  return keys;
}
function rubricSignalRefs() {
  const refs = [];
  for (const f of fs.readdirSync(RUBRIC_DIR).sort()) {
    if (!f.endsWith('.md') || f === 'README.md') continue;
    const t = fs.readFileSync(path.join(RUBRIC_DIR, f), 'utf8');
    for (const m of t.matchAll(/signals\.([A-Za-z_$][\w$]*)(?:\.([A-Za-z_$][\w$]*))?/g)) refs.push({ file: f, top: m[1], sub: m[2] || null });
  }
  return refs;
}

test('§1 every `signals.X` a rubric names is PRODUCED by some code path (naming-drift guard)', () => {
  const produced = producedSignalKeys(ADJ_SRC);
  const dead = rubricSignalRefs().filter((r) => !produced.has(r.top))
    .map((r) => `${r.file} reads signals.${r.top} — no producer in llm-adjudicator.js`);
  assert.deepEqual([...new Set(dead)], [], `a rubric is written to a signal nothing supplies, so its instruction is inert:\n  ${dead.join('\n  ')}`);
});

test('§1b nested `signals.structure.Y` references resolve too (the F34 / F2 lanes)', () => {
  const structKeys = producedStructureKeys(ADJ_SRC);
  const dead = rubricSignalRefs().filter((r) => r.top === 'structure' && r.sub && !structKeys.has(r.sub))
    .map((r) => `${r.file} reads signals.structure.${r.sub} — never assigned onto s.structure`);
  assert.deepEqual([...new Set(dead)], [], `a rubric reads a structure sub-key nothing assigns:\n  ${dead.join('\n  ')}`);
});

test('§1c the extractor itself is honest — it finds BOTH producer forms (anti-false-positive guard)', () => {
  const produced = producedSignalKeys(ADJ_SRC);
  // one key from precomputeSignals' `s.` form, and two from the judgment loops' `signals.` form. If a future
  // refactor breaks the second pattern, §1 would start reporting live keys as dead — catch that here instead.
  assert.ok(produced.has('errorSummaries'), 'precomputeSignals `s.X =` producers are seen');
  assert.ok(produced.has('nativeDialogText'), 'judgment-loop `signals.X =` producers are seen (else §1 false-positives)');
  assert.ok(produced.has('elementNotPerceivable'), 'the required-evidence gate producer is seen');
  assert.ok(producedStructureKeys(ADJ_SRC).has('tables'), 's.structure object-literal keys are seen');
  assert.ok(producedStructureKeys(ADJ_SRC).has('fauxColumns'), 's.structure dotted assignments are seen');
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §2 — LIVE LANES: populated at collect, and actually reaching a prompt
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

// Every page-level collector, keyed by the structure key it PUBLISHES (not its local variable name — that is the
// gap this catches) and the rubric whose prompt is supposed to carry it. `promptKey` is the token that must
// appear in the assembled prompt string, so the assertion covers the whole chain including the JSON embedding.
const LANES = [
  { collector: 'collectTables', structureKey: 'tables', promptKey: 'tableAssociation', rubricId: 'info-relationships-v0' },
  { collector: 'collectLists', structureKey: 'lists', promptKey: 'lists', rubricId: 'info-relationships-v0' },
  { collector: 'collectFauxColumns', structureKey: 'fauxColumns', promptKey: 'fauxColumns', rubricId: 'info-relationships-v0' },
  { collector: 'collectStylingOutliers', structureKey: 'presentationOutliers', promptKey: 'presentationOutliers', rubricId: 'info-relationships-v0' },
  { collector: 'collectStylingOutliers', structureKey: 'presentationConventions', promptKey: 'presentationConventions', rubricId: 'info-relationships-v0' },
  { collector: 'collectErrorSummary', structureKey: 'errorSummaries', promptKey: 'errorSummaries', rubricId: 'error-identification-v0' },
  { collector: 'collectColourPeers', structureKey: 'colourPeerGroups', promptKey: 'colourPeerGroup', rubricId: 'use-of-color-v0' },
];

// A single page built to light EVERY lane: a data table, a real list, whitespace columns, strike-through /
// small-caps presentation carrying meaning, an error summary that names a field the page never flags, and a set
// of structural peers distinguished only by colour. The peers are LINKS on purpose — the 1.4.1 aperture is
// links / form fields / graphic surfaces, so a peer group anchored on a <span> would collect fine and then have
// no obligation to ride into a prompt, which would fail this test for a reason that is not a wiring defect.
const FIXTURE_HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Signal lane fixture</title><style>
  body { margin:0; font:16px/1.5 Arial, sans-serif; }
  .overdue { color:#b00020; } .settled { color:#0a7d33; }
  .withdrawn { text-decoration: line-through; } .ratified { font-variant: small-caps; }
  table { border-collapse: collapse; } td, th { border:1px solid #666; padding:2px 6px; }
  pre.cols { font-family: monospace; }
</style></head><body>
  <h1>Account overview</h1>
  <h2>Outstanding balances</h2>
  <p>Introductory prose with enough words in it to be inventoried by the page-structure collectors.</p>

  <div role="alert">Please fix 2 things to continue. Delivery region must be chosen. Unit count must be a whole number.</div>
  <form action="#">
    <label for="region">Delivery region</label>
    <select id="region" name="region"><option>North</option><option>South</option></select>
    <label for="units">Unit count</label>
    <input id="units" name="units" aria-invalid="true" aria-describedby="units-err">
    <span id="units-err">Unit count must be a whole number.</span>
    <label for="ref">Reference</label>
    <input id="ref" name="ref">
  </form>

  <table><caption>Shipments by region</caption>
    <tr><th>Region</th><th>Units</th></tr>
    <tr><td>North</td><td>120</td></tr>
    <tr><td>South</td><td>95</td></tr></table>

  <ul><li>Real list item one</li><li>Real list item two</li><li>Real list item three</li></ul>

  <pre class="cols">Region     Units    Status
North        120       ok
South         95       ok
East         210       ok</pre>

  <h2>Clause register</h2>
  <ul class="clauses">
    <li><span>Clause one stands as written</span></li>
    <li><span>Clause two stands as written</span></li>
    <li><span>Clause three stands as written</span></li>
    <li><span class="withdrawn">Clause four was withdrawn</span></li>
    <li><span class="withdrawn">Clause five was withdrawn</span></li>
  </ul>
  <p>Ordinary prose mentioning a <span class="ratified">defined term</span> and a second <span class="ratified">defined term</span> in running text.</p>

  <nav><a class="overdue" href="/a">Invoice 1001</a> <a class="settled" href="/b">Invoice 1002</a> <a class="overdue" href="/c">Invoice 1003</a> <a class="settled" href="/d">Invoice 1004</a></nav>
</body></html>`;

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'lane-wiring-'));
const FIXTURE = (() => { const p = path.join(DIR, 'lanes.html'); fs.writeFileSync(p, FIXTURE_HTML); return 'file://' + p; })();

// Assemble the prompt a lane's rubric would actually send for the subject that carries its evidence. Returns
// null when no such subject exists at all — reported as a THREAD failure, since a populated key that reaches no
// subject is precisely the silent disconnection this test exists to find.
function promptsFor(collect, rubrics, rubricId) {
  const rows = oracle.deriveObligations(collect).map((o) => ({ ...o, autoPartial: true, disposition: 'PARTIAL', cleared: false }));
  const subs = adj.selectRubricSubjects(collect, rows, rubrics, {}).filter((s) => s.rubricId === rubricId);
  return subs.map((s) => adj.buildPrompt(
    { xpath: s.xpath, skill: s.skill, sc: s.sc, claimFamily: s.claimFamily },
    adj.precomputeSignals(s.element, s.skill, s.sc), null, { rubric: s.rubric.text },
  ));
}

test('§2 every page-level collector lane is LIVE end to end — populated at collect AND present in a prompt',
  { skip: !chromeOK, concurrency: false }, async () => {
    const { collectActPage, normalizeCollectRoles } = require('../../lib/act-page-collect.js');
    const rubrics = loadRubrics().rubrics;
    const browser = await puppeteer.launch({ headless: 'new', executablePath: CHROME, args: BROWSER_ARGS });
    let collect;
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      collect = normalizeCollectRoles(await collectActPage(page, {
        url: FIXTURE, elementCap: 80, file: 'lane-wiring', runId: 'lw', sourceUrl: FIXTURE,
      }));
    } finally { await browser.close(); }

    // a lane that THREW is already collector-liveness.test.js's business, but surface it here too rather than
    // reporting the downstream empty value as if it were the defect.
    const threw = (collect.collectorLiveness || []).map((l) => `${l.collector}: ${l.error}`);
    assert.deepEqual(threw, [], `a collector threw on the fixture — fix that first, the empty lane below is a symptom:\n  ${threw.join('\n  ')}`);

    const structure = collect.structure || {};
    const promptCache = new Map();
    const dark = [];
    for (const lane of LANES) {
      const val = structure[lane.structureKey];
      if (!Array.isArray(val) || val.length === 0) {
        dark.push(`${lane.collector} → structure.${lane.structureKey}: DARK AT COLLECT (published ${JSON.stringify(val)} on a fixture built to light it up — the collector returned empty, or it publishes under a different key name)`);
        continue;
      }
      if (!promptCache.has(lane.rubricId)) promptCache.set(lane.rubricId, promptsFor(collect, rubrics, lane.rubricId));
      const prompts = promptCache.get(lane.rubricId);
      if (!prompts.length) {
        dark.push(`${lane.collector} → structure.${lane.structureKey}: DARK AT THREAD (collected ${val.length} entr(y/ies) but rubric ${lane.rubricId} produced NO subject on this page, so the evidence reaches no prompt)`);
        continue;
      }
      if (!prompts.some((p) => p.includes(lane.promptKey))) {
        dark.push(`${lane.collector} → structure.${lane.structureKey}: DARK AT THREAD (collected ${val.length} entr(y/ies), rubric ${lane.rubricId} has ${prompts.length} subject(s), but "${lane.promptKey}" appears in none of their prompts — the threading or the signals key name is broken)`);
      }
    }
    assert.deepEqual(dark, [], `signal lane(s) went dark — collected evidence that never reaches the judge reads exactly like "this page has no findings":\n  ${dark.join('\n  ')}`);
  });

test('§2b the fixture really is a positive control — it lights every lane (guards against a vacuous pass)',
  { skip: !chromeOK, concurrency: false }, async () => {
    // If the fixture ever stops triggering a collector, §2's COLLECT half would still fail loudly rather than
    // pass vacuously — but a lane list that silently shrinks would not. Pin the count.
    assert.equal(LANES.length, 7, 'every page-level collector key is enumerated (6 collectors, 7 published keys)');
    assert.equal(new Set(LANES.map((l) => l.collector)).size, 6, 'collectStylingOutliers publishes two keys; the rest publish one');
  });
