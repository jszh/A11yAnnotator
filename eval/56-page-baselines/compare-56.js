#!/usr/bin/env node
'use strict';

// Three-way comparison over the SAME 56 saved pages: the v3 harness (Gemini 3.7 Flash, high),
// GenA11y (Gemini 3.7 Flash, high) and axe-core.
//
// Three views, because the three tools do not share a unit of work:
//   1. LANE COVERAGE   — which (page × SC) lanes each tool even evaluates. GenA11y has element
//                        extraction for 15 SCs; axe's rules map to the SCs its tags carry; the
//                        harness mints obligations per element. Detection counts are meaningless
//                        without this denominator.
//   2. PAGE × SC       — did the tool flag this SC anywhere on this page. The only unit all three
//                        share, so it is the honest headline comparison.
//   3. ELEMENT (n=774) — for each element in the harness's stratified sample, did GenA11y name that
//                        same element for that same SC, and did axe. This is the strictest view and
//                        the one that lines up with the harness's flagged-positive count.
//
//   node eval/56-page-baselines/compare-56.js --gena11y=<run> --axe=<run> [--harness=<dir>] [--out=<dir>]

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
function arg(name, def = null) {
  const exact = `--${name}`;
  const p = process.argv.find((x) => x === exact || x.startsWith(exact + '='));
  if (!p) return def;
  if (p.startsWith(exact + '=')) return p.slice(exact.length + 1);
  const next = process.argv[process.argv.indexOf(p) + 1];
  return next && !next.startsWith('--') ? next : true;
}

const HARNESS = path.resolve(ROOT, String(arg('harness',
  'results/56-page-runs/current/saved-elements-stratified774-gemini37-flash-high-20260820-combined-repaired')));
const GENA11Y = path.resolve(ROOT, 'results', String(arg('gena11y', 'gena11y-56-gemini37-high-20260823-server')));
const AXE = path.resolve(ROOT, 'results', String(arg('axe', 'axe-56-20260823-server')));
const OUT = path.resolve(ROOT, 'results', String(arg('out', 'compare-56-20260823')));

const norm = (v) => String(v || '').replace(/\[1\](?=\/|$)/g, '');
const safe = (s) => String(s).replace(/[^A-Za-z0-9._-]+/g, '-').slice(0, 120);
const pct = (n, d) => (d ? `${(100 * n / d).toFixed(1)}%` : '—');

// ---------------------------------------------------------------------------
// Load the three runs
// ---------------------------------------------------------------------------
const list = JSON.parse(fs.readFileSync(path.join(ROOT, 'eval/56-page-baselines/page-list-56.json'), 'utf8'));
const PAGES = list.pages.map((p) => p.file);

const analysis = JSON.parse(fs.readFileSync(path.join(HARNESS, 'sample-analysis.json'), 'utf8'));
const SAMPLE_SCS = [...new Set(analysis.records.map((r) => r.sc))].sort();

// harness page × SC barriers, read from each page's own obligation ledger (not just the sample):
// a ledger row that reached a terminal, uncleared disposition is a flagged barrier for that SC.
const harnessPageSc = new Map();   // `${page}|${sc}` -> {barrier, clear, partial}
const harnessScLanes = new Map();  // sc -> Set(page) where the SC had any obligation at all
for (const file of fs.readdirSync(path.join(HARNESS, 'pages')).filter((f) => f.endsWith('.json'))) {
  const p = JSON.parse(fs.readFileSync(path.join(HARNESS, 'pages', file), 'utf8'));
  const page = p.spec && p.spec.file;
  const ledger = (p.results && p.results.obligationLedger) || p.obligationLedger || [];
  for (const row of ledger) {
    const k = `${page}|${row.sc}`;
    if (!harnessPageSc.has(k)) harnessPageSc.set(k, { barrier: 0, clear: 0, partial: 0 });
    const t = harnessPageSc.get(k);
    if (row.disposition === 'PARTIAL') t.partial++;
    else if (row.cleared === false) t.barrier++;
    else if (row.cleared === true) t.clear++;
    if (!harnessScLanes.has(row.sc)) harnessScLanes.set(row.sc, new Set());
    harnessScLanes.get(row.sc).add(page);
  }
}

