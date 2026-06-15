// Harness 3.0 — deterministic claim proposer for UNAMBIGUOUS experiment outcomes (plan: the
// evaluator agent proposes claim directions; this handles the mechanical, non-judgment cases so
// the skeleton runs without an LLM). Ambiguous outcomes propose NOTHING → the obligation
// auto-resolves to PARTIAL. The proposer never decides authority; the builder still binds and gates.
'use strict';

function directionForFocusVisible(o) {
  if (o.focusDependentIndicator && o.obviouslyVisible && o.keyboardReachableInState && o.hydrationReady) return 'NO_BARRIER_OBSERVED';
  if (o.stableIndicatorAbsence && o.keyboardReachableInState && o.hydrationReady) return 'BARRIER_OBSERVED';
  return null; // ambiguous → PARTIAL
}

const DIRECTION_FOR = {
  'focus-visual-retry': directionForFocusVisible,
};

const cat = require('./catalog.js');

function proposeClaims(plan, experiments) {
  const proposals = [];
  for (const r of (experiments && experiments.results) || []) {
    const fn = DIRECTION_FOR[r.experimentId];
    if (!fn) continue;
    const direction = fn(r.outcome || {});
    if (!direction) continue;
    const claimFamily = (cat.getExperiment(r.experimentId) || {}).claimFamily || null;
    proposals.push({ claimId: r.claimId, sc: r.sc, direction, experimentId: r.experimentId, claimFamily, observationScope: r.observationScope });
  }
  return { file: plan && plan.file, runId: plan && plan.runId, pageDigest: plan && plan.pageDigest, proposals };
}

module.exports = { proposeClaims, directionForFocusVisible };
