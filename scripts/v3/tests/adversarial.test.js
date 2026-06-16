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
const { withPipeline, promoted } = require('./helpers.js');
const PROMOTED = promoted(['focus-visual-retry/NO_BARRIER_OBSERVED', 'focus-visual-retry/BARRIER_OBSERVED']);
const id = { file: 'p', runId: 'R', pageDigest: 'sha256:d' };
const result = (claimId, target, over = {}) => ({ claimId, experimentId: 'focus-visual-retry', targetXpath: target, sc: '2.4.7', observationScope: SCOPE(target), outcome: { ...FULL }, applicabilityEvidence: { ...APP }, valid: true, completed: true, ...over });
const proposal = (claimId, target, over = {}) => ({ claimId, sc: '2.4.7', direction: 'NO_BARRIER_OBSERVED', experimentId: 'focus-visual-retry', claimFamily: fam, observationScope: SCOPE(target), ...over });
const bundle = (elements, results, proposals) => ({
  collect: { ...id, collectedAt: 1000, elements },
  experiments: { ...id, catalogVersion: '3.0.0-phase0', startedAt: 2000, results },
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
  const halfReady = { 'focus-visual-retry/NO_BARRIER_OBSERVED': { state: 'authoritative', reason: 'x', readiness: { goldSized: true, sealedEval: true, independentRaters: true, measurementValidated: false }, provenance: { goldRef: 'g', sealedRef: 's', raterRef: 'r', measurementSuiteHash: 'h' } } };
  const r = buildV3(withPipeline(bundle([{ xpath: 'A', focusable: true }], [result('c1', 'A')], [proposal('c1', 'A')])), { authority: halfReady });
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

// ======================= Round-1 self-adversarial regressions =======================
const cross = require('../lib/cross-artifact.js');

test('R1-F1: evidence whose observationScope differs from the proposal cannot clear (no fictional scope)', () => {
  const ev = result('c1', 'A'); ev.observationScope = { actionTargetRef: 'A', state: 'OTHER-STATE', action: 'tab-to-focus', environment: 'headless-chromium' };
  const r = buildV3(bundle([{ xpath: 'A', focusable: true }], [ev], [proposal('c1', 'A')]), { authority: PROMOTED });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.results.summary.authoritative, 0, 'a scope mismatch is a bind failure');
});

test('R1-F1: a result with NO observationScope is rejected by schema (cannot fail-open the bind)', () => {
  const ev = result('c1', 'A'); delete ev.observationScope;
  const r = buildV3(bundle([{ xpath: 'A', focusable: true }], [ev], [proposal('c1', 'A')]), { authority: PROMOTED });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((m) => /observationScope/.test(m)));
});

test('R1-F2: a legacy token smuggled in a nested observationScope key is rejected (schema) and never reaches output', () => {
  const p = proposal('c1', 'A'); p.observationScope = { ...SCOPE('A'), priorNote: 'NOT REPRODUCED' };
  const r = buildV3(bundle([{ xpath: 'A', focusable: true }], [result('c1', 'A')], [p]), { authority: PROMOTED });
  assert.equal(r.ok, false, 'nested unknown key in observationScope is rejected');
  assert.ok(r.errors.some((m) => /unknown key "priorNote"/.test(m)));
});

test('R1-F3: experiments with NO catalogVersion is rejected (stale-evidence fail-closed)', () => {
  const b = bundle([{ xpath: 'A', focusable: true }], [result('c1', 'A')], [proposal('c1', 'A')]);
  delete b.experiments.catalogVersion;
  const r = buildV3(b, { authority: PROMOTED });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((m) => /catalogVersion is required/.test(m)));
});

test('R1-F4: a manifest naming a different page/run/digest is caught by the identity gate', () => {
  const b = bundle([{ xpath: 'A', focusable: true }], [result('c1', 'A')], [proposal('c1', 'A')]);
  b.manifest = { file: 'WRONG-PAGE', runId: 'OTHER', pageDigest: 'sha256:WRONG' };
  const errs = cross.crossArtifactErrors(b);
  assert.ok(errs.some((m) => /mismatch: manifest/.test(m)), JSON.stringify(errs));
});

