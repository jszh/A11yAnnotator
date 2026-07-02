// Generalization + adversarial guards for the 1.4.10 reflow de-overfit fixes:
//   #1  — the 2-D exemption over-cleared: is2D() treated an element as 2-D because its SUBTREE contained
//         pre/code/th/toolbar/svg, so one inline <code>x=1</code> or a lone <th> blanket-exempted every
//         horizontally-overflowing SIBLING; and a TABLE/grid ancestor's exemption swallowed pinned content
//         inside individual cells. Understanding 1.4.10: the exception "applies only to that section";
//         Note 2 exempts "data tables (not individual cells)".
//   #12 — the F102 'revealable' equivalent-path hard-coded ENGLISH phrases ("read more/show more/view
//         full …"), deterministically CLEARING on an offsite "read our full story" link (unconfirmable)
//         while giving a non-English reveal ("Mehr anzeigen"/"Weiterlesen") no structural credit.
// Every fixture is SYNTHETIC (data: URL) — the point is to prove the CONDITIONS match the RULE, not the
// corpus pages the findings were derived from. Each fix is paired with an OVER-FIRE guard (variant that
// must NOT trip) and a RECALL case (variant that must trip). The motivating capability-corpus cases are
// re-run at the end as regression guards (expected outcomes come from their hand-written labels.json).
'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');
const { CHROME } = require('../../lib/run-experiments.js');
const { runReflow } = require('../../lib/reflow-runner.js');
const { measureReflow } = require('../../lib/exp-runners.js');

const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — overfit-reflow-generalization suite SKIPPED');

let browser, page;
before(async () => {
  if (!chromeOK) return;
  browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  page = await browser.newPage();
});
after(async () => { if (browser) await browser.close(); });

const dataUrl = (html) => 'data:text/html,' + encodeURIComponent('<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>' + html + '</body></html>');
const reflow = (html) => runReflow(page, { url: dataUrl(html) });
// the parallel BARRIER-ONLY probe in exp-runners.js (same finding-#1 cell-granularity fix)
async function expProbe(html) {
  await page.setViewport({ width: 320, height: 256, deviceScaleFactor: 1 });
  await page.goto(dataUrl(html), { waitUntil: 'load' });
  return page.evaluate(measureReflow);
}

// ─────────────────────────── #1 — descendant pre/code must not exempt siblings ───────────────────────────

test('#1 OVER-FIRE-A: an inline <code> sibling must NOT 2-D-exempt a nowrap paragraph overflowing past 320', { skip: !chromeOK }, async () => {
  // Before the fix: is2D(body) was true because the subtree CONTAINED <code>foo</code>, so the ancestor
  // walk exempted the overflowing nowrap prose → verdict 'pass'/'2d-exempt'. The inline token carries no
  // 2-D layout meaning; the pinned prose is a plain document-overflow barrier.
  const d = await reflow(
    '<p>Install with <code>foo</code> to get started with the tool.</p>' +
    '<p style="white-space:nowrap"><span>This long sentence is forced onto a single non wrapping line so it runs far past the narrow viewport edge.</span></p>');
  assert.equal(d.decided, true);
  assert.equal(d.verdict, 'fail', 'nowrap prose overflow must FAIL — a sibling inline <code> is not a 2-D section');
  assert.equal(d.kind, 'document-overflow');
});

test('#1 RECALL-A: genuine multi-line ASCII-art <pre> overflow stays 2d-exempt via the SELF check', { skip: !chromeOK }, async () => {
  // The tightened pre/code check (computed white-space:pre* AND multi-line layout-bearing content) must
  // keep exempting real preformatted 2-D content — the intended use of the exception.
  const d = await reflow(
    '<p>The diagram below shows the pipeline; this paragraph wraps normally at any width.</p>' +
    '<pre><code>+--------+     +--------+     +---------+\n| ingest | --> | verify | --> | publish |\n+--------+     +--------+     +---------+</code></pre>');
  assert.equal(d.verdict, 'pass', 'multi-line ASCII art in <pre> is a legitimate 2-D section');
  assert.equal(d.kind, '2d-exempt');
});

