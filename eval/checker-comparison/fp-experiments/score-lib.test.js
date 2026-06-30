'use strict';
// scoreCase must RESPECT the obligation-ledger reconcile: a rubric LIKELY_BARRIER that the ledger reconciled-
// suppressed (the 2.4.4 link-equivalence-authoritative fix) must NOT be re-counted as a raw catch. Guards the bug
// where a799c1/e0d32d showed barrierFilled=0 (ledger cleared) yet outcome=caught (scorer counted the raw barrier).
// This scoreCase is the byte-identical copy of run-fn-llm.js's, so this also pins that scorer.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { scoreCase } = require('./score-lib.js');

const XP = '/html/body/p[1]/a[1]';
const tc = { testcaseId: 't', ruleId: 'fd3a94', sc: ['2.4.4'], expected: 'passed', url: 'u' };
// the link-equivalence reconcile case: equiv CLEARS, link-purpose flags a raw barrier, ledger row is cleared with
// the suppression recorded in provisional.reconciled.
const judgments = [
  { sc: '2.4.4', verdict: 'LIKELY_OK', rubricRef: 'link-name-equivalence-v0', targetXpath: XP },
  { sc: '2.4.4', verdict: 'LIKELY_BARRIER', rubricRef: 'link-purpose-v0', targetXpath: XP },
];
const mkOut = (ledgerRow) => ({
  built: { results: { shadowObservations: [], obligationLedger: ledgerRow ? [ledgerRow] : [] } },
  bundle: { judgments: { judgments } },
});
const reconciledRow = {
  xpath: XP, sc: '2.4.4', claimFamily: 'link-purpose', disposition: 'PROVISIONAL', cleared: true, autoPartial: false,
  provisional: { mechanism: 'llm-rubric:link-name-equivalence-v0', reconciled: { rule: 'link-equivalence-authoritative', suppressed: ['llm-rubric:link-purpose-v0'] } },
};

test('scoreCase RESPECTS the ledger reconcile: a reconciled-suppressed link-purpose barrier is NOT counted as caught', () => {
  const rec = scoreCase(tc, mkOut(reconciledRow));
  assert.equal(rec.inScopeBarrierFilled, 0, 'the ledger cleared the obligation (reconcile fired)');
  assert.notEqual(rec.outcome, 'caught', 'the suppressed raw barrier must not flip the case to caught');
  assert.equal(rec.outcome, 'missedAgree', 'with equiv LIKELY_OK and the purpose barrier suppressed, the case agrees with the GT pass');
  assert.equal(rec.falsePositive, false, 'no false positive — the ledger reconcile is now reflected in the metric');
});

test('scoreCase CONTROL: the SAME raw barrier WITHOUT a reconcile note still counts as caught (no over-broad suppression)', () => {
  // a barrier-dominant (not reconciled) ledger row: the obligation is a genuine PROVISIONAL barrier.
  const barrierRow = { xpath: XP, sc: '2.4.4', claimFamily: 'link-purpose', disposition: 'PROVISIONAL', cleared: false, autoPartial: false, provisional: { mechanism: 'llm-rubric:link-purpose-v0' } };
  const rec = scoreCase(tc, mkOut(barrierRow));
  assert.equal(rec.outcome, 'caught', 'a genuine (non-reconciled) barrier still scores caught');
  assert.equal(rec.falsePositive, true);
});

test('scoreCase CONTROL: a reconcile note on a DIFFERENT xpath does not suppress this barrier (keyed by xpath::sc::rubric)', () => {
  const otherRow = { ...reconciledRow, xpath: '/html/body/p[9]/a[1]' };
  const rec = scoreCase(tc, mkOut(otherRow));
  assert.equal(rec.outcome, 'caught', 'suppression is scoped to the exact obligation; an unrelated reconcile does not leak');
});
