// Harness 3.0 — third-pass audit: PUBLICATION LINEAGE (V3R3-C1) + mandatory production lineage
// (V3R3-M3). These prove the publication boundary authenticates EVIDENCE, not just assertions: a
// hand-authored bundle that says valid:true/completed:true with invented flags cannot publish,
// because it lacks a verifiable attestation from a key-holding runner; tampering with any signed
// field is caught; and the production build requires the complete lineage stages.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

const attest = require('../lib/attestation.js');
const { buildV3 } = require('../lib/build-v3.js');
const { loadBundle, STAGE_FILES, PRODUCTION_REQUIRED, SHADOW_DEBUG_REQUIRED } = require('../lib/bundle-loader.js');
const { withPipeline, promoted, TEST_KEY } = require('./helpers.js');

// ---- a complete, internally-consistent 2.4.7 clear bundle (pre-attestation) ----
const SCOPE = { actionTargetRef: 'node:b1', state: 'fresh-load', action: 'tab-to', environment: 'headless-chromium' };
const FULL_OUTCOME = {
  targetIsFocusable: true, keyboardReachableInState: true, realKeyboardFocus: true, hydrationReady: true,
  focusDependentIndicator: true, obviouslyVisible: true, stableIndicatorAbsence: true, modeCompletenessProven: true,
};
const FULL_APP = { targetIsFocusable: true, keyboardReachableInState: true };
const threeStage = () => ({
  collect: { file: 'p', runId: 'R', pageDigest: 'sha256:d', collectedAt: 1000, elements: [{ xpath: 'node:b1', focusable: true }] },
  experiments: { file: 'p', runId: 'R', pageDigest: 'sha256:d', catalogVersion: '3.0.0-phase0', startedAt: 2000, results: [{ claimId: 'c1', experimentId: 'focus-visual-retry', targetXpath: 'node:b1', sc: '2.4.7', observationScope: SCOPE, outcome: { ...FULL_OUTCOME }, applicabilityEvidence: { ...FULL_APP }, valid: true, completed: true }] },
  claimProposals: { file: 'p', runId: 'R', pageDigest: 'sha256:d', proposals: [{ claimId: 'c1', sc: '2.4.7', direction: 'NO_BARRIER_OBSERVED', experimentId: 'focus-visual-retry', claimFamily: 'focus-indicator-visible', observationScope: SCOPE }] },
});
const PROMOTED = promoted(['focus-visual-retry/NO_BARRIER_OBSERVED']);

// ============================ attestation module ============================
test('attestation: sign→verify round-trips; key-order independent', () => {
  const r = { experimentId: 'e', claimId: 'c', targetXpath: 't', sc: '2.4.7', observationScope: SCOPE, outcome: { a: true, b: false }, applicabilityEvidence: { x: true }, valid: true, completed: true };
  const signed = attest.signResult(r, 'k');
  assert.equal(attest.verifyResult(signed, 'k'), true);
  // reordering the outcome keys must NOT change the digest (stable stringify)
  const reordered = { ...signed, outcome: { b: false, a: true } };
  assert.equal(attest.verifyResult(reordered, 'k'), true, 'digest is independent of property order');
});

test('attestation: FAIL-CLOSED on no key, missing attestation, wrong key, and tamper', () => {
  const signed = attest.signResult({ experimentId: 'e', claimId: 'c', targetXpath: 't', sc: 's', observationScope: SCOPE, outcome: { a: true }, applicabilityEvidence: {}, valid: true, completed: true }, 'k');
  assert.equal(attest.verifyResult(signed, null), false, 'no key ⇒ cannot verify');
  assert.equal(attest.verifyResult({ ...signed, attestation: undefined }, 'k'), false, 'no attestation ⇒ false');
  assert.equal(attest.verifyResult(signed, 'WRONG'), false, 'wrong key ⇒ false');
  assert.equal(attest.verifyResult({ ...signed, valid: false }, 'k'), false, 'tampered valid ⇒ digest mismatch');
  assert.equal(attest.verifyResult({ ...signed, outcome: { a: false } }, 'k'), false, 'tampered outcome ⇒ digest mismatch');
  // a fabricated attestation (attacker invents a mac) does not verify without the key
  assert.equal(attest.verifyResult({ ...signed, attestation: { ...signed.attestation, mac: 'deadbeef' } }, 'k'), false);
});

