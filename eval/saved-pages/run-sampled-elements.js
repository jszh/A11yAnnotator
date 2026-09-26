#!/usr/bin/env node
'use strict';

// Run the current v3 harness over the real saved-page corpus's pre-sampled elements.
//
// Phase 1 inventories every saved page without an LLM, then chooses 20 pages by
// equalized ACT + supplementary-human SC coverage.  Phase 2 runs the full LLM
// harness over exactly 20 random elements on each selected page (400 total).
//
//   node eval/saved-pages/run-sampled-elements.js --phase=inventory --out=saved-elements-inventory
//   node eval/saved-pages/run-sampled-elements.js --phase=full \
//     --selection=results/saved-elements-inventory/selection.json --out=saved-elements-full

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const puppeteer = require('puppeteer');

const ROOT = path.join(__dirname, '..', '..');
require('../../scripts/v3/lib/load-env.js').loadEnv(ROOT);

const { orchestrate, BROWSER_ARGS } = require('../../scripts/v3/lib/orchestrator.js');
const { collectActPage, normalizeCollectRoles } = require('../../scripts/v3/lib/act-page-collect.js');
const { createTabAllocator } = require('../../scripts/v3/lib/tab-allocator.js');
const { createBrowserShardPool } = require('../../scripts/v3/lib/browser-shard-pool.js');
const { makeSemaphore, sampleMemory } = require('../../scripts/v3/lib/run-telemetry.js');
const { makeRunAgent, makeGeminiTransport } = require('../../scripts/v3/lib/llm-agent-adapter.js');
const oracle = require('../../scripts/v3/lib/applicability-oracle.js');
const LIMITS = require('../../scripts/v3/lib/limits.js');
const { assetUrlUnder } = require('../../scripts/lib/asset-paths.js');

function arg(name, def = null) {
  const exact = `--${name}`;
  const p = process.argv.find((x) => x === exact || x.startsWith(exact + '='));
  if (!p) return def;
  if (p.startsWith(exact + '=')) return p.slice(exact.length + 1);
  const next = process.argv[process.argv.indexOf(p) + 1];
  return next && !next.startsWith('--') ? next : true;
}

const PHASE = String(arg('phase', 'inventory'));
if (!['inventory', 'full'].includes(PHASE)) throw new Error('--phase must be inventory or full');
const RUN_LLM = PHASE === 'full' && !arg('no-llm', false);
const RUN_NAME = String(arg('out', PHASE === 'inventory' ? 'saved-elements-inventory' : 'saved-elements-full'));
const OUT = path.join(ROOT, 'results', RUN_NAME);
const BASE = String(arg('base', process.env.A11Y_BASE || 'http://127.0.0.1:3001'));
const CHROME = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome';
const AXE_PATH = process.env.AXE_PATH || path.join(ROOT, 'axe.min.js');
const SAMPLE_PATH = path.join(ROOT, 'assets', 'samples-saved.json');
const PAGE_LIMIT = Math.max(1, Number(arg('page-count', 20)) || 20);
const ELEMENTS_PER_PAGE = Math.max(1, Number(arg('elements-per-page', 20)) || 20);
const PAGE_CONC = Math.max(1, Number(arg('pages', 64)) || 64);
const MAX_TABS = Math.max(1, Number(arg('max-tabs', 256)) || 256);
const BROWSER_SHARDS = Math.max(1, Math.min(PAGE_CONC, MAX_TABS, Number(arg('browsers', arg('shards', 16))) || 16));
const INSTRUMENTS_CONC = Math.max(1, Number(arg('instruments-conc', 32)) || 32);
// Saved production pages are materially heavier than the isolated instrument fixtures. The repaired
// six-page sample completed in 74-160 s with low contention, so 180 s had too little operating margin.
// Keep the global library default conservative for small suites; this saved-page entry point owns the
// measured 300 s allowance and callers can use 600 s for targeted recovery.
const INSTRUMENTS_TIMEOUT = Math.max(1, Number(arg('instruments-timeout-ms', 300000)) || 300000);
const REQUIRE_INSTRUMENTS_COMPLETE = !!arg('require-instruments-complete', false);
const GLOBAL_LLM = Math.max(1, Number(arg('global-llm', 100)) || 100);
const LLM_CONC = Math.max(1, Number(arg('llm-concurrency', LIMITS.concurrency.llm)) || LIMITS.concurrency.llm);
const MODEL = String(arg('model', process.env.V3_LLM_MODEL || 'gemini-3.5-flash-lite'));
const EFFORT = String(arg('effort', process.env.V3_LLM_EFFORT || 'high'));
const TOOLS = !arg('no-tools', false);
const SELECTION_PATH = arg('selection', null);
const FILE_FILTER = arg('file', null);
const LIMIT = Math.max(0, Number(arg('limit', 0)) || 0);
const VARIABLE_ELEMENTS = !!arg('variable-elements', false);
const STATUS_EVERY_MS = 1000;

