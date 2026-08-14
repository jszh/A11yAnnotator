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

const { orchestrate } = require('../../../scripts/v3/lib/orchestrator.js');
const { createTabAllocator } = require('../../../scripts/v3/lib/tab-allocator.js');
const { makeRunAgent, makeClaudeSdkTransport } = require('../../../scripts/v3/lib/llm-agent-adapter.js');
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
const PAGE_CONC = Number(arg('pages', 8));
const MAX_TABS = Math.min(LIMITS.concurrency.maxTabs, Number(arg('max-tabs', LIMITS.concurrency.maxTabs)));
const GLOBAL_LLM = Math.min(LIMITS.concurrency.llm, Number(arg('global-llm', LIMITS.concurrency.llm)));
const MODEL = process.env.V3_LLM_MODEL || 'claude-sonnet-4-6';
const INCLUDE = String(arg('include', 'unflagged,clear,fixed'));
const SC_FILTER = arg('sc', null);

// CLAUDE.md: do NOT override LLM_EVAL_STATUS_PATH unless running >1 experiment at once.
const FIXED_STATUS_PATH = process.env.LLM_EVAL_STATUS_PATH || '/tmp/llm-eval-status.json';
const STATUS_EVERY_MS = 500;

const TRANSPORT = {
  oauthToken: process.env.CLAUDE_CODE_OAUTH_TOKEN,
  model: MODEL,
  effort: process.env.V3_LLM_EFFORT || 'medium',
  perTurnTimeoutMs: +(process.env.V3_LLM_TURN_TIMEOUT_MS || LIMITS.llm.perTurnTimeoutMs),
  runTimeoutMs: +(process.env.V3_LLM_RUN_TIMEOUT_MS || LIMITS.llm.runTimeoutMs),
};

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
    if (SC_FILTER && sc !== SC_FILTER) continue;
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
  config: { model: MODEL, include: INCLUDE, pageConc: PAGE_CONC, globalLlm: GLOBAL_LLM, maxTabs: MAX_TABS, vision: true, tools: false },
  workers: {}, inflight: {},
  llm: { calls: 0, done: 0, results: 0, peakInFlight: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreateTokens: 0, costUsd: 0 },
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
const instGate = makeSemaphore(Math.max(1, Math.min(PAGE_CONC, 4)));

// Token usage arrives on the transport's trace sink, not on the agent's return
// value — the same sink run-fn-llm.js uses, so the counters stay comparable.
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
const baseAgent = makeRunAgent({ transport: makeClaudeSdkTransport({ ...TRANSPORT, onTraceSink: recordTrace }), model: MODEL });

let callSeq = 0;
const runAgent = (messages, subject) => sem.run(async () => {
  const id = `c${++callSeq}`;
  tel.inflight[id] = { xpath: subject?.xpath || null, sc: subject?.sc || null, skill: subject?.skill || subject?.rubricRef || null, startedAt: Date.now() };
  tel.llm.calls++;
  tel.llm.peakInFlight = Math.max(tel.llm.peakInFlight, Object.keys(tel.inflight).length);
  try {
    const res = await baseAgent(messages, subject);
    tel.llm.done++;
    return res;
  } finally { delete tel.inflight[id]; }
});

// ---------------------------------------------------------------- main

