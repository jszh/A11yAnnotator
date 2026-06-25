#!/usr/bin/env node
'use strict';
// NO-LLM test of mechanism #2: does the DETERMINISTIC pipeline output vary run-to-run? Runs the full pipeline
// (collect + deterministic build + vision capture, tools-OFF) N times under the SAME pageConc contention as the
// live variance runs, with a NOOP judge (zero LLM calls / zero quota), and via the orchestrator `onLlmInputs` hook
// captures the EXACT inputs the LLM would receive each run. Then it diffs, per case, four signatures:
//   collect  — # collected elements (raw DOM/axe/signal extraction)
//   subjects — which (sc,xpath,skill) obligations reach the LLM (auto-PARTIAL selection)
//   vision   — which xpaths got a crop + the crop BYTES (sha) — presence + pixels
//   ledger   — the obligation ledger's auto-PARTIAL disposition (wall-clock-bounded settle-vs-defer)
// A signature that differs across the N runs is deterministic-lane nondeterminism = mechanism #2, located precisely.
//
// Usage: node evidence-stability.js --scs=1.1.1,1.4.3,1.4.5,2.4.4,2.4.6,4.1.2 --runs=4 --pages=16

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
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
const SCS = (arg('scs', null) || '1.1.1,1.4.3,1.4.5,2.4.4,2.4.6,4.1.2').split(',').map((s) => s.trim()).filter(Boolean);
const RUNS = Number(arg('runs', 4));
const PAGE_CONC = Number(arg('pages', 16));
const LIMIT = Number(arg('limit', 0));
const MAX_TABS = LIMITS.concurrency.maxTabs;
const OUT = path.join(REPO_ROOT, 'results/fp-experiments/runs', arg('out', 'fp-evidence-stability'));
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 12);
// Vision drift is recorded under BOTH metrics each run: `vision` = PERCEPTUAL hash (R2.2e/Q2 — swallows the ≤4px Δ1
// GPU rasterization LSB noise that raw-SHA over-counts as "drift"); `visionRaw` = the exact-byte SHA (shows the
// FOUT/reflow drift the settle removes). Comparing the two attributes the settle effect vs the perceptual-metric effect.
const { perceptualHash } = require('./perceptual-hash.js');

function loadCases() {
  const RAW = path.join(REPO_ROOT, 'eval/checker-comparison/upstream-evidence/v3-act-subset-proposed/raw.json');
  const raw = JSON.parse(fs.readFileSync(RAW, 'utf8'));
  let out = [];
  for (const r of raw) {
    if (r.error || r.axeFlag || r.v3Flag) continue;
    const localPath = path.join('pages', r.ruleId, r.testcaseId + '.html');
    if (!fs.existsSync(path.join(SUBSET_DIR, localPath))) continue;
    out.push({ ruleId: r.ruleId, testcaseId: r.testcaseId, expected: r.expected, sc: r.sc, localPath });
  }
  if (SCS.length) out = out.filter((c) => (c.sc || []).some((s) => SCS.includes(s)));
  // DEDUPE by testcaseId: a fixture enrolled under multiple ACT rules (e.g. the W3C-logo img under 674b10/59796f/
  // e88epe) would otherwise be run once PER RULE with a DIFFERENT restrictScs and accumulated under one testcaseId
  // key — the period-N "drift" artifact (R2.2e/Q4). Stability must compare like-with-like, so keep one rule per id.
  { const seen = new Set(); out = out.filter((c) => (seen.has(c.testcaseId) ? false : (seen.add(c.testcaseId), true))); }
  const CASES_FILE = arg('cases', null);
  if (CASES_FILE) { const ids = new Set(fs.readFileSync(CASES_FILE, 'utf8').split(/\s+/).filter(Boolean)); out = out.filter((c) => ids.has(c.testcaseId)); }
  if (LIMIT > 0) out = out.slice(0, LIMIT);
  return out;
}
const urlFor = (tc) => 'file://' + path.join(SUBSET_DIR, tc.localPath);
const noopAgent = async () => null; // ZERO LLM calls — the deterministic lane + vision still run