const envValue = (key) => {
  if (process.env[key]) return process.env[key];
  try {
    const line = fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/).find((x) => x.startsWith(key + '='));
    return line ? line.slice(key.length + 1).trim() : null;
  } catch { return null; }
};
const GEMINI_KEY = envValue('GEMINI_API_KEY');

const safe = (s) => String(s).replace(/[^a-z0-9_.-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 100);
const hashFile = (f) => {
  try { return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, f))).digest('hex'); }
  catch { return null; }
};
const countBy = (items, key) => {
  const out = {};
  for (const x of items || []) { const k = typeof key === 'function' ? key(x) : x[key]; if (k) out[k] = (out[k] || 0) + 1; }
  return out;
};

function targetScs() {
  const act = JSON.parse(fs.readFileSync(path.join(ROOT, 'uist-artifacts', 'act-testcases.json'), 'utf8'));
  const human = JSON.parse(fs.readFileSync(path.join(ROOT, 'eval', 'act-augmented', '_annotator', 'manifest.json'), 'utf8'));
  const actScs = [...new Set((act.cases || []).flatMap((c) => c.sc || []))].sort();
  const humanScs = [...new Set((human.scs || []).map((x) => x.sc).filter(Boolean))].sort();
  return { act: actScs, human: humanScs, union: [...new Set([...actScs, ...humanScs])].sort() };
}

function loadCorpus() {
  const doc = JSON.parse(fs.readFileSync(SAMPLE_PATH, 'utf8'));
  const pages = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'pages.json'), 'utf8'));
  const pageMeta = new Map((Array.isArray(pages) ? pages : pages.pages || []).filter((p) => p && p.file).map((p) => [p.file, p]));
  return Object.entries(doc).map(([key, page]) => {
    const all = Object.values(page.sampled || {}).flat();
    // Entries carrying source=finding-verification were deliberately injected after
    // sampling. They are valuable annotations, but including them would no longer be
    // a random element evaluation.
    const random = all.filter((x) => !x.source);
    const file = key.replace(/^saved\//, '');
    return { key, file, name: page.name, noscript: !!(pageMeta.get(file) || {}).noscript, randomCount: random.length, xpaths: random.slice(0, ELEMENTS_PER_PAGE).map((x) => x.xpath) };
  }).sort((a, b) => a.file.localeCompare(b.file));
}

function loadSelection() {
  if (!SELECTION_PATH) throw new Error('--selection is required for --phase=full');
  const p = path.isAbsolute(SELECTION_PATH) ? SELECTION_PATH : path.join(ROOT, SELECTION_PATH);
  const doc = JSON.parse(fs.readFileSync(p, 'utf8'));
  const corpusByFile = new Map(loadCorpus().map((x) => [x.file, x]));
  if (!Array.isArray(doc.pages) || (!VARIABLE_ELEMENTS && doc.pages.length !== PAGE_LIMIT)) throw new Error(`selection must contain exactly ${PAGE_LIMIT} pages`);
  return doc.pages.map((p) => {
    const source = corpusByFile.get(p.file);
    const xpaths = Array.isArray(p.xpaths) ? p.xpaths : source && source.xpaths;
    if (!Array.isArray(xpaths) || (!VARIABLE_ELEMENTS && xpaths.length !== ELEMENTS_PER_PAGE) || (VARIABLE_ELEMENTS && xpaths.length < 1)) throw new Error(VARIABLE_ELEMENTS ? `selection page ${p.file} must contain at least one xpath` : `selection page ${p.file} must contain exactly ${ELEMENTS_PER_PAGE} xpaths`);
    return { key: p.key, file: p.file, name: p.name, noscript: p.noscript == null ? !!(source && source.noscript) : !!p.noscript, randomCount: p.randomCount, xpaths };
  });
}

