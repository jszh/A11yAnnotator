#!/usr/bin/env node
'use strict';
// Run the v3 LLM evidence lane over the ACT testcases where BOTH axe AND v3 produced a FALSE NEGATIVE
// (ground truth = `failed`, but neither flagged it) — i.e. worklist(.json|-proposed.json).bothFail. The
// question: on the cases the deterministic stack misses, does the (non-authoritative) LLM judge catch the
// barrier? Uses the UPDATED pipeline: ONE shared browser + tab allocator, page-level parallelism, per-item
// walls, full timing + LLM-trace logging. Writes a live `status.json` a separate monitor renders.
//
//   V3_LLM is forced ON here (this script IS the explicit, user-triggered activation; the corpus run stays
//   on-hold). Auth: Claude Code SUBSCRIPTION via CLAUDE_CODE_OAUTH_TOKEN in .env (no metered key).
//
// Usage:
//   node run-fn-llm.js                          # all 66 FN cases, LLM + vision, tools OFF
//   node run-fn-llm.js --limit=2                # smoke test (first 2)
//   node run-fn-llm.js --sc=2.4.4               # only one SC
//   node run-fn-llm.js --pages=4            # LLM/tab caps default to limits.js (overrides clamp to the limit)
//   node run-fn-llm.js --tools                  # PHASE 2: live in-process CDP tools (multi-turn)
// Then in another terminal:  node fn-llm-monitor.js

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..', '..');
require('../../scripts/v3/lib/load-env.js').loadEnv(REPO_ROOT);

const { orchestrate } = require('../../scripts/v3/lib/orchestrator.js');
const { createTabAllocator } = require('../../scripts/v3/lib/tab-allocator.js');
const { makeRunAgent, makeClaudeSdkTransport } = require('../../scripts/v3/lib/llm-agent-adapter.js');
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
const SUBSET_DIR = path.join(__dirname, 'act-subset');
const AXE_PATH = process.env.AXE_PATH || path.join(REPO_ROOT, 'axe.min.js'); // axe injected at collection → axe-promotion + checker-uncertainty
const LIMIT = Number(arg('limit', 0));                 // 0 = all
const SC = arg('sc', null);
const REACHES_LLM = !!arg('reaches-llm', false);       // run the REACHES-LLM set (recall on failed + SPECIFICITY on passed/inapplicable) instead of bothFail
const RUN_LLM = !arg('no-llm', false);                 // --no-llm ⇒ DETERMINISTIC-ONLY baseline (no LLM lane); measures what the detectors/axe catch alone
const RESTRICT_SC = REACHES_LLM || !!arg('restrict-sc', false); // judge ONLY the case's GT'd SC — ACT ground truth is per-SC (off-target verdicts are unscoreable + wasted spend)
const PAGE_CONC = Number(arg('pages', 8));             // pages orchestrated at once (default = cores-2 headroom; was 4 —
                                                      // too few to feed the global LLM cap once tools cap per-page conc)
