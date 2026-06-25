#!/usr/bin/env node
'use strict';
// Q4 — root-cause the ONE genuinely-propagating ledger nondeterminism: ebd0080b (<img alt="W3C logo">), whose 1.1.1
// subject presence flips 0<->1 under contention. Runs ebd0080b ALONGSIDE filler cases at pages=N (real contention),
// K runs, NO LLM, and per run dumps for the target: the 1.1.1 ledger rows (disposition/autoPartial/decidedBy), the
// reach-LLM SUBJECTS, the IMG collect-facts (removedFromA11yTree/box/renderedVisible/isImage), and the AXE findings.
// Then diffs across runs to locate exactly which fact/disposition flips.
//
// Usage: node ebd-applicability-probe.js --runs=8 --pages=16 --fillers=2.4.4 --out=fp-ebd
const fs = require('fs'); const path = require('path');
const REPO_ROOT = path.join(__dirname, '..', '..', '..');
require('../../../scripts/v3/lib/load-env.js').loadEnv(REPO_ROOT);
const { orchestrate } = require('../../../scripts/v3/lib/orchestrator.js');
const { createTabAllocator } = require('../../../scripts/v3/lib/tab-allocator.js');
const { collectActPage, normalizeCollectRoles } = require('../../../scripts/v3/lib/act-page-collect.js');
const { makeSemaphore } = require('../../../scripts/v3/lib/run-telemetry.js');
const LIMITS = require('../../../scripts/v3/lib/limits.js');
const puppeteer = require('puppeteer');
function arg(n, d) { const p = process.argv.find((x) => x === `--${n}` || x.startsWith(`--${n}=`)); if (!p) return d; if (p === `--${n}`) return true; return p.slice(n.length + 3); }
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SUBSET_DIR = path.join(__dirname, '..', 'act-subset');
const AXE_PATH = path.join(REPO_ROOT, 'axe.min.js');
const TARGET = arg('target', 'ebd0080b');
const FILLER_SCS = (arg('fillers', '2.4.4') || '').split(',').map((s) => s.trim()).filter(Boolean);
const RUNS = Number(arg('runs', 8)); const PAGE_CONC = Number(arg('pages', 16));
const MAX_TABS = LIMITS.concurrency.maxTabs;
const OUT = path.join(REPO_ROOT, 'results/fp-experiments/runs', arg('out', 'fp-ebd'));

function loadCases() {
  const RAW = path.join(REPO_ROOT, 'eval/checker-comparison/upstream-evidence/v3-act-subset-proposed/raw.json');
  const raw = JSON.parse(fs.readFileSync(RAW, 'utf8'));
  const seen = new Set(); const out = [];
  // target first (all rules it matches → use the 1.1.1 one)
  for (const r of raw) { if (r.testcaseId.startsWith(TARGET) && (r.sc || []).includes('1.1.1')) { const lp = path.join('pages', r.ruleId, r.testcaseId + '.html'); if (fs.existsSync(path.join(SUBSET_DIR, lp))) { out.push({ ruleId: r.ruleId, testcaseId: r.testcaseId, expected: r.expected, sc: r.sc, localPath: lp, __target: true }); seen.add(r.testcaseId); break; } } }
  // fillers for contention
  for (const r of raw) { if (r.error || r.axeFlag || r.v3Flag) continue; if (!(r.sc || []).some((s) => FILLER_SCS.includes(s))) continue; if (seen.has(r.testcaseId)) continue; seen.add(r.testcaseId); const lp = path.join('pages', r.ruleId, r.testcaseId + '.html'); if (!fs.existsSync(path.join(SUBSET_DIR, lp))) continue; out.push({ ruleId: r.ruleId, testcaseId: r.testcaseId, expected: r.expected, sc: r.sc, localPath: lp }); }
  return out;
}
const urlFor = (tc) => 'file://' + path.join(SUBSET_DIR, tc.localPath);
const noopAgent = async () => null;

