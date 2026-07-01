#!/usr/bin/env node
'use strict';
// Run the v3 LLM evidence lane over the DHS Trusted Tester test cases (testcases.json, 54 records —
// see README.md for provenance). Same collect/orchestrate/score pipeline as
// eval/checker-comparison/run-fn-llm.js, trimmed of the ACT-corpus-specific escape hatches that don't
// apply here (cross-rule-indeterminate 1.1.1 partition, criterion-level GT overrides, LLM-independent
// splice) — this corpus has no ACT rule-id partition and no prior deterministic-only baseline to splice
// against. Each record already carries its own target SC (wcagSuccessCriterion) and correct-answer
// verdict (expected), so recall/specificity is scored per-record against that single SC.
//
// Usage:
//   node eval/trusted-tester/run-trusted-tester.js --provider=openai --model=gpt-5.4-mini --tools --out=tt-smoke --limit=3
//   node eval/trusted-tester/run-trusted-tester.js --provider=openai --model=gpt-5.4-mini --tools --out=tt-gpt54mini
// Then in another terminal:  node eval/checker-comparison/fn-llm-monitor.js

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..', '..');
require('../../scripts/v3/lib/load-env.js').loadEnv(REPO_ROOT);

const { orchestrate } = require('../../scripts/v3/lib/orchestrator.js');
const { createTabAllocator } = require('../../scripts/v3/lib/tab-allocator.js');
const { makeRunAgent, makeClaudeSdkTransport, makeGeminiTransport, makeCodexTransport, makeOpenAITransport } = require('../../scripts/v3/lib/llm-agent-adapter.js');
const { collectActPage, normalizeCollectRoles } = require('../../scripts/v3/lib/act-page-collect.js');
const { makeSemaphore, sampleMemory } = require('../../scripts/v3/lib/run-telemetry.js');
const LIMITS = require('../../scripts/v3/lib/limits.js');
const puppeteer = require('puppeteer');

function arg(name, def = null) {
  const p = process.argv.find((x) => x === `--${name}` || x.startsWith(`--${name}=`));
  if (!p) return def;
  if (p === `--${name}`) return true;
  return p.slice(name.length + 3);
}

const CHROME = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DHS_ROOT = path.join(REPO_ROOT, 'refs', 'DHS-Trusted-Tester-examples');
const CASES_PATH = path.join(__dirname, 'testcases.json');
const AXE_PATH = process.env.AXE_PATH || path.join(REPO_ROOT, 'axe.min.js');
const LIMIT = Number(arg('limit', 0));
const SC = arg('sc', null);
const PAGE_CONC = Number(arg('pages', 8));
const PROVIDER = arg('provider', 'claude');
const LLM_CAP = PROVIDER === 'gemini' ? Number(process.env.GEMINI_LLM_CAP || 64) : PROVIDER === 'codex' ? Number(process.env.CODEX_LLM_CAP || 16) : PROVIDER === 'openai' ? Number(process.env.OPENAI_LLM_CAP || 24) : LIMITS.concurrency.llm;
const GLOBAL_LLM = Math.min(LLM_CAP, Math.max(1, Number(arg('global-llm', LIMITS.concurrency.llm))));
const LLM_CONC = Math.min(LIMITS.concurrency.llm, Math.max(1, Number(arg('llm-concurrency', LIMITS.concurrency.llm))));
const MAX_TABS = Math.min(LIMITS.concurrency.maxTabs, Math.max(1, Number(arg('max-tabs', LIMITS.concurrency.maxTabs))));
const MAX_AUTO = Number(arg('max-auto', LIMITS.act.maxAuto));
const ELEMENT_CAP = Number(arg('element-cap', LIMITS.act.elementCap));
const RUN_WALL = Number(arg('run-wall-ms', LIMITS.act.runWallClockMs));
const INSTRUMENTS_CONC = Math.max(1, Number(arg('instruments-conc', Math.min(PAGE_CONC, 4))));
const INSTRUMENTS_TIMEOUT = Number(arg('instruments-timeout-ms', 90000));
const instGate = makeSemaphore(INSTRUMENTS_CONC);
const VISION = arg('no-vision', false) ? false : true;
const TOOLS = !!arg('tools', false);
const RUN_NAME = arg('out', null) || 'trusted-tester';
const OUT = path.join(REPO_ROOT, 'results', RUN_NAME);
const FIXED_STATUS_PATH = process.env.LLM_EVAL_STATUS_PATH || process.env.FN_LLM_STATUS_PATH || '/tmp/llm-eval-status.json';
const STATUS_EVERY_MS = 500;