function sigs(collect, snap) {
  const subj = [...(snap.agentSubjects || []).map((s) => `A|${s.sc}|${s.xpath}|${s.skill}`),
                ...(snap.rubricSubjects || []).map((s) => `R|${s.sc}|${s.xpath}|${s.rubricId}`)].sort();
  const vbx = snap.pOpts && snap.pOpts.visionByXpath || {};
  // record BOTH metrics every run so one pass attributes the SETTLE effect (raw drift) vs the PERCEPTUAL-hash effect.
  const xps = Object.keys(vbx).sort();
  const visP = xps.map((xp) => `${xp}:${sha(JSON.stringify(Object.keys(vbx[xp]).sort().map((st) => st + '=' + perceptualHash(vbx[xp][st]))))}`);
  const visR = xps.map((xp) => `${xp}:${sha(JSON.stringify(Object.keys(vbx[xp]).sort().map((st) => st + '=' + sha(String(vbx[xp][st] || '')))))}`);
  const led = ((snap.built && snap.built.results && snap.built.results.obligationLedger) || []).map((r) => `${r.sc}|${r.targetXpath || r.xpath || ''}|${r.autoPartial ? 1 : 0}`).sort();
  return { collect: (collect.elements || []).length, subjects: sha(JSON.stringify(subj)), subjN: subj.length, vision: sha(JSON.stringify(visP)), visionRaw: sha(JSON.stringify(visR)), visN: visP.length, ledger: sha(JSON.stringify(led)), ledN: led.length };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const cases = loadCases();
  console.log(`EVIDENCE-STABILITY: ${cases.length} cases × ${RUNS} runs | pages=${PAGE_CONC} | NO LLM (noop judge) | SCs=${SCS.join(',')}`);
  const byCase = {}; for (const c of cases) byCase[c.testcaseId] = { sc: (c.sc || [])[0], expected: c.expected, runs: [] };
  for (let run = 0; run < RUNS; run++) {
    const t0 = Date.now();
    const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const alloc = createTabAllocator({ browser, maxTabs: MAX_TABS });
    const instGate = makeSemaphore(Math.max(1, Math.min(PAGE_CONC, 4)));
    let cursor = 0, done = 0;
    const worker = async () => {
      while (true) {
        const i = cursor++; if (i >= cases.length) return; const tc = cases[i]; const runId = `es-${run}-${tc.testcaseId}`;
        try {
          const lease = await alloc.acquire(); let collect;
          try { collect = normalizeCollectRoles(await collectActPage(lease.page, { url: urlFor(tc), elementCap: LIMITS.act.elementCap, file: `act:${tc.testcaseId}`, runId, runAxe: true, axePath: AXE_PATH })); }
          finally { await lease.release(); }
          const drive = { file: collect.file, runId, pageDigest: collect.pageDigest, drivenAt: collect.collectedAt + 1, elements: [] };
          let snap = null;
          await orchestrate(collect, drive, {
            resolveUrl: () => urlFor(tc), executablePath: CHROME, browser, tabAllocator: alloc, maxTabs: MAX_TABS,
            runInstruments: true, instrumentsGate: instGate, instrumentsTimeoutMs: 90000, now: collect.collectedAt + 2,
            restrictScs: new Set(tc.sc || []), maxAutomatic: LIMITS.act.maxAuto, budgetOpts: { maxRunWallClockMs: LIMITS.act.runWallClockMs },
            experimentConcurrency: Math.min(LIMITS.concurrency.experimentCap, LIMITS.concurrency.experiment),
            runLlm: true, runAgent: noopAgent, captureVision: true, llmConcurrency: 8,
            onLlmInputs: (s) => { snap = s; },
          });
          byCase[tc.testcaseId].runs.push(snap ? sigs(collect, snap) : { collect: (collect.elements || []).length, subjects: 'NO_SUBJECTS', subjN: 0, vision: '-', visN: 0, ledger: '-', ledN: 0 });
        } catch (e) { byCase[tc.testcaseId].runs.push({ error: String((e && e.message) || e) }); }
        done++;
      }
    };
    await Promise.all(Array.from({ length: Math.min(PAGE_CONC, cases.length) }, () => worker()));
    alloc.close(); await browser.close().catch(() => {});
    console.log(`  run ${run + 1}/${RUNS} done (${Math.round((Date.now() - t0) / 1000)}s)`);
  }
  fs.writeFileSync(path.join(OUT, 'sigs.json'), JSON.stringify(byCase, null, 2));

  // ---- analysis: per signature, which cases vary across the N runs ----
  const cats = ['collect', 'subjects', 'visionRaw', 'vision', 'ledger']; // visionRaw=exact-byte (settle effect); vision=perceptual (after metric)
  const unstable = { collect: [], subjects: [], visionRaw: [], vision: [], ledger: [] };
  let complete = 0;
  for (const [id, rec] of Object.entries(byCase)) {
    const rs = rec.runs.filter((r) => !r.error);
    if (rs.length < RUNS) continue;
    complete++;
    for (const cat of cats) { const vals = new Set(rs.map((r) => String(r[cat]))); if (vals.size > 1) unstable[cat].push({ id: id.slice(0, 8), sc: rec.sc, exp: rec.expected, vals: rs.map((r) => r[cat]) }); }
  }
  const bySC = (arr) => { const h = {}; for (const x of arr) h[x.sc] = (h[x.sc] || 0) + 1; return JSON.stringify(h); };
  console.log(`\n=== EVIDENCE STABILITY over ${RUNS} runs (${complete} cases with all runs) ===`);
  for (const cat of cats) console.log(`  ${cat.padEnd(9)}: ${unstable[cat].length} cases VARY  ${bySC(unstable[cat])}`);
  for (const cat of cats) { if (unstable[cat].length) { console.log(`\n  --- ${cat} unstable cases ---`); for (const x of unstable[cat].slice(0, 25)) console.log(`    ${x.id}(${x.sc},${x.exp}): ${JSON.stringify(x.vals)}`); } }
  console.log(`\nwrote ${path.join(OUT, 'sigs.json')}`);
}
main().catch((e) => { console.error(e && e.stack || e); process.exit(1); });
