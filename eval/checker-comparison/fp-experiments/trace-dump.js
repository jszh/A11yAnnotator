#!/usr/bin/env node
'use strict';
// DEEP trace of the ledger-disposition drift: for a small targeted case set, run the FULL pipeline K times (NO LLM)
// and dump, per run, the actual OUTCOMES of each capability that feeds the obligation ledger — not hashes:
//   bundle.instruments  — the VSR + keyboard-walk outcomes (the timing-sensitive lane)
//   built ledger rows   — every obligation's {disposition, autoPartial, decidedBy/source}
// Then a field-level differ pinpoints WHICH obligationId flips across runs and WHICH upstream instrument outcome
// moved with it. This is the "examine the traces/outcomes" step beyond the drift COUNT.
//
// Usage: node trace-dump.js --ids=43730455,f92350be,... --runs=5 --pages=8 [--analyze=PATH]   (analyze-only: --analyze)

const fs = require('fs');
const path = require('path');
const REPO_ROOT = path.join(__dirname, '..', '..', '..');
require('../../../scripts/v3/lib/load-env.js').loadEnv(REPO_ROOT);
const { orchestrate } = require('../../../scripts/v3/lib/orchestrator.js');
const { createTabAllocator } = require('../../../scripts/v3/lib/tab-allocator.js');
const { collectActPage, normalizeCollectRoles } = require('../../../scripts/v3/lib/act-page-collect.js');
const { makeSemaphore } = require('../../../scripts/v3/lib/run-telemetry.js');
const LIMITS = require('../../../scripts/v3/lib/limits.js');
const puppeteer = require('puppeteer');

function arg(n, d = null) { const p = process.argv.find((x) => x === `--${n}` || x.startsWith(`--${n}=`)); if (!p) return d; if (p === `--${n}`) return true; return p.slice(n.length + 3); }
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SUBSET_DIR = path.join(__dirname, '..', 'act-subset');
const AXE_PATH = path.join(REPO_ROOT, 'axe.min.js');
const RUNS = Number(arg('runs', 5));
const PAGE_CONC = Number(arg('pages', 8));
const BUDGET_MS = Number(arg('budget-ms', 0)) || LIMITS.act.runWallClockMs; // Q3: override the 120s experiment-lane ceiling
const MAX_TABS = LIMITS.concurrency.maxTabs;
const OUT = path.join(REPO_ROOT, 'results/fp-experiments/runs', arg('out', 'fp-trace-dump'));
const urlFor = (tc) => 'file://' + path.join(SUBSET_DIR, tc.localPath);
const noopAgent = async () => null;

function loadCases(ids) {
  const RAW = path.join(REPO_ROOT, 'eval/checker-comparison/upstream-evidence/v3-act-subset-proposed/raw.json');
  const raw = JSON.parse(fs.readFileSync(RAW, 'utf8'));
  const want = new Set(ids);
  const out = [];
  const seen = new Set();
  for (const r of raw) {
    if (r.error || r.axeFlag || r.v3Flag) continue;
    const short = r.testcaseId.slice(0, 8);
    if (!want.has(short) && !want.has(r.testcaseId)) continue;
    if (seen.has(r.testcaseId)) continue; seen.add(r.testcaseId);
    const localPath = path.join('pages', r.ruleId, r.testcaseId + '.html');
    if (!fs.existsSync(path.join(SUBSET_DIR, localPath))) continue;
    out.push({ ruleId: r.ruleId, testcaseId: r.testcaseId, expected: r.expected, sc: r.sc, localPath });
  }
  return out;
}

// keep only the fields that matter for the disposition (drop volatile timings/ids that always differ)
function ledgerView(led) {
  return (led || []).map((r) => ({
    sc: r.sc, obl: r.obligationId, xpath: r.targetXpath || r.xpath || '',
    disposition: r.disposition, autoPartial: !!r.autoPartial, cleared: !!r.cleared,
    decidedBy: r.decidedBy || (r.claim && r.claim.skill) || (r.provisional && r.provisional.mechanism) || null,
    family: r.family || r.claimFamily || null,
  }));
}
function instrumentsView(inst) {
  if (!inst || typeof inst !== 'object') return null;
  // shallow, stable projection: keep arrays' lengths + per-item key identity, drop wall-clock
  const out = {};
  for (const k of Object.keys(inst)) {
    const v = inst[k];
    if (Array.isArray(v)) out[k] = v.map((x) => (x && typeof x === 'object') ? JSON.stringify(x) : x);
    else if (v && typeof v === 'object') out[k] = JSON.stringify(v);
    else out[k] = v;
  }
  return out;
}

