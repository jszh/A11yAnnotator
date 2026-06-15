// Harness 3.0 — derived metrics + gold scoring + statistical-power helpers.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const m = require('../lib/metrics.js');

test('statistical-power helpers match the plan sizing (149 / 299 / 263; n=30 ⇒ 9.5%)', () => {
  assert.equal(m.requiredZeroEventN(0.02), 149);
  assert.equal(m.requiredZeroEventN(0.01), 299);
  assert.equal(m.requiredZeroEventN(0.02, 0.95, 10), 263);
  assert.ok(Math.abs(m.zeroEventUpperBound(30) - 0.095) < 0.001);
  assert.ok(Math.abs(m.ruleOfThree(150) - 0.02) < 1e-9);
});

test('computeMetrics is derived from the ledger (by-SC, auto-PARTIAL, selection source)', () => {
  const results = {
    claims: [{ claimId: 'a', sc: '2.4.7', observationOutcome: 'NO_BARRIER_OBSERVED', observationScope: { actionTargetRef: 'x' } }],
    obligationLedger: [
      { obligationId: 'x::2.4.7', xpath: 'x', sc: '2.4.7', disposition: 'CLAIM', cleared: true, autoPartial: false },
      { obligationId: 'x::1.4.3', xpath: 'x', sc: '1.4.3', disposition: 'PARTIAL', cleared: false, autoPartial: true },
    ],
  };
  const plan = { requests: [{ selectionSource: 'mandatory-automatic' }] };
  const out = m.computeMetrics(results, plan);
  assert.equal(out.obligations, 2);
  assert.equal(out.cleared, 1);
  assert.equal(out.autoPartial, 1);
  assert.equal(out.bySc['2.4.7'].cleared, 1);
  assert.equal(out.bySc['1.4.3'].autoPartial, 1);
  assert.equal(out.pctResolvedWithoutAgent, 100);
});

test('scoreClears flags a false clearance against gold and reports the 95% upper bound', () => {
  const results = { claims: [
    { claimId: 'a', sc: '2.4.7', observationOutcome: 'NO_BARRIER_OBSERVED', observationScope: { actionTargetRef: 'good' } },
    { claimId: 'b', sc: '2.4.7', observationOutcome: 'NO_BARRIER_OBSERVED', observationScope: { actionTargetRef: 'bad' } },
  ] };
  const gold = [
    { xpath: 'good', sc: '2.4.7', goldOutcome: 'NO_BARRIER_OBSERVED' },
    { xpath: 'bad', sc: '2.4.7', goldOutcome: 'BARRIER_OBSERVED' }, // a real barrier we wrongly cleared
  ];
  const s = m.scoreClears(results, gold);
  assert.equal(s.labelledClears, 2);
  assert.equal(s.falseClears, 1);
  assert.equal(s.upperBound95, null, 'with a false clear there is no zero-event bound');
  // clean case: no false clears ⇒ a (wide) zero-event upper bound is reported
  const clean = m.scoreClears(results, [{ xpath: 'good', sc: '2.4.7', goldOutcome: 'NO_BARRIER_OBSERVED' }, { xpath: 'bad', sc: '2.4.7', goldOutcome: 'NO_BARRIER_OBSERVED' }]);
  assert.equal(clean.falseClears, 0);
  assert.ok(clean.upperBound95 > 0);
});
