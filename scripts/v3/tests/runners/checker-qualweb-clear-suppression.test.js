// Harness 3.3 C2 — GREEN regression pins for the CLEAR-lane suppression bugs the adversarial verifier found
// (SHIP-WITH-FIXES). The deterministic eval twins ran with NO LLM lane and NO instruments (observations:[],
// provisional:0, instrumentFindings:0), so a clear that suppresses an LLM adequacy/descriptiveness barrier —
// or a confirmed instrument barrier — was INVISIBLE to the 581/197 corpus validation. These tests drive
// build-v3 with the suppressed lane PRESENT and pin the fixed behavior: the CLEAR lane is empty (every
// QW_POLICY family is barrier-only), and even a hypothetical future clear can never pre-empt a §5b barrier
// (cross-lane barrier-dominance, build-v3 crossLaneBarrierIds guard). Origin: qualweb-verify/VERDICT.md.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const Q = require('../../lib/checker-qualweb.js');
const { buildV3 } = require('../../lib/build-v3.js');

const scope = { actionTargetRef: 'node:b1', state: 'fresh-load', action: 'tab-to', environment: 'headless-chromium' };
const FULL = { targetIsFocusable: true, keyboardReachableInState: true, realKeyboardFocus: true, hydrationReady: true, focusDependentIndicator: true, obviouslyVisible: true, stableIndicatorAbsence: true, modeCompletenessProven: true };
const base = (extraEls = []) => ({
  collect: { file: 'p', runId: 'R', pageDigest: 'sha256:d', collectedAt: 1000, structure: { title: 'Untitled Document' }, elements: [{ xpath: 'node:b1', focusable: true }, ...extraEls] },
  experiments: { file: 'p', runId: 'R', pageDigest: 'sha256:d', catalogVersion: '3.0.0-phase0', startedAt: 2000, results: [{ claimId: 'c1', experimentId: 'focus-visual-retry', targetXpath: 'node:b1', sc: '2.4.7', observationScope: scope, outcome: FULL, applicabilityEvidence: { targetIsFocusable: true, keyboardReachableInState: true } }] },
  claimProposals: { file: 'p', runId: 'R', pageDigest: 'sha256:d', proposals: [{ claimId: 'c1', sc: '2.4.7', direction: 'NO_BARRIER_OBSERVED', experimentId: 'focus-visual-retry', claimFamily: 'focus-indicator-visible', observationScope: scope }] },
});
const judgment = (targetXpath, sc, family, rubricRef) => ({ file: 'p', runId: 'R', pageDigest: 'sha256:d', judgments: [{ judgmentId: 'j1', sc, claimFamily: family, targetXpath, rubricRef, verdict: 'LIKELY_BARRIER', confidence: 'high', summary: 's', reasoning: 'r', rationale: 'x' }] });
const rowFor = (r, oid) => r.results.obligationLedger.find((x) => x.obligationId === oid);

// BUG-1 — QW-ACT-R1 (2779a5, title PRESENCE) must NOT clear the page-title obligation and discard the
// page-title-v0 DESCRIPTIVENESS barrier. c4a8a4 (title-descriptive) is QualWeb's own sibling for that facet.
test('page-title: R1 presence-pass does NOT suppress the page-title-v0 descriptiveness barrier', () => {
  const b = base();
  b.judgments = judgment(Q.PAGE_TITLE_XPATH, '2.4.2', 'page-title', 'page-title-v0');
  b.checkerQualweb = { ran: true, ruleOutcomes: { 'QW-ACT-R1': 'passed' } };
  const r = buildV3(b, { provisionalMode: 'ungated' });
  const row = rowFor(r, Q.PAGE_TITLE_XPATH + '::2.4.2::page-title');
  assert.equal(row.disposition, 'PROVISIONAL', 'the non-descriptive-title barrier survives (R1 presence-pass does not clear)');
  assert.equal(row.cleared, false);
});

// BUG-2 — name-presence clears (R11 button / R16 form-field / R12 link / R66 menuitem) must NOT discard the
// accessible-name-adequacy-v0 barrier (present-but-content-free placeholder name).
test('name-role-value: R11 presence-pass does NOT suppress the accessible-name-adequacy barrier', () => {
  const b = base([{ xpath: '/btn', tag: 'button', axRole: 'button', axName: '{{label}}', focusable: true }]);
  b.judgments = judgment('/btn', '4.1.2', 'name-role-value', 'accessible-name-adequacy-v0');
  b.checkerQualweb = { ran: true, ruleOutcomes: { 'QW-ACT-R11': 'passed' } };
  const r = buildV3(b, { provisionalMode: 'ungated' });
  const row = rowFor(r, '/btn::4.1.2::name-role-value');
  assert.equal(row.disposition, 'PROVISIONAL', 'the content-free-name barrier survives (R11 presence-pass does not clear)');
  assert.equal(row.cleared, false);
});

