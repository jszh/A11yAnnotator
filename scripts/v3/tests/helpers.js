// Harness 3.0 — shared test helpers for the audit-hardened publication boundary.
// Authoritative publication now requires (audit V3R2-C1/H6/H7): the COMPLETE reconciled bundle
// (collect + drive + candidates + plan + experiments + proposals), VALID/COMPLETED evidence, and a
// PROMOTED authority entry backed by NAMED provenance artifacts. These helpers build all of that
// from a minimal 3-stage bundle so tests can exercise the publish path without re-stating it.
'use strict';

// stamp valid/completed:true on evidence results and synthesise the candidate + plan + drive stages
// that reconcile with them (request.candidateId === result.claimId, matching target/sc).
function withPipeline(bundle) {
  const c = bundle.collect;
  const id = { file: c.file, runId: c.runId, pageDigest: c.pageDigest };
  const results = (bundle.experiments.results || []).map((r) => ({ valid: true, completed: true, ...r }));
  const candidates = { ...id, candidates: results.map((r) => ({ candidateId: r.claimId, xpath: r.targetXpath, sc: r.sc, experimentId: r.experimentId, selectionLevel: 1 })) };
  const plan = { ...id, requests: results.map((r) => ({ candidateId: r.claimId, experimentId: r.experimentId, targetXpath: r.targetXpath, sc: r.sc })), escalations: [] };
  const drive = { ...id, elements: [] };
  return { ...bundle, drive, candidates, plan, experiments: { ...bundle.experiments, results, unrun: [] } };
}

// a PROMOTED authority registry (all readiness + provenance satisfied) for the given experiment/dir pairs.
function promoted(pairs) {
  const reg = {};
  for (const key of pairs) reg[key] = {
    state: 'authoritative', reason: 'test-promoted',
    readiness: { goldSized: true, sealedEval: true, independentRaters: true, measurementValidated: true },
    provenance: { goldRef: 'gold://test', sealedRef: 'sealed://test', raterRef: 'rater://test', measurementSuiteHash: 'sha256:test' },
  };
  return reg;
}

module.exports = { withPipeline, promoted };