async function main() {
  const { cases: all, availableByStratum } = loadCases();
  let cases = all;
  if (LIMIT > 0) cases = cases.slice(0, LIMIT);
  if (!process.env.CLAUDE_CODE_OAUTH_TOKEN) { console.error('FATAL: CLAUDE_CODE_OAUTH_TOKEN not set (.env)'); process.exit(1); }

  fs.mkdirSync(OUT, { recursive: true });
  tel.total = cases.length;
  tel.phase = 'running';
  for (const c of cases) tel.byStratum[c.stratum] = (tel.byStratum[c.stratum] || 0) + 1;

  const excluded = Object.entries(availableByStratum)
    .filter(([s]) => !new Set(cases.map((c) => c.stratum)).has(s))
    .map(([s, n]) => `${s}=${n}`).join(' ');
  console.log(`\nact-augmented ANNOTATED suite — ${cases.length} pages | model=${MODEL} | include=${INCLUDE}`);
  console.log(`  strata in run : ${JSON.stringify(tel.byStratum)}`);
  console.log(`  excluded      : ${excluded || '(none)'}`);
  console.log(`  out           : results/${RUN_NAME}`);
  console.log(`  progress      : node eval/act-augmented/_tools/annotated-run-progress.js --watch`);
  console.log(`                  node eval/checker-comparison/fn-llm-monitor.js\n`);

  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify({
    runName: RUN_NAME, startedAt: new Date(startedAt).toISOString(), model: MODEL, include: INCLUDE,
    commit: (() => { try { return require('child_process').execSync('git rev-parse HEAD', { cwd: REPO_ROOT }).toString().trim(); } catch { return null; } })(),
    availableByStratum, runningByStratum: tel.byStratum,
    cases: cases.map((c) => ({ testcaseId: c.testcaseId, key: c.key, stratum: c.stratum, expected: c.expected, sc: c.sc })),
  }, null, 2));

  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const alloc = createTabAllocator({ browser, maxTabs: MAX_TABS });
  const statusTimer = setInterval(() => {
    try { tel.tabs = alloc.stats ? alloc.stats() : {}; } catch { /* noop */ }
    try { tel.mem = sampleMemory ? sampleMemory() : {}; } catch { /* noop */ }
    writeStatus();
  }, STATUS_EVERY_MS);

  const results = [];
  let cursor = 0, done = 0;
  const t0 = Date.now();

  const worker = async (wid) => {
    while (true) {
      const i = cursor++;
      if (i >= cases.length) { delete tel.workers[wid]; return; }
      const tc = cases[i];
      const runId = `aug-${tc.testcaseId}`;
      tel.workers[wid] = { idx: i, ruleId: tc.ruleId, sc: tc.sc[0], expected: tc.expected, stratum: tc.stratum, phase: 'collect', startedAt: Date.now() };
      let rec;
      try {
        const lease = await alloc.acquire();
        let collect;
        try {
          collect = normalizeCollectRoles(await collectActPage(lease.page, {
            url: tc.url, elementCap: LIMITS.act.elementCap, file: `aug:${tc.testcaseId}`,
            runId, sourceUrl: tc.url, runAxe: true, axePath: AXE_PATH,
          }));
        } finally { await lease.release(); }

        tel.workers[wid].phase = 'orchestrate';
        const drive = { file: collect.file, runId, pageDigest: collect.pageDigest, drivenAt: collect.collectedAt + 1, elements: [] };
        const out = await orchestrate(collect, drive, {
          resolveUrl: () => tc.url, executablePath: CHROME, browser, tabAllocator: alloc, maxTabs: MAX_TABS,
          runInstruments: true, instrumentsGate: instGate, instrumentsTimeoutMs: 90000, now: collect.collectedAt + 2,
          restrictScs: new Set(tc.sc || []), maxAutomatic: LIMITS.act.maxAuto,
          budgetOpts: { maxRunWallClockMs: LIMITS.act.runWallClockMs },
          experimentConcurrency: Math.min(LIMITS.concurrency.experimentCap, LIMITS.concurrency.experiment),
          runLlm: true, runAgent, captureVision: true, llmConcurrency: GLOBAL_LLM,
        });
        rec = scoreCase(tc, out);
      } catch (e) {
        rec = { testcaseId: tc.testcaseId, ruleId: tc.ruleId, sc: tc.sc, expected: tc.expected, outcome: 'error', error: String((e && e.message) || e) };
        tel.errors.push({ testcaseId: tc.testcaseId, error: rec.error });
        if (tel.errors.length > 40) tel.errors.shift();
      }
      // carry the reliability stratum + the humans' own votes into the record so
      // every downstream slice is a filter, never another run
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
        console.log(`  ${done}/${cases.length} recall=${s.recall.caught}/${s.recall.failedN} FP=${s.specificity.falsePositive}/${s.specificity.n} (${Math.round((Date.now() - t0) / 1000)}s)`);
        fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(PAGE_CONC, cases.length || 1) }, (_, k) => worker(`w${k}`)));

  clearInterval(statusTimer);
  alloc.close();
  await browser.close().catch(() => {});
  tel.phase = 'done';
  writeStatus();

  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
  const s = summarize(results);
  s.model = MODEL; s.include = INCLUDE; s.runName = RUN_NAME;
  s.llm = tel.llm;
  s.elapsedMs = Date.now() - startedAt;
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(s, null, 2));
  printSummary(results, `act-augmented annotated (${RUN_NAME}, ${MODEL}, tools OFF)`);
  console.log(`\nresults → results/${RUN_NAME}/results.json`);
  console.log(`slice it → node eval/act-augmented/_tools/score-annotated-run.js ${RUN_NAME}`);
}

main().catch((e) => { console.error(e && e.stack || e); process.exit(1); });
