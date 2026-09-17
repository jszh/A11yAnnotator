#!/usr/bin/env node
'use strict';
// Run the v3 harness over the HUMAN-ANNOTATED slice of eval/act-augmented/.
//
// The corpus's `expected` labels are only as good as the cases behind them, and
// this session's adjudication sorted the annotated pages into strata:
//
//   unflagged        326  no annotator raised anything
//   clear             72  raised, checked against the live page, no defect found
//   fixed              7  raised, defect confirmed, metadata repaired this session
//   needs-validation  21  ground truth NOT settled — EXCLUDED by default
//
// Scoring the excluded 21 would be scoring against labels we know are disputed,
// so `--include` defaults to everything else. Each result record carries its
// stratum so the run can be sliced afterwards (score-annotated-run.js) without
// re-running anything.
//
// Mechanically this is freeze-heldout.js's pipeline (same orchestrator, same
// collector, same scoreCase) minus the judge-input freezing, plus case selection
// by stratum and a live status.json the existing monitor already renders.
//
// Usage:
//   node eval/act-augmented/_tools/run-annotated-suite.js --out aug-annot-sonnet46
//   node eval/act-augmented/_tools/run-annotated-suite.js --limit 4 --out smoke   # smoke test
//   node eval/act-augmented/_tools/run-annotated-suite.js --include clear         # one stratum
//   node eval/act-augmented/_tools/run-annotated-suite.js --include all           # incl. needs-validation
// Progress, in a second terminal:
//   node eval/checker-comparison/fn-llm-monitor.js
//   node eval/act-augmented/_tools/annotated-run-progress.js --watch

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..', '..', '..');
require('../../../scripts/v3/lib/load-env.js').loadEnv(REPO_ROOT);

const { orchestrate, BROWSER_ARGS } = require('../../../scripts/v3/lib/orchestrator.js');
const { createTabAllocator } = require('../../../scripts/v3/lib/tab-allocator.js');
const { createBrowserShardPool } = require('../../../scripts/v3/lib/browser-shard-pool.js');
const { makeRunAgent, makeClaudeSdkTransport, makeGeminiTransport, makeGeminiCacheManager, makeOpenRouterTransport } = require('../../../scripts/v3/lib/llm-agent-adapter.js');
const { collectActPage, normalizeCollectRoles } = require('../../../scripts/v3/lib/act-page-collect.js');
const { makeSemaphore, sampleMemory } = require('../../../scripts/v3/lib/run-telemetry.js');
const LIMITS = require('../../../scripts/v3/lib/limits.js');
const { scoreCase, printSummary, summarize } = require('../../checker-comparison/fp-experiments/score-lib.js');
const puppeteer = require('puppeteer');

// accepts --flag, --key=value and --key value
function arg(name, def = null) {
  const p = process.argv.find((x) => x === `--${name}` || x.startsWith(`--${name}=`));
  if (!p) return def;
  if (p.startsWith(`--${name}=`)) return p.slice(name.length + 3);
  const next = process.argv[process.argv.indexOf(p) + 1];
  return next && !next.startsWith('--') ? next : true;
}

const CHROME = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const AUG_DIR = path.join(REPO_ROOT, 'eval/act-augmented');
const IRR_DIR = path.join(AUG_DIR, '_annotator/irr');
const AXE_PATH = process.env.AXE_PATH || path.join(REPO_ROOT, 'axe.min.js');

