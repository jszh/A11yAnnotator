#!/usr/bin/env node
'use strict';
// FREEZE the LLM-judge inputs for the reaches-LLM ACT set so FP-reduction experiments can REPLAY the judge over
// identical evidence (no browser, evidence held exactly fixed). One tools-OFF pass also serves as baseline run #0.
//
// Per case it runs collect → deterministic orchestrate → vision capture, and (via the additive orchestrator
// `onLlmInputs` hook) snapshots: the selected agent/rubric subjects, the per-subject evidence (visionByXpath
// crops + VSR transcript + checker hints), and the PRELIMINARY deterministic build (for scoring). The judge runs
// single-shot (tools OFF) so this pass is also a scored baseline.
//
// Output:
//   <packsDir>/<testcaseId>.json   one evidence pack per case
//   results/<out>/results.json     baseline-0 scored results (run-fn-llm format)  [also summary.json]
//
// Usage:
//   node freeze-and-baseline.js --out=fp-base0 --packs=results/fp-packs
//   node freeze-and-baseline.js --scs=1.1.1,1.4.3,1.4.5,2.4.4,4.1.2 --out=fp-base0-probe
//   node freeze-and-baseline.js --limit=6 --out=fp-smoke           # smoke test

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

function arg(name, def = null) {
  const p = process.argv.find((x) => x === `--${name}` || x.startsWith(`--${name}=`));
  if (!p) return def;
  if (p === `--${name}`) return true;
  return p.slice(name.length + 3);
}

const CHROME = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SUBSET_DIR = path.join(__dirname, '..', 'act-subset');
const AXE_PATH = process.env.AXE_PATH || path.join(REPO_ROOT, 'axe.min.js');
const LIMIT = Number(arg('limit', 0));
const SCS = (arg('scs', null) || '').split(',').map((s) => s.trim()).filter(Boolean);
const CASES_FILE = arg('cases', null);
const PAGE_CONC = Number(arg('pages', 8));
const MAX_TABS = Math.min(LIMITS.concurrency.maxTabs, Number(arg('max-tabs', LIMITS.concurrency.maxTabs)));
const GLOBAL_LLM = Math.min(LIMITS.concurrency.llm, Number(arg('global-llm', LIMITS.concurrency.llm)));
const RUN_NAME = arg('out', null) || 'fp-base0';
const PACKS_DIR = path.isAbsolute(arg('packs', '') || '') ? arg('packs') : path.join(REPO_ROOT, arg('packs', null) || 'results/fp-experiments/packs');
const OUT = path.join(REPO_ROOT, 'results/fp-experiments/runs', RUN_NAME);
const MODEL = process.env.V3_LLM_MODEL || 'claude-sonnet-4-6';
const ELEMENT_CAP = LIMITS.act.elementCap;
const RUN_WALL = LIMITS.act.runWallClockMs;

const TRANSPORT = {
  oauthToken: process.env.CLAUDE_CODE_OAUTH_TOKEN, model: MODEL,
  effort: process.env.V3_LLM_EFFORT || 'medium',
  perTurnTimeoutMs: +(process.env.V3_LLM_TURN_TIMEOUT_MS || LIMITS.llm.perTurnTimeoutMs),
  runTimeoutMs: +(process.env.V3_LLM_RUN_TIMEOUT_MS || LIMITS.llm.runTimeoutMs),
};

function loadReachesLlmCases() {
  const RAW = path.join(REPO_ROOT, 'eval/checker-comparison/upstream-evidence/v3-act-subset-proposed/raw.json');
  const raw = JSON.parse(fs.readFileSync(RAW, 'utf8'));
  const out = [];
  for (const r of raw) {
    if (r.error || r.axeFlag || r.v3Flag) continue;
    const localPath = path.join('pages', r.ruleId, r.testcaseId + '.html');
    if (!fs.existsSync(path.join(SUBSET_DIR, localPath))) continue;
    out.push({ ruleId: r.ruleId, ruleName: r.ruleName, testcaseId: r.testcaseId, expected: r.expected, sc: r.sc, localPath, url: r.url, draft: r.approved === false });
  }
  return out;
}
const urlFor = (tc) => 'file://' + path.join(SUBSET_DIR, tc.localPath);

// keep only the JSON-serializable parts of pOpts the replay needs (drop runAgent/afterEach/budget functions)
function freezePOpts(p) {
  return {
    toolsEnabled: false, // freeze pass is single-shot; replay is single-shot too
    transcriptByXpath: p.transcriptByXpath || null,
    visionByXpath: p.visionByXpath || {},
    checkerHintsByXpath: p.checkerHintsByXpath || {},
    file: p.file, runId: p.runId, pageDigest: p.pageDigest,
    llmConcurrency: p.llmConcurrency,
  };
}

