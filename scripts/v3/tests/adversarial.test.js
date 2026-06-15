// Harness 3.0 — ADVERSARIAL regression suite. Each test reproduces a probe from the first-pass
// independent audit (V3-FIRST-PASS-INDEPENDENT-AUDIT.md) and asserts it is now CLOSED. Builder
// probes are pure; measurement probes are gated on a local Chrome (like runner.test.js).
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildV3 } = require('../lib/build-v3.js');
const { runPlan, runFocusVisualRetry, CHROME } = require('../lib/run-experiments.js');
const { directionForFocusVisible } = require('../lib/proposer.js');

const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — v3 adversarial measurement probes SKIPPED');

const FULL = { targetIsFocusable: true, keyboardReachableInState: true, realKeyboardFocus: true, hydrationReady: true, focusDependentIndicator: true, obviouslyVisible: true, stableIndicatorAbsence: true, modeCompletenessProven: true };
const APP = { targetIsFocusable: true, keyboardReachableInState: true };
const SCOPE = (t) => ({ actionTargetRef: t, state: 'fresh-load', action: 'tab-to', environment: 'headless-chromium' });
const fam = 'focus-indicator-visible';
const PROMOTED = {
  'focus-visual-retry/NO_BARRIER_OBSERVED': { state: 'authoritative', reason: 't', readiness: { goldSized: true, sealedEval: true, independentRaters: true, measurementValidated: true } },
  'focus-visual-retry/BARRIER_OBSERVED': { state: 'authoritative', reason: 't', readiness: { goldSized: true, sealedEval: true, independentRaters: true, measurementValidated: true } },
};
const id = { file: 'p', runId: 'R', pageDigest: 'sha256:d' };
const result = (claimId, target, over = {}) => ({ claimId, experimentId: 'focus-visual-retry', targetXpath: target, sc: '2.4.7', observationScope: SCOPE(target), outcome: { ...FULL }, applicabilityEvidence: { ...APP }, ...over });
const proposal = (claimId, target, over = {}) => ({ claimId, sc: '2.4.7', direction: 'NO_BARRIER_OBSERVED', experimentId: 'focus-visual-retry', claimFamily: fam, observationScope: SCOPE(target), ...over });
const bundle = (elements, results, proposals) => ({
  collect: { ...id, collectedAt: 1000, elements },
  experiments: { ...id, startedAt: 2000, results },
  claimProposals: { ...id, proposals },
});

// ---- V3-C1: cross-TARGET evidence laundering ----
test('V3-C1 cross-target: evidence measured on A cannot clear a claim scoped to B', () => {
  const b = bundle(
    [{ xpath: 'A', focusable: true }, { xpath: 'B', focusable: true }],
    [result('cX', 'A')],                                   // measured on A
    [proposal('cX', 'B')],                                 // but scoped to B
  );
  const r = buildV3(b, { authority: PROMOTED });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.results.summary.authoritative, 0, 'cross-target evidence does not clear');
  assert.ok(!r.results.claims.some((c) => c.observationScope.actionTargetRef === 'B'));
});

// ---- V3-C1: cross-SC evidence laundering ----
test('V3-C1 cross-SC: a 2.4.7 focus experiment cannot publish a 1.4.3 claim', () => {
  const b = bundle(
    [{ xpath: 'A', focusable: true, hasText: true }],
    [result('cX', 'A')],
    [{ claimId: 'cX', sc: '1.4.3', direction: 'BARRIER_OBSERVED', experimentId: 'focus-visual-retry', claimFamily: 'text-contrast', observationScope: SCOPE('A') }],
  );
  const r = buildV3(b, { authority: PROMOTED });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.results.summary.authoritative, 0, 'no cross-SC publication');
  assert.ok(!r.results.claims.some((c) => c.sc === '1.4.3'));
});

// ---- V3-H5: order-independent conflicting/duplicate evidence ----
test('V3-H5: duplicate/conflicting evidence for one claimId resolves to PARTIAL regardless of order', () => {
  const clear = result('c1', 'A');
  const barrier = result('c1', 'A', { outcome: { ...FULL, focusDependentIndicator: false, obviouslyVisible: false } });
  for (const results of [[clear, barrier], [barrier, clear]]) {
    const r = buildV3(bundle([{ xpath: 'A', focusable: true }], results, [proposal('c1', 'A')]), { authority: PROMOTED });
    assert.equal(r.ok, true, JSON.stringify(r.errors));
    assert.equal(r.results.summary.authoritative, 0, 'conflicting evidence never clears (either order)');
  }
});

// ---- V3-C3: zero-obligation publication / silent omission ----
test('V3-C3: a focusable element with NO applicableScs still enumerates obligations (auto-PARTIAL, not absent)', () => {
  // no proposal at all, no applicableScs annotation — the oracle must still enumerate from facts.
  const r = buildV3(bundle([{ xpath: 'A', focusable: true }], [], []), { authority: PROMOTED });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.results.summary.obligations, 2, '2.4.7 + 2.1.1 enumerated independently');
  assert.equal(r.results.summary.autoPartial, 2, 'both are honest auto-PARTIALs, not silently passed');
});