async function runAll(cases) {
  fs.mkdirSync(OUT, { recursive: true });
  const byCase = {}; for (const c of cases) byCase[c.testcaseId] = { sc: (c.sc || [])[0], expected: c.expected, runs: [] };
  for (let run = 0; run < RUNS; run++) {
    const t0 = Date.now();
    const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const alloc = createTabAllocator({ browser, maxTabs: MAX_TABS });
    const instGate = makeSemaphore(Math.max(1, Math.min(PAGE_CONC, 4)));
    let cursor = 0;
    const worker = async () => {
      while (true) {
        const i = cursor++; if (i >= cases.length) return; const tc = cases[i]; const runId = `tr-${run}-${tc.testcaseId}`;
        try {
          const lease = await alloc.acquire(); let collect;
          try { collect = normalizeCollectRoles(await collectActPage(lease.page, { url: urlFor(tc), elementCap: LIMITS.act.elementCap, file: `act:${tc.testcaseId}`, runId, runAxe: true, axePath: AXE_PATH })); }
          finally { await lease.release(); }
          const drive = { file: collect.file, runId, pageDigest: collect.pageDigest, drivenAt: collect.collectedAt + 1, elements: [] };
          const res = await orchestrate(collect, drive, {
            resolveUrl: () => urlFor(tc), executablePath: CHROME, browser, tabAllocator: alloc, maxTabs: MAX_TABS,
            runInstruments: true, instrumentsGate: instGate, instrumentsTimeoutMs: 90000, now: collect.collectedAt + 2,
            restrictScs: new Set(tc.sc || []), maxAutomatic: LIMITS.act.maxAuto, budgetOpts: { maxRunWallClockMs: BUDGET_MS },
            experimentConcurrency: Math.min(LIMITS.concurrency.experimentCap, LIMITS.concurrency.experiment),
            runLlm: true, runAgent: noopAgent, captureVision: true, llmConcurrency: 8,
          });
          const props = (res.claimProposals && res.claimProposals.proposals) || [];
          const expResults = (res.experiments && res.experiments.results) || [];
          const expUnrun = (res.experiments && res.experiments.unrun) || [];
          byCase[tc.testcaseId].runs.push({
            ledger: ledgerView(res.built && res.built.results && res.built.results.obligationLedger),
            instruments: instrumentsView(res.bundle && res.bundle.instruments),
            proposals: props.map((p) => ({ id: p.claimId, sc: p.sc, target: (p.observationScope || {}).actionTargetRef, family: p.claimFamily, exp: p.experimentId })),
            experiments: expResults.map((e) => ({ id: e.claimId, sc: e.sc, target: e.targetXpath, valid: e.valid, completed: e.completed, outcome: e.outcome && (e.outcome.observationOutcome || e.outcome) })),
            unrun: expUnrun.map((u) => ({ id: u.candidateId, exp: u.experimentId, status: u.status, reason: u.reason })),
            counts: { proposals: props.length, expResults: expResults.length, unrun: expUnrun.length, candidates: (res.candidates && res.candidates.length) || 0 },
          });
        } catch (e) { byCase[tc.testcaseId].runs.push({ error: String((e && e.message) || e) }); }
      }
    };
    await Promise.all(Array.from({ length: Math.min(PAGE_CONC, cases.length) }, () => worker()));
    alloc.close(); await browser.close().catch(() => {});
    console.log(`  run ${run + 1}/${RUNS} (${Math.round((Date.now() - t0) / 1000)}s)`);
  }
  fs.writeFileSync(path.join(OUT, 'trace.json'), JSON.stringify(byCase, null, 2));
  console.log(`wrote ${path.join(OUT, 'trace.json')}`);
  return byCase;
}

