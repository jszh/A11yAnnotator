// COLLECTOR LIVENESS — the guard against a lane that is DEAD but reads clean.
//
// Every optional collector in the pipeline is called as `page.evaluate(<collector>).catch(() => <empty>)`.
// That guard is correct (a genuinely broken page must never crash a run) but it makes an in-page THROW
// indistinguishable from "this page has no findings". The class has shipped twice in this campaign from two
// independent causes:
//   · collect-colour-peers.js lost its `module.exports` — the entire 1.4.1 peer lane was dead (196c4f19 →
//     f4fcce9b);
//   · captureInventory referenced `childNodesOf`, a helper declared inside a DIFFERENT serialized function,
//     so every call threw a ReferenceError IN THE PAGE and F102/G224 detection was silently disabled.
// In both cases every artifact still read as a clean, empty result and the ACT gate stayed byte-identical.
//
// §1 is the test that catches that class DIRECTLY: it evaluates each guarded collector in a real browser on a
// fixture rich enough to reach its hot loop, and requires it to RESOLVE. A static self-containment check cannot
// do this — a cross-scope reference is only a ReferenceError at evaluation time, and `.toString()` inspection
// would not have flagged it. §1 fails on the captureInventory bug with "childNodesOf is not defined".
// §2 proves the reporting half: when a collector really does throw, the empty fallback still flows AND the
// failure is recorded. §3 proves the record survives into the published run artifacts.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const puppeteer = require('puppeteer');

const { collectTables } = require('../../lib/collect-tables.js');
const { collectLists } = require('../../lib/collect-lists.js');
const { collectColourPeers, collectFieldColourState, collectTextContrastFacts } = require('../../lib/collect-colour-peers.js');
const { collectFauxColumns } = require('../../lib/collect-faux-columns.js');
const { collectErrorSummary, collectAtRestErrorState } = require('../../lib/collect-error-summary.js');
const { collectLinkTargetFacts } = require('../../lib/collect-link-facts.js');
const { collectControlGroups, collectStructuralMarkupFacts } = require('../../lib/act-page-collect.js');
const { collectStylingOutliers } = require('../../lib/collect-styling-outliers.js');
const { collectMotion } = require('../../lib/broad-scope-probes.js');
const { captureInventory, measureReflow320, runReflow } = require('../../lib/reflow-runner.js');
const { measureReflow } = require('../../lib/exp-runners.js');
const { BROWSER_ARGS } = require('../../lib/browser-args.js');
const { buildV3 } = require('../../lib/build-v3.js');
const { withPipeline, promoted } = require('../helpers.js');

const CHROME = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — collector-liveness browser tests SKIPPED');

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'liveness-fx-'));
const writeFx = (name, html) => { const p = path.join(DIR, name); fs.writeFileSync(p, html); return 'file://' + path.join(DIR, name); };

