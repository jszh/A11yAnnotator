// Harness 3.0 — Phase 0 foundation tests. These PROVE the architectural discipline of the
// walking-skeleton slice (SC 2.4.7), so the same shape can be replicated across SCs.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const V = require('../lib/v3-schema.js');
const reg = require('../lib/registry.js');
const cat = require('../lib/catalog.js');
const xa = require('../lib/cross-artifact.js');
const { resolveClaim } = require('../lib/claims.js');
const { buildV3 } = require('../lib/build-v3.js');

// ---- fixtures: a fully-supported 2.4.7 clear. Obligations ARE typed-outcome flags (unified). ----
const SCOPE = { actionTargetRef: 'node:b1', state: 'fresh-load', action: 'tab-to', environment: 'headless-chromium' };
const FULL_OUTCOME = {
  targetIsFocusable: true, keyboardReachableInState: true, realKeyboardFocus: true, hydrationReady: true,
  focusDependentIndicator: true, obviouslyVisible: true, stableIndicatorAbsence: true, modeCompletenessProven: true,
};
const FULL_APP = { targetIsFocusable: true, keyboardReachableInState: true };
const CLEAR_OBLIGATIONS = reg.REGISTRY['2.4.7/NO_BARRIER_OBSERVED'].completeness.requiredObligations;

const proposal = (direction, over = {}) => ({ claimId: 'c1', sc: '2.4.7', direction, experimentId: 'focus-visual-retry', claimFamily: 'focus-indicator-visible', observationScope: SCOPE, ...over });
const evidence = (over = {}) => ({ experimentOutcome: { ...FULL_OUTCOME }, applicabilityEvidence: { ...FULL_APP }, ...over });

// A test-only authority override that PROMOTES focus-visual-retry to authoritative (all readiness
// met) — used to exercise the publish path; the default registry keeps everything shadow.
const PROMOTED = {
  'focus-visual-retry/NO_BARRIER_OBSERVED': { state: 'authoritative', reason: 'test-promoted', readiness: { goldSized: true, sealedEval: true, independentRaters: true, measurementValidated: true } },
  'focus-visual-retry/BARRIER_OBSERVED': { state: 'authoritative', reason: 'test-promoted', readiness: { goldSized: true, sealedEval: true, independentRaters: true, measurementValidated: true } },
};

// ---- registry / catalog / consistency are well-formed ----
test('registry, catalog, consistency, and full SC coverage validate clean', () => {
  assert.deepEqual(reg.validateRegistry(), []);
  assert.deepEqual(cat.validateCatalog(), []);
  assert.deepEqual(reg.validateConsistency(reg.REGISTRY, cat.CATALOG), []);
  assert.deepEqual(reg.validateCoverage(), []); // every SC × clearing direction is explicitly classified
});

test('default-closed coverage: every clearing direction is classified, and only proven SCs can clear', () => {
  for (const sc of V.ALL_SCS) for (const dir of V.CLEARING_DIRECTIONS) {
    const cl = reg.clearabilityFor(sc, dir);
    const entry = reg.REGISTRY[`${sc}/${dir}`];
    assert.ok(entry, `${sc}/${dir} must be explicitly classified`);
    if (entry.clearability === 'open-scope-never-clearable') assert.equal(cl.allowed, false);
  }
  // 2.4.7 is the only clearable SC in Phase 0; e.g. 1.4.3 clears are still default-closed.
  assert.equal(reg.clearabilityFor('2.4.7', 'NO_BARRIER_OBSERVED').allowed, true);
  assert.equal(reg.clearabilityFor('1.4.3', 'NO_BARRIER_OBSERVED').allowed, false);
});

test('a clearing entry (closed OR exception) without a completeness predicate is rejected', () => {
  const noComplete = { '2.4.7/NO_BARRIER_OBSERVED': { clearability: 'closed-scope-clearable', accessibilitySupportDependent: false, rationale: 'missing completeness' } };
  assert.ok(reg.validateRegistry(noComplete).some((m) => /must declare completeness/.test(m)));
  const exc = { '2.4.7/INAPPLICABLE': { clearability: 'exception-clearable', accessibilitySupportDependent: false, rationale: 'exception with no completeness' } };
  assert.ok(reg.validateRegistry(exc).some((m) => /must declare completeness/.test(m)));
});

