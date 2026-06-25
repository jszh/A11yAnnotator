#!/usr/bin/env node
'use strict';
// FREEZE the judge inputs for the HELD-OUT eval/act-augmented/ corpus (hand-built, harness never tuned on it) so a
// winning FP-method can be validated for GENERALIZATION (not memorization) + RECALL PRESERVATION. Same freeze
// mechanism as freeze-and-baseline.js, but the case loader reads act-augmented result.json pages instead of the ACT
// raw.json. The held-out FP-SC slice is recall-heavy (≈217 GT-fail / 42 GT-pass), so it doubles as a strong check
// that an FP-suppressing method does not silently drop real barriers.
//
// Usage: node freeze-heldout.js --scs=1.1.1,1.4.3,1.4.5,2.4.4,2.4.6,4.1.2 --out=fp-heldout-base0 --packs=results/fp-packs-heldout

const fs = require('fs');
const path = require('path');
const REPO_ROOT = path.join(__dirname, '..', '..', '..');
require('../../../scripts/v3/lib/load-env.js').loadEnv(REPO_ROOT);
const { orchestrate } = require('../../../scripts/v3/lib/orchestrator.js');
const { createTabAllocator } = require('../../../scripts/v3/lib/tab-allocator.js');
const { makeRunAgent, makeClaudeSdkTransport } = require('../../../scripts/v3/lib/llm-agent-adapter.js');
const { collectActPage, normalizeCollectRoles } = require('../../../scripts/v3/lib/act-page-collect.js');
const { makeSemaphore } = require('../../../scripts/v3/lib/run-telemetry.js');
const LIMITS = require('../../../scripts/v3/lib/limits.js');
const { scoreCase, printSummary, summarize } = require('./score-lib.js');
const puppeteer = require('puppeteer');

function arg(name, def = null) { const p = process.argv.find((x) => x === `--${name}` || x.startsWith(`--${name}=`)); if (!p) return def; if (p === `--${name}`) return true; return p.slice(name.length + 3); }
const CHROME = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const AUG_DIR = path.join(REPO_ROOT, 'eval/act-augmented');
const AXE_PATH = process.env.AXE_PATH || path.join(REPO_ROOT, 'axe.min.js');
const SCS = (arg('scs', null) || '1.1.1,1.4.3,1.4.5,2.4.4,2.4.6,4.1.2').split(',').map((s) => s.trim()).filter(Boolean);
const LIMIT = Number(arg('limit', 0));
const PAGE_CONC = Number(arg('pages', 8));
const MAX_TABS = Math.min(LIMITS.concurrency.maxTabs, Number(arg('max-tabs', LIMITS.concurrency.maxTabs)));
const GLOBAL_LLM = Math.min(LIMITS.concurrency.llm, Number(arg('global-llm', LIMITS.concurrency.llm)));
const RUN_NAME = arg('out', null) || 'fp-heldout-base0';
const PACKS_DIR = path.join(REPO_ROOT, arg('packs', null) || 'results/fp-experiments/packs-heldout');
const OUT = path.join(REPO_ROOT, 'results/fp-experiments/runs', RUN_NAME);
const MODEL = process.env.V3_LLM_MODEL || 'claude-sonnet-4-6';
const TRANSPORT = { oauthToken: process.env.CLAUDE_CODE_OAUTH_TOKEN, model: MODEL, effort: process.env.V3_LLM_EFFORT || 'medium', perTurnTimeoutMs: +(process.env.V3_LLM_TURN_TIMEOUT_MS || LIMITS.llm.perTurnTimeoutMs), runTimeoutMs: +(process.env.V3_LLM_RUN_TIMEOUT_MS || LIMITS.llm.runTimeoutMs) };

const safe = (s) => String(s).replace(/[^a-z0-9_]+/gi, '-').slice(0, 80);
function loadHeldoutCases() {
  const out = [];
  for (const sc of SCS) {
    const rp = path.join(AUG_DIR, sc, 'result.json');
    if (!fs.existsSync(rp)) continue;
    const r = JSON.parse(fs.readFileSync(rp, 'utf8'));
    for (const ar of (r.aspectResults || [])) {
      const aspect = (ar.built && ar.built.aspectSlug) || ar.aspect || 'aspect';
      for (const p of ((ar.built && ar.built.pages) || [])) {
        const abs = path.join(REPO_ROOT, p.file);
        if (!fs.existsSync(abs)) continue;
        out.push({ testcaseId: `ha-${sc}-${safe(aspect)}-${safe(p.id)}`, ruleId: safe(aspect), ruleName: p.scenario || aspect, sc: [sc], expected: p.expected, localAbs: abs, url: 'file://' + abs, draft: false });
      }
    }
  }
  return out;
}