// LLM concurrency is governed by limits.js — NOT a hand-picked number. Page-parallelism multiplies per-page
// concurrency, so the GLOBAL in-flight cap is set to (and clamped at) LIMITS.concurrency.llm: the single LLM
// restriction the whole harness honors. An override may only go LOWER, never above the limit (clamp pattern from
// run-v3-act-suite.js). maxTabs likewise sources from limits.js.
const GLOBAL_LLM = Math.min(LIMITS.concurrency.llm, Math.max(1, Number(arg('global-llm', LIMITS.concurrency.llm))));
const LLM_CONC = Math.min(LIMITS.concurrency.llm, Math.max(1, Number(arg('llm-concurrency', LIMITS.concurrency.llm)))); // per-page subjects; the global gate enforces the true cap
const MAX_TABS = Math.min(LIMITS.concurrency.maxTabs, Math.max(1, Number(arg('max-tabs', LIMITS.concurrency.maxTabs))));
const MAX_AUTO = Number(arg('max-auto', LIMITS.act.maxAuto));
const ELEMENT_CAP = Number(arg('element-cap', LIMITS.act.elementCap));
const RUN_WALL = Number(arg('run-wall-ms', LIMITS.act.runWallClockMs)); // experiment-lane wall-clock budget per page (defers the tail by TIME, not count)
// INSTRUMENTS lane robustness: cap concurrent keyboard-driving lanes WELL BELOW the page pool (they round-trip many
// Tab/settle presses and thrash a contended browser), and give each a generous hard timeout. A lane that exceeds it
// fails closed (no findings) — non-authoritative, so it never asserts a false NO_BARRIER, it just forgoes the catch.
const INSTRUMENTS_CONC = Math.max(1, Number(arg('instruments-conc', Math.min(PAGE_CONC, 4))));
const INSTRUMENTS_TIMEOUT = Number(arg('instruments-timeout-ms', 90000));
const instGate = makeSemaphore(INSTRUMENTS_CONC); // shared run-telemetry semaphore (.run(fn)); caps concurrent kbd-driving lanes
const VISION = arg('no-vision', false) ? false : true;
const TOOLS = !!arg('tools', false);
const CASES_FILE = arg('cases', null);                 // --cases=<file>: restrict to a whitespace-separated testcaseId list (subset eval; composes with --sc/--limit)
const RUN_NAME = arg('out', null) || 'fn-llm';
const OUT = path.join(REPO_ROOT, 'results', RUN_NAME); // --out=<name>: write to results/<name> instead of results/fn-llm (don't clobber a baseline)
// experiment identity (so the monitor can label WHICH config is running) + a fixed status path the monitor reads
// by default, so `node fn-llm-monitor.js` (no arg) always follows the latest run without retyping the run name.
const EVIDENCE_MODE = process.env.V3_HTML_EVIDENCE === '1' ? 'raw-html' : process.env.V3_MINIMAL_EVIDENCE === '1' ? 'name/role' : 'v3-signals';
const NO_VISION_RUBRIC = process.env.V3_NO_VISION_RUBRIC === '1';
const BASELINE_VISION = process.env.V3_BASELINE_VISION === '1';
const FIXED_STATUS_PATH = process.env.LLM_EVAL_STATUS_PATH || process.env.FN_LLM_STATUS_PATH || '/tmp/llm-eval-status.json';
const STATUS_EVERY_MS = 500;

const MODEL = process.env.V3_LLM_MODEL || 'claude-sonnet-4-6';
const TRANSPORT_CONFIG = {
  oauthToken: process.env.CLAUDE_CODE_OAUTH_TOKEN,
  model: MODEL,
  effort: process.env.V3_LLM_EFFORT || 'medium',
  perTurnTimeoutMs: +(process.env.V3_LLM_TURN_TIMEOUT_MS || LIMITS.llm.perTurnTimeoutMs),
  runTimeoutMs: +(process.env.V3_LLM_RUN_TIMEOUT_MS || LIMITS.llm.runTimeoutMs),
};

// ---- FN worklist: union of approved + proposed bothFail, deduped by testcaseId ----
function loadFnCases() {
  const seen = new Set();
  const out = [];
  for (const wl of ['worklist.json', 'worklist-proposed.json']) {
    const p = path.join(SUBSET_DIR, wl);
    if (!fs.existsSync(p)) continue;
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    for (const c of (data.bothFail || [])) {
      if (seen.has(c.testcaseId)) continue;
      seen.add(c.testcaseId);
      out.push({ ...c, draft: wl.includes('proposed') });
    }
  }
  return out;
}

// REACHES-LLM set: every DECIDED case the deterministic stack did NOT settle (`!axeFlag && !v3Flag`), so its
// target-SC obligation stays auto-PARTIAL and REACHES the LLM. Drawn from the proposed SUPERSET raw (approved +
// draft). `failed` ⇒ recall; `passed`/`inapplicable` ⇒ SPECIFICITY (a flagged barrier on the target SC = a false
// positive). failed-reaches = 66 here, matching the bothFail FN set exactly.
function loadReachesLlmCases() {
  const RAW = path.join(REPO_ROOT, 'eval/checker-comparison/upstream-evidence/v3-act-subset-proposed/raw.json');
  const raw = JSON.parse(fs.readFileSync(RAW, 'utf8'));
  const out = [];
  for (const r of raw) {
    if (r.error || r.axeFlag || r.v3Flag) continue;          // decided by axe/v3 ⇒ does NOT reach the LLM on its SC
    const localPath = path.join('pages', r.ruleId, r.testcaseId + '.html');
    if (!fs.existsSync(path.join(SUBSET_DIR, localPath))) continue; // fixture must be present locally
    out.push({ ruleId: r.ruleId, ruleName: r.ruleName, testcaseId: r.testcaseId, expected: r.expected, sc: r.sc, localPath, url: r.url, draft: r.approved === false });
  }
  return out;
}

