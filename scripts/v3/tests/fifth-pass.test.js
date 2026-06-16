// Harness 3.0 — FIFTH-PASS audit regressions (V3-FIFTH-PASS-INDEPENDENT-AUDIT.md).
// Each test pins one finding's fix so it cannot silently regress:
//   C1  applicability.json round-trips through the loader (replay verifies the manifest)
//   C2  an authoritative claim REQUIRES an independent applicability stage (cannot self-attest)
//   H1  the oracle/coverage enumerate from the REAL collector shape (text/roleAttr), not only hasText/role
//   H3  a 3.3.1 form-error BARRIER is AT-independent (no AT baseline required)
//   M1  the manifest's observed page identity is DERIVED from per-result observations, fail-closed
//   M3  judgments.json is a known (optional) loader stage; judgments is NOT manifest-hashed
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { buildV3 } = require('../lib/build-v3.js');
const { loadBundle, STAGE_FILES, PRODUCTION_REQUIRED } = require('../lib/bundle-loader.js');
const { withPipeline, reseal, promoted, TEST_KEY } = require('./helpers.js');
const mani = require('../lib/manifest.js');
const oracle = require('../lib/applicability-oracle.js');
const coverage = require('../lib/coverage-registry.js');
const { resolveClaim } = require('../lib/claims.js');

const SCOPE = { actionTargetRef: 'node:b1', state: 'fresh-load', action: 'tab-to', environment: 'headless-chromium' };
const FULL_OUTCOME = {
  targetIsFocusable: true, keyboardReachableInState: true, realKeyboardFocus: true, hydrationReady: true,
  focusDependentIndicator: true, obviouslyVisible: true, stableIndicatorAbsence: true, modeCompletenessProven: true,
};
const FULL_APP = { targetIsFocusable: true, keyboardReachableInState: true };
const threeStage = () => ({
  collect: { file: 'p', runId: 'R', pageDigest: 'sha256:d', collectedAt: 1000, elements: [{ xpath: 'node:b1', focusable: true }] },
  experiments: { file: 'p', runId: 'R', pageDigest: 'sha256:d', catalogVersion: '3.0.0-phase0', startedAt: 2000, results: [{ claimId: 'c1', experimentId: 'focus-visual-retry', targetXpath: 'node:b1', sc: '2.4.7', observationScope: SCOPE, outcome: { ...FULL_OUTCOME }, applicabilityEvidence: { ...FULL_APP }, valid: true, completed: true }] },
  claimProposals: { file: 'p', runId: 'R', pageDigest: 'sha256:d', proposals: [{ claimId: 'c1', experimentId: 'focus-visual-retry', sc: '2.4.7', direction: 'NO_BARRIER_OBSERVED', claimFamily: 'focus-indicator-visible', observationScope: SCOPE, supportRefs: [] }] },
});
const PROMOTED = promoted(['focus-visual-retry/NO_BARRIER_OBSERVED']);