const RUN_NAME = String(arg('out', 'aug-annotated-sonnet46'));
const OUT = path.join(REPO_ROOT, 'results', RUN_NAME);
const LIMIT = Number(arg('limit', 0));
// Concurrency: tabs are the scarce resource, not the LLM. History: at PAGE_CONC 8
// with protocolTimeout 180s and no self-heal, one browser peaked at 40 live contexts
// and createBrowserContext started timing out; at PAGE_CONC 6 the allocator sat
// pinned at its 24-tab cap (~3.7 concurrent tabs per case). 12/36 scales both
// knobs together, stays under LIMITS.concurrency.maxTabs=50, and relies on the
// 300s protocolTimeout + browser self-heal below as the wedge backstop.
const PAGE_CONC = Number(arg('pages', 12));
// An explicit CLI value is an intentional run-level override. Previously it was
// silently clamped to LIMITS.concurrency.maxTabs, so `--max-tabs 256` actually
// launched with 50 unless V3_MAX_TABS was also set. Defaults remain conservative;
// explicit launch parameters are now reflected exactly in execution + provenance.
const MAX_TABS_RAW = Number(arg('max-tabs', Math.min(LIMITS.concurrency.maxTabs, 36)));
if (!Number.isFinite(MAX_TABS_RAW) || MAX_TABS_RAW < 1) throw new Error(`invalid --max-tabs value: ${MAX_TABS_RAW}`);
const MAX_TABS = Math.floor(MAX_TABS_RAW);
// Keep --max-tabs as the aggregate run-wide budget. --browsers partitions that
// budget across independent Chromium processes (e.g. 4 browsers + 144 tabs =
// four 36-tab allocators) so browser-context/CDP work can use multiple cores.
const BROWSER_SHARDS = Math.max(1, Math.min(PAGE_CONC, MAX_TABS, Math.floor(Number(arg('browsers', 1)) || 1)));
const PROVIDER = String(arg('provider', 'claude')).toLowerCase();
if (!['claude', 'gemini', 'openrouter'].includes(PROVIDER)) throw new Error(`unsupported --provider: ${PROVIDER}`);
const LLM_CAP = (PROVIDER === 'gemini' || PROVIDER === 'openrouter') ? Number(process.env.GEMINI_LLM_CAP || 100) : LIMITS.concurrency.llm;
const GLOBAL_LLM = Math.min(LLM_CAP, Math.max(1, Number(arg('global-llm', LIMITS.concurrency.llm))));
const MODEL = process.env.V3_LLM_MODEL || (PROVIDER === 'gemini' ? 'gemini-3.7-flash' : 'claude-sonnet-4-6');
const EFFORT = arg('effort', process.env.V3_LLM_EFFORT || null);
// Gemini flex tier (50% token cost, 1-15 min latency, sheddable). Raise the HTTP timeout with it: at the 60s
// default a slow-but-healthy flex response aborts and becomes a fabricated no-verdict.
const SERVICE_TIER = process.env.V3_LLM_SERVICE_TIER || null;
const HTTP_TIMEOUT_MS = +(process.env.V3_LLM_HTTP_TIMEOUT_MS || (SERVICE_TIER === 'flex' ? 900000 : 0)) || undefined;
const INCLUDE = String(arg('include', 'unflagged,clear,fixed'));
const CASE_LIST_RAW = arg('case-list', null);
const SC_FILTER_RAW = arg('sc', null);
const SC_FILTER = SC_FILTER_RAW ? new Set(String(SC_FILTER_RAW).split(',').map((s) => s.trim()).filter(Boolean)) : null;
// --tools: live in-process CDP tools (multi-turn judge). The deployed harness
// baselines all run tools=ON, so a tools-OFF run here is NOT comparable to them.
const TOOLS = !!arg('tools', false);
// --no-llm: deterministic phases only (collect/instruments/experiments/build; no judge).
// A perf/stress probe, NOT comparable to any scored run — summary.json carries noLlm:true.
const NO_LLM = !!arg('no-llm', false);
// batch-3 #36 (infra, optional): per-case obligation/instrument artifact dumps. The runner persists only
// results.json, so every evidence diff in an RCA has had to re-probe frozen code trees — hours of work a
// cheap dump would have saved. OFF by default (scored-run output shape unchanged); when armed
// (V3_DUMP_CASE_ARTIFACTS=1 or --dump-artifacts) each case additionally writes
// results/<run>/case-artifacts/<testcaseId>.json with the obligation ledger + the instruments artifact.
const DUMP_ARTIFACTS = process.env.V3_DUMP_CASE_ARTIFACTS === '1' || !!arg('dump-artifacts', false);
const INSTRUMENTS_TIMEOUT = Math.max(1, Number(arg('instruments-timeout-ms', LIMITS.instruments.laneTimeoutMs || 90000)) || 90000);

// CLAUDE.md: do NOT override LLM_EVAL_STATUS_PATH unless running >1 experiment at once.
const FIXED_STATUS_PATH = process.env.LLM_EVAL_STATUS_PATH || '/tmp/llm-eval-status.json';
const STATUS_EVERY_MS = 500;

const TRANSPORT = {
  oauthToken: process.env.CLAUDE_CODE_OAUTH_TOKEN,
  apiKey: process.env.GEMINI_API_KEY,
  model: MODEL,
  effort: EFFORT,
  perTurnTimeoutMs: +(process.env.V3_LLM_TURN_TIMEOUT_MS || LIMITS.llm.perTurnTimeoutMs),
  runTimeoutMs: +(process.env.V3_LLM_RUN_TIMEOUT_MS || LIMITS.llm.runTimeoutMs),
};
let geminiCacheManager = null;

const safe = (s) => String(s).replace(/[^a-z0-9_]+/gi, '-').slice(0, 80);

// ---------------------------------------------------------------- case set

/** key -> stratum, from this session's adjudication. */
function strata() {
  const m = new Map();
  const tagFile = path.join(IRR_DIR, 'case-reliability-tags.json');
  if (fs.existsSync(tagFile)) {
    for (const c of JSON.parse(fs.readFileSync(tagFile, 'utf8')).cases) m.set(c.key, c.tag);
  }
  return m;
}

