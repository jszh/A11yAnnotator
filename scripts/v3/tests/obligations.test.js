// Harness 3.0 — obligation ledger: INDEPENDENT enumeration (from raw facts, audit V3-C3), atomic
// per-(xpath, sc, claim-family) identity (V3-C5), reconciliation, family-aware aggregation, coverage.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const obl = require('../lib/obligations.js');
const oracle = require('../lib/applicability-oracle.js');
const { buildV3 } = require('../lib/build-v3.js');

const FULL_OUTCOME = { targetIsFocusable: true, keyboardReachableInState: true, realKeyboardFocus: true, hydrationReady: true, focusDependentIndicator: true, obviouslyVisible: true, stableIndicatorAbsence: true, modeCompletenessProven: true };
const FULL_APP = { targetIsFocusable: true, keyboardReachableInState: true };
const SCOPE = (t) => ({ actionTargetRef: t, state: 'fresh-load', action: 'tab-to', environment: 'headless-chromium' });
const { withPipeline, promoted } = require('./helpers.js');
const PROMOTED = promoted(['focus-visual-retry/NO_BARRIER_OBSERVED', 'focus-visual-retry/BARRIER_OBSERVED']);

test('enumeration is INDEPENDENT of proposals and applicableScs — it derives from raw facts', () => {
  // a focusable element with text yields three atomic obligations across distinct families.
  const collect = { elements: [{ xpath: 'a', focusable: true, hasText: true }, { xpath: 'b', focusable: true }] };
  const o = obl.enumerateObligations(collect);
  assert.deepEqual(o.map((x) => x.obligationId).sort(), [
    'a::1.4.3::text-contrast', 'a::2.1.1::keyboard-operable', 'a::2.4.7::focus-indicator-visible',
    'b::2.1.1::keyboard-operable', 'b::2.4.7::focus-indicator-visible',
  ].sort());
});

test('enumeration FAILS CLOSED: a non-empty evaluable page that yields zero obligations is rejected', () => {
  // an evaluable element (has a role) but no generation branch covers it ⇒ would silently vanish.
  // We simulate a "forgotten branch" by an element whose only evaluable surface is an unhandled role.
  const errs = oracle.enumerationErrors({ elements: [{ xpath: 'x', role: 'application' }] });
  assert.ok(errs.some((m) => /ZERO obligations/.test(m)));
});

test('enumeration drift: a precomputed applicableScs that disagrees with the oracle is rejected', () => {
  const errs = oracle.enumerationErrors({ elements: [{ xpath: 'x', focusable: true, applicableScs: ['2.4.7'] }] }); // oracle also derives 2.1.1
  assert.ok(errs.some((m) => /drift/.test(m)));
});

test('reconcile: an un-proposed obligation auto-resolves to PARTIAL (never a silent pass)', () => {
  const obs = obl.enumerateObligations({ elements: [{ xpath: 'a', focusable: true }] });
  const { errors, ledger } = obl.reconcile(obs, []); // no dispositions
  assert.deepEqual(errors, []);
  assert.equal(ledger.length, 2); // 2.4.7 + 2.1.1
  assert.ok(ledger.every((r) => r.disposition === 'PARTIAL' && r.autoPartial && !r.cleared));
});

test('reconcile: a disposition outside the enumerated inventory, or a duplicate, is rejected', () => {
  const obs = obl.enumerateObligations({ elements: [{ xpath: 'a', focusable: true }] });
  assert.ok(obl.reconcile(obs, [{ obligationId: 'ghost::2.4.7::focus-indicator-visible', kind: 'CLAIM', cleared: true }]).errors.some((m) => /out-of-inventory/.test(m)));
  const dup = [{ obligationId: 'a::2.4.7::focus-indicator-visible', kind: 'CLAIM', cleared: true }, { obligationId: 'a::2.4.7::focus-indicator-visible', kind: 'PARTIAL' }];
  assert.ok(obl.reconcile(obs, dup).errors.some((m) => /duplicate/.test(m)));
});

