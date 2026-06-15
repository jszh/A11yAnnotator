// Harness 3.0 — shared test helpers for the audit-hardened publication boundary.
// Authoritative publication now requires (audit V3R2-C1/H6/H7 + V3R3-C1): the COMPLETE reconciled
// bundle (collect + drive + candidates + plan + experiments + proposals), VALID/COMPLETED evidence
// that carries a VERIFIED ATTESTATION (a key-holding catalog runner signed its lineage), and a
// PROMOTED authority entry backed by NAMED + VERIFIED provenance artifacts. These helpers build all
// of that from a minimal 3-stage bundle so tests can exercise the publish path without re-stating it.
//
// TEST_KEY is the trust anchor a TRUSTED test plays the part of the protected runner key. A forged
// bundle in a test does NOT have it, so it cannot publish — exactly the production guarantee.
'use strict';

const attest = require('../lib/attestation.js');
const manifest = require('../lib/manifest.js');

const TEST_KEY = 'v3-test-attestation-key-do-not-ship';

// stamp valid/completed:true on evidence results, SIGN them with the trust-anchor key (so the
// builder's lineage check passes), and synthesise the candidate + plan + drive stages that
// reconcile with them (request.candidateId === result.claimId, matching target/sc).
function withPipeline(bundle, key = TEST_KEY) {
  const c = bundle.collect;
  const id = { file: c.file, runId: c.runId, pageDigest: c.pageDigest };
  const results = (bundle.experiments.results || []).map((r) => attest.signResult(
    { valid: true, completed: true, ...r },
    key,
    { runner: r.experimentId, runnerVersion: '3.0.0-phase0', runIdentity: { file: c.file, runId: c.runId, observedPageDigest: c.pageDigest } },
  ));
  const candidates = { ...id, candidates: results.map((r) => ({ candidateId: r.claimId, xpath: r.targetXpath, sc: r.sc, experimentId: r.experimentId, selectionLevel: 1 })) };
  const plan = { ...id, requests: results.map((r) => ({ candidateId: r.claimId, experimentId: r.experimentId, targetXpath: r.targetXpath, sc: r.sc })), escalations: [] };
  const drive = { ...id, elements: [] };
  const built = { ...bundle, drive, candidates, plan, experiments: { ...bundle.experiments, results, unrun: [] } };
  // a trusted orchestrator finalizes + signs the run-manifest binding the artifact hashes + page id.
  built.manifest = manifest.buildManifest(built, { key, environment: 'test', observedPageDigest: c.pageDigest, runnerVersion: '3.0.0-phase0', catalogVersion: '3.0.0-phase0' });
  return built;
}

// RE-SEAL a (possibly mutated) bundle's run-manifest so its artifact hashes match the current
// content — used by tests that mutate a bundle to isolate a DOWNSTREAM gate (lineage/provenance/
// boundToRun) rather than the manifest-integrity gate. A real keyless attacker cannot do this (no
// key), which is why bundle tampering without a reseal is REFUSED by the builder.
function reseal(bundle, key = TEST_KEY) {
  return { ...bundle, manifest: manifest.buildManifest(bundle, { key, environment: 'test', observedPageDigest: bundle.collect.pageDigest, runnerVersion: '3.0.0-phase0', catalogVersion: '3.0.0-phase0' }) };
}

// a PROMOTED authority registry (all readiness + provenance satisfied) for the given experiment/dir
// pairs. The non-enumerable `__trust` companion carries the trust anchor (the same TEST_KEY the
// evidence was signed with, plus a stub artifact verifier that accepts the test provenance refs).
// `__trust` is invisible to validateAuthority / authorityFor, which iterate string keys only.
function promoted(pairs, { key = TEST_KEY, artifactVerifier = () => true } = {}) {
  const reg = {};
  for (const k of pairs) reg[k] = {
    state: 'authoritative', reason: 'test-promoted',
    readiness: { goldSized: true, sealedEval: true, independentRaters: true, measurementValidated: true },
    provenance: { goldRef: 'gold://test', sealedRef: 'sealed://test', raterRef: 'rater://test', measurementSuiteHash: 'sha256:test' },
  };
  Object.defineProperty(reg, '__trust', { value: { attestationKey: key, artifactVerifier }, enumerable: false });
  return reg;
}

module.exports = { withPipeline, reseal, promoted, TEST_KEY };
