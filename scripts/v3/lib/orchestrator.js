// Harness 3.0 — orchestrator (plan 3.0-F). Runs the deterministic pipeline end-to-end:
//   annotate obligations → generate candidates → schedule (no agent for L1/L2) → run experiments
//   → propose claims (deterministic for unambiguous) → build + gate v3 results.
// Pure control flow over the library modules; the builder remains the sole publication gate.
// Replay = re-run buildV3 over the frozen artifacts the orchestrator emitted (deterministic).
'use strict';

const cg = require('./candidate-generator.js');
const sch = require('./scheduler.js');
const run = require('./run-experiments.js');
const { proposeClaims } = require('./proposer.js');
const { buildV3 } = require('./build-v3.js');
const manifest = require('./manifest.js');
const agentPlanner = require('./agent-planner.js');

// collect, drive: baseline artifacts. opts.resolveUrl(request)->url; opts.now is a caller-supplied
// timestamp (the runner stamps freshness). Returns every stage artifact + the gated result.
async function orchestrate(collect, drive, opts = {}) {
  const now = Number.isFinite(opts.now) ? opts.now : (Number.isFinite(collect.collectedAt) ? collect.collectedAt + 1 : 1);
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
  const experiments = await run.runPlan(plan, { resolveUrl: opts.resolveUrl, executablePath: opts.executablePath, attestationKey, budgetOpts: opts.budgetOpts });
  experiments.startedAt = now;
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
    const inst = await require('./run-instruments.js')
      .runInstrumentsForUrl(url, { executablePath: opts.executablePath, file: collect.file, runId: collect.runId, pageDigest: collect.pageDigest })
      .catch(() => ({ file: collect.file, runId: collect.runId, pageDigest: collect.pageDigest, findings: [] }));
    bundle.instruments = inst;
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
    const r = await require('./checker-ibm.js').runIbmForUrl(url, { executablePath: opts.executablePath, label: collect.file }).catch((e) => ({ checkerUnavailable: true, reason: e && e.message }));
    if (r && r.ran) { checkerFindings.push(...r.findings); engines.push('ibm'); }
    else checkerUnavailable = (r && r.reason) || 'IBM unavailable';
  }
  if (engines.length || checkerUnavailable) {
    bundle.checkerFindings = { file: collect.file, runId: collect.runId, pageDigest: collect.pageDigest, engines, ran: engines.length > 0, findings: checkerFindings };
    if (checkerUnavailable) bundle.checkerFindings.checkerUnavailable = checkerUnavailable;
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
  let built = buildV3(bundle, buildOpts);
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
    // PARTITION: the SCs an atomic rubric covers are OWNED by the rubric producer; the whole-obligation
    // agent runs only on the rubric-less SCs, so the two never co-fire on one cell (no duplicate eval).
    const ownedScs = new Set(Object.values(llmRubrics.rubrics || {}).filter((r) => r && r.sc).map((r) => r.sc));
    const agentSubjects = llmAdj.selectSubjects(collect, ledger, { onlyAutoPartial, ownedScs });          // llm-agent (rubric-less SCs only)
    const rubricSubjects = llmAdj.selectRubricSubjects(collect, ledger, llmRubrics.rubrics, { onlyAutoPartial }); // llm-rubric:<id> (per SC)
    // VISION (audit D11-1): use a caller-supplied map, else CAPTURE it (browser) for the union of subject
    // xpaths — so the adjudicator stays a pure function over visionByXpath but a real run gets real pixels.
    let visionByXpath = opts.visionByXpath || null;
    if (!visionByXpath && opts.captureVision && opts.resolveUrl) {
      const vc = require('./vision-capture.js');
      const allSubs = [...agentSubjects, ...rubricSubjects];
      const xps = [...new Set(allSubs.map((s) => s.xpath))];
      const statePlan = vc.buildStatePlan(allSubs); // focus/hover state-before/after pairs for the dynamic-state rubrics (audit #1 bridge)
      const url = opts.resolveUrl(plan.requests && plan.requests[0] ? plan.requests[0] : { targetXpath: '/html' });
      visionByXpath = await vc.captureVisionForUrl(url, xps, { executablePath: opts.executablePath, statePlan }).catch(() => ({}));
    }
    const pOpts = {
      runAgent: opts.runAgent, budget: opts.llmBudget, model: opts.llmModel, llmRubrics, llmConcurrency: opts.llmConcurrency,
      transcriptByXpath: opts.transcriptByXpath, visionByXpath: visionByXpath || {},
      file: collect.file, runId: collect.runId, pageDigest: collect.pageDigest,
    };
    const adj = await llmAdj.runAdjudication(agentSubjects, pOpts).catch(() => null);                 // → bundle.llm
    const rub = await llmAdj.runRubricJudgments(rubricSubjects, pOpts).catch(() => null);             // → bundle.judgments
    let changed = false;
    if (adj && adj.llm && adj.llm.verdicts.length) { bundle.llm = adj.llm; bundle.llmRationale = adj.llmRationale; changed = true; }
    if (rub && rub.judgments && rub.judgments.judgments.length) { bundle.judgments = rub.judgments; changed = true; }
    // merge the crops both producers captured (dedup by id) into one llmVision side artifact.
    const seen = new Set(); const images = [];
    for (const im of [...((adj && adj.llmVision && adj.llmVision.images) || []), ...((rub && rub.llmVision && rub.llmVision.images) || [])]) if (!seen.has(im.id)) { seen.add(im.id); images.push(im); }
    if (images.length) { bundle.llmVision = { file: collect.file, runId: collect.runId, pageDigest: collect.pageDigest, images }; changed = true; }
    if (changed) built = buildV3(bundle, buildOpts);
  }
  return { candidates, plan, experiments, claimProposals, bundle, built, planErrors };
}

module.exports = { orchestrate };