test('aggregation is FAMILY-AWARE: clearing 2.4.7-as-focus-visibility does not clear focus-management', () => {
  // focus-indicator-visible maps ONLY to the focus-visibility skill, not focus-management.
  const ledger = [
    { obligationId: 'a::2.4.7::focus-indicator-visible', xpath: 'a', sc: '2.4.7', claimFamily: 'focus-indicator-visible', disposition: 'CLAIM', cleared: true, autoPartial: false },
    { obligationId: 'a::2.1.1::keyboard-operable', xpath: 'a', sc: '2.1.1', claimFamily: 'keyboard-operable', disposition: 'PARTIAL', cleared: false, autoPartial: true },
  ];
  const sums = obl.aggregateElementSkill(ledger);
  const fv = sums.find((s) => s.skill === 'focus-visibility');
  assert.ok(fv && fv.cleared, 'focus-visibility (the cleared family) is cleared');
  assert.ok(!sums.some((s) => s.skill === 'focus-management'), 'the 2.4.7 clear does NOT create a cleared focus-management summary');
  const ko = sums.find((s) => s.skill === 'keyboard-operability');
  assert.ok(ko && !ko.cleared, 'the keyboard-operability sibling is not cleared');
});

test('coverage: every declared claim-family is realizable (mutation backstop)', () => {
  assert.deepEqual(obl.coverageErrors(), []);
});

// ---- end-to-end through buildV3 (PROMOTED so the publish path is exercised) ----
const bundleWith = (proposals, results, elements) => ({
  collect: { file: 'p', runId: 'R', pageDigest: 'sha256:d', collectedAt: 1000, elements },
  experiments: { file: 'p', runId: 'R', pageDigest: 'sha256:d', catalogVersion: '3.0.0-phase0', startedAt: 2000, results },
  claimProposals: { file: 'p', runId: 'R', pageDigest: 'sha256:d', proposals },
});

test('buildV3: an inventory obligation with no proposal shows as auto-PARTIAL, not absent', () => {
  // focusable+text ⇒ obligations for 2.4.7, 2.1.1, 1.4.3. Only the 2.4.7 clear is proposed.
  const proposals = [{ claimId: 'c1', sc: '2.4.7', direction: 'NO_BARRIER_OBSERVED', experimentId: 'focus-visual-retry', claimFamily: 'focus-indicator-visible', observationScope: SCOPE('node:b1') }];
  const results = [{ claimId: 'c1', experimentId: 'focus-visual-retry', targetXpath: 'node:b1', sc: '2.4.7', observationScope: SCOPE('node:b1'), outcome: { ...FULL_OUTCOME }, applicabilityEvidence: { ...FULL_APP } }];
  const r = buildV3(withPipeline(bundleWith(proposals, results, [{ xpath: 'node:b1', focusable: true, hasText: true }])), { authority: PROMOTED });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.results.summary.obligations, 3);
  assert.equal(r.results.summary.cleared, 1);
  assert.equal(r.results.summary.autoPartial, 2, 'the un-proposed 2.1.1 and 1.4.3 obligations are auto-PARTIAL');
  assert.ok(r.results.obligationLedger.find((x) => x.sc === '1.4.3' && x.autoPartial));
});

test('buildV3: a proposal whose (target,sc,family) is outside the collector inventory fails the build', () => {
  // element is focusable (⇒ 2.4.7/2.1.1) but the proposal claims a 1.4.3 obligation it does not have.
  const proposals = [{ claimId: 'c1', sc: '1.4.3', direction: 'NO_BARRIER_OBSERVED', experimentId: 'focus-visual-retry', claimFamily: 'text-contrast', observationScope: SCOPE('node:b1') }];
  const r = buildV3(bundleWith(proposals, [], [{ xpath: 'node:b1', focusable: true }]), { authority: PROMOTED });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((m) => /out-of-inventory|cross-SC/.test(m)));
});
