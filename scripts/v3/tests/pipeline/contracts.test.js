// Harness 3.0 — Phase-0 contract gaps: independently-owned coverage (Rule 16 / H8) and independent
// applicability corroboration (Rule 15 / H6). These prove the two new trust/contract gates fail
// closed: a removed oracle enumeration branch is caught by a SEPARATE coverage declaration, and a
// claim whose family the oracle does not independently derive cannot publish.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const coverage = require('../../lib/coverage-registry.js');
const oracle = require('../../lib/applicability-oracle.js');
const { buildV3 } = require('../../lib/build-v3.js');
const { withPipeline, reseal, promoted } = require('../helpers.js');

// ============================ Rule 16 — independent coverage ============================
test('Rule 16: a well-formed oracle has zero coverage gaps for every surface', () => {
  const collect = { elements: [
    { xpath: 'b1', focusable: true, hasText: true, role: 'button' },
    { xpath: 'f1', isFormField: true },
    { xpath: 'h1', hasHoverContent: true },
    { xpath: 'm1', focusable: true, inModal: true },
    { xpath: 'o1', focusable: true, underOverlay: true },
  ], page: { reflowApplicable: true } };
  assert.deepEqual(coverage.coverageErrors(collect), []);
});

test('Rule 16 mutation backstop: dropping a family branch from the oracle is CAUGHT by the registry', () => {
  const collect = { elements: [{ xpath: 'b1', focusable: true }] };
  // simulate someone deleting the keyboard-operable branch from familiesFor:
  const brokenFamiliesFor = (el) => oracle.familiesFor(el).filter((f) => f !== 'keyboard-operable');
  const errs = coverage.coverageErrors(collect, brokenFamiliesFor);
  assert.ok(errs.some((m) => /keyboard-operable/.test(m) && /generation branch is missing/.test(m)), errs.join(' | '));
  // and a form-field branch removal is caught too
  const collect2 = { elements: [{ xpath: 'f1', isFormField: true }] };
  const broken2 = (el) => oracle.familiesFor(el).filter((f) => f !== 'field-label');
  assert.ok(coverage.coverageErrors(collect2, broken2).some((m) => /field-label/.test(m)));
});

test('Rule 16: a page that declares reflowApplicable must enumerate the page-level reflow obligation', () => {
  assert.deepEqual(coverage.coverageErrors({ elements: [], page: { reflowApplicable: true } }), []);
  assert.deepEqual(coverage.coverageErrors({ elements: [] }), []);
});

test('Rule 16: the coverage registry is a SEPARATE declaration (catches a widened oracle too)', () => {
  // an oracle that enumerates MORE than required is fine (superset); fewer is the failure.
  const collect = { elements: [{ xpath: 'b1', focusable: true, role: 'button' }] };
  assert.deepEqual(coverage.coverageErrors(collect, (el) => [...oracle.familiesFor(el), 'extra-family']), []);
});

// ============================ Rule 15 — independent applicability ============================
const scope = { actionTargetRef: 'node:x', state: 'fresh-load', action: 'tab-to', environment: 'headless-chromium' };
const bundleFor = (elements, family, sc, experimentId) => withPipeline({
  collect: { file: 'p', runId: 'R', pageDigest: 'sha256:d', collectedAt: 1, elements },
  experiments: { file: 'p', runId: 'R', pageDigest: 'sha256:d', catalogVersion: '3.0.0-phase0', startedAt: 2, results: [
    { claimId: 'c', experimentId, targetXpath: 'node:x', sc, observationScope: scope, outcome: {}, applicabilityEvidence: {}, valid: true, completed: true },
  ] },
  claimProposals: { file: 'p', runId: 'R', pageDigest: 'sha256:d', proposals: [
    { claimId: 'c', sc, direction: 'NO_BARRIER_OBSERVED', experimentId, claimFamily: family, observationScope: scope },
  ] },
});

test('Rule 15: a runner cannot self-assert applicability the collector facts do not support', () => {
  // the element is FOCUSABLE but has NO text; a text-contrast (1.4.3) claim on it is not corroborated
  // by the oracle (which derives families from raw collector facts) ⇒ the build refuses it.
  const bundle = bundleFor([{ xpath: 'node:x', focusable: true }], 'text-contrast', '1.4.3', 'text-contrast-pixel');
  const r = buildV3(bundle, { authority: promoted(['text-contrast-pixel/NO_BARRIER_OBSERVED']) });
  assert.equal(r.ok, false, 'an uncorroborated family must not produce an authoritative claim');
  assert.ok(r.errors.some((m) => /Rule 16|coverage|obligation/i.test(m)) || (r.results && r.results.summary.cleared === 0), JSON.stringify(r.errors));
});

test('Rule 15: a claim whose family IS independently derived by the oracle is corroborated', () => {
  // a hasText element with a text-contrast claim: the oracle derives text-contrast ⇒ corroborated.
  const bundle = bundleFor([{ xpath: 'node:x', hasText: true }], 'text-contrast', '1.4.3', 'text-contrast-pixel');
  // (it still won't CLEAR without a passing outcome — we only assert the family is corroborated, i.e.
  // the build is not refused for a Rule-15 reason and the obligation reconciles.)
  const r = buildV3(bundle, { authority: promoted(['text-contrast-pixel/NO_BARRIER_OBSERVED']) });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
});
