#!/usr/bin/env node
'use strict';
// Q2 (faithful) — reproduce the RESIDUAL vision crop drift under the REAL pipeline contention (collect + experiments
// + instruments + vision, the same load as the variance runs), with settle ON, and SAVE the distinct crop PNGs for a
// target case so the actual pixel difference can be eyeballed. The isolated vision-only probe under-reproduces it
// because the experiment/instruments lanes are the real CPU hogs. NO LLM (noop judge). Grabs crops via onLlmInputs.
//
// Usage: V3_SETTLE_WAIT=1 node vision-residual-probe.js --save=8e6c190e --scs=2.4.4 --runs=4 --pages=16 --out=fp-vres
const fs = require('fs'); const path = require('path'); const crypto = require('crypto');
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
const SCS = (arg('scs', '2.4.4') || '').split(',').map((s) => s.trim()).filter(Boolean);
const RUNS = Number(arg('runs', 4)); const PAGE_CONC = Number(arg('pages', 16));
const SAVE = arg('save', '8e6c190e'); const LIMIT = Number(arg('limit', 0));
const MAX_TABS = LIMITS.concurrency.maxTabs;
const OUT = path.join(REPO_ROOT, 'results/fp-experiments/runs', arg('out', 'fp-vres'));
const sha = (s) => crypto.createHash('sha256').update(String(s || '')).digest('hex').slice(0, 10);

function loadCases() {
  const RAW = path.join(REPO_ROOT, 'eval/checker-comparison/upstream-evidence/v3-act-subset-proposed/raw.json');
  const raw = JSON.parse(fs.readFileSync(RAW, 'utf8'));
  let out = []; const seen = new Set();
  for (const r of raw) {
    if (r.error || r.axeFlag || r.v3Flag) continue;
    if (SCS.length && !(r.sc || []).some((s) => SCS.includes(s))) continue;
    if (seen.has(r.testcaseId)) continue; seen.add(r.testcaseId);
    const localPath = path.join('pages', r.ruleId, r.testcaseId + '.html');
    if (!fs.existsSync(path.join(SUBSET_DIR, localPath))) continue;
    out.push({ ruleId: r.ruleId, testcaseId: r.testcaseId, expected: r.expected, sc: r.sc, localPath });
  }
  if (LIMIT > 0) out = out.slice(0, LIMIT);
  // ensure the save-target is present
  if (!out.some((c) => c.testcaseId.startsWith(SAVE))) {
    for (const r of raw) { if (r.testcaseId.startsWith(SAVE) && !out.some((c) => c.testcaseId === r.testcaseId)) { const lp = path.join('pages', r.ruleId, r.testcaseId + '.html'); if (fs.existsSync(path.join(SUBSET_DIR, lp))) out.push({ ruleId: r.ruleId, testcaseId: r.testcaseId, expected: r.expected, sc: r.sc, localPath: lp }); break; } }
  }
  return out;
}
const urlFor = (tc) => 'file://' + path.join(SUBSET_DIR, tc.localPath);
const noopAgent = async () => null;
const cropStore = {}; // xpath -> state -> Map(sha->base64)

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const cases = loadCases();
  console.log(`vision-residual: ${cases.length} cases × ${RUNS} runs | pages=${PAGE_CONC} | settle=${process.env.V3_SETTLE_WAIT === '1' ? 'ON' : 'off'} | save-target=${SAVE}`);
  for (let run = 0; run < RUNS; run++) {
    const t0 = Date.now();
    const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const alloc = createTabAllocator({ browser, maxTabs: MAX_TABS });
    const instGate = makeSemaphore(Math.max(1, Math.min(PAGE_CONC, 4)));
    let cursor = 0;
    const worker = async () => {
      while (true) {
        const i = cursor++; if (i >= cases.length) return; const tc = cases[i]; const runId = `vr-${run}-${tc.testcaseId}`;
        try {
          const lease = await alloc.acquire(); let collect;
          try { collect = normalizeCollectRoles(await collectActPage(lease.page, { url: urlFor(tc), elementCap: LIMITS.act.elementCap, file: `act:${tc.testcaseId}`, runId, runAxe: true, axePath: AXE_PATH })); }
          finally { await lease.release(); }
          const drive = { file: collect.file, runId, pageDigest: collect.pageDigest, drivenAt: collect.collectedAt + 1, elements: [] };
          const isTarget = tc.testcaseId.startsWith(SAVE);
          await orchestrate(collect, drive, {
            resolveUrl: () => urlFor(tc), executablePath: CHROME, browser, tabAllocator: alloc, maxTabs: MAX_TABS,
            runInstruments: true, instrumentsGate: instGate, instrumentsTimeoutMs: 90000, now: collect.collectedAt + 2,
            restrictScs: new Set(tc.sc || []), maxAutomatic: LIMITS.act.maxAuto, budgetOpts: { maxRunWallClockMs: LIMITS.act.runWallClockMs },
            experimentConcurrency: Math.min(LIMITS.concurrency.experimentCap, LIMITS.concurrency.experiment),
            runLlm: true, runAgent: noopAgent, captureVision: true, llmConcurrency: 8,
            onLlmInputs: isTarget ? (s) => {
              const vbx = (s.pOpts && s.pOpts.visionByXpath) || {};
              for (const xp of Object.keys(vbx)) for (const st of Object.keys(vbx[xp] || {})) {
                const b = vbx[xp][st]; if (!b) continue;
                ((cropStore[xp] = cropStore[xp] || {})[st] = cropStore[xp][st] || new Map()).set(sha(b), b);
              }
            } : undefined,
          });
        } catch (e) { /* ignore */ }
      }
    };
    await Promise.all(Array.from({ length: Math.min(PAGE_CONC, cases.length) }, () => worker()));
    alloc.close(); await browser.close().catch(() => {});
    console.log(`  run ${run + 1}/${RUNS} (${Math.round((Date.now() - t0) / 1000)}s)`);
  }
  // report + write distinct variants
  let anyDrift = false;
  for (const xp of Object.keys(cropStore)) for (const st of Object.keys(cropStore[xp])) {
    const m = cropStore[xp][st]; const n = m.size;
    console.log(`  ${st.padEnd(18)} ${xp} → ${n === 1 ? 'STABLE' : n + ' DISTINCT'}`);
    if (n > 1) { anyDrift = true; const tag = xp.replace(/[^a-z0-9]/gi, '_').slice(-26) + '__' + st; [...m.entries()].forEach(([h, b], idx) => fs.writeFileSync(path.join(OUT, `${tag}__v${idx}_${h}.png`), Buffer.from(b, 'base64'))); }
  }
  console.log(anyDrift ? `\ndistinct variants written under ${OUT}` : `\nno drift captured for ${SAVE} this run`);
}
main().catch((e) => { console.error(e && e.stack || e); process.exit(1); });