function freezePOpts(p) { return { toolsEnabled: false, transcriptByXpath: p.transcriptByXpath || null, visionByXpath: p.visionByXpath || {}, checkerHintsByXpath: p.checkerHintsByXpath || {}, file: p.file, runId: p.runId, pageDigest: p.pageDigest, llmConcurrency: p.llmConcurrency }; }

const sem = makeSemaphore(GLOBAL_LLM);
const instGate = makeSemaphore(Math.max(1, Math.min(PAGE_CONC, 4)));
const baseAgent = makeRunAgent({ transport: makeClaudeSdkTransport(TRANSPORT), model: MODEL });
const runAgent = (messages, subject) => sem.run(() => baseAgent(messages, subject));

async function main() {
  fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(PACKS_DIR, { recursive: true });
  let cases = loadHeldoutCases();
  if (LIMIT > 0) cases = cases.slice(0, LIMIT);
  if (!process.env.CLAUDE_CODE_OAUTH_TOKEN) { console.error('FATAL: CLAUDE_CODE_OAUTH_TOKEN not set'); process.exit(1); }
  console.log(`FREEZE held-out: ${cases.length} pages | SCs=${SCS.join(',')} | tools=OFF | packs→${PACKS_DIR}`);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const alloc = createTabAllocator({ browser, maxTabs: MAX_TABS });
  const results = []; let cursor = 0, done = 0, frozen = 0; const t0 = Date.now();
  const worker = async () => {
    while (true) {
      const i = cursor++; if (i >= cases.length) return; const tc = cases[i]; const runId = `ha-${tc.testcaseId}`; let rec;
      try {
        const lease = await alloc.acquire(); let collect;
        try { collect = normalizeCollectRoles(await collectActPage(lease.page, { url: tc.url, elementCap: LIMITS.act.elementCap, file: `aug:${tc.testcaseId}`, runId, sourceUrl: tc.url, runAxe: true, axePath: AXE_PATH })); }
        finally { await lease.release(); }
        const drive = { file: collect.file, runId, pageDigest: collect.pageDigest, drivenAt: collect.collectedAt + 1, elements: [] };
        let snapshot = null;
        const out = await orchestrate(collect, drive, {
          resolveUrl: () => tc.url, executablePath: CHROME, browser, tabAllocator: alloc, maxTabs: MAX_TABS,
          runInstruments: true, instrumentsGate: instGate, instrumentsTimeoutMs: 90000, now: collect.collectedAt + 2,
          restrictScs: new Set(tc.sc || []), maxAutomatic: LIMITS.act.maxAuto, budgetOpts: { maxRunWallClockMs: LIMITS.act.runWallClockMs },
          experimentConcurrency: Math.min(LIMITS.concurrency.experimentCap, LIMITS.concurrency.experiment),
          runLlm: true, runAgent, captureVision: true, llmConcurrency: GLOBAL_LLM,
          onLlmInputs: ({ agentSubjects, rubricSubjects, pOpts, built }) => { snapshot = { tc, agentSubjects, rubricSubjects, pOpts: freezePOpts(pOpts), built: built ? { ok: built.ok, results: { shadowObservations: built.results.shadowObservations, obligationLedger: built.results.obligationLedger } } : null }; },
        });
        rec = scoreCase(tc, out);
        if (snapshot) { fs.writeFileSync(path.join(PACKS_DIR, tc.testcaseId + '.json'), JSON.stringify(snapshot)); frozen++; }
      } catch (e) { rec = { testcaseId: tc.testcaseId, ruleId: tc.ruleId, sc: tc.sc, expected: tc.expected, outcome: 'error', error: String((e && e.message) || e) }; }
      results.push(rec); done++;
      if (done % 20 === 0 || done === cases.length) { const s = summarize(results); console.log(`  ${done}/${cases.length} frozen=${frozen} recall=${s.recall.caught}/${s.recall.failedN} FP=${s.specificity.falsePositive}/${s.specificity.n} (${Math.round((Date.now() - t0) / 1000)}s)`); fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2)); }
    }
  };
  await Promise.all(Array.from({ length: Math.min(PAGE_CONC, cases.length || 1) }, () => worker()));
  alloc.close(); await browser.close().catch(() => {});
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summarize(results), null, 2));
  printSummary(results, `held-out freeze+baseline (${RUN_NAME}, tools OFF)`);
  console.log(`froze ${frozen} packs → ${PACKS_DIR}`);
}
main().catch((e) => { console.error(e && e.stack || e); process.exit(1); });
