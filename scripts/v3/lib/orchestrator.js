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
  const built = buildV3(bundle, { authority: opts.authority, attestationKey: opts.attestationKey, artifactVerifier: opts.artifactVerifier });
  return { candidates, plan, experiments, claimProposals, bundle, built, planErrors };
}

module.exports = { orchestrate };
