#!/usr/bin/env node
'use strict';
// FREEZE the LLM-judge inputs for eval/act-augmented cases, so replay-judge.js can re-run ONLY the judge over
// byte-identical evidence. Rubric edits must be measured this way, not by two full-pipeline runs: the
// full-pipeline FP noise floor is ±3 while the frozen-evidence replay floor is sd≈1.06, so a prompt change
// worth a few FPs is invisible under the former and legible under the latter.
//
// Sibling of freeze-and-baseline.js (paper act-subset) and freeze-actrest-133.js (ACT-REST). Those two are
// hard-wired to their own corpora — `SUBSET_DIR`/`urlFor` there resolve inside act-subset, and `--cases` only
// FILTERS that corpus rather than replacing it — so neither can target act-augmented pages. Pack shape is
// identical to both, so replay-judge.js consumes these unchanged.
//
// The judge is STUBBED here by default (`--stub`, on unless --live): this pass exists to capture evidence, and
// a baseline judged with the rubric text we are about to change is not a baseline for anything. Run the two
// scored variants as replays over these packs instead. --live restores a real judge if a genuine
// full-pipeline baseline-0 is wanted.
//
// Usage:
//   node freeze-augmented.js --scs=1.1.1,1.3.1 --packs=results/fp-experiments/packs-aug --out=fp-aug-freeze
//   V3_LLM_MODEL=gemini-3.5-flash-lite node freeze-augmented.js --scs=1.1.1 --live --out=fp-aug-base0

const fs = require('fs');
const path = require('path');
const REPO_ROOT = path.join(__dirname, '..', '..', '..');
require('../../../scripts/v3/lib/load-env.js').loadEnv(REPO_ROOT);

const puppeteer = require('puppeteer');
const { orchestrate } = require('../../../scripts/v3/lib/orchestrator.js');
const { createTabAllocator } = require('../../../scripts/v3/lib/tab-allocator.js');
const { createBrowserShardPool } = require('../../../scripts/v3/lib/browser-shard-pool.js');
const { collectActPage, normalizeCollectRoles } = require('../../../scripts/v3/lib/act-page-collect.js');
const { makeRunAgent, makeGeminiTransport, makeClaudeSdkTransport } = require('../../../scripts/v3/lib/llm-agent-adapter.js');
const { makeSemaphore } = require('../../../scripts/v3/lib/run-telemetry.js');
const LIMITS = require('../../../scripts/v3/lib/limits.js');
const { scoreCase, printSummary, summarize } = require('./score-lib.js');
const { BROWSER_ARGS } = require('../../../scripts/v3/lib/browser-args.js');

function arg(name, def = null) {
  const p = process.argv.find((x) => x === `--${name}` || x.startsWith(`--${name}=`));
  if (!p) return def;
  if (p === `--${name}`) return true;
  return p.slice(name.length + 3);
}

const CHROME = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const CASE_LIST = arg('cases', path.join(REPO_ROOT, 'eval/act-augmented/_tools/full-supplementary-585-cases.json'));
const SCS = (arg('scs', null) || '').split(',').map((s) => s.trim()).filter(Boolean);
const LIMIT = Number(arg('limit', 0));
const PAGE_CONC = Number(arg('pages', 8));
// `--max-tabs` is the RUN-WIDE budget; `--browsers` partitions it across independent Chromium processes.
// A single browser tops out well below what the box can do — at 16 workers on one browser this freeze ran
// tab-limited at ~7 s/case with load 5.5/16, i.e. idle CPU behind a context cap, which is exactly the
// exhaustion the shard pool exists to avoid. The cap is lifted here because LIMITS.concurrency.maxTabs is
// sized for ONE browser; the pool splits the aggregate across shards and self-heals a wedged one.
const MAX_TABS = Number(arg('max-tabs', LIMITS.concurrency.maxTabs));
const BROWSER_SHARDS = Math.max(1, Math.min(Number(arg('pages', 8)), MAX_TABS, Math.floor(Number(arg('browsers', 1)) || 1)));
const GLOBAL_LLM = Math.min(LIMITS.concurrency.llm, Number(arg('global-llm', LIMITS.concurrency.llm)));
const RUN_NAME = arg('out', null) || 'fp-aug-freeze';
const PACKS_DIR = path.isAbsolute(arg('packs', '') || '') ? arg('packs') : path.join(REPO_ROOT, arg('packs', null) || 'results/fp-experiments/packs-aug');
const OUT = path.join(REPO_ROOT, 'results/fp-experiments/runs', RUN_NAME);
const LIVE = !!arg('live', false);
const PROVIDER = arg('provider', 'gemini');
const MODEL = process.env.V3_LLM_MODEL || 'gemini-3.5-flash-lite';
const AXE_PATH = process.env.AXE_PATH || path.join(REPO_ROOT, 'axe.min.js');
const ELEMENT_CAP = LIMITS.act.elementCap;
const RUN_WALL = LIMITS.act.runWallClockMs;