// GenA11y: one case per (page, SC). `uncovered` = no extraction for that SC (structural abstain).
const gena11y = JSON.parse(fs.readFileSync(path.join(GENA11Y, 'results.json'), 'utf8'));
const genSummary = JSON.parse(fs.readFileSync(path.join(GENA11Y, 'summary.json'), 'utf8'));
const genByPageSc = new Map();
const genElements = new Map();     // `${page}|${sc}|${normXpath}` -> violation
for (const r of gena11y) {
  const page = r.pageFile || path.basename(r.file);
  genByPageSc.set(`${page}|${r.sc}`, r);
  for (const v of ((r.gena11y || {}).violations || [])) {
    if (!v.xpath) continue;
    genElements.set(`${page}|${r.sc}|${norm(v.xpath)}`, v);
  }
}

// axe: full violation/incomplete rows, already carrying the collector's xpath scheme.
const axeRows = [];
for (const p of PAGES) {
  const f = path.join(AXE, 'pages', safe(p) + '.json');
  if (fs.existsSync(f)) axeRows.push(...JSON.parse(fs.readFileSync(f, 'utf8')).rows);
}
const axePageSc = new Set();       // `${page}|${sc}` with a hard violation
const axeElements = new Map();     // `${page}|${sc}|${normXpath}` -> [ruleIds]
for (const r of axeRows) {
  if (r.kind !== 'violation' || !r.sc) continue;
  axePageSc.add(`${r.page}|${r.sc}`);
  if (!r.normalizedXpath) continue;
  const k = `${r.page}|${r.sc}|${r.normalizedXpath}`;
  if (!axeElements.has(k)) axeElements.set(k, []);
  axeElements.get(k).push(r.ruleId);
}

// ---------------------------------------------------------------------------
// View 1 — lane coverage
// ---------------------------------------------------------------------------
const axeScs = new Set(axeRows.filter((r) => r.sc).map((r) => r.sc));
const genCoveredScs = new Set(gena11y.filter((r) => r.outcome !== 'uncovered').map((r) => r.sc));
const coverage = SAMPLE_SCS.map((sc) => ({
  sc,
  harnessPagesWithObligation: (harnessScLanes.get(sc) || new Set()).size,
  gena11yEvaluates: genCoveredScs.has(sc),
  gena11yPagesEvaluated: gena11y.filter((r) => r.sc === sc && r.outcome !== 'uncovered').length,
  axeHasRuleForSc: axeScs.has(sc),
  axePagesWithViolation: PAGES.filter((p) => axePageSc.has(`${p}|${sc}`)).length,
}));

// ---------------------------------------------------------------------------
// View 2 — page × SC detection
// ---------------------------------------------------------------------------
const pageSc = [];
for (const page of PAGES) {
  for (const sc of SAMPLE_SCS) {
    const h = harnessPageSc.get(`${page}|${sc}`) || { barrier: 0, clear: 0, partial: 0 };
    const g = genByPageSc.get(`${page}|${sc}`);
    pageSc.push({
      page, sc,
      harnessBarrier: h.barrier > 0, harnessBarrierRows: h.barrier,
      harnessEvaluated: (h.barrier + h.clear + h.partial) > 0,
      gena11yEvaluated: !!g && g.outcome !== 'uncovered',
      gena11yFlagged: !!g && g.outcome === 'caught',
      gena11yVerdict: g ? ((g.gena11y || {}).verdict || (g.outcome === 'uncovered' ? 'UNCOVERED' : null)) : null,
      gena11yViolations: g ? ((g.gena11y || {}).violations || []).length : 0,
      axeViolation: axePageSc.has(`${page}|${sc}`),
    });
  }
}
const cell = (f) => pageSc.filter(f).length;
const pageScTotals = {
  cells: pageSc.length,
  harnessBarrier: cell((x) => x.harnessBarrier),
  gena11yFlagged: cell((x) => x.gena11yFlagged),
  axeViolation: cell((x) => x.axeViolation),
  allThree: cell((x) => x.harnessBarrier && x.gena11yFlagged && x.axeViolation),
  harnessOnly: cell((x) => x.harnessBarrier && !x.gena11yFlagged && !x.axeViolation),
  gena11yOnly: cell((x) => !x.harnessBarrier && x.gena11yFlagged && !x.axeViolation),
  axeOnly: cell((x) => !x.harnessBarrier && !x.gena11yFlagged && x.axeViolation),
  harnessAndGena11y: cell((x) => x.harnessBarrier && x.gena11yFlagged),
  harnessAndAxe: cell((x) => x.harnessBarrier && x.axeViolation),
  gena11yAndAxe: cell((x) => x.gena11yFlagged && x.axeViolation),
  // restricted to lanes GenA11y can actually evaluate — the only fair head-to-head
  onGena11yLanes: {
    cells: cell((x) => x.gena11yEvaluated),
    harnessBarrier: cell((x) => x.gena11yEvaluated && x.harnessBarrier),
    gena11yFlagged: cell((x) => x.gena11yEvaluated && x.gena11yFlagged),
    both: cell((x) => x.gena11yEvaluated && x.harnessBarrier && x.gena11yFlagged),
    harnessOnly: cell((x) => x.gena11yEvaluated && x.harnessBarrier && !x.gena11yFlagged),
    gena11yOnly: cell((x) => x.gena11yEvaluated && !x.harnessBarrier && x.gena11yFlagged),
  },
};