// ─────────────────────────── C1 ───────────────────────────
test('V3R5-C1: applicability.json round-trips through the loader (replay verifies the manifest)', () => {
  assert.ok(STAGE_FILES.applicability === 'applicability.json', 'applicability must be a declared loader stage');
  assert.ok(PRODUCTION_REQUIRED.includes('applicability'), 'production must require the applicability stage');
  const b = withPipeline(threeStage()); // ships a hashed applicability stage
  assert.ok(b.applicability, 'the orchestrated/pipeline bundle carries an applicability stage');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'v3r5c1-'));
  try {
    const w = (stage, obj) => fs.writeFileSync(path.join(dir, STAGE_FILES[stage]), JSON.stringify(obj, null, 2));
    for (const s of ['manifest', 'collect', 'drive', 'candidates', 'plan', 'experiments', 'claimProposals', 'applicability']) w(s, b[s]);
    const { bundle, errors } = loadBundle(dir, { required: PRODUCTION_REQUIRED });
    assert.deepEqual(errors, [], 'a complete production bundle loads with no missing-stage errors');
    assert.ok(bundle.applicability, 'applicability is loaded back from disk');
    const v = mani.verifyManifest(bundle, TEST_KEY);
    assert.equal(v.integrityBroken, false, 'manifest no longer hashes an absent stage on replay: ' + JSON.stringify(v.errors));
    assert.equal(v.valid, true, JSON.stringify(v.errors));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

// ─────────────────────────── C2 ───────────────────────────
test('V3R5-C2: an authoritative claim REQUIRES an independent applicability stage', () => {
  // baseline: with the (corroborating) applicability stage present, it publishes authoritative.
  assert.equal(buildV3(withPipeline(threeStage()), { authority: PROMOTED }).results.summary.authoritative, 1, 'applicability present + agrees ⇒ authoritative');
  // a complete, signed, promoted, RESEALED bundle with NO applicability stage cannot publish authoritative.
  const b = withPipeline(threeStage());
  delete b.applicability;                       // remove the stage entirely
  const r = buildV3(reseal(b), { authority: PROMOTED }); // reseal so the manifest itself is valid (isolates the C2 gate)
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.results.summary.authoritative, 0, 'no applicability stage ⇒ cannot publish authoritative');
  assert.equal(r.results.summary.shadow, 1, 'it is recorded as a shadow observation, not dropped');
  assert.match(r.results.shadowObservations[0].reason, /applicability/i, JSON.stringify(r.results.shadowObservations[0]));
});

// ─────────────────────────── H1 ───────────────────────────
test('V3R5-H1: the oracle + coverage enumerate from the REAL collector shape (text/roleAttr)', () => {
  // real collector element: `text` (string) + `roleAttr` — NOT the synthetic `hasText`/`role`.
  const realEl = { xpath: '/html/body/button[1]', focusable: true, text: 'Submit order', roleAttr: 'button' };
  const fams = oracle.familiesFor(realEl);
  assert.ok(fams.includes('text-contrast'), 'text from `text` field ⇒ text-contrast (was missed): ' + fams.join(','));
  assert.ok(fams.includes('name-role-value'), 'widget role from `roleAttr` ⇒ name-role-value (was missed): ' + fams.join(','));
  assert.ok(fams.includes('focus-indicator-visible') && fams.includes('keyboard-operable'), 'focusable families still present');
  // the independently-authored coverage registry must agree (else it would hide the under-enumeration).
  const expected = coverage.expectedFamilies(realEl);
  assert.ok(expected.has('text-contrast') && expected.has('name-role-value'), 'coverage registry reads the same collector shape');
  // a form field by the real `isFormField`/`roleAttr` still enumerates label + error-identification.
  const field = { xpath: '/html/body/input[1]', focusable: true, isFormField: true, roleAttr: 'textbox', text: '' };
  const ffams = oracle.familiesFor(field);
  assert.ok(ffams.includes('field-label') && ffams.includes('error-identification'), ffams.join(','));
  // a non-empty page of real-shaped elements must NOT fail closed to zero obligations.
  const collect = { file: 'p', runId: 'R', pageDigest: 'sha256:d', elements: [realEl, field], page: {} };
  assert.deepEqual(oracle.enumerationErrors(collect), [], 'real-shaped elements enumerate obligations (no fail-closed zero)');
  assert.ok(oracle.deriveObligations(collect).length >= 5, 'multiple obligations enumerated from the real shape');
});