const MODEL = process.env.V3_LLM_MODEL || (PROVIDER === 'gemini' ? (arg('model', null) || 'gemini-3.5-flash') : (PROVIDER === 'codex' || PROVIDER === 'openai') ? (arg('model', null) || 'gpt-5.4') : 'claude-sonnet-4-6');
const envVal = (key) => { try { return (fs.readFileSync(path.join(REPO_ROOT, '.env'), 'utf8').split('\n').find((l) => l.startsWith(key + '=')) || '').split('=')[1].trim() || null; } catch (e) { return null; } };
const GEMINI_KEY = envVal('GEMINI_API_KEY');
const CODEX_KEY = process.env.CODEX_API_KEY || envVal('CODEX_API_KEY');
const OPENAI_KEY = process.env.OPENAI_API_KEY || envVal('OPENAI_API_KEY');
const TRANSPORT_CONFIG = {
  oauthToken: process.env.CLAUDE_CODE_OAUTH_TOKEN,
  model: MODEL,
  effort: process.env.V3_LLM_EFFORT || 'medium',
  perTurnTimeoutMs: +(process.env.V3_LLM_TURN_TIMEOUT_MS || LIMITS.llm.perTurnTimeoutMs),
  runTimeoutMs: +(process.env.V3_LLM_RUN_TIMEOUT_MS || LIMITS.llm.runTimeoutMs),
};

// ---- case loader: eval/trusted-tester/testcases.json → the {ruleId, sc, expected, ...} shape scoreCase expects ----
function loadCases() {
  const raw = JSON.parse(fs.readFileSync(CASES_PATH, 'utf8'));
  const seenIds = new Map();
  return raw.map((tc) => {
    // testcaseId collides across records that share (sc_folder, testId) but differ by source page
        // (e.g. three pages all testing 2.4.4 link-purpose) — disambiguate for readable per-record output.
    const n = (seenIds.get(tc.testcaseId) || 0) + 1;
    seenIds.set(tc.testcaseId, n);
    const testcaseId = n === 1 ? tc.testcaseId : `${tc.testcaseId}-${n}`;
    return {
      testcaseId, ruleId: tc.ruleId, ruleName: tc.ruleName, sc: [tc.wcagSuccessCriterion],
      expected: tc.expected, capturedPage: tc.subject.capturedPage, examPageUrl: tc.subject.examPageUrl,
      testCondition: tc.trustedTester.testCondition, targetSelector: tc.target && tc.target.selector,
    };
  });
}

const urlFor = (tc) => 'file://' + path.join(DHS_ROOT, tc.capturedPage);

// ============================ live telemetry ============================
const startedAt = Date.now();
const tel = {
  startedAt,
  runName: RUN_NAME,
  config: { total: 0, pageConc: PAGE_CONC, globalLlm: GLOBAL_LLM, perPageLlm: LLM_CONC, maxTabs: MAX_TABS, vision: VISION, tools: TOOLS, model: MODEL, corpus: 'trusted-tester' },
  phase: 'init',
  done: 0,
  total: 0,
  workers: {},
  inflight: {},
  llm: { calls: 0, done: 0, results: 0, peakInFlight: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreateTokens: 0, costUsd: 0 },
  tabs: {},
  mem: {},
  tally: { caught: 0, missedAgree: 0, uncertain: 0, noVerdict: 0, noObligation: 0, error: 0 },
  recent: [],
  errors: [],
};

function writeStatus() {
  try {
    tel.elapsedMs = Date.now() - startedAt;
    tel.llm.inFlightNow = Object.keys(tel.inflight).length;
    const payload = JSON.stringify(tel);
    fs.writeFileSync(path.join(OUT, 'status.json'), payload);
    try { fs.writeFileSync(FIXED_STATUS_PATH, payload); } catch (e) { /* best effort */ }
  } catch (e) { /* best effort */ }
}