// ─────────────────────────── #1 — table exemption stops at the cell boundary ───────────────────────────

const CELL_PIN_TABLE =
  '<table><tr><th scope="col">Item</th><th scope="col">Description</th></tr>' +
  '<tr><td>Clause 4</td><td><span style="white-space:nowrap;display:inline-block;width:300px">Reimburses reasonable documented expenses within thirty days</span></td></tr></table>';
const WIDE_DATA_TABLE =
  '<table style="min-width:640px;border-collapse:collapse">' +
  '<tr><th scope="col">Time</th><th scope="col">Platform</th><th scope="col">Destination</th><th scope="col">Stops</th></tr>' +
  '<tr><td>08:02</td><td>4</td><td>Riverside</td><td>All</td></tr>' +
  '<tr><td>08:17</td><td>2</td><td>Hilltop</td><td>Express</td></tr></table>';

test('#1 OVER-FIRE-B: nowrap prose pinned inside ONE <td> must FAIL — "data tables (not individual cells)"', { skip: !chromeOK }, async () => {
  // A legitimate data table (th present) whose hscroll is forced by a single cell's nowrap text: the
  // grid exemption must not inherit down to cell-intrinsic overflow (Understanding 1.4.10: "each cell
  // within a table would still need to meet this success criterion").
  const d = await reflow(CELL_PIN_TABLE);
  assert.equal(d.decided, true);
  assert.equal(d.verdict, 'fail', 'cell-intrinsic nowrap overflow is the CELL\'s defect, not the grid\'s 2-D need');
  assert.equal(d.kind, 'document-overflow');
});

test('#1 RECALL-B: a plain wide data table whose COLUMNS exceed 320 (cells wrap) stays 2d-exempt', { skip: !chromeOK }, async () => {
  // Mirrors capability two-d case-12 (legit-data-table-scoped, expected passed): the overflow is the
  // grid ensemble itself — no pinned cell content — so the ancestor walk must keep the exemption.
  const d = await reflow(WIDE_DATA_TABLE);
  assert.equal(d.verdict, 'pass', 'a wide multi-column data table is Note 2\'s exempted case');
  assert.equal(d.kind, '2d-exempt');
});

test('#1 exp-runners.js parallel probe: same cell granularity (OVER-FIRE-B barrier, RECALL-B exempt)', { skip: !chromeOK }, async () => {
  const bad = await expProbe(CELL_PIN_TABLE);
  assert.equal(bad.overflowBarrierObserved, true, 'exp-runners must observe the pinned-cell barrier');
  assert.equal(bad.allOverflowExemptOr2D, false);
  const good = await expProbe(WIDE_DATA_TABLE);
  assert.equal(good.overflowBarrierObserved, false, 'exp-runners must keep the whole-grid exemption');
  assert.equal(good.allOverflowExemptOr2D, true);
  assert.equal(good.dataTableExemptionApplied, true);
});

// ─────────────────────────── #1 — scroller lane: 2-D justification is the WIDE content itself ───────────────────────────

test('#1 scroller OVER-FIRE: a carousel stranding prose panels is NOT justified by an inline <code> token', { skip: !chromeOK }, async () => {
  // Same descendant-blanket bug in the G225 lane: is2D(scroller) used to be true because a panel
  // CONTAINED <code>init</code>. The stranded panels are flowable prose with no keyboard/nav reach.
  const d = await reflow(
    '<div style="overflow-x:auto;display:flex;gap:12px">' +
    '<section style="flex:0 0 280px">First panel of plain prose that wraps fine on its own. Run <code>init</code> to start.</section>' +
    '<section style="flex:0 0 280px">Second panel of flowable prose stranded off-screen.</section>' +
    '<section style="flex:0 0 280px">Third panel of flowable prose stranded further.</section></div>');
  assert.equal(d.verdict, 'fail', 'stranded flowable panels must stay a G225 barrier');
  assert.equal(d.kind, 'g225-stranded-scroller');
});