// Rich enough that every collector reaches its real work rather than returning early: a data table, a real list,
// a faux bulleted list, colour-differentiated peers, an error summary + flagged fields, strike-through/small-caps
// presentation outliers, whitespace columns, an infinite animation with a pause control, an overflow-x scroller
// holding an unbreakable token, and plenty of text-bearing leaves.
const FIXTURE = writeFx('liveness-page.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Liveness fixture</title><style>
  body { margin:0; font:16px/1.5 Arial, sans-serif; }
  @keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
  .spinner { width:40px; height:40px; background:#333; animation: spin 2s linear infinite; }
  .err { color:#c00; } .ok { color:#080; }
  .strike { text-decoration: line-through; } .caps { font-variant: small-caps; }
  .scroller { overflow-x:auto; width:120px; }
  pre.cols { font-family: monospace; }
  #t1 td, #t1 th { border:1px solid #666; }
</style></head><body>
  <h1>Quarterly report</h1>
  <p>Introductory prose long enough to be inventoried by the reflow capture.</p>
  <div role="alert" class="err">There are 2 problems with your submission: Email, Postcode.</div>
  <form action="#">
    <label for="email" class="err">Email</label><input id="email" name="email" aria-invalid="true">
    <label for="pc" class="ok">Postcode</label><input id="pc" name="pc">
    <label for="kids">Number of children</label><input id="kids" name="children" type="number">
  </form>
  <table id="t1"><caption>Shipments</caption><tr><th>Region</th><th>Units</th></tr>
    <tr><td>North</td><td>120</td></tr><tr><td>South</td><td>95</td></tr></table>
  <ul><li>Real list item one</li><li>Real list item two</li><li>Real list item three</li></ul>
  <div><p>&bull; Faux item alpha</p><p>&bull; Faux item beta</p><p>&bull; Faux item gamma</p></div>
  <p><span class="err">Overdue account</span> <span class="ok">Current account</span> <span class="err">Overdue again</span></p>
  <p><span class="strike">Withdrawn clause</span> and <span class="caps">Ratified clause</span> and plain text here.</p>
  <pre class="cols">Region     Units    Status
North        120       ok
South         95       ok</pre>
  <div class="spinner"></div>
  <button type="button">Pause animation</button>
  <div class="scroller">ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnop</div>
  <nav><a href="#appendix">Appendix</a> <a href="files/summary.pdf">Summary</a> <a href="#missing-anchor">Errata</a></nav>
  <section id="appendix"><h2>Appendix</h2><p>Supplementary figures.</p></section>
</body></html>`);

async function withBrowser(fn) {
  const browser = await puppeteer.launch({ headless: 'new', executablePath: CHROME, args: BROWSER_ARGS });
  try { return await fn(browser); } finally { await browser.close(); }
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §1 — the direct catcher
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const GUARDED_COLLECTORS = [
  // act-page-collect.js — every `liveEval`-guarded evaluate
  ['collectTables', collectTables],
  ['collectLists', collectLists],
  ['collectColourPeers', collectColourPeers],
  ['collectFieldColourState', collectFieldColourState],
  ['collectTextContrastFacts', collectTextContrastFacts],
  ['collectFauxColumns', collectFauxColumns],
  ['collectErrorSummary', collectErrorSummary],
  ['collectAtRestErrorState', collectAtRestErrorState],
  ['collectLinkTargetFacts', collectLinkTargetFacts],
  ['collectControlGroups', collectControlGroups],
  ['collectStructuralMarkupFacts', collectStructuralMarkupFacts],
  ['collectStylingOutliers', collectStylingOutliers],
  // broad-scope-probes.js — collectMotion (two guarded call sites)
  ['collectMotion', collectMotion],
  // reflow-runner.js — captureInventory (two guarded call sites) + measureReflow320
  ['captureInventory', captureInventory],
  ['measureReflow320', measureReflow320],
  // exp-runners.js — measureReflow
  ['measureReflow', measureReflow],
];

test('§1 every `.catch()`-guarded collector EVALUATES without throwing in a real page (the captureInventory catcher)',
  { skip: !chromeOK, concurrency: false }, async () => {
    const failures = await withBrowser(async (browser) => {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      await page.goto(FIXTURE, { waitUntil: 'load' });
      const out = [];
      for (const [name, fn] of GUARDED_COLLECTORS) {
        // No .catch() here ON PURPOSE — in production the throw is swallowed, which is the entire problem.
        try { await page.evaluate(fn); } catch (e) { out.push(`${name}: ${(e && e.message) || e}`); }
      }
      return out;
    });
    assert.deepEqual(failures, [], `a guarded collector threw in-page — in production this is swallowed into an empty result and the lane goes silently dead:\n  ${failures.join('\n  ')}`);
  });

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §2 — a real in-page throw is REPORTED, and the fallback value is unchanged
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

test('§2 when a collector really throws, the empty fallback still flows AND the failure is recorded',
  { skip: !chromeOK, concurrency: false }, async () => {
    // A genuine runtime failure inside the real captureInventory / measureReflow320: `document.styleSheets` is
    // read unconditionally by captureInventory, so a throwing accessor reproduces the exact production shape —
    // an in-page exception raised while the collector runs, not a stubbed promise rejection.
    const res = await withBrowser(async (browser) => {
      const page = await browser.newPage();
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(document, 'styleSheets', { configurable: true, get() { throw new Error('forced collector failure'); } });
        Object.defineProperty(document, 'scrollingElement', { configurable: true, get() { throw new Error('forced collector failure'); } });
      });
      return runReflow(page, { url: FIXTURE });
    });

    // FALLBACK VALUE UNCHANGED — the run must not crash and the empty result still flows through.
    assert.ok(res && typeof res === 'object', 'runReflow still returned a result');
    assert.equal(res.measure, null, 'the measurement fell back to null exactly as before');
    assert.equal(res.sc, '1.4.10');

    // ...but the failure is now OBSERVABLE instead of looking like "this page has nothing".
    assert.ok(Array.isArray(res.liveness), 'runReflow reports a liveness channel');
    const names = res.liveness.map((l) => l.collector).sort();
    assert.ok(names.includes('captureInventory@1280') && names.includes('captureInventory@320'),
      `both inventory captures are reported as FALLBACKS, not measurements: ${JSON.stringify(res.liveness)}`);
    assert.ok(names.includes('measureReflow320'), `the 320px measurement is reported too: ${names}`);
    for (const l of res.liveness) {
      assert.match(l.error, /forced collector failure/, 'the error MESSAGE is carried (that is what identifies the defect)');
    }
  });

test('§2b a HEALTHY page reports an empty liveness channel (the signal is not always-on noise)',
  { skip: !chromeOK, concurrency: false }, async () => {
    const res = await withBrowser(async (browser) => runReflow(await browser.newPage(), { url: FIXTURE }));
    assert.deepEqual(res.liveness, [], 'no collector threw, so nothing is reported');
    assert.ok(res.measure && typeof res.measure === 'object', 'and the measurement is real, not a fallback');
  });

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §3 — the record survives into the published run artifacts
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const PROMOTED = promoted([]);
const ID = { file: 'p', runId: 'R', pageDigest: 'sha256:d' };
const bundleWith = (collectExtra) => withPipeline({
  collect: { ...ID, collectedAt: 1000, elements: [{ xpath: '/html/body/img[1]', tag: 'img', isImage: true, alt: 'x' }], ...collectExtra },
  experiments: { ...ID, catalogVersion: '3.0.0-phase0', startedAt: 2000, results: [] },
  claimProposals: { ...ID, proposals: [] },
});

test('§3 a collector failure recorded on the collect artifact reaches results + summary (so a dead lane is visible in a saved run)', () => {
  const r = buildV3(bundleWith({ collectorLiveness: [
    { collector: 'collectColourPeers', error: 'collectColourPeers is not defined' },
    { collector: 'collectLists', error: 'p.children is not iterable' },
  ] }), { authority: PROMOTED });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.results.collectorLiveness.length, 2, 'the full record is published, not just a count');
  assert.equal(r.results.summary.collectorFailures, 2, 'the summary carries the per-page count the run harnesses persist');
  assert.deepEqual({ ...r.results.summary.collectorFailuresByCollector },
    { collectColourPeers: 1, collectLists: 1 }, 'and names the collector, so "collector X threw on N pages" is answerable from raw.json alone');
});

test('§3b a healthy page publishes an empty record and a zero count', () => {
  const r = buildV3(bundleWith({}), { authority: PROMOTED });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.deepEqual(r.results.collectorLiveness, []);
  assert.equal(r.results.summary.collectorFailures, 0);
});