// ============================ LLM agent: tee (token telemetry) + GLOBAL semaphore + inflight tracking ============================
const sem = makeSemaphore(GLOBAL_LLM);
let callSeq = 0;
function recordTrace(e) {
  if (!e || e.type !== 'result') return;
  const u = e.usage || {};
  tel.llm.inputTokens += (+u.input_tokens || 0);
  tel.llm.outputTokens += (+u.output_tokens || 0);
  tel.llm.cacheReadTokens += (+u.cache_read_input_tokens || 0);
  tel.llm.cacheCreateTokens += (+u.cache_creation_input_tokens || 0);
  if (typeof e.totalCostUsd === 'number') tel.llm.costUsd += e.totalCostUsd;
  tel.llm.results++;
}
const TRANSPORT_WITH_SINK = { ...TRANSPORT_CONFIG, onTraceSink: recordTrace };
const baseTransport = PROVIDER === 'gemini'
  ? makeGeminiTransport({ apiKey: GEMINI_KEY, model: MODEL, onTraceSink: recordTrace })
  : PROVIDER === 'codex'
    ? makeCodexTransport({ apiKey: CODEX_KEY, model: MODEL, effort: TRANSPORT_CONFIG.effort, onTraceSink: recordTrace, runTimeoutMs: TRANSPORT_CONFIG.runTimeoutMs })
    : PROVIDER === 'openai'
      ? makeOpenAITransport({ apiKey: OPENAI_KEY, model: MODEL, effort: TRANSPORT_CONFIG.effort, onTraceSink: recordTrace, runTimeoutMs: TRANSPORT_CONFIG.runTimeoutMs })
      : makeClaudeSdkTransport(TRANSPORT_WITH_SINK);
const baseAgent = makeRunAgent({ transport: baseTransport, model: MODEL });
const wrapAgent = (agent) => (messages, subject) => sem.run(async () => {
  const id = ++callSeq;
  tel.inflight[id] = { xpath: (subject && subject.xpath) || null, sc: (subject && subject.sc) || null, skill: (subject && (subject.skill || subject.rubricId)) || null, startedAt: Date.now() };
  tel.llm.calls++;
  const nIn = Object.keys(tel.inflight).length;
  if (nIn > tel.llm.peakInFlight) tel.llm.peakInFlight = nIn;
  try { return await agent(messages, subject); }
  finally { delete tel.inflight[id]; tel.llm.done++; }
});
const runAgent = wrapAgent(baseAgent);

// ============================ scoring one case ============================
// Same catch/miss/uncertain logic as run-fn-llm.js's scoreCase — a barrier flagged in-scope is a TRUE POSITIVE on a
// `failed` case (recall) and a FALSE POSITIVE on `passed`/`inapplicable` (specificity). No ACT-specific GT override
// or cross-rule exclusion here: this corpus's `expected` already reflects a single hand-verified correct answer.
function scoreCase(tc, out) {
  const inScope = new Set(tc.sc || []);
  const built = out && out.built;
  const bundle = (out && out.bundle) || {};
  const rec = { testcaseId: tc.testcaseId, ruleId: tc.ruleId, ruleName: tc.ruleName, sc: tc.sc, expected: tc.expected, url: tc.examPageUrl, testCondition: tc.testCondition, targetSelector: tc.targetSelector };

  const agentV = (bundle.llm && bundle.llm.verdicts) || [];
  const rubricV = (bundle.judgments && bundle.judgments.judgments) || [];
  const agentInScope = agentV.filter((v) => inScope.has(v.sc));
  const rubricInScope = rubricV.filter((j) => inScope.has(j.sc));

  const shadow = (built && built.results && built.results.shadowObservations) || [];
  rec.v3Barrier = shadow.some((o) => o.source === 'deterministic' && inScope.has(o.sc) && o.wouldBe && o.wouldBe.observationOutcome === 'BARRIER_OBSERVED');

  const ledger = (built && built.results && built.results.obligationLedger) || [];
  const inScopeOblig = ledger.filter((r) => inScope.has(r.sc));
  rec.inScopeObligations = inScopeOblig.length;
  rec.inScopeAutoPartial = inScopeOblig.filter((r) => r.autoPartial).length;
  rec.inScopeBarrierFilled = inScopeOblig.filter((r) => r.disposition === 'PROVISIONAL' && r.cleared === false).length;

  const reconciledSuppressed = new Set();
  for (const r of inScopeOblig) {
    const sup = r && r.cleared === true && r.provisional && r.provisional.reconciled && r.provisional.reconciled.suppressed;
    if (Array.isArray(sup)) for (const mech of sup) reconciledSuppressed.add(`${r.xpath}::${r.sc}::${String(mech).replace(/^llm-rubric:/, '')}`);
  }
  const barrierAgent = agentInScope.filter((v) => v.agentVerdict === 'REPRODUCED');
  const barrierRubric = rubricInScope.filter((j) => j.verdict === 'LIKELY_BARRIER'
    && !reconciledSuppressed.has(`${j.targetXpath}::${j.sc}::${j.rubricRef}`));
  const okAgent = agentInScope.filter((v) => v.agentVerdict === 'NOT REPRODUCED');
  const okRubric = rubricInScope.filter((j) => j.verdict === 'LIKELY_OK');
  const nVerdicts = agentInScope.length + rubricInScope.length;

  let outcome;
  if (rec.v3Barrier || rec.inScopeBarrierFilled > 0) outcome = 'caught';
  else if (barrierAgent.length || barrierRubric.length) outcome = 'caught';
  else if (nVerdicts === 0) outcome = rec.inScopeAutoPartial > 0 ? 'noVerdict' : 'noObligation';
  else if (okAgent.length || okRubric.length) outcome = 'missedAgree';
  else outcome = 'uncertain';
  rec.outcome = outcome;
  rec.llmFlag = outcome === 'caught';
  rec.polarity = tc.expected === 'failed' ? 'recall' : 'specificity';
  rec.correct = rec.polarity === 'recall' ? (outcome === 'caught') : (outcome !== 'caught');
  rec.falsePositive = rec.polarity === 'specificity' && outcome === 'caught';

  const rats = (bundle.llmRationale && bundle.llmRationale.rationales) || [];
  const ratById = {}; for (const r of rats) ratById[r.verdictId] = r;
  rec.agentVerdicts = agentInScope.map((v) => ({ sc: v.sc, verdict: v.agentVerdict, confidence: v.confidence, claimFamily: v.claimFamily, xpath: v.targetXpath,
    summary: (ratById[v.verdictId] && ratById[v.verdictId].summary) || null }));
  rec.rubricVerdicts = rubricInScope.map((j) => ({ sc: j.sc, verdict: j.verdict, confidence: j.confidence, rubric: j.rubricRef, xpath: j.targetXpath, summary: j.summary || null }));
  rec.otherBarriers = [
    ...agentV.filter((v) => !inScope.has(v.sc) && v.agentVerdict === 'REPRODUCED').map((v) => ({ kind: 'agent', sc: v.sc, xpath: v.targetXpath })),
    ...rubricV.filter((j) => !inScope.has(j.sc) && j.verdict === 'LIKELY_BARRIER').map((j) => ({ kind: 'rubric', sc: j.sc, rubric: j.rubricRef, xpath: j.targetXpath })),
  ];
  rec.timings = (bundle.timings && bundle.timings.stages) || null;
  return rec;
}