test('consistency catches registry/catalog drift (a completeness obligation no experiment measures)', () => {
  const driftReg = { '2.4.7/NO_BARRIER_OBSERVED': { clearability: 'closed-scope-clearable', accessibilitySupportDependent: false, completeness: { resolver: 'focus-visible-completeness-v1', requiredObligations: ['ghostObligation'], derivation: 'd' }, rationale: 'drifted' } };
  assert.ok(reg.validateConsistency(driftReg, cat.CATALOG).some((m) => /drift/.test(m)));
});

// ---- happy path ----
test('2.4.7 NO_BARRIER_OBSERVED clears when every gate is positively satisfied', () => {
  const out = resolveClaim(proposal('NO_BARRIER_OBSERVED'), evidence());
  assert.equal(out.authoritative, true, out.reason);
  assert.equal(out.observationOutcome, 'NO_BARRIER_OBSERVED');
  assert.equal(out.wcagApplicability, 'APPLICABLE');
  assert.equal(out.conformanceOutcome, 'NOT_ASSESSED');
  assert.ok(out.observationScope && out.scopeCompletenessRef);
});

test('2.4.7 BARRIER_OBSERVED reproduces from a stable absence on a hydrated page', () => {
  const out = resolveClaim(proposal('BARRIER_OBSERVED'), evidence());
  assert.equal(out.authoritative, true, out.reason);
  assert.equal(out.observationOutcome, 'BARRIER_OBSERVED');
});

// ---- DEFAULT-CLOSED + FAIL-CLOSED ----
test('cross-SC binding: a focus experiment cannot resolve a different SC (audit V3-C1)', () => {
  const out = resolveClaim(proposal('NO_BARRIER_OBSERVED', { claimId: 'x', sc: '1.1.1' }), evidence());
  assert.equal(out.authoritative, false);
  assert.match(out.reason, /cross-SC binding refused/);
});

test('registry default-closed path: an SC with a matching experiment but never-clearable still refuses', () => {
  // inject an experiment that legitimately MEASURES 2.4.11 so binding passes and the registry's
  // open-scope-never-clearable class is the thing that refuses the clear.
  const cat2411 = { catalogVersion: 't', experiments: { 'x-2411': { sc: '2.4.11', claimFamily: undefined, applicability: { requires: ['ok'] }, supports: { NO_BARRIER_OBSERVED: { requires: ['flag'] } }, typedOutcomes: ['ok', 'flag'] } } };
  const out = resolveClaim({ claimId: 'z', sc: '2.4.11', direction: 'NO_BARRIER_OBSERVED', experimentId: 'x-2411', observationScope: SCOPE },
    { experimentOutcome: { flag: true }, applicabilityEvidence: { ok: true } }, { catalog: cat2411 });
  assert.equal(out.authoritative, false);
  assert.match(out.reason, /open-scope-never-clearable/);
});

test('fail-closed: an injected registry entry with an unknown clearability value cannot clear', () => {
  const badReg = { '2.4.7/NO_BARRIER_OBSERVED': { clearability: 'totally-clearable-trust-me', accessibilitySupportDependent: false, completeness: reg.REGISTRY['2.4.7/NO_BARRIER_OBSERVED'].completeness, rationale: 'malformed' } };
  const out = resolveClaim(proposal('NO_BARRIER_OBSERVED'), evidence(), { registry: badReg });
  assert.equal(out.authoritative, false);
  assert.match(out.reason, /invalid clearability|fail-closed/);
});

test('fail-closed: an injected catalog experiment with no declared applicability cannot establish it', () => {
  const badCat = { catalogVersion: 't', experiments: { 'focus-visual-retry': { sc: '2.4.7', applicability: {}, supports: { NO_BARRIER_OBSERVED: { requires: ['focusDependentIndicator'] } }, typedOutcomes: ['focusDependentIndicator'] } } };
  const out = resolveClaim(proposal('NO_BARRIER_OBSERVED'), evidence(), { catalog: badCat });
  assert.equal(out.authoritative, false);
  assert.match(out.reason, /applicability/);
});

// ---- DROP-ANY-OBLIGATION rejects the clear (completeness as a whole; obligation ⊆ support) ----
test('dropping ANY required obligation rejects the 2.4.7 clear', () => {
  for (const drop of CLEAR_OBLIGATIONS) {
    const out = resolveClaim(proposal('NO_BARRIER_OBSERVED'), evidence({ experimentOutcome: { ...FULL_OUTCOME, [drop]: false } }));
    assert.equal(out.authoritative, false, `dropping ${drop} must reject the clear`);
    assert.match(out.reason, /directional support not satisfied|completeness not proven|keyboard reachability/);
  }
});

