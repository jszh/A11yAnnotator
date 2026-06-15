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
const { withPipeline, reseal, promoted, TEST_KEY } = require('./helpers.js');
const mani = require('../lib/manifest.js');

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
  // sibling-prefix escape (audit V3R4-M2): a sibling dir whose path STARTS WITH the root string must
  // be rejected — `path.relative`, not `startsWith`.
  const evil = dir + '-evil'; fs.mkdirSync(evil, { recursive: true });
  const evilFile = path.join(evil, 'gold.json'); fs.writeFileSync(evilFile, '{"cases":3}');
  assert.equal(verify('goldRef', `gold://../${path.basename(evil)}/gold.json`, hash), false, 'sibling-prefix path ⇒ false');
  fs.rmSync(dir, { recursive: true, force: true }); fs.rmSync(evil, { recursive: true, force: true });
});

// ============================ publication boundary (V3R3-C1) ============================
test('V3R3-C1: a forged COMPLETE+promoted bundle with no attestation cannot publish (stays shadow)', () => {
  const forged = withPipeline(threeStage());
  forged.experiments.results.forEach((r) => { delete r.attestation; }); // attacker lacks the runner key
  const r = buildV3(reseal(forged), { authority: PROMOTED }); // reseal isolates the evidence-lineage gate
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.results.summary.authoritative, 0, 'unattested evidence ⇒ never authoritative');
  assert.equal(r.results.summary.shadow, 1);
  assert.match(r.results.shadowObservations[0].reason, /lineage unverified/);
});

test('V3R3-C1: a fabricated attestation (invented mac) cannot publish', () => {
  const forged = withPipeline(threeStage());
  forged.experiments.results.forEach((r) => { r.attestation = { runner: 'focus-visual-retry', runnerVersion: '3.0.0-phase0', runIdentity: { file: 'p', runId: 'R', observedPageDigest: 'sha256:d' }, resultDigest: 'sha256:' + '0'.repeat(64), mac: 'deadbeef' }; });
  const r = buildV3(reseal(forged), { authority: PROMOTED });
  assert.equal(r.results.summary.authoritative, 0, 'a forged mac does not verify against the trust-anchor key');
});

test('V3R3-C1: tampering a signed result (any covered field) drops it to shadow', () => {
  const signed = withPipeline(threeStage());
  // flip a NON-required typed outcome flag: the clear still RESOLVES authoritative, so the ONLY
  // reason it must not publish is the broken attestation digest — isolating tamper-evidence.
  signed.experiments.results[0].outcome.stableIndicatorAbsence = false;
  const r = buildV3(reseal(signed), { authority: PROMOTED }); // reseal: the per-result MAC (not the manifest) must catch this
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
  assert.match(r.results.shadowObservations[0].reason, /provenance artifacts unverified/);
});

// ============================ independent applicability observer (Rule 15) ============================
test('Rule 15 faithful: the runner appEv must AGREE with the independent observation, else PARTIAL', () => {
  const withObs = (facts) => { const b = withPipeline(threeStage()); b.applicability = { file: 'p', runId: 'R', pageDigest: 'sha256:d', observations: [{ xpath: 'node:b1', facts }] }; return reseal(b); };
  // the focus result's appEv asserts targetIsFocusable:true.
  assert.equal(buildV3(withObs({ targetIsFocusable: true }), { authority: PROMOTED }).results.summary.authoritative, 1, 'agreement ⇒ publishes');
  const disagree = buildV3(withObs({ targetIsFocusable: false }), { authority: PROMOTED });
  assert.equal(disagree.results.summary.authoritative, 0, 'observer says NOT focusable ⇒ runner appEv uncorroborated ⇒ PARTIAL');
  // an ABSENT observation for the target fails closed too (cannot corroborate).
  const noObs = withPipeline(threeStage()); noObs.applicability = { file: 'p', runId: 'R', pageDigest: 'sha256:d', observations: [] };
  assert.equal(buildV3(reseal(noObs), { authority: PROMOTED }).results.summary.authoritative, 0, 'no independent observation for the target ⇒ cannot corroborate ⇒ PARTIAL');
});

// ============================ run-manifest (V3R4-H7 / Rule 17) ============================
test('V3R4-H7: tampering ANY stage after the manifest is sealed REFUSES the build (artifact-hash mismatch)', () => {
  const b = withPipeline(threeStage());            // manifest seals the artifact hashes
  b.experiments.results[0].outcome.obviouslyVisible = false; // tamper a stage WITHOUT resealing
  const r = buildV3(b, { authority: PROMOTED });
  assert.equal(r.ok, false, 'a content/hash mismatch ⇒ corrupt bundle ⇒ refuse');
  assert.ok(r.errors.some((m) => /manifest artifact hash mismatch/.test(m)), JSON.stringify(r.errors));
});

test('V3R4-H7: an UNSIGNED manifest (attacker lacks the key) cannot publish authoritative', () => {
  const b = withPipeline(threeStage());
  b.manifest = mani.buildManifest(b, { observedPageDigest: b.collect.pageDigest }); // no key ⇒ unsigned
  const r = buildV3(b, { authority: PROMOTED });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.results.summary.authoritative, 0, 'unsigned manifest ⇒ shadow');
  assert.match(r.results.shadowObservations[0].reason, /run-manifest absent or unverified/);
});