test('V3-C3: a non-empty evaluable page that yields zero obligations FAILS CLOSED', () => {
  const r = buildV3(bundle([{ xpath: 'A', role: 'application' }], [], []), { authority: PROMOTED });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((m) => /ZERO obligations/.test(m)));
});

// ---- V3-C2: authority / shadow enforcement ----
test('V3-C2: a gate-passing clear does NOT publish under default-shadow authority', () => {
  const r = buildV3(bundle([{ xpath: 'A', focusable: true }], [result('c1', 'A')], [proposal('c1', 'A')]));
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.results.summary.authoritative, 0);
  assert.equal(r.results.summary.shadow, 1);
});

test('V3-C2: an authoritative entry with unmet readiness is fail-closed to shadow', () => {
  const halfReady = { 'focus-visual-retry/NO_BARRIER_OBSERVED': { state: 'authoritative', reason: 'x', readiness: { goldSized: true, sealedEval: true, independentRaters: true, measurementValidated: false } } };
  const r = buildV3(bundle([{ xpath: 'A', focusable: true }], [result('c1', 'A')], [proposal('c1', 'A')]), { authority: halfReady });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.results.summary.authoritative, 0, 'unmet readiness ⇒ shadow, never authoritative');
  assert.equal(r.results.summary.shadow, 1);
});

// ---- V3-H2: strict schema — unknown stage / unknown record field ----
test('V3-H2: an unknown bundle stage is rejected', () => {
  const b = bundle([{ xpath: 'A', focusable: true }], [result('c1', 'A')], [proposal('c1', 'A')]);
  b.evilStage = { smuggled: true };
  const r = buildV3(b, { authority: PROMOTED });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((m) => /unknown stage/.test(m)));
});

test('V3-H2: an unknown field on a proposal record is rejected', () => {
  const p = proposal('c1', 'A'); p.smuggledAuthority = 'authoritative';
  const r = buildV3(bundle([{ xpath: 'A', focusable: true }], [result('c1', 'A')], [p]), { authority: PROMOTED });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((m) => /unknown key "smuggledAuthority"/.test(m)));
});

// ---- V3-H7: legacy-token rejection targets schema, not page content ----
test('V3-H7: a collected accessible name "N/A" does NOT trip the legacy gate; a verdict field does', () => {
  const okBundle = bundle([{ xpath: 'A', focusable: true, name: 'N/A' }], [result('c1', 'A')], [proposal('c1', 'A')]);
  const r = buildV3(okBundle, { authority: PROMOTED });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  const bad = bundle([{ xpath: 'A', focusable: true }], [result('c1', 'A')], [proposal('c1', 'A')]);
  bad.collect.legacyVerdict = 'NOT REPRODUCED';
  const r2 = buildV3(bad, { authority: PROMOTED });
  assert.equal(r2.ok, false);
  assert.ok(r2.errors.some((m) => /legacy verdict label/.test(m)));
});

// ============================ measurement probes (real Chrome) ============================
const ADV = 'file://' + path.join(__dirname, '..', '..', '..', 'assets', 'saved', 'fx-v3-focus-adversarial.html');
const advPlan = {
  ...id, _startedAt: 1000,
  requests: [
    { candidateId: 'c-transparent', experimentId: 'focus-visual-retry', targetXpath: '/html/body/button[1]', sc: '2.4.7' },
    { candidateId: 'c-redborder', experimentId: 'focus-visual-retry', targetXpath: '/html/body/button[2]', sc: '2.4.7' },
  ],
};

test('V3-C4: a TRANSPARENT focus shadow is not an obviously-visible indicator (no false clear)', { skip: !chromeOK, concurrency: false }, async () => {
  const exp = await runPlan(advPlan, { resolveUrl: () => ADV });
  const t = exp.results.find((r) => r.claimId === 'c-transparent').outcome;
  assert.equal(t.keyboardReachableInState, true, 'reached the button');
  assert.equal(t.obviouslyVisible, false, 'a transparent shadow produces no perceivable pixels');
  assert.equal(t.focusDependentIndicator, false, 'so it is not a focus-dependent visible indicator');
  assert.notEqual(directionForFocusVisible(t), 'NO_BARRIER_OBSERVED', 'the proposer must not propose a clear');
});

test('V3-C4: a focus-dependent RED border changes pixels — it is NOT a stable absence (no false barrier)', { skip: !chromeOK, concurrency: false }, async () => {
  const exp = await runPlan(advPlan, { resolveUrl: () => ADV });
  const rb = exp.results.find((r) => r.claimId === 'c-redborder').outcome;
  assert.equal(rb.keyboardReachableInState, true);
  assert.equal(rb.stableIndicatorAbsence, false, 'a visibly-changing focus border is not an absence');
  assert.equal(rb.focusDependentIndicator, true, 'it is a real focus-dependent indicator');
  assert.equal(rb.obviouslyVisible, true);
});
