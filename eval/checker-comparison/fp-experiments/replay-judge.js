#!/usr/bin/env node
'use strict';
// REPLAY the LLM judge over frozen evidence packs (from freeze-and-baseline.js) with a configurable judge design.
// No browser: re-calls runAdjudication + runRubricJudgments with the EXACT frozen subjects + evidence
// (visionByXpath crops, VSR transcript, checker hints) and an injected single-shot runAgent, then scores with the
// SAME scorer as the live harness. This is the cheap, controlled FP-reduction testbed — evidence is held byte-fixed
// across variants, so any FP/recall delta is attributable to the judge design, not to collect/vision noise.
//
// The judge design is selected by env vars consumed in scripts/v3/lib/llm-adjudicator.js (prompt/verdict levers)
// plus a few replay-side wrappers (refutation / self-consistency / panel). --method is a convenience preset that
// sets those env vars; individual V3_FP_* flags override.
//
// Usage:
//   node replay-judge.js --out=fp-rep-baseline --method=baseline    # --packs defaults to results/fp-experiments/packs
//   node replay-judge.js --out=fp-rep-abstain  --method=abstain-high
//   node replay-judge.js --scs=2.4.4 --rep=3 --out=fp-rep-refute --method=refute   # 3 replicate runs

const fs = require('fs');
const path = require('path');
const REPO_ROOT = path.join(__dirname, '..', '..', '..');
require('../../../scripts/v3/lib/load-env.js').loadEnv(REPO_ROOT);

const llmAdj = require('../../../scripts/v3/lib/llm-adjudicator.js');
const { makeRunAgent, makeClaudeSdkTransport, makeGeminiTransport } = require('../../../scripts/v3/lib/llm-agent-adapter.js');
const { makeSemaphore } = require('../../../scripts/v3/lib/run-telemetry.js');
const LIMITS = require('../../../scripts/v3/lib/limits.js');
const { scoreCase, printSummary, summarize } = require('./score-lib.js');
const { applyMethod } = require('./methods.js');

function arg(name, def = null) {
  const p = process.argv.find((x) => x === `--${name}` || x.startsWith(`--${name}=`));
  if (!p) return def;
  if (p === `--${name}`) return true;
  return p.slice(name.length + 3);
}

const PACKS_DIR = path.isAbsolute(arg('packs', '') || '') ? arg('packs') : path.join(REPO_ROOT, arg('packs', null) || 'results/fp-experiments/packs');
const SCS = (arg('scs', null) || '').split(',').map((s) => s.trim()).filter(Boolean);
const CASES_FILE = arg('cases', null);
const LIMIT = Number(arg('limit', 0));
const REP = Math.max(1, Number(arg('rep', 1)));            // replicate runs (LLM stochasticity → multiple runs)
const METHOD = arg('method', 'baseline');
const RUN_NAME = arg('out', null) || `fp-rep-${METHOD}`;
const PACK_CONC = Number(arg('pack-conc', 12));
const GLOBAL_LLM = Math.min(LIMITS.concurrency.llm, Number(arg('global-llm', LIMITS.concurrency.llm)));
// PROVIDER: 'claude' (default, subscription SDK) or 'gemini' (cross-family comparison, GEMINI_API_KEY). Same frozen
// evidence + same scorer → an apples-to-apples judge-model swap. Gemini path is single-shot, no tools.
const PROVIDER = arg('provider', 'claude');
const MODEL = process.env.V3_LLM_MODEL || (PROVIDER === 'gemini' ? (arg('model', null) || 'gemini-3.5-flash') : 'claude-sonnet-4-6');
const GEMINI_KEY = (() => { try { return (fs.readFileSync(path.join(REPO_ROOT, '.env'), 'utf8').split('\n').find((l) => l.startsWith('GEMINI_API_KEY=')) || '').split('=')[1].trim(); } catch (e) { return null; } })();
const OUT = path.join(REPO_ROOT, 'results/fp-experiments/runs', RUN_NAME);

const TRANSPORT = {
  oauthToken: process.env.CLAUDE_CODE_OAUTH_TOKEN, model: MODEL,
  effort: process.env.V3_LLM_EFFORT || 'medium',
  perTurnTimeoutMs: +(process.env.V3_LLM_TURN_TIMEOUT_MS || LIMITS.llm.perTurnTimeoutMs),
  runTimeoutMs: +(process.env.V3_LLM_RUN_TIMEOUT_MS || LIMITS.llm.runTimeoutMs),
};

function loadPacks() {
  let files = fs.readdirSync(PACKS_DIR).filter((f) => f.endsWith('.json'));
  let packs = files.map((f) => JSON.parse(fs.readFileSync(path.join(PACKS_DIR, f), 'utf8')));
  if (SCS.length) packs = packs.filter((p) => (p.tc.sc || []).some((s) => SCS.includes(s)));
  if (CASES_FILE) { const ids = new Set(fs.readFileSync(CASES_FILE, 'utf8').split(/\s+/).filter(Boolean)); packs = packs.filter((p) => ids.has(p.tc.testcaseId)); }
  if (LIMIT > 0) packs = packs.slice(0, LIMIT);
  return packs;
}