// ============================ main ============================
async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(path.join(OUT, 'traces'), { recursive: true });
  let cases = loadCases();
  if (SC) cases = cases.filter((c) => (c.sc || []).includes(SC));
  if (Number.isFinite(LIMIT) && LIMIT > 0) cases = cases.slice(0, LIMIT);

  tel.total = cases.length;
  tel.config.total = cases.length;
  tel.phase = 'launching';
  writeStatus();
  console.log(`Trusted Tester × LLM run: ${cases.length} cases | provider=${PROVIDER} model=${MODEL} effort=${TRANSPORT_CONFIG.effort} | pages=${PAGE_CONC} globalLLM=${GLOBAL_LLM} maxTabs=${MAX_TABS} vision=${VISION} tools=${TOOLS}`);
  console.log(`status → ${path.join(OUT, 'status.json')}  (run: node ${path.relative(process.cwd(), path.join(REPO_ROOT, 'eval/checker-comparison/fn-llm-monitor.js'))})`);

  if (PROVIDER === 'gemini') { if (!GEMINI_KEY) { console.error('FATAL: GEMINI_API_KEY not set (.env)'); process.exit(1); } }
  else if (PROVIDER === 'openai') { if (!OPENAI_KEY) { console.error('FATAL: OPENAI_API_KEY not set (.env)'); process.exit(1); } }
  else if (PROVIDER === 'codex') { if (!CODEX_KEY) { console.error('FATAL: CODEX_API_KEY not set (.env) and no ambient codex login'); process.exit(1); } }
  else if (!process.env.CLAUDE_CODE_OAUTH_TOKEN) { console.error('FATAL: CLAUDE_CODE_OAUTH_TOKEN not set (.env)'); process.exit(1); }

  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const browserPid = browser.process() && browser.process().pid;
  const alloc = createTabAllocator({ browser, maxTabs: MAX_TABS });
  tel.phase = 'running';

  let sampling = false;
  const statusTimer = setInterval(async () => {
    tel.tabs = alloc.stats();
    if (!sampling) { sampling = true; try { tel.mem = await sampleMemory(browserPid); } catch (e) {} finally { sampling = false; } }
    writeStatus();
  }, STATUS_EVERY_MS);
  if (statusTimer.unref) statusTimer.unref();

  const results = [];
  const allTraces = [];
  const persist = () => {
    fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
    const tk = tel.llm;
    const tokens = { provider: PROVIDER, model: MODEL, inputTokens: tk.inputTokens, outputTokens: tk.outputTokens, totalTokens: tk.inputTokens + tk.outputTokens, cacheReadTokens: tk.cacheReadTokens, cacheCreateTokens: tk.cacheCreateTokens, costUsd: tk.costUsd, usageEvents: tk.results, meanOutputPerVerdict: tk.results ? Math.round(tk.outputTokens / tk.results) : 0 };
    fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify({ ...summarize(results), tokens }, null, 2));
  };

  let cursor = 0;
  const worker = async (wid) => {
    while (true) {
      const i = cursor++;
      if (i >= cases.length) { delete tel.workers[wid]; return; }
      const tc = cases[i];
      const runId = `tt-${tc.testcaseId}`;
      tel.workers[wid] = { idx: i, ruleId: tc.ruleId, sc: (tc.sc || []).join(','), expected: tc.expected, phase: 'collect', startedAt: Date.now() };
      let rec;
      try {
        const lease = await alloc.acquire();
        let collect;
        try {
          collect = normalizeCollectRoles(await collectActPage(lease.page, {
            url: urlFor(tc), elementCap: ELEMENT_CAP, file: `tt:${tc.testcaseId}`, runId, sourceUrl: tc.examPageUrl,
            runAxe: true, axePath: AXE_PATH,
          }));
        } finally { await lease.release(); }
        tel.workers[wid].phase = 'orchestrate';
        const drive = { file: collect.file, runId, pageDigest: collect.pageDigest, drivenAt: collect.collectedAt + 1, elements: [] };
        const out = await orchestrate(collect, drive, {
          resolveUrl: () => urlFor(tc),
          executablePath: CHROME, browser, tabAllocator: alloc, maxTabs: MAX_TABS,
          runInstruments: true, instrumentsGate: instGate, instrumentsTimeoutMs: INSTRUMENTS_TIMEOUT,
          now: collect.collectedAt + 2,
          restrictScs: new Set(tc.sc || []), // judge ONLY this record's target SC
          maxAutomatic: Number.isFinite(MAX_AUTO) ? MAX_AUTO : Infinity,
          budgetOpts: { maxRunWallClockMs: RUN_WALL },
          experimentConcurrency: Math.min(LIMITS.concurrency.experimentCap, LIMITS.concurrency.experiment),
          runLlm: true, runAgent, captureVision: VISION, wrapAgent,
          llmConcurrency: LLM_CONC,
          llmTools: TOOLS, llmTransportConfig: TRANSPORT_WITH_SINK,
          llmProvider: PROVIDER, geminiKey: GEMINI_KEY, codexKey: CODEX_KEY, openaiKey: OPENAI_KEY,
          llmToolConcurrency: LIMITS.concurrency.llmTool,
          llmToolMaxTurns: LIMITS.llm.toolMaxTurns,
          llmToolRunTimeoutMs: LIMITS.llm.toolRunTimeoutMs,
        });
        rec = scoreCase(tc, out);
        const traces = (out.bundle && out.bundle.llmTrace && out.bundle.llmTrace.traces) || [];
        if (traces.length) allTraces.push({ testcaseId: tc.testcaseId, ruleId: tc.ruleId, sc: tc.sc, traces });
      } catch (e) {
        rec = { testcaseId: tc.testcaseId, ruleId: tc.ruleId, sc: tc.sc, expected: tc.expected, outcome: 'error', error: String((e && e.stack) || e) };
        tel.errors.push({ ruleId: tc.ruleId, testcaseId: tc.testcaseId, error: String((e && e.message) || e) });
      }
      results.push(rec);
      tel.done = results.length;
      tel.tally[rec.outcome] = (tel.tally[rec.outcome] || 0) + 1;
      tel.recent.unshift({ ruleId: tc.ruleId, sc: (tc.sc || []).join(','), outcome: rec.outcome, ms: Date.now() - tel.workers[wid].startedAt });
      tel.recent = tel.recent.slice(0, 10);
      persist();
      writeStatus();
    }
  };

  const nWorkers = Math.min(PAGE_CONC, cases.length || 1);
  await Promise.all(Array.from({ length: nWorkers }, (_, w) => worker(`w${w + 1}`)));

  clearInterval(statusTimer);
  tel.tabs = alloc.stats();
  alloc.close();
  await browser.close().catch(() => {});
  fs.writeFileSync(path.join(OUT, 'llm-trace.json'), JSON.stringify(allTraces, null, 2));
  persist();
  tel.phase = 'done';
  writeStatus();

  printSummary(results);
}