// ---- DIRECTIONAL / hydration / reachability ----
test('a 2.4.7 clear without a focus-dependent indicator is refused', () => {
  const out = resolveClaim(proposal('NO_BARRIER_OBSERVED'), evidence({ experimentOutcome: { ...FULL_OUTCOME, focusDependentIndicator: false } }));
  assert.equal(out.authoritative, false);
  assert.match(out.reason, /directional support not satisfied/);
});

test('under-hydration cannot manufacture a 2.4.7 barrier', () => {
  const out = resolveClaim(proposal('BARRIER_OBSERVED'), evidence({ experimentOutcome: { ...FULL_OUTCOME, hydrationReady: false } }));
  assert.equal(out.authoritative, false);
  assert.match(out.reason, /directional support not satisfied/);
});

test('keyboard reachability is an independent precondition for a 2.4.7 clear (Rule 14)', () => {
  const out = resolveClaim(proposal('NO_BARRIER_OBSERVED'), evidence({ experimentOutcome: { ...FULL_OUTCOME, keyboardReachableInState: false } }));
  assert.equal(out.authoritative, false);
  assert.match(out.reason, /keyboard reachability/);
});

test('applicability independence: missing applicability evidence refuses the clear', () => {
  const out = resolveClaim(proposal('NO_BARRIER_OBSERVED'), evidence({ applicabilityEvidence: {} }));
  assert.equal(out.authoritative, false);
  assert.match(out.reason, /applicability not independently established/);
});

// ---- scope must travel, with REAL values (no falsy bypass) ----
test('an authoritative claim missing or empty observationScope fields is refused', () => {
  assert.match(resolveClaim(proposal('NO_BARRIER_OBSERVED', { observationScope: { actionTargetRef: 'node:b1' } }), evidence()).reason, /observationScope/);
  assert.match(resolveClaim(proposal('NO_BARRIER_OBSERVED', { observationScope: { ...SCOPE, state: '' } }), evidence()).reason, /observationScope/);
  assert.match(resolveClaim(proposal('NO_BARRIER_OBSERVED', { observationScope: { ...SCOPE, actionTargetRef: 0 } }), evidence()).reason, /observationScope/);
});

// ---- Rule 12 ----
test('an AT-dependent clear requires a declared AT baseline (Rule 12)', () => {
  const atCatalog = { catalogVersion: 't', experiments: { 'at-exp': { sc: '4.1.3', accessibilitySupportDependent: { NO_BARRIER_OBSERVED: true }, applicability: { requires: ['ok'] }, supports: { NO_BARRIER_OBSERVED: { requires: ['flag'] } }, typedOutcomes: ['ok', 'flag', 'ob'] } } };
  const atRegistry = { '4.1.3/NO_BARRIER_OBSERVED': { clearability: 'closed-scope-clearable', accessibilitySupportDependent: true, completeness: { resolver: 'focus-visible-completeness-v1', requiredObligations: ['ob'], derivation: 'd' }, rationale: 'at-dependent test entry' } };
  const prop = { claimId: 'a1', sc: '4.1.3', direction: 'NO_BARRIER_OBSERVED', experimentId: 'at-exp', observationScope: SCOPE };
  const ev = { experimentOutcome: { flag: true, ob: true }, applicabilityEvidence: { ok: true } };
  const deps = { registry: atRegistry, catalog: atCatalog };
  assert.equal(resolveClaim(prop, ev, deps).authoritative, false);
  assert.match(resolveClaim(prop, ev, deps).reason, /AT baseline/);
  assert.equal(resolveClaim(prop, { ...ev, atBaseline: { at: 'NVDA', os: 'win', browser: 'chrome' } }, deps).authoritative, true);
});

// ---- cross-artifact gate ----
// collect carries RAW FACTS (focusable) so the oracle independently enumerates the obligation;
// the experiment result carries the bound sc + scope; the proposal carries its claim-family.
const goodBundle = () => ({
  collect: { file: 'p', runId: 'R', pageDigest: 'sha256:d', collectedAt: 1000, elements: [{ xpath: 'node:b1', focusable: true }] },
  experiments: { file: 'p', runId: 'R', pageDigest: 'sha256:d', catalogVersion: '3.0.0-phase0', startedAt: 2000, results: [{ claimId: 'c1', experimentId: 'focus-visual-retry', targetXpath: 'node:b1', sc: '2.4.7', observationScope: SCOPE, outcome: { ...FULL_OUTCOME }, applicabilityEvidence: { ...FULL_APP } }] },
  claimProposals: { file: 'p', runId: 'R', pageDigest: 'sha256:d', proposals: [proposal('NO_BARRIER_OBSERVED')] },
});