/** The 426 pages a human actually annotated (union over annotations/*.json). */
function annotatedKeys() {
  const keys = new Map();
  const dir = path.join(REPO_ROOT, 'annotations');
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const doc = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const who = doc.meta?.annotatorName || f;
    for (const [k, a] of Object.entries(doc.annotations)) {
      if (!keys.has(k)) keys.set(k, []);
      keys.get(k).push({ annotator: who, issueExists: a.issueExists });
    }
  }
  return keys;
}

function loadCases() {
  if (CASE_LIST_RAW) {
    const listPath = path.isAbsolute(String(CASE_LIST_RAW))
      ? String(CASE_LIST_RAW) : path.join(REPO_ROOT, String(CASE_LIST_RAW));
    const rows = JSON.parse(fs.readFileSync(listPath, 'utf8'));
    const cases = rows.map((row) => {
      const abs = path.join(REPO_ROOT, row.file);
      if (!fs.existsSync(abs)) throw new Error(`case-list fixture missing: ${row.file}`);
      return {
        testcaseId: `aug-${row.sc}-${safe(row.aspect)}-${safe(row.id)}`,
        key: row.key || `${row.sc}::${row.aspect}::${row.id}`,
        stratum: 'initial-79', ruleId: safe(row.aspect), ruleName: row.aspect,
        sc: [row.sc], expected: row.expected, localAbs: abs, url: 'file://' + abs,
        draft: false, humanVotes: [],
      };
    });
    return { cases, availableByStratum: { 'initial-79': cases.length } };
  }
  const tag = strata();
  const annotated = annotatedKeys();
  const include = new Set(INCLUDE === 'all'
    ? ['unflagged', 'clear', 'fixed', 'needs-validation']
    : INCLUDE.split(',').map((s) => s.trim()).filter(Boolean));

  const out = [];
  const counts = {};
  for (const sc of fs.readdirSync(AUG_DIR).sort()) {
    const rp = path.join(AUG_DIR, sc, 'result.json');
    if (!fs.existsSync(rp)) continue;
    if (SC_FILTER && !SC_FILTER.has(sc)) continue;
    const r = JSON.parse(fs.readFileSync(rp, 'utf8'));
    for (const ar of (r.aspectResults || [])) {
      const aspect = (ar.built && ar.built.aspectSlug) || ar.aspect || 'aspect';
      for (const p of ((ar.built && ar.built.pages) || [])) {
        const key = `${sc}::${aspect}::${p.id}`;
        if (!annotated.has(key)) continue;                       // annotated slice only
        const stratum = tag.get(key) || 'unflagged';
        counts[stratum] = (counts[stratum] || 0) + 1;
        if (!include.has(stratum)) continue;
        const abs = path.join(REPO_ROOT, p.file);
        if (!fs.existsSync(abs)) continue;
        out.push({
          testcaseId: `aug-${sc}-${safe(aspect)}-${safe(p.id)}`,
          key, stratum, ruleId: safe(aspect), ruleName: p.scenario || aspect,
          sc: [sc], expected: p.expected, localAbs: abs, url: 'file://' + abs, draft: false,
          humanVotes: annotated.get(key),
        });
      }
    }
  }
  return { cases: out, availableByStratum: counts };
}

// ---------------------------------------------------------------- telemetry

const startedAt = Date.now();
const tel = {
  startedAt, runName: RUN_NAME, phase: 'init', done: 0, total: 0,
  config: { provider: PROVIDER, model: MODEL, effort: EFFORT, include: INCLUDE, caseList: CASE_LIST_RAW, sc: SC_FILTER ? [...SC_FILTER] : null, pageConc: PAGE_CONC, globalLlm: GLOBAL_LLM, maxTabs: MAX_TABS, browserShards: BROWSER_SHARDS, instruments: Number(arg('inst-gate', 6)), instrumentsTimeoutMs: INSTRUMENTS_TIMEOUT, vision: true, tools: TOOLS, noLlm: NO_LLM },
  workers: {}, inflight: {},
  llm: { calls: 0, done: 0, results: 0, transportFailures: 0, failuresByMode: {}, peakInFlight: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreateTokens: 0, costUsd: 0 },
  // A tools-ON run that makes zero tool calls has happened before (prompting gap
  // + a built-in-tool leak). Count them so the failure is visible in the first
  // minutes rather than discovered after the run.
  tools: { calls: 0, byName: {}, multiTurnResults: 0, maxTurns: 0 },
  cache: null,
  tabs: {}, mem: {},
  tally: { caught: 0, missedAgree: 0, uncertain: 0, noVerdict: 0, noObligation: 0, error: 0 },
  byStratum: {},
  recent: [], errors: [],
};