test('attestation: on-disk artifact verifier checks sha256, rejects tamper / missing / path-escape', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'v3-attest-'));
  const file = path.join(dir, 'gold.json');
  fs.writeFileSync(file, '{"cases":3}');
  const hash = 'sha256:' + crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  const verify = attest.makeDiskArtifactVerifier(dir);
  assert.equal(verify('goldRef', 'gold://gold.json', hash), true, 'matching hash verifies');
  assert.equal(verify('goldRef', 'gold://gold.json', 'sha256:' + '0'.repeat(64)), false, 'wrong hash ⇒ false');
  assert.equal(verify('goldRef', 'gold://missing.json', hash), false, 'missing file ⇒ false');
  assert.equal(verify('goldRef', 'gold://gold.json', 'not-a-hash'), false, 'malformed hash ⇒ false');
  assert.equal(verify('goldRef', 'gold://../escape.json', hash), false, 'path escape ⇒ false');
  fs.rmSync(dir, { recursive: true, force: true });
});

// ============================ publication boundary (V3R3-C1) ============================
test('V3R3-C1: a forged COMPLETE+promoted bundle with no attestation cannot publish (stays shadow)', () => {
  const forged = withPipeline(threeStage());
  forged.experiments.results.forEach((r) => { delete r.attestation; }); // attacker lacks the runner key
  const r = buildV3(forged, { authority: PROMOTED });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.results.summary.authoritative, 0, 'unattested evidence ⇒ never authoritative');
  assert.equal(r.results.summary.shadow, 1);
  assert.match(r.results.shadowObservations[0].reason, /lineage unverified/);
});

test('V3R3-C1: a fabricated attestation (invented mac) cannot publish', () => {
  const forged = withPipeline(threeStage());
  forged.experiments.results.forEach((r) => { r.attestation = { runner: 'focus-visual-retry', runnerVersion: '3.0.0-phase0', resultDigest: 'sha256:' + '0'.repeat(64), mac: 'deadbeef' }; });
  const r = buildV3(forged, { authority: PROMOTED });
  assert.equal(r.results.summary.authoritative, 0, 'a forged mac does not verify against the trust-anchor key');
});

test('V3R3-C1: tampering a signed result (any covered field) drops it to shadow', () => {
  const signed = withPipeline(threeStage());
  // flip a NON-required typed outcome flag: the clear still RESOLVES authoritative, so the ONLY
  // reason it must not publish is the broken attestation digest — isolating tamper-evidence.
  signed.experiments.results[0].outcome.stableIndicatorAbsence = false;
  const r = buildV3(signed, { authority: PROMOTED });
  assert.equal(r.results.summary.authoritative, 0, 'tampered lineage ⇒ shadow');
  assert.match(r.results.shadowObservations[0].reason, /lineage unverified/);
});

test('V3R3-C1: legitimately attested + promoted + complete ⇒ publishes (mechanism still works)', () => {
  const r = buildV3(withPipeline(threeStage()), { authority: PROMOTED });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.results.summary.authoritative, 1, 'real signed evidence publishes');
});

test('V3R3-C1: promotion whose provenance artifacts do NOT verify on disk stays shadow', () => {
  const failingProv = promoted(['focus-visual-retry/NO_BARRIER_OBSERVED'], { artifactVerifier: () => false });
  const r = buildV3(withPipeline(threeStage()), { authority: failingProv });
  assert.equal(r.results.summary.authoritative, 0, 'unverified provenance ⇒ shadow');
  assert.match(r.results.shadowObservations[0].reason, /provenance artifacts did not verify/);
});

test('V3R3-C1: no trust-anchor key configured ⇒ nothing publishes (default-shadow safety preserved)', () => {
  // a promoted registry with NO trust companion (no key): even signed evidence cannot be verified.
  const noKeyReg = {
    'focus-visual-retry/NO_BARRIER_OBSERVED': {
      state: 'authoritative', reason: 'promoted but no key',
      readiness: { goldSized: true, sealedEval: true, independentRaters: true, measurementValidated: true },
      provenance: { goldRef: 'gold://x', sealedRef: 'sealed://x', raterRef: 'rater://x', measurementSuiteHash: 'sha256:x' },
    },
  };
  const r = buildV3(withPipeline(threeStage()), { authority: noKeyReg });
  assert.equal(r.results.summary.authoritative, 0, 'no key ⇒ lineage unverifiable ⇒ shadow');
});