function analyze(byCase) {
  for (const [id, rec] of Object.entries(byCase)) {
    const rs = rec.runs.filter((r) => !r.error);
    if (rs.length < 2) { console.log(`\n### ${id.slice(0,8)} (${rec.sc}): <2 good runs`); continue; }
    // 1) which ledger rows (by obl) flip any field across runs?
    const oblKeys = new Set(); for (const r of rs) for (const row of r.ledger) oblKeys.add(row.obl);
    const flips = [];
    for (const obl of oblKeys) {
      const variants = rs.map((r) => r.ledger.find((x) => x.obl === obl) || null);
      const sigs = new Set(variants.map((v) => v ? `${v.disposition}|ap${v.autoPartial ? 1 : 0}|cl${v.cleared ? 1 : 0}|${v.decidedBy}` : 'ABSENT'));
      if (sigs.size > 1) flips.push({ obl, variants });
    }
    // 2) which instrument keys differ across runs?
    const instKeys = new Set(); for (const r of rs) if (r.instruments) for (const k of Object.keys(r.instruments)) instKeys.add(k);
    const instFlips = [];
    for (const k of instKeys) {
      const vals = rs.map((r) => r.instruments ? JSON.stringify(r.instruments[k]) : 'NO_INST');
      if (new Set(vals).size > 1) instFlips.push({ k, vals: rs.map((r) => r.instruments && r.instruments[k]) });
    }
    // per-run capability counts (does the WHOLE proposal/experiment batch vary?)
    const countLine = rs.map((r) => r.counts ? `prop${r.counts.proposals}/res${r.counts.expResults}/UNRUN${r.counts.unrun}/cand${r.counts.candidates}` : '?').join('  ');
    console.log(`\n### ${id.slice(0,8)} (${rec.sc}, ${rec.expected}) — ${rs.length} runs | ${flips.length} ledger-row flip(s), ${instFlips.length} instrument-key flip(s)`);
    console.log(`  per-run counts (proposals/results/UNRUN/candidates): ${countLine}`);
    // unrun reasons (the budget-deferral smoking gun) — distinct reasons across runs
    const allReasons = new Set(); for (const r of rs) for (const u of (r.unrun || [])) allReasons.add(u.reason);
    if (allReasons.size) console.log(`  unrun reasons seen: ${[...allReasons].map((x) => String(x).slice(0, 70)).join(' | ')}`);
    for (const f of flips.slice(0, 8)) {
      console.log(`  FLIP ${f.variants[0] ? f.variants[0].sc : '?'} ${String(f.obl).slice(0, 60)}`);
      // for the flipping obligation, did a CLAIM PROPOSAL exist for this (sc,target) each run?
      const samp = f.variants.find(Boolean) || {};
      f.variants.forEach((v, i) => {
        const r = rs[i];
        const prop = r.proposals ? r.proposals.find((p) => p.sc === (v && v.sc || samp.sc) && p.target === (v && v.xpath || samp.xpath)) : null;
        const exp = prop && r.experiments ? r.experiments.find((e) => e.id === prop.id) : null;
        const provTag = prop ? `proposal=YES exp=${exp ? `valid${exp.valid?1:0}/comp${exp.completed?1:0}/${exp.outcome||'-'}` : 'NONE'}` : 'proposal=NO';
        console.log(`    run${i}: ${v ? `${v.disposition} ap=${v.autoPartial?1:0} by=${v.decidedBy}` : 'ABSENT'}  | ${provTag}`);
      });
    }
    for (const f of instFlips.slice(0, 6)) {
      console.log(`  INSTRUMENT-FLIP key="${f.k}"`);
      f.vals.forEach((v, i) => console.log(`    run${i}: ${typeof v === 'string' ? v.slice(0, 140) : JSON.stringify(v).slice(0, 140)}`));
    }
  }
}

async function main() {
  const analyzePath = arg('analyze', null);
  if (analyzePath) {
    const p = analyzePath === true ? path.join(OUT, 'trace.json') : analyzePath;
    analyze(JSON.parse(fs.readFileSync(p, 'utf8')));
    return;
  }
  const ids = (arg('ids', '') || '').split(',').map((s) => s.trim()).filter(Boolean);
  const cases = loadCases(ids);
  console.log(`TRACE-DUMP: ${cases.length} cases × ${RUNS} runs | pages=${PAGE_CONC} | NO LLM`);
  const byCase = await runAll(cases);
  analyze(byCase);
}
main().catch((e) => { console.error(e && e.stack || e); process.exit(1); });