// Equalized coverage: each target SC can contribute at most 1, regardless of
// how many common link/button obligations it creates. Its target depth is the
// smaller of 20 candidates and all candidates available in eligible pages.
// ACT and human sets each contribute equal total weight, so overlap SCs matter
// to both without allowing the larger set to dominate.
function choosePages(inventory, targets) {
  const eligible = inventory.filter((p) => !p.error && p.randomCount >= ELEMENTS_PER_PAGE && p.collectedElements === ELEMENTS_PER_PAGE);
  const sourceWeight = {};
  for (const sc of targets.union) sourceWeight[sc] = (targets.act.includes(sc) ? 1 / targets.act.length : 0) + (targets.human.includes(sc) ? 1 / targets.human.length : 0);
  const available = Object.fromEntries(targets.union.map((sc) => [sc, eligible.reduce((n, p) => n + (p.scCandidates[sc] || 0), 0)]));
  const depth = Object.fromEntries(targets.union.map((sc) => [sc, Math.min(20, available[sc])]));
  const utility = (pages) => {
    const totals = Object.fromEntries(targets.union.map((sc) => [sc, 0]));
    for (const p of pages) for (const sc of targets.union) totals[sc] += p.scCandidates[sc] || 0;
    return targets.union.reduce((s, sc) => s + (depth[sc] ? sourceWeight[sc] * Math.min(1, totals[sc] / depth[sc]) : 0), 0);
  };
  const picked = [];
  const rest = eligible.slice();
  while (picked.length < Math.min(PAGE_LIMIT, eligible.length)) {
    let best = null;
    for (const p of rest) {
      const score = utility([...picked, p]);
      const distinct = targets.union.filter((sc) => p.scCandidates[sc]).length;
      if (!best || score > best.score + 1e-12 || (Math.abs(score - best.score) < 1e-12 && (distinct > best.distinct || (distinct === best.distinct && p.file < best.page.file)))) best = { page: p, score, distinct };
    }
    picked.push(best.page);
    rest.splice(rest.indexOf(best.page), 1);
  }
  // Deterministic one-for-one local search closes easy greedy gaps.
  let improved = true;
  while (improved) {
    improved = false;
    const base = utility(picked);
    outer: for (let i = 0; i < picked.length; i++) for (const candidate of eligible) {
      if (picked.includes(candidate)) continue;
      const trial = picked.slice(); trial[i] = candidate;
      const score = utility(trial);
      if (score > base + 1e-12) { picked[i] = candidate; improved = true; break outer; }
    }
  }
  const totals = Object.fromEntries(targets.union.map((sc) => [sc, picked.reduce((n, p) => n + (p.scCandidates[sc] || 0), 0)]));
  return {
    schema: 'saved-elements-selection/1', generatedAt: new Date().toISOString(), method: 'greedy equalized ACT+human SC coverage, then deterministic 1-swap local search',
    requestedPages: PAGE_LIMIT, elementsPerPage: ELEMENTS_PER_PAGE, totalElements: picked.length * ELEMENTS_PER_PAGE,
    eligiblePages: eligible.length, excludedPages: inventory.length - eligible.length, objective: utility(picked), targets, availableCandidates: available,
    coverage: Object.fromEntries(targets.union.map((sc) => [sc, { candidates: totals[sc], targetDepth: depth[sc], fraction: depth[sc] ? Math.min(1, totals[sc] / depth[sc]) : 0, act: targets.act.includes(sc), human: targets.human.includes(sc) }])),
    pages: picked.map((p, rank) => ({ rank: rank + 1, key: p.key, file: p.file, name: p.name, noscript: !!p.noscript, randomCount: p.randomCount, collectedElements: p.collectedElements, scCandidates: p.scCandidates, xpaths: p.xpaths })),
  };
}