// BUG-3 (real-rule form) — a confirmed ~0-FP instrument BARRIER (focus-rests-in-aria-hidden, 6cfa84) must
// survive alongside a QualWeb name-presence PASS on the same obligation.
test('cross-lane: a confirmed instrument barrier survives a QualWeb name-presence pass on the same obligation', () => {
  const b = base([{ xpath: '/btn', tag: 'button', axRole: 'button', axName: 'Submit', focusable: true }]);
  b.instruments = { file: 'p', runId: 'R', pageDigest: 'sha256:d', findings: [{ sc: '4.1.2', kind: 'focus-rests-in-aria-hidden', xpath: '/btn', detector: 'focusRestProbe', review: false }] };
  b.checkerQualweb = { ran: true, ruleOutcomes: { 'QW-ACT-R11': 'passed' } };
  const r = buildV3(b, { provisionalMode: 'ungated' });
  const row = rowFor(r, '/btn::4.1.2::name-role-value');
  assert.equal(row.cleared, false, 'the confirmed instrument barrier is preserved (not discarded by a QualWeb pass)');
});

// BUG-3 (structural guard) — defense for ANY future clear:true family. Stub the pure core to emit a CLEAR on
// an obligation that a §5b lane (here the instrument focus-rests barrier) will BARRIER; build-v3's
// crossLaneBarrierIds guard must drop that clear so barrier-dominates-clear holds ACROSS lanes.
test('cross-lane GUARD: a (stubbed clear-eligible) QualWeb CLEAR never pre-empts a §5b instrument barrier', () => {
  const orig = Q.normalizeQualweb;
  Q.normalizeQualweb = () => ({ ran: true, disabled: false, barriers: [], reviews: [],
    clears: [{ actId: 'STUB', code: 'QW-ACT-STUB', families: [{ sc: '4.1.2', family: 'name-role-value', matchId: 'button', clear: true }] }] });
  try {
    const b = base([{ xpath: '/btn', tag: 'button', axRole: 'button', axName: 'Submit', focusable: true }]);
    b.instruments = { file: 'p', runId: 'R', pageDigest: 'sha256:d', findings: [{ sc: '4.1.2', kind: 'focus-rests-in-aria-hidden', xpath: '/btn', detector: 'focusRestProbe', review: false }] };
    b.checkerQualweb = { ran: true, ruleOutcomes: { 'QW-ACT-STUB': 'passed' } };
    const r = buildV3(b, { provisionalMode: 'ungated' });
    const oid = '/btn::4.1.2::name-role-value';
    assert.ok(!(r.results.summary.qualweb.clearObligations || []).includes(oid), 'the guard drops the clear (obligation is cross-lane-barriered)');
    const row = rowFor(r, oid);
    assert.equal(row.cleared, false, 'the instrument barrier dominates the stubbed QualWeb clear (barrier-dominates across lanes)');
  } finally { Q.normalizeQualweb = orig; }
});

// BUG-3 (structural guard, axe-promoted barrier) — same guarantee for an axe-promoted 4.1.2 barrier.
test('cross-lane GUARD: a (stubbed clear-eligible) QualWeb CLEAR never pre-empts an axe-promoted barrier', () => {
  const orig = Q.normalizeQualweb;
  Q.normalizeQualweb = () => ({ ran: true, disabled: false, barriers: [], reviews: [],
    clears: [{ actId: 'STUB', code: 'QW-ACT-STUB', families: [{ sc: '4.1.2', family: 'name-role-value', matchId: 'button', clear: true }] }] });
  try {
    const b = base([{ xpath: '/btn', tag: 'button', axRole: 'button', axName: 'Submit', focusable: true }]);
    // an axe DECIDED 4.1.2 hard violation on /btn promotes to a barrier via build-v3's axeObs → §5b fill.
    b.checkerFindings = { file: 'p', runId: 'R', pageDigest: 'sha256:d', source: 'axe', ran: true, findings: [
      { source: 'axe', detector: 'axe:button-name', ruleId: 'button-name', sc: '4.1.2', impact: 'serious', kind: 'violation', xpath: '/btn', review: false },
    ] };
    b.checkerQualweb = { ran: true, ruleOutcomes: { 'QW-ACT-STUB': 'passed' } };
    const r = buildV3(b, { provisionalMode: 'ungated' });
    const row = rowFor(r, '/btn::4.1.2::name-role-value');
    assert.equal(row.cleared, false, 'the axe-promoted barrier dominates the stubbed QualWeb clear');
  } finally { Q.normalizeQualweb = orig; }
});