test('V3R3-C1 (red-team): a genuinely-signed result cannot be REPLAYED into a foreign bundle', () => {
  // a legit run A signs its evidence; an attacker drops the UNCHANGED signed result into a bundle
  // whose every stage carries a different (attacker) page identity. The signed run identity no longer
  // matches the bundle's collect ⇒ shadow, even though the MAC itself still verifies.
  const a = withPipeline(threeStage()); // signed for {file:p, runId:R, pageDigest:sha256:d}
  const signedResult = a.experiments.results[0];
  assert.equal(attest.verifyResult(signedResult, TEST_KEY), true, 'the MAC itself verifies');
  const foreignId = { file: 'ATTACKER-PAGE', runId: 'R-B', pageDigest: 'sha256:attacker' };
  const foreign = {
    collect: { ...foreignId, collectedAt: 1000, elements: [{ xpath: 'node:b1', focusable: true }] },
    drive: { ...foreignId, elements: [] },
    candidates: { ...foreignId, candidates: [{ candidateId: 'c1', xpath: 'node:b1', sc: '2.4.7', experimentId: 'focus-visual-retry' }] },
    plan: { ...foreignId, requests: [{ candidateId: 'c1', experimentId: 'focus-visual-retry', targetXpath: 'node:b1', sc: '2.4.7' }], escalations: [] },
    experiments: { ...foreignId, catalogVersion: '3.0.0-phase0', startedAt: 2000, results: [signedResult], unrun: [] },
    claimProposals: { ...foreignId, proposals: [{ claimId: 'c1', sc: '2.4.7', direction: 'NO_BARRIER_OBSERVED', experimentId: 'focus-visual-retry', claimFamily: 'focus-indicator-visible', observationScope: SCOPE }] },
  };
  const r = buildV3(foreign, { authority: PROMOTED });
  assert.equal(r.results.summary.authoritative, 0, 'a result signed for another run cannot publish here');
  assert.match(r.results.shadowObservations[0].reason, /lineage unverified/);
});

test('V3R3-C1 (red-team): boundToRun fails closed on a missing/partial run identity', () => {
  const collect = { file: 'p', runId: 'R', pageDigest: 'sha256:d' };
  const sign = (ri) => attest.signResult({ experimentId: 'e', claimId: 'c', targetXpath: 't', sc: 's', observationScope: SCOPE, outcome: {}, applicabilityEvidence: {}, valid: true, completed: true }, 'k', { runIdentity: ri });
  assert.equal(attest.boundToRun(sign(collect), collect), true, 'full match binds');
  assert.equal(attest.boundToRun(sign({ file: 'p' }), collect), false, 'partial identity (missing runId/pageDigest) ⇒ false');
  assert.equal(attest.boundToRun(sign(null), collect), false, 'absent run identity ⇒ false');
  assert.equal(attest.boundToRun(sign(collect), {}), false, 'empty collect identity ⇒ false (no undefined===undefined)');
});

test('V3R3-C1 (red-team): atBaseline cannot be injected after signing (AT-baseline gate is bound)', () => {
  const signed = attest.signResult({ experimentId: 'e', claimId: 'c', targetXpath: 't', sc: 's', observationScope: SCOPE, outcome: { a: true }, applicabilityEvidence: {}, valid: true, completed: true }, 'k');
  assert.equal(attest.verifyResult(signed, 'k'), true);
  assert.equal(attest.verifyResult({ ...signed, atBaseline: { at: 'NVDA' } }, 'k'), false, 'injecting an AT baseline breaks the MAC');
});

test('V3R3-C1: a malformed/over-wide attestation is rejected by the strict schema', () => {
  const b = withPipeline(threeStage());
  b.experiments.results[0].attestation = { mac: 5, smuggled: 'x' }; // non-string mac + unknown key
  const r = buildV3(b, { authority: PROMOTED });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((m) => /attestation/.test(m)), JSON.stringify(r.errors));
});

// ============================ mandatory production lineage (V3R3-M3) ============================
function writeBundleDir(stages) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'v3-bundle-'));
  for (const [stage, obj] of Object.entries(stages)) fs.writeFileSync(path.join(dir, STAGE_FILES[stage]), JSON.stringify(obj));
  return dir;
}

test('V3R3-M3: production load REQUIRES the complete lineage; shadow-debug accepts the minimal triple', () => {
  const b = threeStage(); // collect + experiments + claimProposals only
  const dir = writeBundleDir({ collect: b.collect, experiments: b.experiments, claimProposals: b.claimProposals });
  const prod = loadBundle(dir, { required: PRODUCTION_REQUIRED });
  assert.ok(prod.errors.some((m) => /drive\.json/.test(m)), 'production requires drive');
  assert.ok(prod.errors.some((m) => /experiment-candidates\.json/.test(m)), 'production requires candidates');
  assert.ok(prod.errors.some((m) => /experiment-plan\.json/.test(m)), 'production requires plan');
  const dbg = loadBundle(dir, { required: SHADOW_DEBUG_REQUIRED });
  assert.deepEqual(dbg.errors, [], 'shadow-debug accepts the minimal triple');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('V3R3-M3: buildV3 with production requiredStages refuses an incomplete bundle at the gate', () => {
  const r = buildV3(threeStage(), { authority: PROMOTED, requiredStages: PRODUCTION_REQUIRED });
  assert.equal(r.ok, false, 'incomplete bundle fails the cross-artifact gate in production mode');
  assert.ok(r.errors.some((m) => /missing required stage/.test(m)));
});