function compactResult(spec, collect, out, elapsedMs) {
  const bundle = out.bundle || {};
  const built = out.built || {};
  const ledger = (built.results && built.results.obligationLedger) || [];
  const judgments = (bundle.judgments && bundle.judgments.judgments) || [];
  const observations = (built.results && built.results.shadowObservations) || [];
  const inScope = require('../../scripts/v3/lib/scope.js').scopePredicate(collect); // V3: count only in-scope obligations
  const obligations = oracle.deriveObligations(collect).filter((o) => !inScope || inScope(o.sc));
  return {
    key: spec.key, file: spec.file, name: spec.name, noscript: !!spec.noscript, randomCount: spec.randomCount, xpaths: spec.xpaths, requestedElements: spec.xpaths.length,
    collectedElements: (collect.elements || []).length, unresolvedElements: Math.max(0, spec.xpaths.length - (collect.elements || []).length),
    obligationCount: obligations.length, scCandidates: countBy(obligations, 'sc'), familyCandidates: countBy(obligations, 'claimFamily'),
    ledger: { rows: ledger.length, bySc: countBy(ledger, 'sc'), byDisposition: countBy(ledger, 'disposition'), barriers: ledger.filter((x) => x.disposition === 'PROVISIONAL' && !x.cleared).length, clears: ledger.filter((x) => x.disposition === 'PROVISIONAL' && x.cleared).length, autoPartial: ledger.filter((x) => x.autoPartial).length },
    judgments: { count: judgments.length, bySc: countBy(judgments, 'sc'), byVerdict: countBy(judgments, 'verdict') },
    deterministicBarriers: observations.filter((x) => x.source === 'deterministic' && x.wouldBe && x.wouldBe.observationOutcome === 'BARRIER_OBSERVED').length,
    instruments: bundle.instruments ? { findings: (bundle.instruments.findings || []).length, timedOut: !!bundle.instruments.timedOut, partial: !!bundle.instruments.partial } : null,
    timings: bundle.timings || null, elapsedMs,
  };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(path.join(OUT, 'pages'), { recursive: true });
  const targets = targetScs();
  let specs = PHASE === 'inventory' ? loadCorpus() : loadSelection();
  if (FILE_FILTER) specs = specs.filter((p) => p.file === FILE_FILTER);
  if (LIMIT) specs = specs.slice(0, LIMIT);
  const expectedTotal = specs.reduce((n, p) => n + p.xpaths.length, 0);
  if (RUN_LLM && !GEMINI_KEY) throw new Error('GEMINI_API_KEY is required for the full phase');
  const health = await fetch(BASE + '/engine/status').catch(() => null);
  if (!health || !health.ok) throw new Error(`annotator server is not reachable at ${BASE}`);

  const sourceFiles = ['scripts/v3/lib/act-page-collect.js', 'scripts/v3/lib/applicability-oracle.js', 'scripts/v3/lib/orchestrator.js', 'scripts/v3/lib/llm-adjudicator.js', 'scripts/v3/lib/run-instruments.js', 'eval/saved-pages/run-sampled-elements.js'];
  const manifest = {
    schema: 'saved-elements-run/1', phase: PHASE, runName: RUN_NAME, startedAt: new Date().toISOString(), base: BASE,
    model: RUN_LLM ? MODEL : null, effort: RUN_LLM ? EFFORT : null, tools: RUN_LLM && TOOLS, llm: RUN_LLM,
    concurrency: { pages: PAGE_CONC, globalLlm: GLOBAL_LLM, maxTabs: MAX_TABS, browserShards: BROWSER_SHARDS, instruments: INSTRUMENTS_CONC, instrumentsTimeoutMs: INSTRUMENTS_TIMEOUT, requireInstrumentsComplete: REQUIRE_INSTRUMENTS_COMPLETE },
    requested: { pages: specs.length, elements: expectedTotal, elementsPerPage: VARIABLE_ELEMENTS ? null : ELEMENTS_PER_PAGE, variableElements: VARIABLE_ELEMENTS }, targets,
    sourceHashes: Object.fromEntries(sourceFiles.map((f) => [f, hashFile(f)])),
  };
  try { manifest.commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim(); } catch { manifest.commit = null; }
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));

  const tel = { phase: 'launching', startedAt: Date.now(), done: 0, total: specs.length, errors: [], incomplete: [], workers: {}, llm: { calls: 0, done: 0, peakInFlight: 0, inputTokens: 0, outputTokens: 0, costUsd: 0 }, tabs: {}, mem: {} };
  const persistStatus = () => fs.writeFileSync(path.join(OUT, 'status.json'), JSON.stringify({ ...tel, elapsedMs: Date.now() - tel.startedAt }, null, 2));
  const llmGate = makeSemaphore(GLOBAL_LLM);
  const instGate = makeSemaphore(INSTRUMENTS_CONC);
  const traceSink = (e) => {
    if (!e || e.type !== 'result') return;
    const u = e.usage || {};
    tel.llm.inputTokens += Number(u.input_tokens || u.promptTokenCount || 0);
    tel.llm.outputTokens += Number(u.output_tokens || u.candidatesTokenCount || 0);
    if (typeof e.totalCostUsd === 'number') tel.llm.costUsd += e.totalCostUsd;
  };
  const transportConfig = { apiKey: GEMINI_KEY, model: MODEL, effort: EFFORT, onTraceSink: traceSink, perTurnTimeoutMs: Number(process.env.V3_LLM_TURN_TIMEOUT_MS || LIMITS.llm.perTurnTimeoutMs), runTimeoutMs: Number(process.env.V3_LLM_RUN_TIMEOUT_MS || LIMITS.llm.runTimeoutMs) };
  const baseAgent = RUN_LLM ? makeRunAgent({ transport: makeGeminiTransport(transportConfig), model: MODEL }) : null;
  const wrapAgent = (agent) => (messages, subject) => llmGate.run(async () => {
    tel.llm.calls++; tel.llm.peakInFlight = Math.max(tel.llm.peakInFlight, llmGate.inFlight());
    try { return await agent(messages, subject); } finally { tel.llm.done++; }
  });
  const runAgent = RUN_LLM ? wrapAgent(baseAgent) : null;

  const launchBrowser = () => puppeteer.launch({ executablePath: CHROME, headless: 'new', args: BROWSER_ARGS, protocolTimeout: 300000 });
  const pool = await createBrowserShardPool({ browserCount: BROWSER_SHARDS, totalTabs: MAX_TABS, launchBrowser, createAllocator: (browser, cap) => createTabAllocator({ browser, maxTabs: cap }) });
  tel.phase = 'running'; persistStatus();
  let sampling = false;
  const timer = setInterval(async () => {
    tel.tabs = pool.stats();
    if (!sampling) { sampling = true; try { tel.mem = await sampleMemory(process.pid); } finally { sampling = false; } }
    persistStatus();
  }, STATUS_EVERY_MS);
  timer.unref?.();

  const results = [];
  let cursor = 0;
  const worker = async (wid, workerIndex) => {
    const shard = pool.shardFor(workerIndex);
    while (true) {
      const i = cursor++;
      if (i >= specs.length) { delete tel.workers[wid]; return; }
      const spec = specs[i];
      const runId = `${RUN_NAME}-${safe(spec.file)}`;
      const pageUrl = assetUrlUnder(BASE, spec.file) + '?offline=1' + (spec.noscript ? '&noscript=1' : '');
      const started = Date.now();
      tel.workers[wid] = { index: i, file: spec.file, phase: 'collect', startedAt: started };
      let rec = null;
      for (let attempt = 0; attempt < 2 && !rec; attempt++) {
        const gen = shard.gen;
        try {
          if (shard.healing) await shard.healing;
          const lease = await shard.alloc.acquire();
          let collect;
          try {
            collect = normalizeCollectRoles(await collectActPage(lease.page, { url: pageUrl, xpaths: spec.xpaths, elementCap: spec.xpaths.length, file: spec.file, runId, sourceUrl: spec.file, runAxe: true, axePath: AXE_PATH }));
          } finally { await lease.release(); }
          tel.workers[wid].phase = 'orchestrate';
          const drive = { file: collect.file, runId, pageDigest: collect.pageDigest, drivenAt: collect.collectedAt + 1, elements: [] };
          const out = await orchestrate(collect, drive, {
            resolveUrl: () => pageUrl, executablePath: CHROME, browser: shard.browser, tabAllocator: shard.alloc, maxTabs: shard.cap,
            runInstruments: true, instrumentsGate: instGate, instrumentsTimeoutMs: INSTRUMENTS_TIMEOUT, now: collect.collectedAt + 2,
            maxAutomatic: LIMITS.act.maxAuto, budgetOpts: { maxRunWallClockMs: LIMITS.act.runWallClockMs }, experimentConcurrency: Math.min(LIMITS.concurrency.experimentCap, LIMITS.concurrency.experiment),
            runLlm: RUN_LLM, runAgent, captureVision: RUN_LLM, wrapAgent, llmConcurrency: LLM_CONC,
            llmTools: RUN_LLM && TOOLS, llmTransportConfig: RUN_LLM && TOOLS ? transportConfig : undefined,
            llmProvider: 'gemini', geminiKey: GEMINI_KEY, llmToolConcurrency: LIMITS.concurrency.llmTool, llmToolMaxTurns: LIMITS.llm.toolMaxTurns, llmToolRunTimeoutMs: LIMITS.llm.toolRunTimeoutMs,
          });
          rec = compactResult(spec, collect, out, Date.now() - started);
          const b = out.bundle || {};
          // A timed-out instrument lane is still useful: orchestrator salvages every finding measured before
          // the cap and those findings have already participated in build/LLM adjudication above. Preserve the
          // page artifact and mark it incomplete instead of throwing here (which used to discard that evidence).
          // `--require-instruments-complete` remains a completion gate: the run finishes with an incomplete
          // status/non-zero exit so automation can schedule a targeted repair, but never mistakes partial for
          // complete and never loses the partial evidence.
          if (b.instruments && b.instruments.timedOut) {
            rec.incompleteLanes = ['instruments'];
            rec.repairRequired = true;
            tel.incomplete.push({ file: spec.file, lane: 'instruments', timeoutMs: INSTRUMENTS_TIMEOUT, findingsRetained: (b.instruments.findings || []).length });
          }
          fs.writeFileSync(path.join(OUT, 'pages', safe(spec.file) + '.json'), JSON.stringify({ spec, collect, experimentCandidates: out.candidates, experiments: out.experiments, instruments: b.instruments || null, checkerFindings: b.checkerFindings || null, judgments: b.judgments || null, llmRationale: b.llmRationale || null, llmTrace: b.llmTrace || null, results: out.built && out.built.results, timings: b.timings || null }, null, 2));
          shard.consecTransient = 0;
        } catch (e) {
          const message = String((e && e.stack) || e);
          const transient = /createBrowserContext|Target closed|protocolTimeout|timed?\s*out|Navigation timeout|Session closed|Connection closed|detached Frame/i.test(message);
          if (transient && attempt === 0) { shard.consecTransient++; if (shard.consecTransient >= 2) await pool.heal(shard, gen); continue; }
          rec = { key: spec.key, file: spec.file, name: spec.name, randomCount: spec.randomCount, requestedElements: spec.xpaths.length, error: message, elapsedMs: Date.now() - started };
          tel.errors.push({ file: spec.file, error: message.split('\n')[0] });
        }
      }
      results.push(rec); tel.done = results.length;
      fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
      persistStatus();
    }
  };

  await Promise.all(Array.from({ length: Math.min(PAGE_CONC, specs.length || 1) }, (_, i) => worker(`w${i + 1}`, i)));
  clearInterval(timer); tel.tabs = pool.stats(); await pool.close();
  results.sort((a, b) => a.file.localeCompare(b.file));
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
  if (PHASE === 'inventory' && !LIMIT) fs.writeFileSync(path.join(OUT, 'selection.json'), JSON.stringify(choosePages(results, targets), null, 2));
  const summary = {
    phase: PHASE, pages: results.length, errors: results.filter((x) => x.error).length, requestedElements: results.reduce((n, x) => n + (x.requestedElements || 0), 0), collectedElements: results.reduce((n, x) => n + (x.collectedElements || 0), 0),
    scCandidates: Object.fromEntries(targets.union.map((sc) => [sc, results.reduce((n, x) => n + ((x.scCandidates && x.scCandidates[sc]) || 0), 0)])),
    incompletePages: results.filter((x) => Array.isArray(x.incompleteLanes) && x.incompleteLanes.length).length,
    incompleteLanes: tel.incomplete,
    llm: tel.llm, tabs: tel.tabs, elapsedMs: Date.now() - tel.startedAt,
  };
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2));
  manifest.finishedAt = new Date().toISOString(); manifest.summary = summary;
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
  const requiredLaneIncomplete = REQUIRE_INSTRUMENTS_COMPLETE && tel.incomplete.length > 0;
  tel.phase = requiredLaneIncomplete ? 'incomplete' : 'done'; persistStatus();
  console.log(JSON.stringify(summary, null, 2));
  if (requiredLaneIncomplete) process.exitCode = 2;
}

main().catch((e) => { console.error(e.stack || e); process.exit(1); });