test('#1 scroller RECALL: a bounded scroller whose WIDE content IS a data table stays exempt', { skip: !chromeOK }, async () => {
  // The scoped justification: the 2-D artifact (table wider than the scroller box) is exactly the
  // section being scrolled — the intended bounded-scroll affordance, even with no tabindex.
  const d = await reflow('<div style="overflow-x:auto">' + WIDE_DATA_TABLE + '</div>');
  assert.equal(d.verdict, 'pass', 'scrolling a genuine wide data table is the legit exception');
  assert.equal(d.kind, '2d-exempt');
});

// ─────────────────────────── #12 — F102 equivalent path: structural, not English ───────────────────────────

test('#12 OVER-FIRE: a non-English reveal (button[aria-controls] "Mehr anzeigen") must NOT hard-barrier', { skip: !chromeOK }, async () => {
  // Language-independent structural binding: the button aria-controls the hidden node, so the
  // disappearance has a confirmable reveal path → the runner clears deterministically ('reflows').
  // (Anything but a hard kind:'f102-disappearance' barrier would satisfy the design — an abstain
  // routes to the rubric — but the aria-controls disjunct decides this one.)
  const d = await reflow(
    '<style>.mehr{display:none}@media(max-width:520px){#volltext{display:none}.mehr{display:inline}}</style>' +
    '<p>Zusammenfassung der Richtlinie. <span id="volltext">Der vollstaendige Rechtstext wird hier in mehreren Saetzen fortgesetzt.</span> ' +
    '<button class="mehr" aria-controls="volltext" aria-expanded="false">Mehr anzeigen</button></p>');
  assert.equal(d.verdict, 'pass', 'aria-controls-bound reveal suppresses F102 regardless of language');
  assert.equal(d.kind, 'reflows');
});

test('#12 RECALL: an unrelated OFFSITE "Read our full story" link must NOT deterministically clear F102', { skip: !chromeOK }, async () => {
  // The old English-phrase regex matched "full story" and suppressed the disappearance outright. An
  // offsite href proves nothing about equivalence — the runner must FAIL with kind 'f102-disappearance'
  // so reflow-checklist routes it to the equivalent-content-on-reflow LLM skeptic (abstain-to-rubric).
  const d = await reflow(
    '<style>@media(max-width:520px){.deep{display:none}}</style>' +
    '<p>Board statement summary. <span class="deep">The complete minority-shareholder dissent appears here in several sentences.</span> ' +
    '<a href="https://example.org/press/other-story">Read our full story</a></p>');
  assert.equal(d.decided, true);
  assert.equal(d.verdict, 'fail', 'an unconfirmable same-scope link must not suppress the disappearance');
  assert.equal(d.kind, 'f102-disappearance');
});

test('#12 structural recall: a #fragment link ("Weiterlesen") whose :target rule reveals the hidden node suppresses F102', { skip: !chromeOK }, async () => {
  // The replacement signal is confirmable structure, not phrasing: a same-scope a[href="#volltext"] resolving
  // to the truncated node (or an ancestor) — in any language — AND a stylesheet :target rule that actually
  // un-hides it. Fragment navigation alone cannot reveal display:none content (audit review defect 2).
  const d = await reflow(
    '<style>.mehr{display:none}@media(max-width:520px){#volltext{display:none}.mehr{display:inline}}#volltext:target{display:inline}</style>' +
    '<p>Zusammenfassung der Richtlinie. <span id="volltext">Der vollstaendige Rechtstext wird hier in mehreren Saetzen fortgesetzt.</span> ' +
    '<a class="mehr" href="#volltext">Weiterlesen</a></p>');
  assert.equal(d.verdict, 'pass', 'a fragment link + a matching :target reveal rule is a working structural reveal path');
  assert.equal(d.kind, 'reflows');
});