// ---------------------------------------------------------------------------
// View 3 — element level over the harness's 774-element sample
// ---------------------------------------------------------------------------
const elements = analysis.records.map((r) => {
  const xp = norm(r.normalizedXpath || r.xpath);
  const g = genByPageSc.get(`${r.page}|${r.sc}`);
  const axeHit = axeElements.get(`${r.page}|${r.sc}|${xp}`) || null;
  return {
    key: r.key, page: r.page, sc: r.sc, normalizedXpath: xp,
    recordKind: r.recordKind, harnessOutcome: r.outcome,
    harnessBarrier: r.outcome === 'barrier',
    gena11yEvaluated: !!g && g.outcome !== 'uncovered',
    gena11yFlaggedPage: !!g && g.outcome === 'caught',
    gena11yFlaggedElement: genElements.has(`${r.page}|${r.sc}|${xp}`),
    axeViolationElement: !!axeHit, axeRules: axeHit,
  };
});
const el = (f) => elements.filter(f).length;
const elementTotals = {
  sampled: elements.length,
  harnessBarrier: el((x) => x.harnessBarrier),
  gena11yEvaluatedLane: el((x) => x.gena11yEvaluated),
  gena11yFlaggedSameElement: el((x) => x.gena11yFlaggedElement),
  gena11yFlaggedSameLane: el((x) => x.gena11yFlaggedPage),
  axeViolationSameElement: el((x) => x.axeViolationElement),
  // agreement on the harness's own barriers
  onHarnessBarriers: {
    total: el((x) => x.harnessBarrier),
    gena11yLaneEvaluated: el((x) => x.harnessBarrier && x.gena11yEvaluated),
    gena11ySameElement: el((x) => x.harnessBarrier && x.gena11yFlaggedElement),
    axeSameElement: el((x) => x.harnessBarrier && x.axeViolationElement),
    neitherBaseline: el((x) => x.harnessBarrier && !x.gena11yFlaggedElement && !x.axeViolationElement),
  },
};

fs.mkdirSync(OUT, { recursive: true });
const out = {
  schema: '56-page-three-way-comparison/1', generatedAt: new Date().toISOString(),
  runs: {
    harness: { dir: path.relative(ROOT, HARNESS), model: 'gemini-3.7-flash', effort: 'high' },
    gena11y: { dir: path.relative(ROOT, GENA11Y), model: genSummary.model, effort: genSummary.effort,
               unlabeled: genSummary.unlabeled || null, llm: genSummary.llm || null },
    axe: { dir: path.relative(ROOT, AXE), engine: 'axe-core (see manifest)' },
  },
  pages: PAGES.length, sampleScs: SAMPLE_SCS,
  coverage, pageScTotals, elementTotals,
  pageSc, elements,
};
fs.writeFileSync(path.join(OUT, 'three-way-56.json'), JSON.stringify(out, null, 2));

// ---------------------------------------------------------------------------
// Markdown report
// ---------------------------------------------------------------------------
const L = [];
L.push('# Three-way comparison over the 56 saved pages\n');
L.push(`Harness: \`${path.relative(ROOT, HARNESS)}\` (Gemini 3.7 Flash, effort high)  `);
L.push(`GenA11y: \`${path.relative(ROOT, GENA11Y)}\` (${genSummary.model}, effort ${genSummary.effort})  `);
L.push(`axe: \`${path.relative(ROOT, AXE)}\`\n`);
L.push('The three tools do not share a unit of work, so detection counts are only comparable inside a stated denominator. All three views below are over the same 56 pages.\n');