function summarize(results) {
  const tally = { caught: 0, missedAgree: 0, uncertain: 0, noVerdict: 0, noObligation: 0, error: 0 };
  const bySc = {};
  const byExpected = {};
  for (const r of results) {
    tally[r.outcome] = (tally[r.outcome] || 0) + 1;
    const e = r.expected || 'unknown';
    const be = byExpected[e] || (byExpected[e] = { n: 0, caught: 0, missedAgree: 0, uncertain: 0, noVerdict: 0, noObligation: 0, error: 0 });
    be.n++; be[r.outcome] = (be[r.outcome] || 0) + 1;
    for (const sc of (r.sc || [])) {
      bySc[sc] = bySc[sc] || { total: 0, expected: e, caught: 0, missedAgree: 0, uncertain: 0, noVerdict: 0, noObligation: 0, error: 0 };
      bySc[sc].total++; bySc[sc][r.outcome] = (bySc[sc][r.outcome] || 0) + 1;
    }
  }
  const n = results.length;
  const recallCases = results.filter((r) => r.polarity === 'recall');
  const specCases = results.filter((r) => r.polarity === 'specificity');
  const recallCaught = recallCases.filter((r) => r.outcome === 'caught').length;
  const falsePos = specCases.filter((r) => r.falsePositive).length;
  return { generatedAt: new Date().toISOString(), n, model: MODEL, vision: VISION, tools: TOOLS, tally, byExpected,
    recall: { failedN: recallCases.length, caught: recallCaught, recallRate: recallCases.length ? +(recallCaught / recallCases.length).toFixed(3) : null },
    specificity: { n: specCases.length, falsePositive: falsePos, falsePositiveRate: specCases.length ? +(falsePos / specCases.length).toFixed(3) : null },
    caughtRate: n ? +(tally.caught / n).toFixed(3) : null, bySc };
}