function writeStatus() {
  try {
    tel.elapsedMs = Date.now() - startedAt;
    tel.llm.inFlightNow = Object.keys(tel.inflight).length;
    const payload = JSON.stringify(tel);
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, 'status.json'), payload);
    try { fs.writeFileSync(FIXED_STATUS_PATH, payload); } catch (e) { /* best effort */ }
  } catch (e) { /* best effort */ }
}

const sem = makeSemaphore(GLOBAL_LLM);
// Instrument cap (--inst-gate, default 6): at 4, the instrument phase (mean ~43s/case)
// bounds whole-run throughput to ~10.7s/case — below what PAGE_CONC 12 can reach.
// Larger machines can raise it; it is the browser-heaviest lane, so it scales with tabs.
const instGate = makeSemaphore(Math.max(1, Math.min(PAGE_CONC, Number(arg('inst-gate', 6)))));

// Token usage arrives on the transport's trace sink, not on the agent's return
// value — the same sink run-fn-llm.js uses, so the counters stay comparable.
// PER-CASE ATTRIBUTION: the run-level tool counters answer "did tools fire at all", but not "did THIS
// case use a tool, and did that change its outcome" — which is the question that actually matters when
// diagnosing a miss. The 2026-08-15 root-cause pass could not answer it: `agentVerdicts` was empty on all
// 405 records, so a run-level "74% of tool-capable runs made zero tool calls" could not be joined to any
// per-case result, and one root cause had to be INFERRED from verdict prose instead of observed. Passing a
// per-case sink alongside the global one fixes that at no cost.
function makeTraceSink(caseAcc, tc = null, attempt = null) {
  return function recordTraceFor(e) {
    if (!e) return;
    if (Array.isArray(e.blocks)) {
      if (tc) {
        try { fs.appendFileSync(path.join(OUT, 'tool-events.jsonl'), JSON.stringify({ testcaseId: tc.testcaseId, ruleId: tc.ruleId, sc: tc.sc, attempt, event: e }) + '\n'); }
        catch (err) { tel.tools.traceWriteErrors = (tel.tools.traceWriteErrors || 0) + 1; }
      }
      for (const b of e.blocks) {
        if (b && b.kind === 'tool_use') {
          tel.tools.calls++;
          tel.tools.byName[b.name] = (tel.tools.byName[b.name] || 0) + 1;
          if (caseAcc) { caseAcc.calls++; caseAcc.byName[b.name] = (caseAcc.byName[b.name] || 0) + 1; }
        }
      }
      return;
    }
    if (e.type === 'transportFail') {
      const mode = e.mode || 'unknown';
      tel.llm.transportFailures++;
      tel.llm.failuresByMode[mode] = (tel.llm.failuresByMode[mode] || 0) + 1;
      if (caseAcc) {
        caseAcc.transportFailures = (caseAcc.transportFailures || 0) + 1;
        caseAcc.failuresByMode = caseAcc.failuresByMode || {};
        caseAcc.failuresByMode[mode] = (caseAcc.failuresByMode[mode] || 0) + 1;
      }
      return;
    }
    if (e.type !== 'result') return;
    if (e.numTurns > 1) tel.tools.multiTurnResults++;
    tel.tools.maxTurns = Math.max(tel.tools.maxTurns, e.numTurns || 0);
    if (caseAcc) {
      if (e.numTurns > 1) caseAcc.multiTurnResults++;
      caseAcc.maxTurns = Math.max(caseAcc.maxTurns, e.numTurns || 0);
      caseAcc.llmCalls++;
    }
    const u = e.usage || {};
    tel.llm.inputTokens += (+u.input_tokens || 0);
    tel.llm.outputTokens += (+u.output_tokens || 0);
    tel.llm.cacheReadTokens += (+u.cache_read_input_tokens || 0);
    tel.llm.cacheCreateTokens += (+u.cache_creation_input_tokens || 0);
    if (typeof e.totalCostUsd === 'number') tel.llm.costUsd += e.totalCostUsd;
    tel.llm.results++;
  };
}
const newCaseToolAcc = () => ({ calls: 0, byName: {}, multiTurnResults: 0, maxTurns: 0, llmCalls: 0 });
const recordTrace = makeTraceSink(null);   // run-level only (the non-tool base agent)
const baseTransport = PROVIDER === 'gemini'
  ? makeGeminiTransport({ apiKey: TRANSPORT.apiKey, model: MODEL, effort: EFFORT, onTraceSink: recordTrace, serviceTier: SERVICE_TIER, ...(HTTP_TIMEOUT_MS ? { timeoutMs: HTTP_TIMEOUT_MS } : {}) })
  : PROVIDER === 'openrouter'
  ? makeOpenRouterTransport({ apiKey: process.env.OPENROUTER_API_KEY, model: MODEL, effort: EFFORT, onTraceSink: recordTrace })
  : makeClaudeSdkTransport({ ...TRANSPORT, onTraceSink: recordTrace });
