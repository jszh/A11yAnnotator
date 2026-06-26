// Harness 3.0 — orchestrator (plan 3.0-F). Runs the deterministic pipeline end-to-end:
//   annotate obligations → generate candidates → schedule (no agent for L1/L2) → run experiments
//   → propose claims (deterministic for unambiguous) → build + gate v3 results.
// Pure control flow over the library modules; the builder remains the sole publication gate.
// Replay = re-run buildV3 over the frozen artifacts the orchestrator emitted (deterministic).
'use strict';

const cg = require('./candidate-generator.js');
const sch = require('./scheduler.js');
const run = require('./run-experiments.js');
const LIMITS = require('./limits.js'); // concurrency + tool-session budget DEFAULTS (tier D)
const { proposeClaims } = require('./proposer.js');
const { buildV3 } = require('./build-v3.js');
const manifest = require('./manifest.js');
const { makeTimings } = require('./timings.js'); // per-stage + per-element wall-clock → bundle.timings (non-hashed)
const { createTabAllocator } = require('./tab-allocator.js'); // ONE shared browser pool for EVERY lane
const agentPlanner = require('./agent-planner.js');

const BROWSER_ARGS = ['--no-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'];

function mergeJudgmentsArtifacts(base, extra, id) {
  const raw = [
    ...((base && Array.isArray(base.judgments)) ? base.judgments : []),
    ...((extra && Array.isArray(extra.judgments)) ? extra.judgments : []),
  ];
  const seen = new Set();
  const judgments = [];
  for (const j of raw) {
    const key = j && (j.judgmentId || `${j.sc}|${j.claimFamily}|${j.targetXpath}|${j.verdict}`);
    if (seen.has(key)) continue;
    seen.add(key);
    judgments.push(j);
  }
  return { ...id, judgments };
}