function imgFacts(collect) {
  return (collect.elements || []).filter((e) => e.isImage || /img|svg|canvas/.test(e.tag || '')).map((e) => ({
    xpath: e.xpath, tag: e.tag, isImage: !!e.isImage, removedFromA11yTree: !!e.removedFromA11yTree,
    renderedVisible: e.renderedVisible, box: e.box ? `${Math.round(e.box.width)}x${Math.round(e.box.height)}` : null,
    role: e.role, axName: e.axName || e.accessibleName || null,
  }));
}
function axeView(collect) {
  return (collect.axe || []).map((a) => `${a.ruleId || a.id}:${(a.targetXpaths && a.targetXpaths[0]) || a.target || ''}`).sort();
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const cases = loadCases();
  const target = cases.find((c) => c.__target);
  console.log(`ebd-probe: target ${target.testcaseId.slice(0,8)} (${target.sc}) + ${cases.length - 1} fillers | ${RUNS} runs | pages=${PAGE_CONC}`);
  const runs = [];
  for (let run = 0; run < RUNS; run++) {
    const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const alloc = createTabAllocator({ browser, maxTabs: MAX_TABS });
    const instGate = makeSemaphore(Math.max(1, Math.min(PAGE_CONC, 4)));
    let cursor = 0; let captured = null;
    const worker = async () => {
      while (true) {
        const i = cursor++; if (i >= cases.length) return; const tc = cases[i]; const runId = `ebd-${run}-${tc.testcaseId}`;
        try {
          const lease = await alloc.acquire(); let collect;
          try { collect = normalizeCollectRoles(await collectActPage(lease.page, { url: urlFor(tc), elementCap: LIMITS.act.elementCap, file: `act:${tc.testcaseId}`, runId, runAxe: true, axePath: AXE_PATH })); }
          finally { await lease.release(); }
          const drive = { file: collect.file, runId, pageDigest: collect.pageDigest, drivenAt: collect.collectedAt + 1, elements: [] };
          let snap = null;
          const res = await orchestrate(collect, drive, {
            resolveUrl: () => urlFor(tc), executablePath: CHROME, browser, tabAllocator: alloc, maxTabs: MAX_TABS,
            runInstruments: true, instrumentsGate: instGate, instrumentsTimeoutMs: 90000, now: collect.collectedAt + 2,
            restrictScs: new Set(tc.sc || []), maxAutomatic: LIMITS.act.maxAuto, budgetOpts: { maxRunWallClockMs: LIMITS.act.runWallClockMs },
            experimentConcurrency: Math.min(LIMITS.concurrency.experimentCap, LIMITS.concurrency.experiment),
            runLlm: true, runAgent: noopAgent, captureVision: true, llmConcurrency: 8,
            onLlmInputs: tc.__target ? (s) => { snap = s; } : undefined,
          });
          if (tc.__target) {
            const led = ((res.built && res.built.results && res.built.results.obligationLedger) || []).filter((r) => r.sc === '1.1.1');
            const subjects = snap ? [...(snap.agentSubjects || []), ...(snap.rubricSubjects || [])].map((x) => `${x.sc}|${x.skill || x.rubricId}`) : [];
            captured = {
              img: imgFacts(collect), axe: axeView(collect),
              ledger111: led.map((r) => ({ obl: r.obligationId, disp: r.disposition, ap: !!r.autoPartial, by: r.decidedBy || null })),
              subjects, pageDigest: collect.pageDigest,
            };
          }
        } catch (e) { if (tc.__target) captured = { error: String(e && e.message || e) }; }
      }
    };
    await Promise.all(Array.from({ length: Math.min(PAGE_CONC, cases.length) }, () => worker()));
    alloc.close(); await browser.close().catch(() => {});
    runs.push(captured);
    console.log(`  run ${run + 1}/${RUNS}: subjects=${captured && captured.subjects ? captured.subjects.length : '?'} | ledger111=${captured && captured.ledger111 ? JSON.stringify(captured.ledger111.map((r) => r.ap ? 'ap' : 'AP')) : '?'} | pageDigest=${captured && captured.pageDigest ? String(captured.pageDigest).slice(0,8) : '?'}`);
  }
  fs.writeFileSync(path.join(OUT, 'ebd.json'), JSON.stringify(runs, null, 2));
  // diff
  const fields = ['img', 'axe', 'ledger111', 'subjects', 'pageDigest'];
  console.log(`\n=== which target field varies across ${RUNS} runs ===`);
  for (const f of fields) {
    const vals = runs.map((r) => JSON.stringify(r && r[f]));
    const uniq = [...new Set(vals)];
    console.log(`  ${f.padEnd(11)} ${uniq.length === 1 ? 'STABLE' : uniq.length + ' DISTINCT'}`);
    if (uniq.length > 1) uniq.forEach((u, i) => console.log(`     variant${i}: ${String(u).slice(0, 240)}`));
  }
  console.log(`\nwrote ${path.join(OUT, 'ebd.json')}`);
}
main().catch((e) => { console.error(e && e.stack || e); process.exit(1); });