const sem = makeSemaphore(GLOBAL_LLM);
const instGate = makeSemaphore(Math.max(1, Math.min(PAGE_CONC, 4)));   // shared cap on concurrent kbd-driving instrument lanes
const baseAgent = makeRunAgent({ transport: makeClaudeSdkTransport(TRANSPORT), model: MODEL });
const runAgent = (messages, subject) => sem.run(() => baseAgent(messages, subject));

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(PACKS_DIR, { recursive: true });
  let cases = loadReachesLlmCases();
  if (SCS.length) cases = cases.filter((c) => (c.sc || []).some((s) => SCS.includes(s)));
  if (CASES_FILE) { const ids = new Set(fs.readFileSync(CASES_FILE, 'utf8').split(/\s+/).filter(Boolean)); cases = cases.filter((c) => ids.has(c.testcaseId)); }
  if (LIMIT > 0) cases = cases.slice(0, LIMIT);
  if (!process.env.CLAUDE_CODE_OAUTH_TOKEN) { console.error('FATAL: CLAUDE_CODE_OAUTH_TOKEN not set (.env)'); process.exit(1); }
  console.log(`FREEZE+baseline: ${cases.length} cases | model=${MODEL} effort=${TRANSPORT.effort} tools=OFF | packs→${PACKS_DIR} results→${OUT}`);

  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const alloc = createTabAllocator({ browser, maxTabs: MAX_TABS });
  const results = [];
  let cursor = 0, done = 0, frozen = 0;
  const t0 = Date.now();

  const worker = async () => {
    while (true) {
      const i = cursor++;
      if (i >= cases.length) return;
      const tc = cases[i];
      const runId = `fp-${tc.testcaseId}`;
      let rec;
      try {
        const lease = await alloc.acquire();
        let collect;
        try {
          collect = normalizeCollectRoles(await collectActPage(lease.page, {
            url: urlFor(tc), elementCap: ELEMENT_CAP, file: `act:${tc.testcaseId}`, runId, sourceUrl: tc.url,
            runAxe: true, axePath: AXE_PATH,
          }));
        } finally { await lease.release(); }
        const drive = { file: collect.file, runId, pageDigest: collect.pageDigest, drivenAt: collect.collectedAt + 1, elements: [] };
        let snapshot = null;
        const out = await orchestrate(collect, drive, {
          resolveUrl: () => urlFor(tc), executablePath: CHROME, browser, tabAllocator: alloc, maxTabs: MAX_TABS,
          runInstruments: true, instrumentsGate: instGate, instrumentsTimeoutMs: 90000,
          now: collect.collectedAt + 2,
          restrictScs: new Set(tc.sc || []),
          maxAutomatic: LIMITS.act.maxAuto, budgetOpts: { maxRunWallClockMs: RUN_WALL },
          experimentConcurrency: Math.min(LIMITS.concurrency.experimentCap, LIMITS.concurrency.experiment),
          runLlm: true, runAgent, captureVision: true,   // tools OFF (no llmTools)
          llmConcurrency: GLOBAL_LLM,
          // FREEZE: snapshot the exact judge inputs + the preliminary deterministic build
          onLlmInputs: ({ agentSubjects, rubricSubjects, pOpts, built }) => {
            snapshot = {
              tc,
              agentSubjects, rubricSubjects,
              pOpts: freezePOpts(pOpts),
              built: built ? { ok: built.ok, results: { shadowObservations: built.results.shadowObservations, obligationLedger: built.results.obligationLedger } } : null,
            };
          },
        });
        rec = scoreCase(tc, out);
        if (snapshot) { fs.writeFileSync(path.join(PACKS_DIR, tc.testcaseId + '.json'), JSON.stringify(snapshot)); frozen++; }
      } catch (e) {
        rec = { testcaseId: tc.testcaseId, ruleId: tc.ruleId, sc: tc.sc, expected: tc.expected, outcome: 'error', error: String((e && e.message) || e) };
      }
      results.push(rec);
      done++;
      if (done % 20 === 0 || done === cases.length) {
        const s = summarize(results);
        console.log(`  ${done}/${cases.length}  frozen=${frozen}  recall=${s.recall.caught}/${s.recall.failedN} FP=${s.specificity.falsePositive}/${s.specificity.n}  (${Math.round((Date.now() - t0) / 1000)}s)`);
        fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(PAGE_CONC, cases.length || 1) }, () => worker()));
  alloc.close(); await browser.close().catch(() => {});
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summarize(results), null, 2));
  printSummary(results, `freeze+baseline-0 (${RUN_NAME}, tools OFF)`);
  console.log(`\nfroze ${frozen} packs → ${PACKS_DIR}\nbaseline-0 results → ${OUT}`);
}
main().catch((e) => { console.error(e && e.stack || e); process.exit(1); });
