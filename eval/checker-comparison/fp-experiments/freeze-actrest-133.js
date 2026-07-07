#!/usr/bin/env node
'use strict';
// FREEZE the LLM-judge inputs for the ACT-REST 1.3.3 (9bd38c) cases, so the fixed-evidence replay harness
// (replay-judge.js) can re-run ONLY the judge over byte-identical evidence and separate the rubric effect from
// the judge's own sampling noise (full-pipeline noise floor is ±3; the frozen-evidence replay floor is sd≈1.06).
//
// Unlike freeze-and-baseline.js (which uses the PRODUCTION collectActPage over the paper's act-subset), this
// freezer reuses the EVAL collector `collectForV3` from run-v3-act-rest-suite.js — the only collector that runs
// the 1.3.3 sensory pre-filter (mints the sensoryWordHint obligation) AND the FIX-1 headings/landmarks structure
// threading the rubric depends on. Production port of both stays DEFERRED-TODO J.
//
// Output: <packsDir>/<testcaseId>.json  (one evidence pack per 9bd38c case; shape identical to freeze-and-baseline)
//
// Usage:
//   V3_LLM_MODEL=claude-sonnet-4-6 node freeze-actrest-133.js --packs=results/fp-experiments/packs-133 --out=fp-actrest133-base0

const fs = require('fs');
const path = require('path');
const REPO_ROOT = path.join(__dirname, '..', '..', '..');
require('../../../scripts/v3/lib/load-env.js').loadEnv(REPO_ROOT);

const puppeteer = require('puppeteer');
const { orchestrate } = require('../../../scripts/v3/lib/orchestrator.js');
const { makeRunAgent, makeClaudeSdkTransport } = require('../../../scripts/v3/lib/llm-agent-adapter.js');
const { makeSemaphore } = require('../../../scripts/v3/lib/run-telemetry.js');
const LIMITS = require('../../../scripts/v3/lib/limits.js');
const { scoreCase, printSummary, summarize } = require('./score-lib.js');
const suite = require('../run-v3-act-rest-suite.js'); // exports collectForV3, normalizeCollectRoles, urlFor, REST_DIR

function arg(name, def = null) {
  const p = process.argv.find((x) => x === `--${name}` || x.startsWith(`--${name}=`));
  if (!p) return def;
  if (p === `--${name}`) return true;
  return p.slice(name.length + 3);
}

const CHROME = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const RULE = arg('rule', '9bd38c');
const SC = arg('sc', '1.3.3');
const LIMIT = Number(arg('limit', 0));
const PAGE_CONC = Number(arg('pages', 4));
const GLOBAL_LLM = Math.min(LIMITS.concurrency.llm, Number(arg('global-llm', LIMITS.concurrency.llm)));
const RUN_NAME = arg('out', null) || 'fp-actrest133-base0';
const PACKS_DIR = path.isAbsolute(arg('packs', '') || '') ? arg('packs') : path.join(REPO_ROOT, arg('packs', null) || 'results/fp-experiments/packs-133');
const OUT = path.join(REPO_ROOT, 'results/fp-experiments/runs', RUN_NAME);
const MODEL = process.env.V3_LLM_MODEL || 'claude-sonnet-4-6';
const RUN_WALL = LIMITS.act.runWallClockMs;

const TRANSPORT = {
  oauthToken: process.env.CLAUDE_CODE_OAUTH_TOKEN, model: MODEL,
  effort: process.env.V3_LLM_EFFORT || 'medium',
  perTurnTimeoutMs: +(process.env.V3_LLM_TURN_TIMEOUT_MS || LIMITS.llm.perTurnTimeoutMs),
  runTimeoutMs: +(process.env.V3_LLM_RUN_TIMEOUT_MS || LIMITS.llm.runTimeoutMs),
};

// keep only the JSON-serializable parts of pOpts the replay needs (same shape as freeze-and-baseline.js)
function freezePOpts(p) {
  return {
    toolsEnabled: false,
    transcriptByXpath: p.transcriptByXpath || null,
    visionByXpath: p.visionByXpath || {},
    checkerHintsByXpath: p.checkerHintsByXpath || {},
    file: p.file, runId: p.runId, pageDigest: p.pageDigest,
    llmConcurrency: p.llmConcurrency,
  };
}

const sem = makeSemaphore(GLOBAL_LLM);
const baseAgent = makeRunAgent({ transport: makeClaudeSdkTransport(TRANSPORT), model: MODEL });
const runAgent = (messages, subject) => sem.run(() => baseAgent(messages, subject));

async function main() {
  if (!process.env.CLAUDE_CODE_OAUTH_TOKEN) { console.error('FATAL: CLAUDE_CODE_OAUTH_TOKEN not set (.env)'); process.exit(1); }
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(PACKS_DIR, { recursive: true });
  const all = JSON.parse(fs.readFileSync(path.join(suite.REST_DIR, 'subset.json'), 'utf8'));
  let cases = all.filter((tc) => tc.ruleId === RULE && ['failed', 'passed', 'inapplicable'].includes(tc.expected) && (tc.sc || []).includes(SC));
  if (LIMIT > 0) cases = cases.slice(0, LIMIT);
  console.log(`FREEZE actrest ${RULE}/${SC}: ${cases.length} cases | model=${MODEL} effort=${TRANSPORT.effort} tools=OFF | packs→${PACKS_DIR}`);

  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files'] });
  const results = [];
  let cursor = 0, frozen = 0;
  const t0 = Date.now();
  const worker = async () => {
    while (true) {
      const i = cursor++;
      if (i >= cases.length) return;
      const tc = cases[i];
      const runId = `fp133-${tc.testcaseId}`;
      let rec;
      const page = await browser.newPage();
      try {
        const collect = suite.normalizeCollectRoles(await suite.collectForV3(page, tc, runId));
        const drive = { file: collect.file, runId, pageDigest: collect.pageDigest, drivenAt: collect.collectedAt + 1, elements: [] };
        let snapshot = null;
        const out = await orchestrate(collect, drive, {
          resolveUrl: () => suite.urlFor(tc), executablePath: CHROME, browser,
          now: collect.collectedAt + 2,
          restrictScs: new Set(tc.sc || []),
          maxAutomatic: LIMITS.act.maxAuto, budgetOpts: { maxRunWallClockMs: RUN_WALL },
          experimentConcurrency: 1,
          runLlm: true, runAgent, captureVision: true, // tools OFF
          llmConcurrency: GLOBAL_LLM,
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
        rec = { testcaseId: tc.testcaseId, ruleId: tc.ruleId, sc: tc.sc, expected: tc.expected, outcome: 'error', error: String((e && e.stack) || e).slice(0, 300) };
      } finally { await page.close().catch(() => {}); }
      results.push(rec);
      console.log(`  [${results.length}/${cases.length}] ${tc.testcaseId.slice(0, 8)} ${tc.expected} → ${rec.outcome}${rec.falsePositive ? ' (FP)' : ''} (frozen=${frozen}, ${Math.round((Date.now() - t0) / 1000)}s)`);
      fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
    }
  };
  await Promise.all(Array.from({ length: Math.min(PAGE_CONC, cases.length || 1) }, () => worker()));
  await browser.close().catch(() => {});
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summarize(results), null, 2));
  printSummary(results, `freeze actrest ${RULE} baseline-0 (${RUN_NAME}, tools OFF)`);
  console.log(`\nfroze ${frozen} packs → ${PACKS_DIR}`);
}
main().catch((e) => { console.error(e && e.stack || e); process.exit(1); });