// act-augmented's list carries {key, sc, aspect, id, file, expected, source}; normalize to the `tc` shape the
// scorer and the packs use (sc as an ARRAY — restrictScs and scoreCase both iterate it).
function loadCases() {
  const raw = JSON.parse(fs.readFileSync(CASE_LIST, 'utf8'));
  let cases = raw.map((c) => ({
    testcaseId: 'aug-' + String(c.key || '').replace(/::/g, '-'),
    ruleId: c.aspect || c.key, ruleName: c.aspect || c.key,
    sc: Array.isArray(c.sc) ? c.sc : [c.sc],
    expected: c.expected, key: c.key, source: c.source,
    localFile: path.join(REPO_ROOT, c.file), url: 'file://' + path.join(REPO_ROOT, c.file),
  })).filter((c) => fs.existsSync(c.localFile));
  if (SCS.length) cases = cases.filter((c) => c.sc.some((s) => SCS.includes(s)));
  if (LIMIT > 0) cases = cases.slice(0, LIMIT);
  return cases;
}

function freezePOpts(pOpts) {
  if (!pOpts || typeof pOpts !== 'object') return pOpts;
  const out = {};
  for (const [k, v] of Object.entries(pOpts)) if (typeof v !== 'function') out[k] = v;
  return out;
}

const sem = makeSemaphore(GLOBAL_LLM);
// STUB: capture evidence without spending. A null reply is the adapter's own transport-failure shape, so the
// orchestrator records no verdicts and the packs still carry every judge INPUT — which is all a replay needs.
const stubAgent = async () => null;
const liveAgent = (() => {
  const transport = PROVIDER === 'gemini'
    ? makeGeminiTransport({ apiKey: process.env.GEMINI_API_KEY, model: MODEL })
    : makeClaudeSdkTransport({});
  const base = makeRunAgent({ transport, model: MODEL });
  return (messages, subject) => sem.run(() => base(messages, subject));
})();
const runAgent = LIVE ? liveAgent : stubAgent;

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(PACKS_DIR, { recursive: true });
  const cases = loadCases();
  if (LIVE && PROVIDER === 'gemini' && !process.env.GEMINI_API_KEY) { console.error('FATAL: GEMINI_API_KEY not set (.env)'); process.exit(1); }
  console.log(`FREEZE(augmented): ${cases.length} cases | judge=${LIVE ? PROVIDER + '/' + MODEL : 'STUB (evidence only)'} | pages=${PAGE_CONC} tabs=${MAX_TABS} browsers=${BROWSER_SHARDS} | packs→${PACKS_DIR}`);

  const pool = await createBrowserShardPool({
    browserCount: BROWSER_SHARDS, totalTabs: MAX_TABS,
    launchBrowser: () => puppeteer.launch({ executablePath: CHROME, headless: 'new', args: BROWSER_ARGS, protocolTimeout: 300000 }),
    createAllocator: (browser, cap) => createTabAllocator({ browser, maxTabs: cap }),
  });
  const results = [];
  let cursor = 0, done = 0, frozen = 0;
  const t0 = Date.now();

  const worker = async (workerIndex) => {
    const shard = pool.shardFor(workerIndex);
    while (true) {
      const i = cursor++;
      if (i >= cases.length) return;
      const tc = cases[i];
      const runId = `fpaug-${tc.testcaseId}`;
      let rec;
      try {
        if (shard.healing) await shard.healing;
        const lease = await shard.alloc.acquire();
        let collect;
        try {
          collect = normalizeCollectRoles(await collectActPage(lease.page, {
            url: tc.url, elementCap: ELEMENT_CAP, file: `aug:${tc.testcaseId}`, runId, sourceUrl: tc.url,
            runAxe: true, axePath: AXE_PATH,
          }));
        } finally { await lease.release(); }
        const drive = { file: collect.file, runId, pageDigest: collect.pageDigest, drivenAt: collect.collectedAt + 1, elements: [] };
        let snapshot = null;
        const out = await orchestrate(collect, drive, {
          resolveUrl: () => tc.url, executablePath: CHROME, browser: shard.browser, tabAllocator: shard.alloc, maxTabs: shard.cap,
          runInstruments: true, instrumentsTimeoutMs: 180000,
          now: collect.collectedAt + 2,
          restrictScs: new Set(tc.sc || []),
          maxAutomatic: LIMITS.act.maxAuto, budgetOpts: { maxRunWallClockMs: RUN_WALL },
          experimentConcurrency: Math.min(LIMITS.concurrency.experimentCap, LIMITS.concurrency.experiment),
          runLlm: true, runAgent, captureVision: true,
          llmConcurrency: GLOBAL_LLM,
          onLlmInputs: ({ agentSubjects, rubricSubjects, pOpts, built }) => {
            snapshot = {
              tc, agentSubjects, rubricSubjects,
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
        console.log(`  ${done}/${cases.length}  frozen=${frozen}  (${Math.round((Date.now() - t0) / 1000)}s)`);
        fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(PAGE_CONC, cases.length || 1) }, (_, w) => worker(w)));
  await pool.close().catch(() => {});
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summarize(results), null, 2));
  const subjectBearing = fs.readdirSync(PACKS_DIR).filter((f) => f.endsWith('.json')).length;
  console.log(`\nfroze ${frozen} packs (${subjectBearing} on disk) → ${PACKS_DIR}`);
  if (LIVE) printSummary(results, `freeze+baseline-0 (${RUN_NAME})`);
}
main().catch((e) => { console.error(e && e.stack || e); process.exit(1); });