// ─────────────────────────── H3 ───────────────────────────
test('V3R5-H3: a 3.3.1 form-error BARRIER is AT-independent (no AT baseline required)', () => {
  const proposal = { claimId: 'c', sc: '3.3.1', direction: 'BARRIER_OBSERVED', experimentId: 'form-error-probe', claimFamily: 'error-identification', observationScope: { actionTargetRef: '/x', state: 's', action: 'submit-invalid', environment: 'env' } };
  const ev = { experimentOutcome: { isUserInputField: true, fieldRendered: true, fieldConstrained: true, hydrationReady: true, errorNotIdentified: true }, applicabilityEvidence: { isUserInputField: true, fieldRendered: true, fieldConstrained: true } };
  const r = resolveClaim(proposal, ev); // NO atBaseline supplied
  assert.equal(r.authoritative, true, 'a no-error-surface barrier resolves to a definite BARRIER without an AT baseline: ' + (r.partialReason || r.reason || ''));
  assert.equal(r.observationOutcome, 'BARRIER_OBSERVED');
});

// ─────────────────────────── M1 ───────────────────────────
test('V3R5-M1: the manifest observed identity is DERIVED from per-result observations (fail-closed)', () => {
  const at = (digest) => ({ runIdentity: { file: 'p', runId: 'R', observedPageDigest: digest } });
  // agreement across signed results ⇒ that digest.
  assert.equal(mani.deriveObservedPageDigest({ results: [{ attestation: at('sha256:d') }, { attestation: at('sha256:d') }] }), 'sha256:d');
  // disagreement ⇒ null (fail closed).
  assert.equal(mani.deriveObservedPageDigest({ results: [{ attestation: at('sha256:a') }, { attestation: at('sha256:b') }] }), null);
  // an unsigned/unobserved result ⇒ null.
  assert.equal(mani.deriveObservedPageDigest({ results: [{ attestation: at('sha256:a') }, {}] }), null);
  assert.equal(mani.deriveObservedPageDigest({ results: [] }), null);
  // buildManifest is undefined-distinguishing: a PASSED null is honored (no silent fallback to collect).
  const b = withPipeline(threeStage());
  const m = mani.buildManifest(b, { key: TEST_KEY, observedPageDigest: null, catalogVersion: '3.0.0-phase0', runnerVersion: '3.0.0-phase0' });
  assert.equal(m.observedPageDigest, null, 'explicit null is not silently replaced by collect.pageDigest');
  assert.ok(mani.validateManifestShape(m).length > 0, 'a null observed identity fails the manifest schema ⇒ build refuses (fail closed)');
  // OMITTED ⇒ back-compat fallback to collect.pageDigest.
  const m2 = mani.buildManifest(b, { key: TEST_KEY, catalogVersion: '3.0.0-phase0', runnerVersion: '3.0.0-phase0' });
  assert.equal(m2.observedPageDigest, b.collect.pageDigest, 'omitting observedPageDigest falls back to the collector digest (back-compat)');
});

// ─────────── R5R-C1 (response-audit): applicability identity is cross-artifact bound ───────────
test('R5R-C1: a wrong-run applicability artifact is REFUSED even if its facts agree', () => {
  // baseline: a correct applicability stage publishes authoritative.
  assert.equal(buildV3(withPipeline(threeStage()), { authority: PROMOTED }).results.summary.authoritative, 1);
  // mutate ONLY the applicability stage identity to a different page/run, then reseal the manifest so
  // this is not a simple tamper test — the stage's facts still agree with the runner.
  const b = withPipeline(threeStage());
  b.applicability.file = 'WRONG-PAGE'; b.applicability.runId = 'WRONG-RUN'; b.applicability.pageDigest = 'sha256:WRONG';
  const r = buildV3(reseal(b), { authority: PROMOTED, requireManifest: true });
  assert.equal(r.ok, false, 'a wrong-run applicability artifact must not satisfy the publication boundary');
  assert.ok(r.errors.some((m) => /applicability\.(file|runId|pageDigest)|mismatch.*applicability/i.test(m)), JSON.stringify(r.errors));
});