const baseAgent = makeRunAgent({ transport: baseTransport, model: MODEL });

let callSeq = 0;
// One wrapper applied to BOTH the single-shot agent and (via orchestrate's
// wrapAgent hook) the multi-turn tool agent, exactly as run-fn-llm.js:205-214
// does — otherwise the tool agent runs outside the global LLM cap entirely.
// It doubles as the probe for whether the tool agent was built at all: the hook
// only fires inside the branch that replaces the judge.
const wrapAgent = (agent) => (messages, subject) => sem.run(async () => {
  const id = `c${++callSeq}`;
  tel.inflight[id] = { xpath: subject?.xpath || null, sc: subject?.sc || null, skill: subject?.skill || subject?.rubricRef || null, startedAt: Date.now() };
  tel.llm.calls++;
  tel.llm.peakInFlight = Math.max(tel.llm.peakInFlight, Object.keys(tel.inflight).length);
  try {
    const res = await agent(messages, subject);
    tel.llm.done++;
    return res;
  } finally { delete tel.inflight[id]; }
});
const runAgent = wrapAgent(baseAgent);

// ---------------------------------------------------------------- main

async function main() {
  const { cases: all, availableByStratum } = loadCases();
  let cases = all;
  if (LIMIT > 0) cases = cases.slice(0, LIMIT);
  if (!NO_LLM && PROVIDER === 'gemini' && !/^gemini-/i.test(MODEL)) {
    throw new Error(`provider/model mismatch: --provider=gemini requires a Gemini model, got ${JSON.stringify(MODEL)}. Set V3_LLM_MODEL=gemini-3.7-flash (or another gemini-* model).`);
  }
  if (!NO_LLM && PROVIDER === 'gemini' && !process.env.GEMINI_API_KEY) { console.error('FATAL: GEMINI_API_KEY not set (.env)'); process.exit(1); }
  if (!NO_LLM && PROVIDER !== 'gemini' && !process.env.CLAUDE_CODE_OAUTH_TOKEN) { console.error('FATAL: CLAUDE_CODE_OAUTH_TOKEN not set (.env)'); process.exit(1); }

  // One run-scoped cache registry is shared by every page/shard. It single-flights creation per exact rubric prefix
  // and tool schema, so high concurrency cannot stampede the CachedContent API. Explicit caches are GenerateContent-
  // only; an AUTO function call routes that subject to a fresh stateful Interactions chain. TTL handles crashes and
  // normal completion deletes all cache resources eagerly.
  if (!NO_LLM && TOOLS && PROVIDER === 'gemini' && process.env.V3_GEMINI_HYBRID !== '0') {
    geminiCacheManager = makeGeminiCacheManager({ apiKey: process.env.GEMINI_API_KEY, model: MODEL });
    TRANSPORT.cacheManager = geminiCacheManager;
  }

  fs.mkdirSync(OUT, { recursive: true });
  tel.total = cases.length;
  tel.phase = 'running';
  for (const c of cases) tel.byStratum[c.stratum] = (tel.byStratum[c.stratum] || 0) + 1;

  const excluded = Object.entries(availableByStratum)
    .filter(([s]) => !new Set(cases.map((c) => c.stratum)).has(s))
    .map(([s, n]) => `${s}=${n}`).join(' ');
  console.log(`\nact-augmented ANNOTATED suite — ${cases.length} pages | provider=${PROVIDER} model=${MODEL} effort=${EFFORT || 'provider-default'} | include=${INCLUDE} | tools=${TOOLS ? 'ON' : 'OFF'} vision=ON`);
  console.log(`  strata in run : ${JSON.stringify(tel.byStratum)}`);
  console.log(`  excluded      : ${excluded || '(none)'}`);
  console.log(`  out           : results/${RUN_NAME}`);
  console.log(`  progress      : node eval/act-augmented/_tools/annotated-run-progress.js --watch`);
  console.log(`                  node eval/checker-comparison/fn-llm-monitor.js\n`);

  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify({
    runName: RUN_NAME, startedAt: new Date(startedAt).toISOString(), provider: PROVIDER, model: MODEL, effort: EFFORT, include: INCLUDE, caseList: CASE_LIST_RAW, sc: SC_FILTER ? [...SC_FILTER] : null, tools: TOOLS, vision: true,
    concurrency: { pageConc: PAGE_CONC, globalLlm: GLOBAL_LLM, maxTabs: MAX_TABS, browserShards: BROWSER_SHARDS, instruments: Number(arg('inst-gate', 6)), instrumentsTimeoutMs: INSTRUMENTS_TIMEOUT },
    commit: process.env.HARNESS_COMMIT || (() => { try { return require('child_process').execSync('git rev-parse HEAD', { cwd: REPO_ROOT }).toString().trim(); } catch { return null; } })(),
    availableByStratum, runningByStratum: tel.byStratum,
    cases: cases.map((c) => ({ testcaseId: c.testcaseId, key: c.key, stratum: c.stratum, expected: c.expected, sc: c.sc })),
  }, null, 2));

  // BROWSER_ARGS is the orchestrator's own arg set and must be used verbatim: it
  // carries --allow-file-access-from-files, without which a file:// page's
  // <frame>/<iframe> contentDocument is null under Chrome's opaque-origin policy
  // and the collector silently returns ZERO elements for that frame. A run
  // launched with a hand-rolled arg list under-collects iframe pages instead of
  // failing, so the loss is invisible in the metrics.
  //
  // protocolTimeout is raised because this corpus runs 405 pages through one
  // browser: at PAGE_CONC 8 the allocator peaked at 40 live contexts and
  // Target.createBrowserContext began timing out on the default 180s, erroring
  // 126/405 cases (all in the alphabetical tail — pure resource exhaustion).
  const launchBrowser = () => puppeteer.launch({
    executablePath: CHROME, headless: 'new', args: BROWSER_ARGS, protocolTimeout: 300000,
  });
  const pool = await createBrowserShardPool({
    browserCount: BROWSER_SHARDS,
    totalTabs: MAX_TABS,
    launchBrowser,
    createAllocator: (browser, cap) => createTabAllocator({ browser, maxTabs: cap }),
  });
  // BROWSER SELF-HEAL (aug-annot-s11 post-mortem). The shared browser can wedge TERMINALLY — allocator
  // telemetry from the wedged run: peak 24 contexts, then inUse 0 with 395 consecutive createBrowserContext
  // timeouts — after which every remaining case (292 of 392) died at context creation and the run silently
  // degenerated into a 60%-error artifact. The per-case retry cannot fix a dead browser; only a relaunch
  // can. Trigger: >= 2 CONSECUTIVE transient browser failures across workers (a healthy run's flakes are
  // isolated; consecutive ones mean the browser is gone). Single-flight + generation-guarded so concurrent
  // failing workers trigger exactly one relaunch, and a worker whose failure predates the current
  // generation never kills a fresh browser. Measurement-neutral: no scoring path changes.
  const statusTimer = setInterval(() => {
    try { tel.tabs = pool.stats(); tel.heals = tel.tabs.heals; } catch { /* noop */ }
    try { tel.mem = sampleMemory ? sampleMemory() : {}; } catch { /* noop */ }
    writeStatus();
  }, STATUS_EVERY_MS);

  const results = [];
  let cursor = 0, done = 0;
  const t0 = Date.now();

  const worker = async (wid, workerIndex) => {
    const shard = pool.shardFor(workerIndex);
    while (true) {
      const i = cursor++;
      if (i >= cases.length) { delete tel.workers[wid]; return; }
      const tc = cases[i];
      const runId = `aug-${tc.testcaseId}`;
      tel.workers[wid] = { idx: i, ruleId: tc.ruleId, sc: tc.sc[0], expected: tc.expected, stratum: tc.stratum, phase: 'collect', startedAt: Date.now() };
      let rec;
      // Keep all attempts attributable, including calls before a browser failure.
      const caseTools = newCaseToolAcc();
      // Browser-resource failures are transient and say nothing about the page,
      // so retry once after letting the browser drain. A case that errors is
      // dropped from BOTH the recall and specificity denominators, which quietly
      // shrinks the eval instead of failing it — that must not happen silently.
      for (let attempt = 0; attempt < 2; attempt++) {
      rec = null;
      const genAtStart = shard.gen; // which shard generation this attempt ran on (for the self-heal guard)
      try {
        if (shard.healing) await shard.healing;  // never start an attempt mid-relaunch
        const lease = await shard.alloc.acquire();
        let collect;
        try {
          collect = normalizeCollectRoles(await collectActPage(lease.page, {
            url: tc.url, elementCap: LIMITS.act.elementCap, file: `aug:${tc.testcaseId}`,
            runId, sourceUrl: tc.url, runAxe: true, axePath: AXE_PATH,
          }));
        } finally { await lease.release(); }

        tel.workers[wid].phase = 'orchestrate';
        // per-case tool attribution (see makeTraceSink) — rides alongside the run-level counters
        const drive = { file: collect.file, runId, pageDigest: collect.pageDigest, drivenAt: collect.collectedAt + 1, elements: [] };
        const out = await orchestrate(collect, drive, {
          resolveUrl: () => tc.url, executablePath: CHROME, browser: shard.browser, tabAllocator: shard.alloc, maxTabs: shard.cap, // reads the CURRENT shard bindings (self-heal swaps them)
          runInstruments: true, instrumentsGate: instGate, instrumentsTimeoutMs: INSTRUMENTS_TIMEOUT, now: collect.collectedAt + 2,
          restrictScs: new Set(tc.sc || []), maxAutomatic: LIMITS.act.maxAuto,
          budgetOpts: { maxRunWallClockMs: LIMITS.act.runWallClockMs },
          experimentConcurrency: Math.min(LIMITS.concurrency.experimentCap, LIMITS.concurrency.experiment),
          runLlm: !NO_LLM, runAgent, captureVision: true, llmConcurrency: GLOBAL_LLM,
          // fires ONLY when the tool agent is built -> proves tools are live
          wrapAgent: (a) => { tel.tools.agentBuilt = (tel.tools.agentBuilt || 0) + 1; caseTools.agentBuilt = (caseTools.agentBuilt || 0) + 1; return wrapAgent(a); },
          // Tool wiring mirrors run-fn-llm.js:509-513 exactly — llmTools alone is
          // not enough; without llmTransportConfig the orchestrator cannot build
          // the tool agent and silently falls back to the single-shot judge.
          llmTools: TOOLS,
          llmTransportConfig: TOOLS ? { ...TRANSPORT, onTraceSink: makeTraceSink(caseTools, tc, attempt + 1), serviceTier: SERVICE_TIER } : undefined,
          llmProvider: PROVIDER,
          geminiKey: process.env.GEMINI_API_KEY,
          openrouterKey: process.env.OPENROUTER_API_KEY,
          llmToolConcurrency: LIMITS.concurrency.llmTool,
          llmToolMaxTurns: LIMITS.llm.toolMaxTurns,
          llmToolRunTimeoutMs: LIMITS.llm.toolRunTimeoutMs,
        });
        rec = scoreCase(tc, out);
        // Attach the per-case tool trace so a later analysis can JOIN tool use to outcome. `toolCalls: 0`
        // on a tools-ON case is a real finding (the judge chose not to look), not missing data — which is
        // exactly the distinction the previous run could not make.
        rec.toolUse = { ...caseTools, toolsEnabled: TOOLS };
        // batch-3 #36: optional per-case artifact dump (see the flag above). Best-effort by construction —
        // a dump failure must never fail, slow, or reshape the scored run.
        if (DUMP_ARTIFACTS) {
          try {
            const dir = path.join(OUT, 'case-artifacts');
            fs.mkdirSync(dir, { recursive: true });
            const b = (out && out.bundle) || {};
            const built = out && out.built;
            const inst = b.instruments || null;
            fs.writeFileSync(path.join(dir, `${safe(tc.testcaseId)}.json`), JSON.stringify({
              testcaseId: tc.testcaseId, key: tc.key, stratum: tc.stratum, expected: tc.expected, sc: tc.sc,
              obligationLedger: (built && built.results && built.results.obligationLedger) || null,
              shadowObservations: (built && built.results && built.results.shadowObservations) || null,
              instruments: inst ? {
                findings: inst.findings || null,
                tabOrder: inst.tabOrder || null,
                statusObservations: inst.statusObservations || null,
                statusTimelines: inst.statusTimelines || null,
                liveRegionBirths: inst.liveRegionBirths || null,
                colourStateDeltas: inst.colourStateDeltas || null,
                autoUpdateCadence: inst.autoUpdateCadence || null,
                lateArrival: inst.lateArrival || null,
                collectorLiveness: inst.collectorLiveness || null,
                ...(inst.timedOut === true ? { timedOut: true } : {}),
                ...(inst.partial === true ? { partial: true } : {}),
              } : null,
            }, null, 1));
          } catch (e) { /* best-effort — see above */ }
        }
        shard.consecTransient = 0; // a healthy completion ends this shard's failure streak
      } catch (e) {
        const msg = String((e && e.message) || e);
        const transient = /createBrowserContext|Target closed|protocolTimeout|timed out|Session closed|Connection closed/i.test(msg);
        if (transient) {
          shard.consecTransient += 1;
          // two consecutive transient failures on one shard = that browser is gone, not flaking
          if (shard.consecTransient >= 2) {
            tel.workers[wid].phase = 'browser-heal';
            await pool.heal(shard, genAtStart);
            tel.heals = pool.stats().heals;
            writeStatus();
          }
        }
        if (transient && attempt === 0) {
          tel.workers[wid].phase = 'retry-backoff';
          await new Promise((r) => setTimeout(r, 5000 + Math.min(i, 20) * 250));
          continue;                                   // second and final attempt
        }
        rec = { testcaseId: tc.testcaseId, ruleId: tc.ruleId, sc: tc.sc, expected: tc.expected, outcome: 'error', error: msg, transient, attempts: attempt + 1 };
        tel.errors.push({ testcaseId: tc.testcaseId, error: msg });
        if (tel.errors.length > 40) tel.errors.shift();
      }
      break;
      }
      // carry the reliability stratum + the humans' own votes into the record so
      // every downstream slice is a filter, never another run
      rec.toolUse = { ...caseTools, toolsEnabled: TOOLS };
      rec.stratum = tc.stratum;
      rec.key = tc.key;
      rec.humanVotes = tc.humanVotes;
      results.push(rec);
      done++;
      tel.done = done;
      tel.tally[rec.outcome] = (tel.tally[rec.outcome] || 0) + 1;
      tel.recent.unshift({ testcaseId: rec.testcaseId, stratum: rec.stratum, expected: rec.expected, outcome: rec.outcome, at: Date.now() });
      if (tel.recent.length > 25) tel.recent.pop();
      if (done % 10 === 0 || done === cases.length) {
        const s = summarize(results);
        const errN = results.filter((r) => r.outcome === 'error').length;
        console.log(`  ${done}/${cases.length} recall=${s.recall.caught}/${s.recall.failedN} FP=${s.specificity.falsePositive}/${s.specificity.n}`
          + `${errN ? ` ERR=${errN} (${((errN / done) * 100).toFixed(0)}%)` : ''} (${Math.round((Date.now() - t0) / 1000)}s)`);
        fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(PAGE_CONC, cases.length || 1) }, (_, k) => worker(`w${k}`, k)));

  clearInterval(statusTimer);
  await pool.close();
  if (geminiCacheManager) {
    const beforeCleanup = geminiCacheManager.snapshot();
    await geminiCacheManager.close();
    tel.cache = { ...beforeCleanup, cleanup: geminiCacheManager.snapshot() };
  }
  try { tel.tabs = pool.stats(); tel.heals = tel.tabs.heals; } catch { /* noop */ }
  const systemicLlmFailure = !NO_LLM && tel.llm.calls > 0 && tel.llm.results === 0;
  tel.phase = systemicLlmFailure ? 'failed' : 'done';
  writeStatus();

  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
  const s = summarize(results);
  s.model = MODEL; s.include = INCLUDE; s.runName = RUN_NAME;
  s.llm = tel.llm;
  s.tools = { enabled: TOOLS, ...tel.tools };
  s.cache = tel.cache;
  s.valid = !systemicLlmFailure;
  s.fatalReason = systemicLlmFailure
    ? `all ${tel.llm.calls} LLM calls failed before producing provider usage/results`
    : null;
  s.elapsedMs = Date.now() - startedAt;
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(s, null, 2));
  printSummary(results, `act-augmented annotated (${RUN_NAME}, ${MODEL}, tools ${TOOLS ? 'ON' : 'OFF'})`);
  const errN = results.filter((r) => r.outcome === 'error').length;
  if (errN) {
    const pctErr = (errN / results.length) * 100;
    console.log(`  errors:   ${errN}/${results.length} = ${pctErr.toFixed(1)}% — these are EXCLUDED from both denominators above`);
    if (pctErr > 2) console.log(`  *** WARNING: ${pctErr.toFixed(1)}% error rate. The metrics describe only the ${results.length - errN} cases that scored. Do not report them as corpus-level results. ***`);
  }
  if (TOOLS) {
    console.log(`  tools:    ${tel.tools.calls} calls, maxTurns ${tel.tools.maxTurns}, ${JSON.stringify(tel.tools.byName)}`);
    if (!tel.tools.calls) console.log(`  *** WARNING: tools were ENABLED but ZERO tool calls were made — this is a single-shot run mislabelled as tools-ON. ***`);
  }
  if (tel.cache) console.log(`  cache:    ${tel.cache.created} created, ${tel.cache.reused} reused; routes ${JSON.stringify(tel.cache.routes)}; deleted ${tel.cache.cleanup.deleted}`);
  if (systemicLlmFailure) {
    console.error(`\nFATAL: ${s.fatalReason}. Artifacts were preserved, but this run is invalid and exits nonzero.`);
    process.exitCode = 1;
  }
  console.log(`\nresults → results/${RUN_NAME}/results.json`);
  console.log(`slice it → node eval/act-augmented/_tools/score-annotated-run.js ${RUN_NAME}`);
}

main().catch((e) => { console.error(e && e.stack || e); process.exit(1); });