async function replayOnce(packs, runAgent, methodCfg, repIdx) {
  const rubrics = require('../../../scripts/v3/lib/rubric-loader.js').loadRubrics();
  const results = [];
  let cursor = 0;
  const worker = async () => {
    while (true) {
      const i = cursor++;
      if (i >= packs.length) return;
      const pack = packs[i];
      let rec;
      try {
        const pOpts = { ...pack.pOpts, runAgent, llmRubrics: rubrics, llmConcurrency: 8, toolsEnabled: false };
        // apply judge-design wrappers (refutation / self-consistency / panel) at the verdict layer
        const judged = await applyMethod(methodCfg, { llmAdj, pack, pOpts, runAgent });
        const out = { built: pack.built, bundle: {} };
        if (judged.adj && judged.adj.llm) { out.bundle.llm = judged.adj.llm; out.bundle.llmRationale = judged.adj.llmRationale; }
        if (judged.rub && judged.rub.judgments) out.bundle.judgments = judged.rub.judgments;
        rec = scoreCase(pack.tc, out);
      } catch (e) {
        rec = { testcaseId: pack.tc.testcaseId, ruleId: pack.tc.ruleId, sc: pack.tc.sc, expected: pack.tc.expected, outcome: 'error', error: String((e && e.message) || e) };
      }
      results.push(rec);
    }
  };
  await Promise.all(Array.from({ length: Math.min(PACK_CONC, packs.length || 1) }, () => worker()));
  return results;
}

async function main() {
  if (PROVIDER === 'gemini') { if (!GEMINI_KEY) { console.error('FATAL: GEMINI_API_KEY not set (.env)'); process.exit(1); } }
  else if (!process.env.CLAUDE_CODE_OAUTH_TOKEN) { console.error('FATAL: CLAUDE_CODE_OAUTH_TOKEN not set (.env)'); process.exit(1); }
  fs.mkdirSync(OUT, { recursive: true });
  const packs = loadPacks();
  const methodCfg = applyMethod.resolve(METHOD); // sets process.env V3_FP_* flags + returns wrapper config
  console.log(`REPLAY: ${packs.length} packs × ${REP} rep | provider=${PROVIDER} model=${MODEL} | method=${METHOD} | flags=${JSON.stringify(methodCfg.envEcho || {})}`);

  // packs that actually reach the LLM (have ≥1 subject); the collapse-guard is relative to THIS, not total packs
  // (a noObligation case correctly produces no verdict, so it must not count against "quota healthy").
  const subjectBearing = packs.filter((p) => (p.agentSubjects && p.agentSubjects.length) || (p.rubricSubjects && p.rubricSubjects.length)).length;
  const sem = makeSemaphore(GLOBAL_LLM);
  const transport = PROVIDER === 'gemini' ? makeGeminiTransport({ apiKey: GEMINI_KEY, model: MODEL }) : makeClaudeSdkTransport(TRANSPORT);
  const baseAgent = makeRunAgent({ transport, model: MODEL });
  const runAgent = (messages, subject) => sem.run(() => baseAgent(messages, subject));

  const allRuns = [];
  let collapsed = 0;
  for (let r = 0; r < REP; r++) {
    const t0 = Date.now();
    const results = await replayOnce(packs, runAgent, methodCfg, r);
    // QUOTA-COLLAPSE GUARD: if almost no case got an LLM verdict, the subscription rate-limit is exhausted and the
    // transport is degrading to null — the rep is garbage. Don't write it or burn more reps; abort and report.
    const answered = results.filter((x) => (x.rubricVerdicts && x.rubricVerdicts.length) || (x.agentVerdicts && x.agentVerdicts.length)).length;
    if (subjectBearing > 0 && answered < Math.max(3, subjectBearing * 0.2)) {
      console.error(`\n⚠ COLLAPSE on rep#${r + 1}: only ${answered}/${results.length} cases got an LLM verdict — quota likely exhausted. Aborting (valid reps so far: ${r}).`);
      collapsed = 1; break;
    }
    const s = printSummary(results, `${METHOD} rep#${r + 1} (${Math.round((Date.now() - t0) / 1000)}s)`);
    fs.writeFileSync(path.join(OUT, `results.rep${r + 1}.json`), JSON.stringify(results, null, 2));
    allRuns.push({ rep: r + 1, summary: s, fpCases: results.filter((x) => x.falsePositive).map((x) => x.testcaseId), missCases: results.filter((x) => x.polarity === 'recall' && x.outcome !== 'caught').map((x) => x.testcaseId) });
    if (r === 0) fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2)); // rep1 as the canonical results.json (ablation-table compatible)
  }
  // aggregate across replicates
  const fpCounts = allRuns.map((x) => x.summary.specificity.falsePositive);
  const recCounts = allRuns.map((x) => x.summary.recall.caught);
  const agg = {
    method: METHOD, reps: REP, packs: packs.length, model: MODEL, effort: TRANSPORT.effort, envEcho: methodCfg.envEcho || {},
    fp: { mean: mean(fpCounts), values: fpCounts, denom: allRuns[0] && allRuns[0].summary.specificity.n },
    recall: { mean: mean(recCounts), values: recCounts, denom: allRuns[0] && allRuns[0].summary.recall.failedN },
    runs: allRuns,
  };
  fs.writeFileSync(path.join(OUT, 'aggregate.json'), JSON.stringify(agg, null, 2));
  console.log(`\nAGG ${METHOD}: FP mean ${agg.fp.mean.toFixed(1)} (${fpCounts.join(',')})/${agg.fp.denom}  recall mean ${agg.recall.mean.toFixed(1)} (${recCounts.join(',')})/${agg.recall.denom}`);
  console.log(`wrote → ${OUT}`);
}
function mean(a) { return a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0; }
main().catch((e) => { console.error(e && e.stack || e); process.exit(1); });