L.push('## 1. Lane coverage — what each tool can even evaluate\n');
L.push('| SC | harness pages w/ obligation | GenA11y evaluates | GenA11y pages | axe has a rule | axe pages w/ violation |');
L.push('| --- | ---: | :---: | ---: | :---: | ---: |');
for (const c of coverage) {
  L.push(`| ${c.sc} | ${c.harnessPagesWithObligation} | ${c.gena11yEvaluates ? 'yes' : '—'} | ` +
         `${c.gena11yPagesEvaluated} | ${c.axeHasRuleForSc ? 'yes' : '—'} | ${c.axePagesWithViolation} |`);
}
L.push('');

L.push('## 2. Page × SC detection\n');
L.push(`Over ${pageScTotals.cells} (page × SC) cells — ${PAGES.length} pages × ${SAMPLE_SCS.length} sampled SCs:\n`);
L.push('| | cells flagged |');
L.push('| --- | ---: |');
L.push(`| harness barrier | ${pageScTotals.harnessBarrier} |`);
L.push(`| GenA11y flagged | ${pageScTotals.gena11yFlagged} |`);
L.push(`| axe violation | ${pageScTotals.axeViolation} |`);
L.push(`| all three | ${pageScTotals.allThree} |`);
L.push(`| harness only | ${pageScTotals.harnessOnly} |`);
L.push(`| GenA11y only | ${pageScTotals.gena11yOnly} |`);
L.push(`| axe only | ${pageScTotals.axeOnly} |`);
L.push('');
const og = pageScTotals.onGena11yLanes;
L.push(`Restricted to the ${og.cells} cells GenA11y actually evaluates (its 15 covered SCs): ` +
       `harness flags ${og.harnessBarrier}, GenA11y flags ${og.gena11yFlagged}, both agree on ${og.both} ` +
       `(${pct(og.both, og.harnessBarrier)} of the harness's flags in those lanes); ` +
       `${og.harnessOnly} harness-only, ${og.gena11yOnly} GenA11y-only.\n`);

L.push('## 3. Element level — the harness\'s 774-element stratified sample\n');
const e = elementTotals;
L.push('| | elements |');
L.push('| --- | ---: |');
L.push(`| sampled | ${e.sampled} |`);
L.push(`| harness flagged a barrier | ${e.harnessBarrier} |`);
L.push(`| in a lane GenA11y evaluates | ${e.gena11yEvaluatedLane} |`);
L.push(`| GenA11y named the SAME element | ${e.gena11yFlaggedSameElement} |`);
L.push(`| GenA11y flagged that page+SC (any element) | ${e.gena11yFlaggedSameLane} |`);
L.push(`| axe violation on the SAME element | ${e.axeViolationSameElement} |`);
L.push('');
const b = e.onHarnessBarriers;
L.push(`On the ${b.total} sampled elements the harness flagged as barriers: ` +
       `${b.gena11yLaneEvaluated} sit in a lane GenA11y evaluates, ` +
       `GenA11y independently named ${b.gena11ySameElement} of them, ` +
       `axe named ${b.axeSameElement}, and ${b.neitherBaseline} (${pct(b.neitherBaseline, b.total)}) ` +
       `were named by neither baseline.\n`);

L.push('### Per SC (element level)\n');
L.push('| SC | sampled | harness barrier | GenA11y lane | GenA11y same element | axe same element |');
L.push('| --- | ---: | ---: | :---: | ---: | ---: |');
for (const sc of SAMPLE_SCS) {
  const rows = elements.filter((x) => x.sc === sc);
  L.push(`| ${sc} | ${rows.length} | ${rows.filter((x) => x.harnessBarrier).length} | ` +
         `${rows.some((x) => x.gena11yEvaluated) ? 'yes' : '—'} | ` +
         `${rows.filter((x) => x.gena11yFlaggedElement).length} | ` +
         `${rows.filter((x) => x.axeViolationElement).length} |`);
}
L.push('');
fs.writeFileSync(path.join(OUT, 'three-way-56.md'), L.join('\n'));
console.log(L.join('\n'));
console.log(`\nwrote ${path.relative(ROOT, OUT)}/three-way-56.{json,md}`);