// ─────────── R5R-H1 (response-audit): native role channels (sampledRole/axRole) ───────────
test('R5R-H1: native controls (roleAttr:null) enumerate name-role-value via sampledRole/axRole', () => {
  const link = { xpath: '/a', focusable: true, text: 'Help', roleAttr: null, sampledRole: 'link', axRole: 'link' };
  const btn = { xpath: '/button', focusable: true, text: 'Submit', roleAttr: null, sampledRole: 'button', axRole: 'button' };
  const nativeInput = { xpath: '/input', focusable: true, isFormField: true, roleAttr: null, sampledRole: 'textbox', axRole: 'textbox' };
  assert.ok(oracle.familiesFor(link).includes('name-role-value'), 'native <a> via sampledRole/axRole');
  assert.ok(oracle.familiesFor(btn).includes('name-role-value'), 'native <button> via sampledRole/axRole');
  assert.ok(oracle.familiesFor(nativeInput).includes('field-label'), 'native <input> still enumerates field-label');
  // a non-widget AX role must NOT manufacture a widget obligation (no over-enumeration).
  const iframe = { xpath: '/iframe', focusable: true, roleAttr: null, sampledRole: null, axRole: 'Iframe' };
  assert.ok(!oracle.familiesFor(iframe).includes('name-role-value'), 'Iframe axRole is not a widget');
  // the coverage registry reads the same channels (else it would hide the under-enumeration).
  assert.ok(coverage.expectedFamilies(btn).has('name-role-value'), 'coverage registry agrees on native widget role');
});

// ─────────── R5R-L1 (response-audit): an all-unrun signed run produces a clean manifest ───────────
test('R5R-L1: an empty (all-unrun) run records the collector identity, not a fail-closed null', () => {
  // the orchestrator passes collect.pageDigest when there are NO results (nothing to publish, nothing
  // to independently observe); a signed manifest over that empty run is schema-valid (not refused).
  assert.equal(mani.deriveObservedPageDigest({ results: [] }), null, 'derive yields null for an empty run (so the orchestrator must fall back)');
  const empty = { collect: { file: 'p', runId: 'R', pageDigest: 'sha256:d', collectedAt: 1000, elements: [] }, experiments: { file: 'p', runId: 'R', pageDigest: 'sha256:d', startedAt: 2000, results: [], unrun: [] } };
  const m = mani.buildManifest(empty, { key: TEST_KEY, observedPageDigest: empty.collect.pageDigest, catalogVersion: '3.0.0-phase0', runnerVersion: '3.0.0-phase0' });
  assert.deepEqual(mani.validateManifestShape(m), [], 'an empty-run manifest with the collector identity is schema-valid');
  assert.equal(mani.verifyManifest(empty, TEST_KEY).integrityBroken, false, 'and its identity gate is satisfied');
});

// ─────────────────────────── M3 ───────────────────────────
test('V3R5-M3: judgments.json is a known optional loader stage and is NOT manifest-hashed', () => {
  assert.equal(STAGE_FILES.judgments, 'judgments.json', 'judgments is a declared loader stage');
  assert.ok(!PRODUCTION_REQUIRED.includes('judgments'), 'judgments is NOT production-required (non-authoritative)');
  assert.ok(!mani.HASHED_STAGES.includes('judgments'), 'judgments is NOT hashed by the manifest (produced post-manifest)');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'v3r5m3-'));
  try {
    const b = withPipeline(threeStage());
    const w = (stage, obj) => fs.writeFileSync(path.join(dir, STAGE_FILES[stage]), JSON.stringify(obj, null, 2));
    for (const s of ['collect', 'experiments', 'claimProposals']) w(s, b[s]);
    // absent judgments ⇒ undefined, not an error.
    assert.equal(loadBundle(dir).bundle.judgments, undefined, 'absent judgments.json ⇒ undefined (optional)');
    // present judgments ⇒ loaded.
    w('judgments', { file: 'p', runId: 'R', pageDigest: 'sha256:d', judgments: [] });
    assert.ok(loadBundle(dir).bundle.judgments, 'present judgments.json is auto-loaded as an optional stage');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