function printSummary(results) {
  const s = summarize(results);
  console.log('\n================= Trusted Tester × LLM eval results (recall + specificity) =================');
  console.log(`cases: ${s.n}  |  model ${s.model}  vision=${s.vision} tools=${s.tools}`);
  console.log(`\n  RECALL — expected=failed (a flagged barrier is a TRUE POSITIVE):`);
  console.log(`    failed cases: ${s.recall.failedN}  |  caught: ${s.recall.caught}  =  ${s.recall.recallRate != null ? (100 * s.recall.recallRate).toFixed(0) + '%' : '-'} recall`);
  console.log(`\n  SPECIFICITY — expected=passed/inapplicable (a flagged barrier is a FALSE POSITIVE):`);
  console.log(`    specificity cases: ${s.specificity.n}  |  false positives: ${s.specificity.falsePositive}  =  ${s.specificity.falsePositiveRate != null ? (100 * s.specificity.falsePositiveRate).toFixed(1) + '%' : '-'} FP rate`);
  console.log('\n  by SC (FP = flagged where GT says pass/inapplicable):');
  console.log('    sc        exp           n  caught/FP  agree  uncert  noVerd  noOblig');
  for (const [sc, b] of Object.entries(s.bySc).sort()) {
    console.log(`    ${sc.padEnd(8)} ${String(b.expected).padEnd(13)} ${String(b.total).padStart(2)}   ${String(b.caught).padStart(7)}  ${String(b.missedAgree).padStart(5)}  ${String(b.uncertain).padStart(6)}  ${String(b.noVerdict).padStart(6)}  ${String(b.noObligation).padStart(7)}`);
  }
  console.log(`\n  raw outcome tally: ${JSON.stringify(s.tally)}`);
  console.log(`  resource peak: parallel LLM ${tel.llm.peakInFlight}/${GLOBAL_LLM}  |  tabs ${(tel.tabs && tel.tabs.peak) || '?'}/${MAX_TABS}  |  pages=${PAGE_CONC}`);
  console.log(`\nwrote ${path.join(OUT, 'results.json')} + summary.json + llm-trace.json`);
}

main().catch((e) => { console.error(e && e.stack || e); process.exit(1); });