test('R1-F5: an evaluable role-only element is surfaced as out-of-scope, never silently dropped', () => {
  // `region` is a landmark role no Phase-0/3.2 family covers (unlike img/link/heading, which now enumerate).
  const r = buildV3(bundle([{ xpath: 'btn', focusable: true }, { xpath: 'reg', role: 'region' }], [], []), { authority: PROMOTED });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.results.summary.outOfScopeElements, 1, 'the region is explicitly counted, not vanished');
  assert.ok(r.results.outOfScope.some((o) => o.xpath === 'reg'));
  assert.ok(!r.results.obligationLedger.some((l) => l.xpath === 'reg'), 'and it produced no phantom obligation');
});

test('R1-F6: a result that answers a different target/SC than its request is rejected by reconciliation', () => {
  const collect = { ...id, collectedAt: 1000, elements: [{ xpath: 'A', focusable: true }, { xpath: 'B', focusable: true }] };
  const plan = { ...id, requests: [{ candidateId: 'c1', experimentId: 'focus-visual-retry', targetXpath: 'A', sc: '2.4.7' }], escalations: [] };
  const candidates = { ...id, candidates: [{ candidateId: 'c1', xpath: 'A', sc: '2.4.7', experimentId: 'focus-visual-retry', selectionLevel: 1 }] };
  const experiments = { ...id, catalogVersion: '3.0.0-phase0', startedAt: 2000, results: [result('c1', 'B')], unrun: [] }; // answers B, requested A
  const errs = cross.crossArtifactErrors({ collect, candidates, plan, experiments, claimProposals: { ...id, proposals: [] } }, ['collect', 'experiments', 'claimProposals']);
  assert.ok(errs.some((m) => /answered the wrong element/.test(m)), JSON.stringify(errs));
});

test('R1-F7: elementSkillSummaries are byte-deterministic under element reorder', () => {
  const mk = (els) => buildV3(bundle(els, [], []), { authority: PROMOTED }).results.elementSkillSummaries;
  const a = mk([{ xpath: 'x1', focusable: true }, { xpath: 'x2', focusable: true, hasText: true }]);
  const b = mk([{ xpath: 'x2', focusable: true, hasText: true }, { xpath: 'x1', focusable: true }]);
  assert.equal(JSON.stringify(a), JSON.stringify(b));
});

// ======================= Round-2 self-adversarial regressions (pure) =======================
const { scoreClears } = require('../lib/metrics.js');
const { reconcile } = require('../lib/obligations.js');
const { authorityFor, validateAuthority } = require('../lib/authority.js');

test('R2-M1: scoreClears reports unlabelled clears (gold-key drift cannot hide a false clear)', () => {
  const results = { claims: [
    { claimId: 'a', sc: '2.4.7', observationOutcome: 'NO_BARRIER_OBSERVED', observationScope: { actionTargetRef: 'good' } },
    { claimId: 'b', sc: '2.4.7', observationOutcome: 'NO_BARRIER_OBSERVED', observationScope: { actionTargetRef: 'mismatch' } },
  ] };
  const s = scoreClears(results, [{ xpath: 'good', sc: '2.4.7', goldOutcome: 'NO_BARRIER_OBSERVED' }]); // 'mismatch' not labelled
  assert.equal(s.unlabelledClears, 1);
  assert.equal(s.upperBound95, null, 'an unlabelled clear voids the zero-event bound');
  assert.equal(s.promotionEligible, false, 'cannot promote while a clear is unlabelled');
});

