// Harness 3.0 — deterministic claim proposer (plan: the evaluator proposes a claim DIRECTION; the
// builder still binds + gates). Generic over the catalog: for each result, a direction is proposed
// only when EXACTLY ONE of the experiment's declared support predicates is satisfied by the typed
// outcome. Ambiguous (both/neither) ⇒ no proposal ⇒ the obligation auto-resolves to PARTIAL. The
// proposer never decides authority, clearability, completeness, reachability, or binding — those are
// the builder's. This handles the focus skeleton and all of C1/C3–C9 with no per-experiment code.
'use strict';

const cat = require('./catalog.js');

// Back-compat helper used by tests: the focus-visible direction for an unambiguous outcome.
function directionForFocusVisible(o) {
  if (o.focusDependentIndicator && o.obviouslyVisible && o.keyboardReachableInState && o.realKeyboardFocus && o.hydrationReady) return 'NO_BARRIER_OBSERVED';
  if (o.stableIndicatorAbsence && o.keyboardReachableInState && o.realKeyboardFocus && o.hydrationReady) return 'BARRIER_OBSERVED';
  return null;
}

// Generic: the single satisfied support direction, or null if ambiguous.
function directionFor(experimentId, outcome) {
  const exp = cat.getExperiment(experimentId);
  if (!exp) return null;
  const dirs = ['NO_BARRIER_OBSERVED', 'BARRIER_OBSERVED'].filter(
    (d) => exp.supports[d] && cat.supportsDirection(experimentId, d, outcome || {}).supported,
  );
  return dirs.length === 1 ? dirs[0] : null;
}

function proposeClaims(plan, experiments) {
  const proposals = [];
  for (const r of (experiments && experiments.results) || []) {
    const exp = cat.getExperiment(r.experimentId);
    if (!exp) continue;
    const direction = directionFor(r.experimentId, r.outcome || {});
    if (!direction) continue;
    proposals.push({ claimId: r.claimId, sc: r.sc, direction, experimentId: r.experimentId, claimFamily: exp.claimFamily, observationScope: r.observationScope });
  }
  return { file: plan && plan.file, runId: plan && plan.runId, pageDigest: plan && plan.pageDigest, proposals };
}

module.exports = { proposeClaims, directionForFocusVisible, directionFor };