test('#12 OVER-FIRE guard: a #fragment link with NO :target reveal rule cannot reveal — F102 fires (routes to the skeptic)', { skip: !chromeOK }, async () => {
  // Identical markup, no :target rule: navigating the fragment leaves #volltext display:none at 320px — a
  // functionally NON-conforming page. The pre-review version of this fix credited the bare fragment link
  // (an unsanctioned deterministic CLEAR the adversarial diff review caught); the runner must FAIL with
  // kind 'f102-disappearance' so reflow-checklist routes it to the equivalent-content-on-reflow skeptic.
  const d = await reflow(
    '<style>.mehr{display:none}@media(max-width:520px){#volltext{display:none}.mehr{display:inline}}</style>' +
    '<p>Zusammenfassung der Richtlinie. <span id="volltext">Der vollstaendige Rechtstext wird hier in mehreren Saetzen fortgesetzt.</span> ' +
    '<a class="mehr" href="#volltext">Weiterlesen</a></p>');
  assert.equal(d.verdict, 'fail', 'a fragment link that cannot un-hide its target is no reveal path');
  assert.equal(d.kind, 'f102-disappearance');
});

// ─────────────────────────── capability-corpus regression guards (hand-labelled expectations) ───────────────────────────

const CAP = path.resolve(__dirname, '../../../../eval/capability-tests/1.4.10');
const capOK = chromeOK && fs.existsSync(CAP);
const capUrl = (aspect, file) => 'file://' + path.join(CAP, aspect, file);

test('#1 corpus: two-d case-05 (toolbar exemption mis-scoped over prose body) → barrier', { skip: !capOK }, async () => {
  // labels.json: expected 'failed' — "only the toolbar could plausibly claim the exception, and not at
  // the cost of the body". The role=application wrapper must not exempt pinned wrappable prose inside it.
  const d = await runReflow(page, { url: capUrl('two-d-exception-overclaimed-or-misscoped', 'case-05.html') });
  assert.equal(d.verdict, 'fail');
  assert.equal(d.kind, 'document-overflow');
});

test('#1 corpus: two-d case-08 (single cell prose pinned to 800px) → barrier', { skip: !capOK }, async () => {
  // labels.json: expected 'failed' — Note 2: "data tables (not individual cells)".
  const d = await runReflow(page, { url: capUrl('two-d-exception-overclaimed-or-misscoped', 'case-08.html') });
  assert.equal(d.verdict, 'fail');
  assert.equal(d.kind, 'document-overflow');
});

test('#1 corpus: two-d case-12 (legit multi-column timetable) keeps its grid exemption', { skip: !capOK }, async () => {
  // labels.json: expected 'passed' — the exception correctly scoped to the table; overflow is
  // table-intrinsic (columns), no pinned cell content, so the ancestor walk still exempts it.
  const d = await runReflow(page, { url: capUrl('two-d-exception-overclaimed-or-misscoped', 'case-12.html') });
  assert.equal(d.verdict, 'pass');
  assert.equal(d.kind, '2d-exempt');
});

test('#12 corpus: f102 case-14 ("Read full policy" offsite link) routes to the equivalence skeptic', { skip: !capOK }, async () => {
  // labels.json: runnerShould 'abstain' — "Abstain (equivalence check needed)". The runner must no longer
  // deterministically CLEAR on the English phrase; the f102-disappearance kind is exactly what
  // reflow-checklist forwards to the equivalent-content-on-reflow skeptic.
  const d = await runReflow(page, { url: capUrl('f102-content-disappears-no-equivalent', 'case-14.html') });
  assert.equal(d.verdict, 'fail');
  assert.equal(d.kind, 'f102-disappearance');
});