test('R2-L1: reconcile treats a prototype-key obligationId as data, not a method', () => {
  const obs = [{ obligationId: 'toString', xpath: 'x', sc: '2.4.7', claimFamily: 'focus-indicator-visible' }];
  const { errors, ledger } = reconcile(obs, []); // no disposition ⇒ auto-PARTIAL, no spurious "duplicate"
  assert.deepEqual(errors, []);
  assert.equal(ledger[0].disposition, 'PARTIAL');
  assert.equal(ledger[0].autoPartial, true);
});

test('R2-L2: authority readiness inherited via the prototype chain does not promote', () => {
  const readiness = Object.create({ goldSized: true, sealedEval: true, independentRaters: true, measurementValidated: true });
  const reg = { 'focus-visual-retry/NO_BARRIER_OBSERVED': { state: 'authoritative', reason: 'x', readiness } };
  assert.equal(authorityFor('focus-visual-retry', 'NO_BARRIER_OBSERVED', reg).mayPublish, false);
  assert.ok(validateAuthority(reg).some((m) => /OWN boolean readiness/.test(m)));
});

// ============================ measurement probes (real Chrome) ============================
const R2 = 'file://' + path.join(__dirname, '..', '..', '..', 'assets', 'saved', 'fx-v3-focus-r2.html');
const r2Plan = {
  ...id, _startedAt: 1000,
  requests: [
    { candidateId: 'anim', experimentId: 'focus-visual-retry', targetXpath: '/html/body/button[1]', sc: '2.4.7' },
    { candidateId: 'move', experimentId: 'focus-visual-retry', targetXpath: '/html/body/button[2]', sc: '2.4.7' },
    { candidateId: 'pseudo', experimentId: 'focus-visual-retry', targetXpath: '/html/body/button[3]', sc: '2.4.7' },
    { candidateId: 'offset12', experimentId: 'focus-visual-retry', targetXpath: '/html/body/button[4]', sc: '2.4.7' },
  ],
};

test('R2-F1: a CSS animation (no :focus rule) is INCONCLUSIVE, not a false clear', { skip: !chromeOK, concurrency: false }, async () => {
  const o = (await runPlan(r2Plan, { resolveUrl: () => R2 })).results;
  const anim = o.find((r) => r.claimId === 'anim');
  assert.equal(anim.measurement.stableUnfocused, false, 'two unfocused frames disagree ⇒ animating');
  assert.equal(anim.outcome.focusDependentIndicator, false);
  assert.equal(anim.outcome.obviouslyVisible, false);
  assert.equal(anim.outcome.stableIndicatorAbsence, false);
  assert.equal(directionForFocusVisible(anim.outcome), null, 'no clear AND no barrier ⇒ no proposal');
});

test('R2-F2: an element that MOVES on focus is INCONCLUSIVE, not a false clear', { skip: !chromeOK, concurrency: false }, async () => {
  const o = (await runPlan(r2Plan, { resolveUrl: () => R2 })).results;
  const move = o.find((r) => r.claimId === 'move');
  assert.equal(move.measurement.movedOnFocus, true);
  assert.equal(move.outcome.focusDependentIndicator, false, 'a stale-clip pixel diff must not clear');
  assert.notEqual(directionForFocusVisible(move.outcome), 'NO_BARRIER_OBSERVED');
});

test('R2-F3/F4: a ::after ring with large inset and a 12px-offset outline are CORRECTLY cleared (not false barriers/partials)', { skip: !chromeOK, concurrency: false }, async () => {
  const o = (await runPlan(r2Plan, { resolveUrl: () => R2 })).results;
  const pseudo = o.find((r) => r.claimId === 'pseudo').outcome;
  assert.equal(pseudo.stableIndicatorAbsence, false, 'a real ::after ring is NOT a stable absence');
  assert.equal(pseudo.focusDependentIndicator, true, 'the dynamic clip + pseudo read credits it as a real indicator');
  const off = o.find((r) => r.claimId === 'offset12').outcome;
  assert.equal(off.focusDependentIndicator, true, 'a 12px-offset ring is captured by the dynamic clip');
});

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
