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

// collect, drive: baseline artifacts. opts.resolveUrl(request)->url; opts.now is a caller-supplied
// timestamp (the runner stamps freshness). Returns every stage artifact + the gated result.
async function orchestrate(collect, drive, opts = {}) {
  const now = Number.isFinite(opts.now) ? opts.now : (Number.isFinite(collect.collectedAt) ? collect.collectedAt + 1 : 1);
  cg.annotateApplicableScs(collect);
  const candidates = cg.generateCandidates(collect, drive);
  const plan = sch.schedulePlan(candidates, { maxAutomatic: opts.maxAutomatic });
  plan._startedAt = now;
  const experiments = await run.runPlan(plan, { resolveUrl: opts.resolveUrl, executablePath: opts.executablePath });
  experiments.startedAt = now;
  const claimProposals = proposeClaims(plan, experiments);
  // The COMPLETE bundle travels through the one gate: collect + drive baseline, the candidate and
  // plan stages (so requests/results reconcile), the experiments, and the proposals (audit V3-H1).
  const driveArt = drive && (drive.file || drive.runId || drive.pageDigest)
    ? drive : { file: collect.file, runId: collect.runId, pageDigest: collect.pageDigest, ...(drive || {}) };
  const planArt = { file: plan.file, runId: plan.runId, pageDigest: plan.pageDigest, requests: plan.requests, escalations: plan.escalations };
  const bundle = { collect, drive: driveArt, candidates, plan: planArt, experiments, claimProposals };
  const built = buildV3(bundle, { authority: opts.authority });
  return { candidates, plan, experiments, claimProposals, bundle, built };
}

module.exports = { orchestrate };