test('cross-artifact: a clean bundle passes the gate', () => {
  assert.deepEqual(xa.crossArtifactErrors(goodBundle()), []);
});

test('legacy detection: a whole-value legacy label (value or key) is rejected; prose is NOT', () => {
  const b1 = goodBundle(); b1.collect.legacyVerdict = 'NOT REPRODUCED';
  assert.ok(xa.crossArtifactErrors(b1).some((m) => /legacy verdict label/.test(m)));
  const b2 = goodBundle(); b2.collect['N/A'] = { x: 1 };
  assert.ok(xa.crossArtifactErrors(b2).some((m) => /legacy verdict label/.test(m)));
  const b3 = goodBundle(); b3.collect.note = 'the barrier reproduced across both tabs';
  assert.equal(xa.crossArtifactErrors(b3).filter((m) => /legacy verdict label/.test(m)).length, 0, 'prose must not false-positive');
});

test('cross-artifact: identity mismatch (incl. a missing id field), missing stage, stale, out-of-inventory', () => {
  const m1 = goodBundle(); m1.experiments.runId = 'R2';
  assert.ok(xa.crossArtifactErrors(m1).some((m) => /runId mismatch/.test(m)));
  const m1b = goodBundle(); delete m1b.experiments.pageDigest;
  assert.ok(xa.crossArtifactErrors(m1b).some((m) => /pageDigest mismatch/.test(m)));
  const m2 = goodBundle(); delete m2.experiments;
  assert.ok(xa.crossArtifactErrors(m2).some((m) => /missing required stage/.test(m)));
  const m3 = goodBundle(); m3.experiments.results[0].targetXpath = 'node:ghost';
  assert.ok(xa.crossArtifactErrors(m3).some((m) => /NOT in the collector inventory/.test(m)));
  const m4 = goodBundle(); m4.experiments.startedAt = 500;
  assert.ok(xa.crossArtifactErrors(m4).some((m) => /stale experiments/.test(m)));
});

// ---- end-to-end builder ----
test('buildV3 default authority: a fully-supported clear is SHADOW, never authoritative (audit V3-C2)', () => {
  const r = buildV3(goodBundle());
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.results.summary.authoritative, 0, 'shadow mechanism does not publish');
  assert.equal(r.results.summary.shadow, 1, 'the gate-passing clear is recorded as a shadow observation');
  assert.equal(r.results.summary.cleared, 0);
  assert.equal(r.results.shadowObservations[0].wouldBe.observationOutcome, 'NO_BARRIER_OBSERVED');
  assert.equal(r.results.conformanceOutcome, 'NOT_ASSESSED');
  assert.equal(xa.findLegacyLabel(r.results), null);
});

test('buildV3 PROMOTED authority: the same bundle publishes one authoritative clear', () => {
  const r = buildV3(goodBundle(), { authority: PROMOTED });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.results.summary.authoritative, 1);
  assert.equal(r.results.summary.cleared, 1);
  assert.equal(r.results.claims[0].claimFamily, 'focus-indicator-visible');
});

test('buildV3: an unsupported proposal becomes PARTIAL, not a clear or a shadow', () => {
  const b = goodBundle();
  b.experiments.results[0].outcome.focusDependentIndicator = false;
  const r = buildV3(b, { authority: PROMOTED });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.results.summary.authoritative, 0);
  assert.equal(r.results.summary.shadow, 0, 'unsupported ⇒ not even a shadow would-be clear');
  // 2.4.7 unsupported PARTIAL + 2.1.1 auto-PARTIAL = 2
  assert.equal(r.results.summary.partial, 2);
});

test('buildV3: evidence from a DIFFERENT experiment than the proposal cites does not support the claim', () => {
  const b = goodBundle();
  b.experiments.results[0].experimentId = 'some-other-experiment';
  const r = buildV3(b, { authority: PROMOTED });
  assert.equal(r.results.summary.authoritative, 0, 'mismatched experimentId ⇒ unbound evidence ⇒ PARTIAL');
});

test('buildV3: duplicate claimIds fail the build', () => {
  const b = goodBundle();
  b.claimProposals.proposals.push(proposal('NO_BARRIER_OBSERVED'));
  const r = buildV3(b);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((m) => /duplicate claimId/.test(m)));
});