test('V3R4-H7: a manifest signed with a DIFFERENT key cannot publish authoritative', () => {
  const b = withPipeline(threeStage());
  b.manifest = mani.buildManifest(b, { key: 'attacker-key', observedPageDigest: b.collect.pageDigest });
  const r = buildV3(b, { authority: PROMOTED });
  assert.equal(r.results.summary.authoritative, 0, 'manifest MAC by a non-trust-anchor key ⇒ shadow');
});

test('V3R4-H7: an ABSENT manifest cannot publish authoritative (and production requires one)', () => {
  const b = withPipeline(threeStage()); delete b.manifest;
  assert.equal(buildV3(b, { authority: PROMOTED }).results.summary.authoritative, 0, 'no manifest ⇒ shadow');
  const prod = buildV3(b, { authority: PROMOTED, requireManifest: true });
  assert.equal(prod.ok, false, 'production refuses a bundle with no run-manifest');
  assert.ok(prod.errors.some((m) => /run-manifest is required/.test(m)));
});

test('V3R4-H7: a legitimately attested manifest + signed evidence publishes (mechanism works)', () => {
  const r = buildV3(withPipeline(threeStage()), { authority: PROMOTED, requireManifest: true });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.results.summary.authoritative, 1);
});

test('V3R4-H7 (red-team): a manifest attesting a STALE catalog/runner build cannot publish (plan G1d)', () => {
  const b = withPipeline(threeStage());
  b.manifest = mani.buildManifest(b, { key: TEST_KEY, observedPageDigest: b.collect.pageDigest, catalogVersion: 'stale-0.0', runnerVersion: '3.0.0-phase0' });
  assert.equal(buildV3(b, { authority: PROMOTED }).results.summary.authoritative, 0, 'manifest catalogVersion != live build ⇒ shadow');
  const b2 = withPipeline(threeStage());
  b2.manifest = mani.buildManifest(b2, { key: TEST_KEY, observedPageDigest: b2.collect.pageDigest, catalogVersion: '3.0.0-phase0', runnerVersion: 'rogue-9.9' });
  assert.equal(buildV3(b2, { authority: PROMOTED }).results.summary.authoritative, 0, 'manifest runnerVersion != approved build ⇒ shadow');
});

test('V3R4-H4: a promoted bundle with NO artifact verifier configured stays shadow (fail-closed)', () => {
  // promoted WITHOUT a verifier: even valid signed evidence cannot publish — provenance is unverifiable.
  const noVerifier = promoted(['focus-visual-retry/NO_BARRIER_OBSERVED'], { artifactVerifier: null });
  const r = buildV3(withPipeline(threeStage()), { authority: noVerifier });
  assert.equal(r.results.summary.authoritative, 0, 'no verifier ⇒ provenance unverifiable ⇒ shadow');
  assert.match(r.results.shadowObservations[0].reason, /provenance artifacts unverified/);
});

test('V3R4-M1: an attestation missing runner/runnerVersion is rejected by the schema', () => {
  const b = withPipeline(threeStage());
  delete b.experiments.results[0].attestation.runnerVersion;
  const r = buildV3(b, { authority: PROMOTED });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((m) => /attestation\.runnerVersion/.test(m)), JSON.stringify(r.errors));
});

test('V3R4-M1: a signed result whose runner/version mismatches the cited catalog runner stays shadow', () => {
  const b = withPipeline(threeStage());
  // re-sign with a mismatched runnerVersion (still a valid MAC, but not the approved build).
  b.experiments.results[0] = attest.signResult(
    { ...b.experiments.results[0], attestation: undefined },
    TEST_KEY,
    { runner: 'focus-visual-retry', runnerVersion: 'rogue-9.9', runIdentity: { file: 'p', runId: 'R', observedPageDigest: 'sha256:d' } },
  );
  const r = buildV3(reseal(b), { authority: PROMOTED });
  assert.equal(r.results.summary.authoritative, 0, 'runnerVersion != approved catalog build ⇒ shadow');
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
  const r = buildV3(reseal(foreign), { authority: PROMOTED }); // a valid manifest for the foreign run isolates the boundToRun gate
  assert.equal(r.results.summary.authoritative, 0, 'a result signed for another run cannot publish here');
  assert.match(r.results.shadowObservations[0].reason, /lineage unverified/);
});

test('V3R3-C1 (red-team): boundToRun fails closed on a missing/partial run identity', () => {
  const collect = { file: 'p', runId: 'R', pageDigest: 'sha256:d' };
  const full = { file: 'p', runId: 'R', observedPageDigest: 'sha256:d' };
  const sign = (ri) => attest.signResult({ experimentId: 'e', claimId: 'c', targetXpath: 't', sc: 's', observationScope: SCOPE, outcome: {}, applicabilityEvidence: {}, valid: true, completed: true }, 'k', { runIdentity: ri });
  assert.equal(attest.boundToRun(sign(full), collect), true, 'full match (observed === collect.pageDigest) binds');
  assert.equal(attest.boundToRun(sign({ file: 'p' }), collect), false, 'partial identity (missing runId/observedPageDigest) ⇒ false');
  assert.equal(attest.boundToRun(sign({ file: 'p', runId: 'R', observedPageDigest: 'sha256:WRONG' }), collect), false, 'observed digest != collect.pageDigest ⇒ false (loaded a different page)');
  assert.equal(attest.boundToRun(sign(null), collect), false, 'absent run identity ⇒ false');
  assert.equal(attest.boundToRun(sign(full), {}), false, 'empty collect identity ⇒ false (no undefined===undefined)');
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