const urlFor = (tc) => 'file://' + path.join(SUBSET_DIR, tc.localPath);

// ============================ live telemetry ============================
const startedAt = Date.now();
const tel = {
  startedAt,
  runName: RUN_NAME,
  config: { fnTotal: 0, pageConc: PAGE_CONC, globalLlm: GLOBAL_LLM, perPageLlm: LLM_CONC, maxTabs: MAX_TABS, vision: VISION, tools: TOOLS, evidence: EVIDENCE_MODE, noVisionRubric: NO_VISION_RUBRIC, baselineVision: BASELINE_VISION, model: MODEL },
  phase: 'init',
  done: 0,
  total: 0,
  workers: {},     // workerId -> { idx, ruleId, sc, expected, phase, startedAt }
  inflight: {},    // callId  -> { xpath, sc, skill, startedAt }
  llm: { calls: 0, done: 0, results: 0, peakInFlight: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreateTokens: 0, costUsd: 0 },
  tabs: {},        // allocator.stats()
  mem: {},
  tally: { caught: 0, missedAgree: 0, uncertain: 0, noVerdict: 0, noObligation: 0, error: 0 },
  recent: [],      // last N completions
  errors: [],
};

function writeStatus() {
  try {
    tel.elapsedMs = Date.now() - startedAt;
    tel.llm.inFlightNow = Object.keys(tel.inflight).length;
    const payload = JSON.stringify(tel);
    fs.writeFileSync(path.join(OUT, 'status.json'), payload);
    // mirror to a FIXED path (last-writer-wins) so the monitor can follow "the current run" with no arg; the
    // payload carries runName + config so the dashboard shows WHICH experiment owns it.
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
// ONE config carrying the persistent token sink. It feeds BOTH the single-shot transport built here AND the
// multi-turn tool transport orchestrate builds internally (it rides `...llmTransportConfig`), so the monitor's
// token/cost counters stay honest whether tools are off or on.
const TRANSPORT_WITH_SINK = { ...TRANSPORT_CONFIG, onTraceSink: recordTrace };
const baseAgent = makeRunAgent({ transport: makeClaudeSdkTransport(TRANSPORT_WITH_SINK), model: MODEL });
// GLOBAL semaphore + inflight tracking, factored so it wraps EITHER agent: the single-shot agent (here) and the
// tool agent (via orchestrate's wrapAgent hook). One global cap + one inflight view regardless of tools on/off.
const wrapAgent = (agent) => (messages, subject) => sem.run(async () => {
  const id = ++callSeq;
  tel.inflight[id] = { xpath: (subject && subject.xpath) || null, sc: (subject && subject.sc) || null, skill: (subject && (subject.skill || subject.rubricId)) || null, startedAt: Date.now() };
  tel.llm.calls++;
  const nIn = Object.keys(tel.inflight).length;        // LLM-concurrency high-water mark (real peak parallel calls)
  if (nIn > tel.llm.peakInFlight) tel.llm.peakInFlight = nIn;
  try { return await agent(messages, subject); }
  finally { delete tel.inflight[id]; tel.llm.done++; }
});
const runAgent = wrapAgent(baseAgent);

// ============================ scoring one case ============================
function scoreCase(tc, out) {
  const inScope = new Set(tc.sc || []);
  const built = out && out.built;
  const bundle = (out && out.bundle) || {};
  const rec = { testcaseId: tc.testcaseId, ruleId: tc.ruleId, ruleName: tc.ruleName, sc: tc.sc, expected: tc.expected, draft: !!tc.draft, url: tc.url };

  const agentV = (bundle.llm && bundle.llm.verdicts) || [];
  const rubricV = (bundle.judgments && bundle.judgments.judgments) || [];
  const agentInScope = agentV.filter((v) => inScope.has(v.sc));
  const rubricInScope = rubricV.filter((j) => inScope.has(j.sc));

  // deterministic re-check (these should be FN ⇒ no in-scope deterministic barrier; recorded honestly)
  const shadow = (built && built.results && built.results.shadowObservations) || [];
  rec.v3Barrier = shadow.some((o) => o.source === 'deterministic' && inScope.has(o.sc) && o.wouldBe && o.wouldBe.observationOutcome === 'BARRIER_OBSERVED');

  // in-scope obligation ledger (was the LLM even ASKED about this SC?)
  const ledger = (built && built.results && built.results.obligationLedger) || [];
  const inScopeOblig = ledger.filter((r) => inScope.has(r.sc));
  rec.inScopeObligations = inScopeOblig.length;
  rec.inScopeAutoPartial = inScopeOblig.filter((r) => r.autoPartial).length;
  // a MINTED/deterministic BARRIER that FILLED an in-scope obligation (autoPartial=false, cleared=false) is the
  // harness catching it — covers the axe-decided, deterministic-detector (iframe/aria-hidden/role=none) and
  // keyboard-trap PROVISIONAL barriers that fill the ledger but never enter shadowObservations as source:
  // 'deterministic' (so rec.v3Barrier misses them, and the obligation, being filled, is no longer autoPartial →
  // it was mis-scored as noObligation/noVerdict). This is the minted-barrier analog of the v3Barrier credit.
  // ONLY a minted PROVISIONAL BARRIER counts as a catch — NOT a deferred/review PARTIAL. The old test
  // (`autoPartial === false`) also matched a deliberate PARTIAL (a checker/runner/instrument flagging the obligation
  // for REVIEW without asserting a barrier — e.g. contrast on a photo backdrop, the demoted confinement review),
  // which inflated BOTH recall and FP by scoring "the harness deferred" as "the harness caught it".
  rec.inScopeBarrierFilled = inScopeOblig.filter((r) => r.disposition === 'PROVISIONAL' && r.cleared === false).length;

  const barrierAgent = agentInScope.filter((v) => v.agentVerdict === 'REPRODUCED');
  const barrierRubric = rubricInScope.filter((j) => j.verdict === 'LIKELY_BARRIER');
  const okAgent = agentInScope.filter((v) => v.agentVerdict === 'NOT REPRODUCED');
  const okRubric = rubricInScope.filter((j) => j.verdict === 'LIKELY_OK');
  const nVerdicts = agentInScope.length + rubricInScope.length;

  let outcome;
  // CREDIT a deterministic in-scope barrier: the harness CAUGHT it via a runner/checker (the obligation was filled
  // deterministically and correctly subtracted from the LLM lane), so it is a true catch — NOT a noObligation FN.
  // Without this, the LLM-only scorer penalized the harness for a barrier it actually found (the contrast/keyboard
  // runner cases that show v3Barrier:true but produce no LLM verdict because the obligation was already disposed).
  if (rec.v3Barrier || rec.inScopeBarrierFilled > 0) outcome = 'caught';
  else if (barrierAgent.length || barrierRubric.length) outcome = 'caught';
  else if (nVerdicts === 0) outcome = rec.inScopeAutoPartial > 0 ? 'noVerdict' : 'noObligation';
  else if (okAgent.length || okRubric.length) outcome = 'missedAgree';
  else outcome = 'uncertain';
  rec.outcome = outcome;
  rec.llmFlag = outcome === 'caught';
  // POLARITY (ACT GT is per-SC): on a `failed` case a flagged barrier is a TRUE POSITIVE (recall); on a
  // `passed`/`inapplicable` case the SAME flag is a FALSE POSITIVE (the LLM invented a barrier the GT denies).
  rec.polarity = tc.expected === 'failed' ? 'recall' : 'specificity';
  rec.correct = rec.polarity === 'recall' ? (outcome === 'caught') : (outcome !== 'caught');
  rec.falsePositive = rec.polarity === 'specificity' && outcome === 'caught';

  // surface the actual verdicts + rationale so the run is auditable
  const rats = (bundle.llmRationale && bundle.llmRationale.rationales) || [];
  const ratById = {}; for (const r of rats) ratById[r.verdictId] = r;
  rec.agentVerdicts = agentInScope.map((v) => ({ sc: v.sc, verdict: v.agentVerdict, confidence: v.confidence, claimFamily: v.claimFamily, xpath: v.targetXpath,
    summary: (ratById[v.verdictId] && ratById[v.verdictId].summary) || null }));
  rec.rubricVerdicts = rubricInScope.map((j) => ({ sc: j.sc, verdict: j.verdict, confidence: j.confidence, rubric: j.rubricRef, xpath: j.targetXpath, summary: j.summary || null }));
  // also note any OUT-of-scope barrier the LLM raised (the page may fail a DIFFERENT SC than the ACT rule targets)
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
  let cases = REACHES_LLM ? loadReachesLlmCases() : loadFnCases();
  if (SC) cases = cases.filter((c) => (c.sc || []).includes(SC));
  if (CASES_FILE) {
    const ids = new Set(fs.readFileSync(CASES_FILE, 'utf8').split(/\s+/).filter(Boolean));
    const before = cases.length;
    cases = cases.filter((c) => ids.has(c.testcaseId));
    console.log(`--cases ${path.basename(CASES_FILE)}: ${ids.size} ids → ${cases.length} matched (of ${before})`);
  }
  if (Number.isFinite(LIMIT) && LIMIT > 0) cases = cases.slice(0, LIMIT);
  tel.total = cases.length;
  tel.config.fnTotal = cases.length;
  tel.phase = 'launching';
  writeStatus();
  console.log(`FN×LLM run: ${cases.length} cases | model=${MODEL} effort=${TRANSPORT_CONFIG.effort} | pages=${PAGE_CONC} globalLLM=${GLOBAL_LLM} maxTabs=${MAX_TABS} vision=${VISION} tools=${TOOLS}`);
  console.log(`status → ${path.join(OUT, 'status.json')}  (run: node ${path.relative(process.cwd(), path.join(__dirname, 'fn-llm-monitor.js'))})`);

  if (!process.env.CLAUDE_CODE_OAUTH_TOKEN) { console.error('FATAL: CLAUDE_CODE_OAUTH_TOKEN not set (.env)'); process.exit(1); }

  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const browserPid = browser.process() && browser.process().pid;
  const alloc = createTabAllocator({ browser, maxTabs: MAX_TABS });
  tel.phase = 'running';

  // status writer (+ memory sampler) on a timer
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
    fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summarize(results), null, 2));
  };

  let cursor = 0;
  const worker = async (wid) => {
    while (true) {
      const i = cursor++;
      if (i >= cases.length) { delete tel.workers[wid]; return; }
      const tc = cases[i];
      const runId = `fn-llm-${tc.testcaseId}`;
      tel.workers[wid] = { idx: i, ruleId: tc.ruleId, sc: (tc.sc || []).join(','), expected: tc.expected, phase: 'collect', startedAt: Date.now() };
      let rec;
      try {
        // COLLECT: borrow a tab from the shared allocator, navigate + extract, release.
        const lease = await alloc.acquire();
        let collect;
        try {
          collect = normalizeCollectRoles(await collectActPage(lease.page, {
            url: urlFor(tc), elementCap: ELEMENT_CAP, file: `act:${tc.testcaseId}`, runId, sourceUrl: tc.url,
            runAxe: true, axePath: AXE_PATH, // surface axe → the axe-promotion (decided) + checker-uncertainty obligations (incomplete)
          }));
        } finally { await lease.release(); }
        tel.workers[wid].phase = 'orchestrate';
        const drive = { file: collect.file, runId, pageDigest: collect.pageDigest, drivenAt: collect.collectedAt + 1, elements: [] };
        const out = await orchestrate(collect, drive, {
          resolveUrl: () => urlFor(tc),
          executablePath: CHROME, browser, tabAllocator: alloc, maxTabs: MAX_TABS,
          // INSTRUMENTS lane (VSR + keyboard-trap + focus-rests-in-aria-hidden) — was NEVER enabled here, so the kbd
          // 2.1.2 + 6cfa84 4.1.2 deterministic catches silently never ran (those cases read as noObligation). Enable it,
          // gated to a LOWER concurrency than the page pool (the lane DRIVES the keyboard and thrashes a contended
          // browser) and bounded by a hard timeout (orchestrate races it; a slow/hung lane fails closed to no findings).
          runInstruments: true, instrumentsGate: instGate, instrumentsTimeoutMs: INSTRUMENTS_TIMEOUT,
          now: collect.collectedAt + 2,
          restrictScs: RESTRICT_SC ? new Set(tc.sc || []) : undefined, // judge ONLY the case's GT'd SC (ACT GT is per-SC)
          maxAutomatic: Number.isFinite(MAX_AUTO) ? MAX_AUTO : Infinity,
          budgetOpts: { maxRunWallClockMs: RUN_WALL }, // deterministic lane bounded by TIME (2 min), not count — run as many real runners as fit, defer the tail to the LLM lane

          experimentConcurrency: Math.min(LIMITS.concurrency.experimentCap, LIMITS.concurrency.experiment),
          runLlm: RUN_LLM, runAgent, captureVision: RUN_LLM && VISION, wrapAgent, // --no-llm ⇒ DETERMINISTIC baseline (no LLM lane, no vision capture)
          llmConcurrency: LLM_CONC,
          llmTools: TOOLS, llmTransportConfig: TRANSPORT_WITH_SINK,
          llmToolConcurrency: LIMITS.concurrency.llmTool,
          llmToolMaxTurns: LIMITS.llm.toolMaxTurns,
          llmToolRunTimeoutMs: LIMITS.llm.toolRunTimeoutMs,
        });
        rec = scoreCase(tc, out);
        // full LLM trace → side file (offline analysis); base64 already elided by the transport.
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
  const byExpected = {}; // expected -> outcome counts
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
  // POLARITY metrics: recall on `failed`; false-positive rate on `passed`+`inapplicable` (specificity).
  const recallCases = results.filter((r) => r.polarity === 'recall');
  const specCases = results.filter((r) => r.polarity === 'specificity');
  const recallCaught = recallCases.filter((r) => r.outcome === 'caught').length;
  const falsePos = specCases.filter((r) => r.falsePositive).length;
  return { generatedAt: new Date().toISOString(), n, model: MODEL, vision: VISION, tools: TOOLS,
    reachesLlm: REACHES_LLM, restrictSc: RESTRICT_SC, tally, byExpected,
    recall: { failedN: recallCases.length, caught: recallCaught, recallRate: recallCases.length ? +(recallCaught / recallCases.length).toFixed(3) : null },
    specificity: { n: specCases.length, falsePositive: falsePos, falsePositiveRate: specCases.length ? +(falsePos / specCases.length).toFixed(3) : null },
    caughtRate: n ? +(tally.caught / n).toFixed(3) : null, bySc };
}

function printSummary(results) {
  const s = summarize(results);
  console.log('\n================= LLM eval results (recall + specificity) =================');
  console.log(`cases: ${s.n}  |  model ${s.model}  vision=${s.vision} tools=${s.tools}  restrictSC=${s.restrictSc}  reachesLLM=${s.reachesLlm}`);
  console.log('\n  RECALL — expected=failed (a flagged barrier is a TRUE POSITIVE):');
  console.log(`    failed cases reaching the LLM: ${s.recall.failedN}  |  caught: ${s.recall.caught}  =  ${s.recall.recallRate != null ? (100 * s.recall.recallRate).toFixed(0) + '%' : '-'} recall`);
  console.log('\n  SPECIFICITY — expected=passed/inapplicable (a flagged barrier is a FALSE POSITIVE):');
  console.log(`    specificity cases: ${s.specificity.n}  |  false positives: ${s.specificity.falsePositive}  =  ${s.specificity.falsePositiveRate != null ? (100 * s.specificity.falsePositiveRate).toFixed(1) + '%' : '-'} FP rate`);
  for (const e of ['passed', 'inapplicable']) { const b = s.byExpected[e]; if (b) console.log(`      ${e.padEnd(13)} n=${String(b.n).padStart(3)}  FP(flagged)=${String(b.caught).padStart(3)}  clearedOK=${String(b.missedAgree).padStart(3)}  uncertain=${String(b.uncertain).padStart(3)}  noVerdict=${String(b.noVerdict).padStart(3)}  noObligation=${String(b.noObligation).padStart(3)}`); }
  console.log('\n  by SC (FP = flagged where GT says pass/inapplicable; * = recall SC):');
  console.log('    sc        exp           n  caught/FP  agree  uncert  noVerd  noOblig');
  for (const [sc, b] of Object.entries(s.bySc).sort()) {
    console.log(`    ${sc.padEnd(8)} ${String(b.expected).padEnd(13)} ${String(b.total).padStart(2)}   ${String(b.caught).padStart(7)}  ${String(b.missedAgree).padStart(5)}  ${String(b.uncertain).padStart(6)}  ${String(b.noVerdict).padStart(6)}  ${String(b.noObligation).padStart(7)}`);
  }
  console.log(`\n  raw outcome tally: ${JSON.stringify(s.tally)}`);
  console.log(`  resource peak: parallel LLM ${tel.llm.peakInFlight}/${GLOBAL_LLM}  |  tabs ${(tel.tabs && tel.tabs.peak) || '?'}/${MAX_TABS}  |  pages=${PAGE_CONC} perPageLLM=${TOOLS ? Math.min(LLM_CONC, LIMITS.concurrency.llmTool) : LLM_CONC}`);
  console.log(`\nwrote ${path.join(OUT, 'results.json')} + summary.json + llm-trace.json`);
}

main().catch((e) => { console.error(e && e.stack || e); process.exit(1); });