// PHASE 2 tool session: a live browser at the page URL + a fresh-clone factory, threaded to the in-process
// CDP tool server so the judge can drive the page mid-reasoning. One page per RUN serves every subject (the
// tools take xpath/coordinate args); mutating tools clone. Lazy puppeteer require (only when tools are on).
async function openToolSession(url, opts = {}) {
  const reapAgeMs = Number.isFinite(opts.reapAgeMs) ? opts.reapAgeMs : LIMITS.concurrency.reapAgeFallbackMs;
  const alloc = opts.tabAllocator || null;
  // Pin to the COLLECTOR viewport (eval-page/drive-page/vision-capture all use 1280×900). The frozen crops the
  // model reasons over are 1280×900, so coordinate-keyed tools (query_ax_node x/y, resolve_part_color x/y) must
  // resolve the model's screenshot pixels against the SAME reflow — not the Puppeteer default 800×600.
  const COLLECTOR_VP = { width: 1280, height: 900, deviceScaleFactor: 1 };
  // ALL tool tabs (base + clones) come from ONE source: the shared allocator (global cap + FIFO + timer-pause)
  // when a pool is provided, else an OWN browser (legacy/direct callers). acquirePage() → { page, release };
  // release frees the allocator slot (or closes the own tab). Clone queue-wait is ACCUMULATED so the SDK transport
  // can credit it back to the deadline (a tool parked waiting for a tab shouldn't burn the model's budget).
  let ownBrowser = null, ownsBrowser = false, cloneWaitMs = 0;
  let acquirePage;
  if (alloc) {
    acquirePage = async () => { const lease = await alloc.acquire(); cloneWaitMs += (Number(lease.waitMs) || 0); return { page: lease.page, release: lease.release }; };
  } else {
    const puppeteer = require('puppeteer');
    const CHROME = opts.executablePath || process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    ownBrowser = opts.browser || await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: BROWSER_ARGS });
    ownsBrowser = !opts.browser;
    acquirePage = async () => { const p = await ownBrowser.newPage(); return { page: p, release: async () => { try { await p.close(); } catch (e) {} } }; };
  }
  const baseLease = await acquirePage();
  const page = baseLease.page;
  await page.setViewport(COLLECTOR_VP).catch(() => {});
  await page.goto(url, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  // Track every clone tab so leaks can be swept. Mutating tools close their own clone in a `finally`
  // (per-call cleanup, finer than per-subject); the close listener keeps this map = currently-open clones AND
  // routes a tool's own page.close() through the lease's release so the shared allocator slot is always freed.
  const clones = new Map(); // page -> { bornMs, release }
  const freshClone = async () => {
    const lease = await acquirePage();
    const p = lease.page;
    await p.setViewport(COLLECTOR_VP).catch(() => {}); // same collector viewport as the base page (coordinate-frame parity)
    clones.set(p, { bornMs: Date.now(), release: lease.release });
    p.once('close', () => { clones.delete(p); lease.release(); }); // a tool's own page.close() still frees the slot
    await p.goto(url, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    return p;
  };
  // CHECK #1 (after each worker): reap a STALE clone — open longer than ANY tool call could legitimately run.
  // Concurrency-SAFE because the threshold is set ABOVE the whole-run abort (V3_LLM_TOOL_RUN_TIMEOUT_MS +
  // margin): a tool call is killed by that abort, so an in-use clone is ALWAYS younger than the threshold and
  // a peer subject's active tab can never be reaped (adversarial verify: the prior "younger than the 60s
  // STALL timeout" premise was wrong — a stall timeout doesn't bound a progressing in-process CDP handler).
  // Only a genuinely-orphaned tab (an aborted tool whose finally never fired) ages past it. (The per-call
  // finally is the prompt cleanup; this + the post-all sweep + browser.close are the backstops.)
  const reapStale = async (maxAgeMs = reapAgeMs) => { let n = 0; const now = Date.now(); for (const [p, info] of [...clones]) { if (!p.isClosed() && now - info.bornMs > maxAgeMs) { try { await info.release(); n++; } catch (e) {} } } return n; };
  // CHECK #2 (after ALL workers, no subject still running): release every remaining clone tab (frees its slot).
  const sweep = async () => { let n = 0; for (const [p, info] of [...clones]) { if (!p.isClosed()) { try { await info.release(); n++; } catch (e) {} } } return n; };
  // The PP-OCRv6 sidecar handle for ocr_image_text — LAZY (the Python process spawns on the first recognise,
  // not here) and isolated to its own venv; closed alongside the session so no sidecar process leaks.
  const ocr = require('./ocr-sidecar.js').makeOcrSidecar();
  // Session teardown: release the base-page lease (frees its slot; the shared browser stays for the run) and close
  // an OWN browser only if we launched one. extraDeadlineMs() feeds the transport's queue-wait credit-back.
  const close = async () => { try { await baseLease.release(); } catch (e) {} if (ownsBrowser && ownBrowser) { try { await ownBrowser.close(); } catch (e) {} } };
  return { browser: ownBrowser, page, freshClone, reapStale, sweep, ocr, close, extraDeadlineMs: () => cloneWaitMs, openCloneCount: () => { let n = 0; for (const p of clones.keys()) if (!p.isClosed()) n++; return n; } };
}

// collect, drive: baseline artifacts. opts.resolveUrl(request)->url; opts.now is a caller-supplied
// timestamp (the runner stamps freshness). Returns every stage artifact + the gated result.
async function orchestrate(collect, drive, opts = {}) {
  const now = Number.isFinite(opts.now) ? opts.now : (Number.isFinite(collect.collectedAt) ? collect.collectedAt + 1 : 1);
  const timings = makeTimings(); // ONE collector threaded through the run; snapshotted into bundle.timings at the end
  // ONE browser pool for EVERY lane (experiment, vision, instruments, IBM checker, LLM tools). A multi-page driver
  // injects a shared browser+allocator (page parallelism) ⇒ we don't own/close them; otherwise we own one + close
  // it in the finally. This collapses the former PER-LANE browsers into a single shared, globally-capped pool.
  // Ownership is PER-RESOURCE (mirrors run-experiments runPlan): a caller can inject just one half and we still
  // close only the half we created — injecting one but treating ownership as all-or-nothing would orphan the other.
  const ownsBrowser = !opts.browser;
  const ownsAlloc = !opts.tabAllocator;
  const browser = opts.browser || await require('puppeteer').launch({ executablePath: opts.executablePath || run.CHROME, headless: 'new', args: BROWSER_ARGS });
  const tabAllocator = opts.tabAllocator || createTabAllocator({ browser, maxTabs: opts.maxTabs });
  try {
  cg.annotateApplicableScs(collect);
  const candidates = cg.generateCandidates(collect, drive);
  const autoPlan = sch.schedulePlan(candidates, { maxAutomatic: opts.maxAutomatic });
  // Level-3 contextual escalations (if any) go through the UNTRUSTED planner → validating merger.
  // The planner cannot widen the plan or escape the catalog allowlist (plan Phase 2); with no Level-3
  // candidate this is a no-op and scheduling stays fully deterministic.
  const { plan, errors: planErrors } = agentPlanner.planLevel3(autoPlan, candidates, opts.level3Planner);
  plan._startedAt = now;
  // ATTESTATION (audit V3R3-C1): a run that holds the trust-anchor key signs its evidence so the
  // builder can verify lineage at the publish boundary. The key comes from opts or the trusted
  // authority config (__trust) — never the bundle. Absent a key, evidence is unsigned ⇒ shadow-only.
  const attestationKey = opts.attestationKey || (opts.authority && opts.authority.__trust && opts.authority.__trust.attestationKey) || null;
  const experiments = await timings.stage('experiments', () => run.runPlan(plan, { resolveUrl: opts.resolveUrl, executablePath: opts.executablePath, attestationKey, budgetOpts: opts.budgetOpts, experimentConcurrency: opts.experimentConcurrency, maxTabs: opts.maxTabs, browser, tabAllocator }));
  experiments.startedAt = now;
  // per-ELEMENT experiment durations ride a side channel (wall-clock is run-dependent ⇒ kept OUT of the hashed
  // experiments artifact, exactly like applicabilityObservations). Fold into the timings collector, then drop.
  // key per-element by the bare xpath so a single element's experiment time + LLM time (folded below, also by
  // targetXpath) collate under ONE key in timings.elements — candidateId would put them in disjoint namespaces.
  for (const st of (experiments.stepTimings || [])) timings.element(st.targetXpath, 'experiment', st.durationMs);
  delete experiments.stepTimings;
  // the INDEPENDENT applicability observation (Rule 15) is produced by the runner pass but lives in
  // its OWN stage artifact (a different producer than the experiment outcome) — pull it out so the
  // experiments stage stays the outcome record and the manifest hashes applicability separately.
  const observations = experiments.applicabilityObservations || [];
  delete experiments.applicabilityObservations;
  const claimProposals = proposeClaims(plan, experiments);
  // The COMPLETE bundle travels through the one gate: collect + drive baseline, the candidate and
  // plan stages (so requests/results reconcile), the experiments, and the proposals (audit V3-H1).
  const driveArt = drive && (drive.file || drive.runId || drive.pageDigest)
    ? drive : { file: collect.file, runId: collect.runId, pageDigest: collect.pageDigest, ...(drive || {}) };
  const planArt = { file: plan.file, runId: plan.runId, pageDigest: plan.pageDigest, requests: plan.requests, escalations: plan.escalations };
  const applicability = { file: collect.file, runId: collect.runId, pageDigest: collect.pageDigest, observations };
  const bundle = { collect, drive: driveArt, candidates, plan: planArt, experiments, claimProposals, applicability };
  // INSTRUMENT FINDINGS stage (opt-in): run the hardened VSR + keyboard instruments against the page and
  // attach the findings. NON-AUTHORITATIVE and NOT hashed (like judgments) — they never publish
  // authoritative; they are recorded for offline scoring against the hand-labeled ground truth.
  if (opts.runInstruments && opts.resolveUrl) {
    const url = opts.resolveUrl(plan.requests && plan.requests[0] ? plan.requests[0] : { targetXpath: '/html' });
    // ROBUSTNESS: the keyboard instruments DRIVE the page (press Tab/Shift+Tab/Escape + settle), which under heavy
    // concurrent-Chrome load can slow to a crawl or, pathologically, HANG (an unresolved CDP round-trip). The `.catch`
    // only covers a REJECTION; a hang would block the whole case. Race the stage against a hard wall-clock cap and
    // fall back to empty findings (fail-closed — instruments are non-authoritative, so a skipped lane never asserts a
    // false NO_BARRIER; it just forgoes the deterministic catch and the obligation rides to the LLM/PARTIAL as before).
    const empty = { file: collect.file, runId: collect.runId, pageDigest: collect.pageDigest, findings: [], timedOut: false };
    const capMs = Number.isFinite(opts.instrumentsTimeoutMs) ? opts.instrumentsTimeoutMs : 90000;
    // CONCURRENCY GATE: when the caller passes a semaphore (run-telemetry makeSemaphore, .run(fn)), hold a slot for
    // the whole lane so only a few keyboard-driving lanes contend at once. The timeout starts only once we hold the
    // slot (inside run(fn)), so time spent queueing never burns the budget. No gate ⇒ run immediately (the timeout
    // still bounds a hang).
    const stage = () => timings.stage('instruments', () => {
      let timer;
      const run = require('./run-instruments.js')
        .runInstrumentsForUrl(url, { executablePath: opts.executablePath, browser, tabAllocator, file: collect.file, runId: collect.runId, pageDigest: collect.pageDigest })
        .catch(() => empty);
      const guard = new Promise((resolve) => { timer = setTimeout(() => resolve({ ...empty, timedOut: true }), capMs); });
      return Promise.race([run, guard]).finally(() => clearTimeout(timer));
    });
    bundle.instruments = opts.instrumentsGate && typeof opts.instrumentsGate.run === 'function'
      ? await opts.instrumentsGate.run(stage)
      : await stage();
  }
  // CHECKER FINDINGS stage — C0 (Harness 3.3): surface axe's already-decided coverage from the
  // collector's OWN run (collect.axe / collect.axeRan, scripts/eval-page.js). FREE: no browser, no
  // network, no API — axe already ran at collection time and v3 was throwing the decided wins away.
  // NON-AUTHORITATIVE and identity-stamped; never an obligation disposition (no tie-break — §2). Only
  // attached when axe actually ran (a missing sentinel ⇒ no axe signal, not "axe clean").
  const axeSurf = require('./axe-surface.js').surfaceAxeFindings(collect);
  const checkerFindings = axeSurf.ran ? [...axeSurf.findings] : [];
  const engines = []; if (axeSurf.ran) engines.push('axe');
  let checkerUnavailable;
  // C1 (Harness 3.3): IBM Equal Access as a live cross-signal — OPT-IN (opts.runChecker) and INERT
  // otherwise. runIbmForUrl lazy-requires accessibility-checker and returns checkerUnavailable if the
  // package/network is absent, so a skipped IBM run is RECORDED on the artifact (it never silently
  // vanishes). IBM findings (1.4.12/2.5.3 hard + 1.4.1/1.3.3 priors) merge into the one checkerFindings
  // artifact alongside axe; each finding carries its own source, so the lanes stay distinguishable.
  if (opts.runChecker && opts.resolveUrl) {
    const url = opts.resolveUrl(plan.requests && plan.requests[0] ? plan.requests[0] : { targetXpath: '/html' });
    const r = await timings.stage('checker-ibm', () => require('./checker-ibm.js').runIbmForUrl(url, { executablePath: opts.executablePath, browser, tabAllocator, label: collect.file }).catch((e) => ({ checkerUnavailable: true, reason: e && e.message })));
    if (r && r.ran) { checkerFindings.push(...r.findings); engines.push('ibm'); }
    else checkerUnavailable = (r && r.reason) || 'IBM unavailable';
  }
  if (engines.length || checkerUnavailable) {
    bundle.checkerFindings = { file: collect.file, runId: collect.runId, pageDigest: collect.pageDigest, engines, ran: engines.length > 0, findings: checkerFindings };
    if (checkerUnavailable) bundle.checkerFindings.checkerUnavailable = checkerUnavailable;
  }
  // BROAD-SCOPE SIDECAR (experimental): WCAG/TT/EN scope + review candidates that do NOT publish
  // conformance outcomes. This is opt-in and identity-bound like instruments/checkers. It opens fresh
  // pages for mutating probes (text spacing / reduced motion / forced colors) so the main run state is
  // not contaminated. The builder consumes it as scopeWarnings + broadScopeFindings + triage only.
  if (opts.runBroadScope && opts.resolveUrl) {
    const url = opts.resolveUrl(plan.requests && plan.requests[0] ? plan.requests[0] : { targetXpath: '/html' });
    bundle.broadScope = await timings.stage('broad-scope', () => require('./broad-scope-probes.js')
      .runBroadScopeForUrl(url, { browser, file: collect.file, runId: collect.runId, pageDigest: collect.pageDigest, elementCap: opts.elementCap })
      .catch((e) => ({ file: collect.file, runId: collect.runId, pageDigest: collect.pageDigest, ran: false, error: e && e.message, probes: {}, findings: [], scopeWarnings: [], visualChecks: [], researchAnnotations: [] })));
    if (opts.runBroadScopeJudge && opts.runBroadScopeCritic) {
      const broadReview = await timings.stage('broad-scope-llm-review', () => require('./broad-scope-llm-review.js')
        .runBroadScopePacketReviews(bundle.broadScope, {
          runJudge: opts.runBroadScopeJudge,
          runCritic: opts.runBroadScopeCritic,
          maxPackets: Number.isFinite(opts.maxBroadScopeReviewPackets) ? opts.maxBroadScopeReviewPackets : Infinity,
        })
        .catch((e) => ({
          judgments: { file: collect.file, runId: collect.runId, pageDigest: collect.pageDigest, judgments: [] },
          broadScopeRationale: {
            file: collect.file,
            runId: collect.runId,
            pageDigest: collect.pageDigest,
            error: e && e.message,
            rationales: [],
          },
        })));
      bundle.broadScopeRationale = broadReview.broadScopeRationale;
      if (broadReview.judgments && broadReview.judgments.judgments && broadReview.judgments.judgments.length) {
        bundle.judgments = mergeJudgmentsArtifacts(bundle.judgments, broadReview.judgments, { file: collect.file, runId: collect.runId, pageDigest: collect.pageDigest });
      }
    }
  }
  // the trusted orchestrator finalizes + attests the run-manifest binding every artifact hash and the
  // observed page identity (plan Rule 17; audit V3R4-H7). The observed identity is the RUNNER's own
  // per-result observation, not the collector's claim (audit V3R5-M1): a SIGNED, RESULT-BEARING run
  // derives it from the attested results (fail-closed null on disagreement ⇒ the manifest schema then
  // refuses it). An EMPTY run (all candidates deferred/unrun) has no observation to derive AND no claim
  // to publish authoritative, so it records the collector identity — that cannot mislead a publication
  // decision (there are none) and lets an all-PARTIAL sweep produce a clean bundle instead of refusing
  // (audit R5R-L1). An UNSIGNED run is shadow-only anyway, so it also records the collector's digest.
  const hasResults = !!(experiments && Array.isArray(experiments.results) && experiments.results.length > 0);
  const observedPageDigest = (attestationKey && hasResults) ? manifest.deriveObservedPageDigest(experiments) : collect.pageDigest;
  bundle.manifest = manifest.buildManifest(bundle, {
    key: attestationKey, environment: experiments.environment,
    observedPageDigest, runnerVersion: '3.0.0-phase0', catalogVersion: experiments.catalogVersion,
  });
  // build opts threaded to BOTH passes so provisionalMode/gold take effect on the LLM-attached re-gate.
  const buildOpts = { authority: opts.authority, attestationKey: opts.attestationKey, artifactVerifier: opts.artifactVerifier, provisionalMode: opts.provisionalMode, gold: opts.gold, provisionOpts: opts.provisionOpts };
  let built = timings.stageSync('build', () => buildV3(bundle, buildOpts));
  // LLM EVIDENCE LANE (Harness 3.1 §2/§3; 3.2 rubrics+vision) — opt-in, offline, and INERT unless an
  // agent is injected (the default runAgent refuses, so no run can accidentally hit an API). Two-pass:
  // the preliminary build gives the obligation ledger, from which we select the auto-PARTIAL subjects to
  // judge per (element, skill) with the loaded v3.2 rubrics + (optional) vision crops; then we re-gate
  // with the frozen llm + rationale + vision artifacts attached. The lane is non-authoritative and NOT
  // hashed, so the manifest is unchanged. A producer failure leaves the original build intact.
  if (opts.runLlm && opts.runAgent && built.ok) {
    const llmAdj = require('./llm-adjudicator.js');
    const llmRubrics = opts.llmRubrics || require('./rubric-loader.js').loadRubrics();
    const ledger = built.results.obligationLedger;
    const onlyAutoPartial = opts.llmOnlyAutoPartial !== false;
    // S5 (RCA R5): annotate elements with the DETERMINISTIC keyboard-trap result (the actual Tab/Shift+Tab/Esc
    // walk — experiment lane and/or kbd instruments) so the 2.1.x precompute hands the agent a CONFIRMED-trap
    // signal, not just the focusRisk heuristic. A confirmed 2.1.2 BARRIER observation at/around an element xpath
    // is positive evidence focus cannot escape; absence falls back to the heuristic reasoning (never asserted as
    // "checked + clean"). Cheap xpath-prefix match (the finding xpath may be the trapping element OR its region).
    const trapBarrierXpaths = ((built.results && built.results.shadowObservations) || [])
      .filter((o) => o && o.sc === '2.1.2' && o.source === 'deterministic' && o.wouldBe && o.wouldBe.observationOutcome === 'BARRIER_OBSERVED')
      .map((o) => (o.observationScope && o.observationScope.actionTargetRef)).filter(Boolean);
    if (trapBarrierXpaths.length) {
      for (const el of collect.elements || []) {
        if (!el || !el.xpath) continue;
        el.deterministicTrapConfirmed = trapBarrierXpaths.some((tx) => el.xpath === tx || el.xpath.startsWith(tx + '/') || tx.startsWith(el.xpath + '/'));
      }
    }
    // PARTITION: the SCs an atomic rubric covers are OWNED by the rubric producer; the whole-obligation
    // agent runs only on the rubric-less SCs, so the two never co-fire on one cell (no duplicate eval).
    const ownedScs = new Set(Object.values(llmRubrics.rubrics || {}).filter((r) => r && r.sc).map((r) => r.sc));
    let agentSubjects = llmAdj.selectSubjects(collect, ledger, { onlyAutoPartial, ownedScs });          // llm-agent (rubric-less SCs only)
    let rubricSubjects = llmAdj.selectRubricSubjects(collect, ledger, llmRubrics.rubrics, { onlyAutoPartial }); // llm-rubric:<id> (per SC)
    // EVAL SCOPE GATE (opt-in): restrict the LLM to the SC(s) we have ground truth for. ACT ground truth is
    // PER-SC — a testcase only tells us pass/fail/inapplicable for its OWN rule's SC, not the page's other SCs.
    // Judging off-target obligations is both unscoreable (no GT) and wasted LLM/tool/vision spend. A Set of SC
    // strings (opts.restrictScs) keeps only matching subjects; absent ⇒ judge everything (production behaviour).
    if (opts.restrictScs instanceof Set && opts.restrictScs.size) {
      agentSubjects = agentSubjects.filter((s) => opts.restrictScs.has(s.sc));
      rubricSubjects = rubricSubjects.filter((s) => opts.restrictScs.has(s.sc));
    }
    // VISION (audit D11-1): use a caller-supplied map, else CAPTURE it (browser) for the union of subject
    // xpaths — so the adjudicator stays a pure function over visionByXpath but a real run gets real pixels.
    let visionByXpath = opts.visionByXpath || null;
    if (!visionByXpath && opts.captureVision && opts.resolveUrl) {
      const vc = require('./vision-capture.js');
      const allSubs = [...agentSubjects, ...rubricSubjects];
      const xps = [...new Set(allSubs.map((s) => s.xpath))];
      const statePlan = vc.buildStatePlan(allSubs); // focus/hover state-before/after pairs for the dynamic-state rubrics (audit #1 bridge)
      const url = opts.resolveUrl(plan.requests && plan.requests[0] ? plan.requests[0] : { targetXpath: '/html' });
      visionByXpath = await timings.stage('vision', () => vc.captureVisionForUrl(url, xps, { executablePath: opts.executablePath, browser, tabAllocator, statePlan }).catch(() => ({})));
    }
    // PHASE 2 (opt-in V3_LLM_TOOLS): give the judge a LIVE in-process CDP tool session so it can activate
    // controls / resolve nodes mid-reasoning. The tools take xpath/coordinate args ⇒ ONE server over the
    // page serves every subject; mutating tools clone. Verdicts stay canary-capped shadow regardless. The
    // live session is opened here and ALWAYS closed in the finally. Tool-path concurrency is bounded (≤4) to
    // cap concurrent live pages. Falls back to the single-shot runAgent if the session/server can't open.
    let llmRunAgent = opts.runAgent, toolSession = null, toolConcurrency = opts.llmConcurrency;
    try {
      if (opts.llmTools && opts.llmTransportConfig && opts.resolveUrl) {
        const adapter = require('./llm-agent-adapter.js');
        const cdpTools = require('./cdp-tools.js');
        const turl = opts.resolveUrl(plan.requests && plan.requests[0] ? plan.requests[0] : { targetXpath: '/html' });
        const reapAgeMs = (Number(opts.llmToolRunTimeoutMs) || LIMITS.llm.toolRunTimeoutMs) + LIMITS.concurrency.reapAgeMarginMs; // strictly above the whole-run abort
        // the tool session draws its base page + clones from the SHARED pool (same browser+allocator as every lane).
        toolSession = await openToolSession(turl, { executablePath: opts.executablePath, reapAgeMs, browser, tabAllocator }).catch(() => null);
        const server = toolSession ? await cdpTools.buildCdpToolServer(toolSession).catch(() => null) : null;
        if (server) {
          toolConcurrency = Math.min(Number(opts.llmConcurrency) || 1, Number(opts.llmToolConcurrency) || LIMITS.concurrency.llmTool); // V3_LLM_TOOL_CONCURRENCY (default 4) bounds concurrent SUBJECTS (≈ tabs; a turn may open >1 clone briefly)
          llmRunAgent = adapter.makeRunAgent({
            transport: adapter.makeClaudeSdkTransport({
              ...opts.llmTransportConfig, mcpServers: { cdp: server }, allowedTools: ['mcp__cdp__*'],
              maxTurns: opts.llmToolMaxTurns || LIMITS.llm.toolMaxTurns, runTimeoutMs: opts.llmToolRunTimeoutMs || LIMITS.llm.toolRunTimeoutMs,
              getExtraDeadlineMs: toolSession.extraDeadlineMs, // credit tab-queue wait back to the deadline (timer-pause)
              // onTraceSink rides ...llmTransportConfig ⇒ this multi-turn tool transport feeds the SAME token telemetry.
            }),
            model: opts.llmTransportConfig.model,
          });
          // The tool agent is built HERE (it needs the live server + session), so the caller's single-shot wrapper
          // (global LLM semaphore + inflight tracking) can't reach it unless we apply it. Keep BOTH paths under one cap.
          if (typeof opts.wrapAgent === 'function') llmRunAgent = opts.wrapAgent(llmRunAgent);
        }
      }
      // CHECKER-UNCERTAINTY hints (DEFERRED-TODO A): xpath -> [{sc, checker, rule, note}] from the INCOMPLETE
      // findings, so the adjudicator threads "axe flagged <rule> for review here" into the matching subject's
      // prompt (the obligation reached the LLM precisely because a checker couldn't decide).
      const checkerHintsByXpath = {};
      for (const f of ((bundle.checkerFindings && bundle.checkerFindings.findings) || [])) {
        if (!f || f.kind !== 'incomplete' || !f.xpath) continue;
        (checkerHintsByXpath[f.xpath] = checkerHintsByXpath[f.xpath] || []).push({ sc: f.sc, checker: f.source || 'checker', rule: f.ruleId || f.detector || 'rule', note: 'flagged for REVIEW — investigate this specific concern; needs-review is never a pass' });
      }
      const pOpts = {
        runAgent: llmRunAgent, budget: opts.llmBudget, model: opts.llmModel, llmRubrics, llmConcurrency: toolConcurrency,
        // tools are TRULY live iff the tool agent replaced the single-shot one (server built) — gates the prompt's
        // tool-guidance block so the judge is told about tools ONLY when it can actually call them.
        toolsEnabled: llmRunAgent !== opts.runAgent,
        transcriptByXpath: opts.transcriptByXpath, visionByXpath: visionByXpath || {}, checkerHintsByXpath,
        file: collect.file, runId: collect.runId, pageDigest: collect.pageDigest,
        // CHECK #1 (after each worker/subject): reap any stale leaked clone tab (concurrency-safe).
        afterEach: toolSession ? () => toolSession.reapStale() : undefined,
      };
      // FREEZE HOOK (additive; inert unless opts.onLlmInputs is supplied). Snapshots the EXACT judge inputs —
      // selected subjects + the per-subject evidence (visionByXpath crops, VSR transcript, checker hints) + the
      // PRELIMINARY deterministic build (pre-LLM-re-gate, used for scoring). An offline replay harness re-runs
      // runAdjudication/runRubricJudgments over identical evidence with a different judge design (FP-reduction
      // experiments) without a browser. Never mutates state; the live run proceeds unchanged.
      if (typeof opts.onLlmInputs === 'function') {
        try { opts.onLlmInputs({ agentSubjects, rubricSubjects, pOpts, built }); } catch (e) { /* best effort */ }
      }
      const adj = await timings.stage('llm-adjudication', () => llmAdj.runAdjudication(agentSubjects, pOpts).catch(() => null));   // → bundle.llm
      const rub = await timings.stage('llm-rubric', () => llmAdj.runRubricJudgments(rubricSubjects, pOpts).catch(() => null));    // → bundle.judgments
      let changed = false;
      if (adj && adj.llm && adj.llm.verdicts.length) { bundle.llm = adj.llm; bundle.llmRationale = adj.llmRationale; changed = true; }
      if (rub && rub.judgments && rub.judgments.judgments.length) {
        bundle.judgments = mergeJudgmentsArtifacts(bundle.judgments, rub.judgments, { file: collect.file, runId: collect.runId, pageDigest: collect.pageDigest });
        changed = true;
      }
      // FULL LLM TRACE (non-authoritative, NOT hashed): merge both producers' turn-by-turn traces and fold each
      // subject's latency into the timings collector keyed by element. Does NOT set `changed` — a trace never
      // affects the ledger/build, it is recorded purely for offline analysis.
      const llmTraces = [...((adj && adj.llmTrace && adj.llmTrace.traces) || []), ...((rub && rub.llmTrace && rub.llmTrace.traces) || [])];
      if (llmTraces.length) {
        bundle.llmTrace = { file: collect.file, runId: collect.runId, pageDigest: collect.pageDigest, traces: llmTraces };
        for (const tr of llmTraces) if (Number.isFinite(tr.latencyMs)) timings.element(tr.targetXpath, 'llm', tr.latencyMs);
      }
      // merge the crops both producers captured (dedup by id) into one llmVision side artifact.
      const seen = new Set(); const images = [];
      for (const im of [...((adj && adj.llmVision && adj.llmVision.images) || []), ...((rub && rub.llmVision && rub.llmVision.images) || [])]) if (!seen.has(im.id)) { seen.add(im.id); images.push(im); }
      if (images.length) { bundle.llmVision = { file: collect.file, runId: collect.runId, pageDigest: collect.pageDigest, images }; changed = true; }
      if (changed) built = timings.stageSync('build-llm', () => buildV3(bundle, buildOpts));
      // CHECK #2 (after ALL workers, no subject still running): sweep any clone tab left open (e.g. a tool
      // aborted mid-call whose finally didn't fire). Normally 0 — the per-call finally already closed them.
      if (toolSession) { const leaked = await toolSession.sweep(); if (leaked) console.error(`[v3-tools] swept ${leaked} leaked clone tab(s) after the run`); }
    } finally {
      // tool-session teardown: stop the OCR sidecar (kills its isolated Python process) and release the base-page
      // lease (frees its slot) + close an own browser only if the session launched one. The SHARED run browser is
      // closed by orchestrate's OUTER finally below — any clone that survived both checks dies with it.
      if (toolSession && toolSession.ocr) { try { await toolSession.ocr.close(); } catch (e) {} }
      if (toolSession && toolSession.close) { try { await toolSession.close(); } catch (e) {} }
    }
  }
  // per-stage + per-element wall-clock breakdown (NON-authoritative, NOT hashed — like judgments/instruments):
  // where the page's time went, and which element/obligation was slow. Written to timings.json by run-evaluation.
  bundle.timings = { file: collect.file, runId: collect.runId, pageDigest: collect.pageDigest, ...timings.snapshot() };
  return { candidates, plan, experiments, claimProposals, bundle, built, planErrors };
  } finally { if (ownsAlloc) tabAllocator.close(); if (ownsBrowser) await browser.close().catch(() => {}); }
}

module.exports = { orchestrate, openToolSession };
