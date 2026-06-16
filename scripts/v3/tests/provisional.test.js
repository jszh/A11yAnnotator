// Harness 3.2 — the PROVISIONAL disposition. A calibrated (gated) or ungated (research-default) LLM
// verdict FILLS an obligation the deterministic + instrument lanes left at auto-PARTIAL, as a
// NON-AUTHORITATIVE, channel-tagged ledger row. These tests pin the spine: ungated-default fills,
// gated gating (strict clear vs lenient barrier), CLAIM-always-wins, barrier-dominates-clear,
// calibration attachment, the ○-tier enumeration, and the structured-only / never-authoritative floors.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const V = require('../lib/v3-schema.js');
const auth = require('../lib/authority.js');
const metrics = require('../lib/metrics.js');
const oracle = require('../lib/applicability-oracle.js');
const obl = require('../lib/obligations.js');
const { buildV3 } = require('../lib/build-v3.js');
const { withPipeline, reseal, promoted, TEST_KEY } = require('./helpers.js');

const ID = { file: 'p', runId: 'R', pageDigest: 'sha256:d' };
const scope = (xpath) => ({ actionTargetRef: xpath, state: 'fresh-load', action: 'inspect', environment: 'headless-chromium' });
const llmVerdict = (over = {}) => ({ verdictId: 'lv1', sc: '2.4.7', claimFamily: 'focus-indicator-visible', targetXpath: 'node:b1', observationScope: scope('node:b1'), agentVerdict: 'NOT REPRODUCED', confidence: 'medium', evidenceRefs: ['ev-1'], rationaleRef: 'lv1#basis', ...over });
const llmArt = (verdicts, over = {}) => ({ ...ID, model: 'claude-test', promptHash: 'sha256:prompt', verdicts, ...over });
const baseBundle = () => ({
  collect: { ...ID, collectedAt: 1, elements: [{ xpath: 'node:b1', focusable: true }] },
  experiments: { ...ID, catalogVersion: '3.0.0-phase0', startedAt: 2, results: [] },
  claimProposals: { ...ID, proposals: [] },
});
const focusRow = (r) => r.results.obligationLedger.find((o) => o.sc === '2.4.7' && o.claimFamily === 'focus-indicator-visible');
// a canary LLM registry (sealedEval + model/prompt + gold-blinding) for the gated path.
function canaryLlm(pairs, { key = TEST_KEY } = {}) {
  const reg = {};
  for (const k of pairs) reg[k] = { state: 'canary', reason: 'canary', readiness: { sealedEval: true }, provenance: { modelRef: 'm', promptHash: 'ph', goldBlindedRef: 'gb' } };
  Object.defineProperty(reg, '__trust', { value: { attestationKey: key, artifactVerifier: () => true }, enumerable: false });
  return reg;
}

// ============================ ungated (research default) ============================
test('ungated DEFAULT: an LLM clear FILLS the auto-PARTIAL obligation as a PROVISIONAL clear (non-authoritative)', () => {
  const b = withPipeline(baseBundle());
  b.llm = llmArt([llmVerdict()]); // NOT REPRODUCED → NO_BARRIER on node:b1/2.4.7
  const r = buildV3(reseal(b), { authority: promoted([]) }); // no provisionalMode ⇒ ungated
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  const row = focusRow(r);
  assert.equal(row.disposition, 'PROVISIONAL');
  assert.equal(row.cleared, true);
  assert.equal(row.autoPartial, false);
  assert.equal(row.provisional.mode, 'ungated');
  assert.equal(row.provisional.calibrated, false, 'ungated never claims to be gold-validated');
  assert.equal(row.provisional.source, 'llm');
  assert.equal(row.provisional.mechanism, 'llm-agent');
  assert.equal(row.provisional.outcome, 'NO_BARRIER_OBSERVED');
  assert.equal(row.provisional.rationaleRef, 'lv1#basis', 'free text stays in the side artifact (channel ref only)');
  // NEVER authoritative; the authoritative cleared count stays deterministic-only.
  assert.equal(r.results.summary.authoritative, 0);
  assert.equal(r.results.summary.cleared, 0, 'deterministic cleared count is unchanged');
  assert.equal(r.results.summary.provisionalCleared, 1);
  assert.equal(r.results.summary.provisionalByMechanism['llm-agent'], 1);
});

test('ungated: an LLM barrier fills a PROVISIONAL barrier; an INCONCLUSIVE abstention does NOT fill', () => {
  const barrier = buildV3(reseal((() => { const b = withPipeline(baseBundle()); b.llm = llmArt([llmVerdict({ agentVerdict: 'REPRODUCED' })]); return b; })()), { authority: promoted([]) });
  assert.equal(focusRow(barrier).disposition, 'PROVISIONAL');
  assert.equal(focusRow(barrier).cleared, false);
  assert.equal(barrier.results.summary.provisionalBarrier, 1);
  // PARTIAL / N/A abstention → no row, stays auto-PARTIAL with the annotation attached.
  const abstain = buildV3(reseal((() => { const b = withPipeline(baseBundle()); b.llm = llmArt([llmVerdict({ agentVerdict: 'N/A' })]); return b; })()), { authority: promoted([]) });
  assert.equal(focusRow(abstain).disposition, 'PARTIAL');
  assert.equal(focusRow(abstain).autoPartial, true, 'an abstention is not a disposition');
  assert.equal(abstain.results.summary.provisionalCleared + abstain.results.summary.provisionalBarrier, 0);
});

test('ungated + gold: the per-mechanism calibration numbers RIDE ALONG (measurement, not gate)', () => {
  const b = withPipeline(baseBundle());
  b.llm = llmArt([llmVerdict()]);
  const gold = [{ xpath: 'node:b1', sc: '2.4.7', goldOutcome: 'NO_BARRIER_OBSERVED' }];
  const r = buildV3(reseal(b), { authority: promoted([]), gold });
  const cal = focusRow(r).provisional.calibration;
  assert.ok(cal && cal.labelledClears === 1 && cal.falseClearRate === 0, JSON.stringify(cal));
  assert.equal(focusRow(r).provisional.calibrated, false, 'ungated stays calibrated:false even with gold present');
});

// ============================ precedence + conflict ============================
test('CLAIM always wins: a deterministic CLAIM is NEVER overridden by a conflicting LLM barrier', () => {
  const good = {
    collect: { ...ID, collectedAt: 1000, elements: [{ xpath: 'node:b1', focusable: true }] },
    experiments: { ...ID, catalogVersion: '3.0.0-phase0', startedAt: 2000, results: [{ claimId: 'c1', experimentId: 'focus-visual-retry', targetXpath: 'node:b1', sc: '2.4.7', observationScope: { ...scope('node:b1'), action: 'tab-to' }, outcome: { targetIsFocusable: true, keyboardReachableInState: true, realKeyboardFocus: true, hydrationReady: true, focusDependentIndicator: true, obviouslyVisible: true, stableIndicatorAbsence: true, modeCompletenessProven: true }, applicabilityEvidence: { targetIsFocusable: true, keyboardReachableInState: true } }] },
    claimProposals: { ...ID, proposals: [{ claimId: 'c1', sc: '2.4.7', direction: 'NO_BARRIER_OBSERVED', experimentId: 'focus-visual-retry', claimFamily: 'focus-indicator-visible', observationScope: { ...scope('node:b1'), action: 'tab-to' } }] },
  };
  const b = withPipeline(good);
  b.llm = llmArt([llmVerdict({ agentVerdict: 'REPRODUCED', observationScope: { ...scope('node:b1'), action: 'tab-to' } })]);
  const r = buildV3(reseal(b), { authority: promoted(['focus-visual-retry/NO_BARRIER_OBSERVED']) });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(focusRow(r).disposition, 'CLAIM', 'the deterministic CLAIM stands');
  assert.equal(focusRow(r).cleared, true);
  assert.equal(r.results.summary.provisionalCleared + r.results.summary.provisionalBarrier, 0, 'no provisional on a CLAIMed obligation');
});

test('barrier-dominates-clear: two mechanisms disagree on one obligation ⇒ provisional BARRIER, conflict noted', () => {
  const b = withPipeline(baseBundle());
  b.llm = llmArt([llmVerdict({ agentVerdict: 'NOT REPRODUCED' })]); // llm-agent says CLEAR
  b.judgments = { ...ID, judgments: [{ judgmentId: 'j1', sc: '2.4.7', claimFamily: 'focus-indicator-visible', targetXpath: 'node:b1', observationScope: scope('node:b1'), rubricRef: 'focus-rubric-v0', verdict: 'LIKELY_BARRIER' }] }; // llm-rubric says BARRIER
  const r = buildV3(reseal(b), { authority: promoted([]) });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  const row = focusRow(r);
  assert.equal(row.disposition, 'PROVISIONAL');
  assert.equal(row.cleared, false, 'fail-closed: the barrier dominates');
  assert.equal(row.provisional.outcome, 'BARRIER_OBSERVED');
  assert.equal(row.provisional.mechanism, 'llm-rubric:focus-rubric-v0');
  assert.ok(row.provisional.conflict && row.provisional.conflict.blockedClears.includes('llm-agent'), JSON.stringify(row.provisional.conflict));
  assert.ok(row.provisional.supportRefs.includes('llm-agent') && row.provisional.supportRefs.includes('llm-rubric:focus-rubric-v0'));
});

// ============================ gated (production) ============================
test('gated: with NO canary mechanism the lane is dark — the obligation stays auto-PARTIAL (3.1 output)', () => {
  const b = withPipeline(baseBundle());
  b.llm = llmArt([llmVerdict()]);
  const r = buildV3(reseal(b), { authority: promoted([]), provisionalMode: 'gated' });
  assert.equal(focusRow(r).disposition, 'PARTIAL');
  assert.equal(focusRow(r).autoPartial, true);
});

test('gated: a canary mechanism + gold that PASSES the barrier gate fills a calibrated PROVISIONAL barrier', () => {
  const b = withPipeline(baseBundle());
  b.llm = llmArt([llmVerdict({ agentVerdict: 'REPRODUCED' })]); // BARRIER on node:b1/2.4.7
  const gold = [{ xpath: 'node:b1', sc: '2.4.7', goldOutcome: 'BARRIER_OBSERVED' }]; // a TRUE barrier
  const r = buildV3(reseal(b), { authority: canaryLlm(['llm-agent/BARRIER_OBSERVED']), provisionalMode: 'gated', gold });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  const row = focusRow(r);
  assert.equal(row.disposition, 'PROVISIONAL');
  assert.equal(row.cleared, false);
  assert.equal(row.provisional.mode, 'gated');
  assert.equal(row.provisional.calibrated, true);
});

test('gated CLEAR: the 149-bound is a STANDING canary property (earned offline), not a per-page gate (D-GATE-3)', () => {
  // a NON-canary clear is blocked (the authority half — D7-2); a canary clear (offline-earned 149) fills.
  const mk = () => { const b = withPipeline(baseBundle()); b.llm = llmArt([llmVerdict()]); return reseal(b); };
  const blocked = buildV3(mk(), { authority: promoted([]), provisionalMode: 'gated' });
  assert.equal(focusRow(blocked).disposition, 'PARTIAL', 'no canary ⇒ no gated provisional clear');
  const filled = buildV3(mk(), { authority: canaryLlm(['llm-agent/NO_BARRIER_OBSERVED']), provisionalMode: 'gated' });
  assert.equal(focusRow(filled).disposition, 'PROVISIONAL', 'a canary mechanism (149 attested offline) fills the gated clear');
  assert.equal(focusRow(filled).provisional.calibrated, true);
});

test('D7-2: the gated AUTHORITY half is load-bearing — a NON-canary mechanism cannot fill (mutation guard)', () => {
  // a VALID registry where llm-agent is default-shadow; the decisive obs IS present, so only the
  // provisionFor gate stands between it and a (wrong) calibrated fill. Removing that gate (the audit's
  // mutation) would fill — so this pins it.
  const b = withPipeline(baseBundle()); b.llm = llmArt([llmVerdict()]);
  const r = buildV3(reseal(b), { authority: promoted([]), provisionalMode: 'gated' });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.results.summary.llmShadowObservations, 1, 'the obs IS present — the GATE blocked the fill, not a missing obs');
  assert.equal(focusRow(r).disposition, 'PARTIAL', 'a non-canary (shadow) mechanism must not fill in gated mode');
});

// ============================ authority + metrics units ============================
test('authority: canary ⇒ mayProvision; shadow ⇒ not; provisionFor requires LLM provenance', () => {
  assert.equal(auth.authorityFor('llm-agent', 'BARRIER_OBSERVED', {}).mayProvision, false, 'no entry ⇒ no provision');
  const reg = canaryLlm(['llm-agent/BARRIER_OBSERVED']);
  assert.equal(auth.authorityFor('llm-agent', 'BARRIER_OBSERVED', reg).mayProvision, true);
  assert.equal(auth.provisionFor('llm-agent', 'BARRIER_OBSERVED', reg).mayProvision, true);
  // strip the provenance ⇒ provisionFor refuses (gold-blinding/model pinning is mandatory at canary).
  const weak = { 'llm-agent/BARRIER_OBSERVED': { state: 'canary', readiness: { sealedEval: true } } };
  assert.equal(auth.provisionFor('llm-agent', 'BARRIER_OBSERVED', weak).mayProvision, false);
});

test('metrics: clearCanaryEligible needs zero-false + zero-unlabelled + ≥ requiredZeroEventN labelled clears', () => {
  const mk = (n) => ({ claims: [], shadowObservations: Array.from({ length: n }, (_, i) => ({ source: 'llm', mechanism: 'llm-agent', sc: '2.4.7', observationScope: scope('x' + i), wouldBe: { observationOutcome: 'NO_BARRIER_OBSERVED', wcagApplicability: 'APPLICABLE' } })) });
  const gold = (n) => Array.from({ length: n }, (_, i) => ({ xpath: 'x' + i, sc: '2.4.7', goldOutcome: 'NO_BARRIER_OBSERVED' }));
  const need = metrics.requiredZeroEventN(0.02); // 149
  const few = metrics.scoreMechanism(mk(10), gold(10), 'llm-agent');
  assert.equal(few.clears.promotionEligible, true, '10 clean labelled clears: zero-false gate passes');
  assert.equal(few.clearCanaryEligible, false, 'but 10 < 149 cannot bound the rate ⇒ not canary-eligible');
  const enough = metrics.scoreMechanism(mk(need), gold(need), 'llm-agent');
  assert.equal(enough.clearCanaryEligible, true, `${need} clean labelled clears clears the strict gate`);
});

// ============================ ○-tier enumeration + structured-only ============================
test('○-tier: a pointer target enumerates target-size obligations; the LLM fills 2.5.8 provisionally', () => {
  const collect = { ...ID, collectedAt: 1, elements: [{ xpath: 'node:t1', box: { x: 0, y: 0, w: 20, h: 20 }, role: 'button' }] };
  const b = withPipeline({ collect, experiments: { ...ID, catalogVersion: '3.0.0-phase0', startedAt: 2, results: [] }, claimProposals: { ...ID, proposals: [] } });
  b.llm = llmArt([{ verdictId: 'lv9', sc: '2.5.8', claimFamily: 'target-size-minimum', targetXpath: 'node:t1', observationScope: scope('node:t1'), agentVerdict: 'NOT REPRODUCED', confidence: 'high', evidenceRefs: [], rationaleRef: 'lv9#b' }]);
  const r = buildV3(reseal(b), { authority: promoted([]) });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.ok(r.results.obligationLedger.some((o) => o.sc === '2.5.8' && o.claimFamily === 'target-size-minimum'), 'the 2.5.8 obligation now EXISTS');
  const row = r.results.obligationLedger.find((o) => o.sc === '2.5.8' && o.claimFamily === 'target-size-minimum');
  assert.equal(row.disposition, 'PROVISIONAL');
  assert.equal(row.cleared, true);
});

test('○-tier: a page with a title slot enumerates the page-level 2.4.2 page-title obligation', () => {
  const collect = { ...ID, collectedAt: 1, structure: { title: 'My Page' }, elements: [{ xpath: 'node:b1', focusable: true }] };
  const obls = oracle.deriveObligations(collect);
  assert.ok(obls.some((o) => o.sc === '2.4.2' && o.claimFamily === 'page-title' && o.xpath === oracle.PAGE_TITLE_XPATH));
});

test('structured-only: a PROVISIONAL ledger row carries no free text — the strict scanner stays green', () => {
  const b = withPipeline(baseBundle());
  // a rationale/basis full of legacy-looking prose must never block the build (it lives in the side artifact).
  b.llm = llmArt([llmVerdict({ agentVerdict: 'REPRODUCED' })]);
  b.llmRationale = { ...ID, rationales: [{ id: 'lv1#basis', summary: 'The control is N/A in this state.', reasoning: 'REPRODUCED across both tabs.' }] };
  const r = buildV3(reseal(b), { authority: promoted([]) });
  assert.equal(r.ok, true, 'free-text rationale never reaches strict results');
  const blob = JSON.stringify(r.results.obligationLedger.find((o) => o.sc === '2.4.7' && o.disposition === 'PROVISIONAL'));
  assert.ok(!/REPRODUCED|"N\/A"/.test(blob), 'the provisional row is structured-only');
});

// ============================ adversarial regressions (skeptic round) ============================
test('adversarial MED: INHERITED (prototype-chain) LLM provenance does NOT satisfy the gated gate', () => {
  const protoProv = Object.create({ modelRef: 'm', promptHash: 'ph', goldBlindedRef: 'gb' }); // inherited, not OWN
  const reg = { 'llm-agent/BARRIER_OBSERVED': { state: 'canary', readiness: { sealedEval: true }, provenance: protoProv } };
  assert.equal(auth.provisionFor('llm-agent', 'BARRIER_OBSERVED', reg).mayProvision, false, 'inherited provenance refs do not count');
  assert.ok(auth.validateAuthority(reg).some((m) => /modelRef|promptHash|goldBlindedRef/.test(m)), 'the registry is rejected');
});

test('adversarial MED: a malformed gold row (null) DEGRADES — it never fail-crashes the build', () => {
  assert.doesNotThrow(() => metrics.scoreMechanism({ claims: [], shadowObservations: [] }, [null, undefined, { xpath: 'x', sc: '2.4.7', goldOutcome: 'NO_BARRIER_OBSERVED' }], 'llm-agent'));
  const b = withPipeline(baseBundle()); b.llm = llmArt([llmVerdict()]);
  let r; assert.doesNotThrow(() => { r = buildV3(reseal(b), { authority: promoted([]), gold: [null] }); });
  assert.equal(r.ok, true);
});

test('tie-break: on a confidence tie the ATOMIC rubric wins the attribution (not the broad agent), order-independent', () => {
  const oid = 'x::1.1.1::non-text-content';
  const obls = [{ obligationId: oid, xpath: 'x', sc: '1.1.1', claimFamily: 'non-text-content' }];
  const fill = (mech) => ({ obligationId: oid, kind: 'PROVISIONAL', outcome: 'NO_BARRIER_OBSERVED', provisional: { mechanism: mech, confidence: 'high' } });
  const r1 = obl.reconcile(obls, [fill('llm-agent'), fill('llm-rubric:alt-text-adequacy-v0')]);
  const r2 = obl.reconcile(obls, [fill('llm-rubric:alt-text-adequacy-v0'), fill('llm-agent')]); // reversed input order
  assert.equal(r1.ledger[0].provisional.mechanism, 'llm-rubric:alt-text-adequacy-v0', 'the scoped, calibratable rubric wins, not alphabetical llm-agent');
  assert.equal(r2.ledger[0].provisional.mechanism, 'llm-rubric:alt-text-adequacy-v0', 'order-independent (deterministic)');
  assert.ok(r1.ledger[0].provisional.supportRefs.includes('llm-agent'), 'the agent still appears in supportRefs');
});

test('adversarial MED: reconcile never throws on a non-decisive PROVISIONAL set (fail-closed, not fail-open)', () => {
  const oid = 'a::2.4.7::focus-indicator-visible';
  const obls = [{ obligationId: oid, xpath: 'a', sc: '2.4.7', claimFamily: 'focus-indicator-visible' }];
  let res; assert.doesNotThrow(() => { res = obl.reconcile(obls, [{ obligationId: oid, kind: 'PROVISIONAL', outcome: 'INCONCLUSIVE', provisional: { mechanism: 'm' } }]); });
  assert.equal(res.ledger[0].disposition, 'PARTIAL');
  assert.equal(res.ledger[0].autoPartial, true, 'a non-decisive fill yields NO provisional row');
});

test('D-GATE-1: the clear-gate clamp is TWO-SIDED — a malicious clearTarget cannot collapse the 149 floor', () => {
  // 200 clean labelled clears so the ONLY thing that could pass/fail the gate is the required-N floor.
  const mk = (n) => ({ claims: [], shadowObservations: Array.from({ length: n }, (_, i) => ({ source: 'llm', mechanism: 'llm-agent', sc: '2.4.7', observationScope: scope('x' + i), wouldBe: { observationOutcome: 'NO_BARRIER_OBSERVED', wcagApplicability: 'APPLICABLE' } })) });
  const gold = (n) => Array.from({ length: n }, (_, i) => ({ xpath: 'x' + i, sc: '2.4.7', goldOutcome: 'NO_BARRIER_OBSERVED' }));
  // clearTarget <= 0 previously made requiredZeroEventN negative ⇒ a single clear passed. Now floored at 149.
  assert.equal(metrics.scoreMechanism(mk(1), gold(1), 'llm-agent', { clearTarget: -5 }).clearCanaryEligible, false, 'one clear cannot pass even with clearTarget:-5');
  assert.equal(metrics.scoreMechanism(mk(148), gold(148), 'llm-agent', { clearTarget: 0.999 }).clearCanaryEligible, false, '148 < 149 floor, even with a huge clearTarget');
  assert.equal(metrics.scoreMechanism(mk(149), gold(149), 'llm-agent', { clearTarget: 0.999 }).clearCanaryEligible, true, '149 clears clears the clamped floor');
});

test('D7-1: a PROVISIONAL clear does NOT set the authoritative `cleared` aggregate (mutation guard)', () => {
  const b = withPipeline(baseBundle());
  b.llm = llmArt([llmVerdict()]); // a provisional clear on node:b1/2.4.7
  const r = buildV3(reseal(b), { authority: promoted([]) });
  const summ = r.results.elementSkillSummaries.filter((s) => s.xpath === 'node:b1');
  assert.ok(summ.length, 'node:b1 has skill summaries');
  assert.ok(summ.every((s) => s.cleared === false), 'a provisional clear must NEVER make a skill read deterministically `cleared`');
  assert.ok(summ.some((s) => s.provisionallyCleared === true), 'it is recorded as provisionallyCleared instead');
});

test('D7-3: a provisional clear does NOT override a deterministic SHADOW-PARTIAL obligation', () => {
  // a gate-passing-but-unpromoted deterministic clear becomes a shadow-PARTIAL (not autoPartial); the LLM
  // also clears the same obligation — the deterministic disposition must win (precedence), no PROVISIONAL.
  const good = {
    collect: { ...ID, collectedAt: 1000, elements: [{ xpath: 'node:b1', focusable: true }] },
    experiments: { ...ID, catalogVersion: '3.0.0-phase0', startedAt: 2000, results: [{ claimId: 'c1', experimentId: 'focus-visual-retry', targetXpath: 'node:b1', sc: '2.4.7', observationScope: { ...scope('node:b1'), action: 'tab-to' }, outcome: { targetIsFocusable: true, keyboardReachableInState: true, realKeyboardFocus: true, hydrationReady: true, focusDependentIndicator: true, obviouslyVisible: true, stableIndicatorAbsence: true, modeCompletenessProven: true }, applicabilityEvidence: { targetIsFocusable: true, keyboardReachableInState: true } }] },
    claimProposals: { ...ID, proposals: [{ claimId: 'c1', sc: '2.4.7', direction: 'NO_BARRIER_OBSERVED', experimentId: 'focus-visual-retry', claimFamily: 'focus-indicator-visible', observationScope: { ...scope('node:b1'), action: 'tab-to' } }] },
  };
  const b = withPipeline(good);
  b.llm = llmArt([llmVerdict({ observationScope: { ...scope('node:b1'), action: 'tab-to' } })]);
  const r = buildV3(reseal(b), { authority: promoted([]) }); // UNPROMOTED ⇒ the clear is a deterministic shadow-PARTIAL
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  const row = focusRow(r);
  assert.equal(row.disposition, 'PARTIAL', 'the deterministic shadow-PARTIAL stands');
  assert.equal(row.shadow, true, 'and it is the deterministic shadow row, not a PROVISIONAL fill');
  assert.equal(row.autoPartial, false);
});

test('D7-4: an ABSTAINING obs of a mechanism that filled the row via another obs does NOT read promotedTo', () => {
  // llm-agent BARRIER on node:b1/2.4.7 fills a provisional barrier; an llm-agent INCONCLUSIVE obs on a
  // DIFFERENT obligation (node:b1/2.1.1) must not read promotedTo just because the mechanism filled elsewhere.
  const b = withPipeline(baseBundle());
  b.llm = llmArt([
    llmVerdict({ verdictId: 'v1', agentVerdict: 'REPRODUCED' }),                                   // BARRIER → fills 2.4.7
    llmVerdict({ verdictId: 'v2', sc: '2.1.1', claimFamily: 'keyboard-operable', agentVerdict: 'PARTIAL' }), // INCONCLUSIVE on 2.1.1
  ]);
  const r = buildV3(reseal(b), { authority: promoted([]) });
  const recs = r.results.adjudicationRecommendations;
  const barrierRec = recs.find((x) => x.sc === '2.4.7' && x.wouldBeOutcome === 'BARRIER_OBSERVED');
  const abstainRec = recs.find((x) => x.sc === '2.1.1');
  assert.equal(barrierRec.promotedTo, 'PROVISIONAL', 'the winning barrier obs reports promotedTo');
  assert.equal(abstainRec.promotedTo, null, 'the abstaining obs must NOT look like a disposition (D7-4)');
});

test('D-GATE-2: a gold label for family A does NOT credit a clear from family B (family-aware keying)', () => {
  const results = { claims: [], shadowObservations: [{ source: 'llm', mechanism: 'llm-agent', sc: '1.3.1', claimFamily: 'famB', observationScope: scope('x'), wouldBe: { observationOutcome: 'NO_BARRIER_OBSERVED', wcagApplicability: 'APPLICABLE' } }] };
  const goldA = [{ xpath: 'x', sc: '1.3.1', claimFamily: 'famA', goldOutcome: 'BARRIER_OBSERVED' }]; // labels family A only
  const s = metrics.scoreClears(results, goldA, { mechanism: 'llm-agent' });
  assert.equal(s.labelledClears, 0, 'the famA gold must NOT label the famB clear');
  assert.equal(s.unlabelledClears, 1);
  // a family-agnostic gold (no claimFamily) DOES credit it (back-compat).
  const s2 = metrics.scoreClears(results, [{ xpath: 'x', sc: '1.3.1', goldOutcome: 'BARRIER_OBSERVED' }], { mechanism: 'llm-agent' });
  assert.equal(s2.labelledClears, 1);
  assert.equal(s2.falseClears, 1);
});

test('adversarial: a verdict whose observationScope.actionTargetRef disagrees with targetXpath is REFUSED', () => {
  const b = withPipeline(baseBundle());
  b.llm = llmArt([llmVerdict({ targetXpath: 'node:b1', observationScope: scope('node:b2') })]);
  const r = buildV3(reseal(b), { authority: promoted([]) });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((m) => /must equal targetXpath/.test(m)));
});

test('gold-loader: flattens ADJUDICATED labels into the flat array; an un-adjudicated draft is INERT', () => {
  const gl = require('../lib/gold-loader.js');
  const { gold, errors, byMechanism } = gl.loadGold();
  assert.deepEqual(errors, [], JSON.stringify(errors));
  assert.ok(gold.length >= 3, 'the seed focus-visual-retry labels load');
  assert.ok(gold.every((g) => g.xpath && g.sc && ['BARRIER_OBSERVED', 'NO_BARRIER_OBSERVED', 'INAPPLICABLE'].includes(g.goldOutcome)));
  assert.ok(byMechanism['focus-visual-retry'] >= 3);
  // a draft (adjudicated:false) label must not enter the gating array.
  const drafts = gl.loadGold({ requireAdjudicated: false });
  assert.ok(drafts.gold.length >= gold.length, 'inspecting drafts is a superset');
});

test('the v3-schema provisional() constructor is structured-only + never authoritative', () => {
  const p = V.provisional({ source: 'llm', mechanism: 'llm-agent', mode: 'ungated', calibrated: false, outcome: 'NO_BARRIER_OBSERVED', confidence: 'high', rationaleRef: 'r#1', evidenceRefs: ['e1'] });
  assert.equal(p.authoritative, false);
  assert.equal(p.mode, 'ungated');
  assert.equal(p.outcome, 'NO_BARRIER_OBSERVED');
  assert.deepEqual(V.DISPOSITIONS, ['CLAIM', 'PROVISIONAL', 'PARTIAL']);
});

test('adversarial LOW: a contradictory gold pair is BARRIER-dominant (order-independent) + the loader surfaces it', () => {
  const results = { claims: [], shadowObservations: [{ source: 'llm', mechanism: 'llm-agent', sc: '2.4.7', observationScope: scope('x'), wouldBe: { observationOutcome: 'NO_BARRIER_OBSERVED', wcagApplicability: 'APPLICABLE' } }] };
  const pair = (o1, o2) => [{ xpath: 'x', sc: '2.4.7', goldOutcome: o1 }, { xpath: 'x', sc: '2.4.7', goldOutcome: o2 }];
  for (const g of [pair('BARRIER_OBSERVED', 'NO_BARRIER_OBSERVED'), pair('NO_BARRIER_OBSERVED', 'BARRIER_OBSERVED')]) {
    const s = metrics.scoreClears(results, g);
    assert.equal(s.falseClears, 1, 'a caught false clear can never be erased by a later NO_BARRIER row');
    assert.equal(s.promotionEligible, false);
  }
});

test('adversarial LOW: labelledClears counts distinct gold CELLS, not records (auth + same-mechanism shadow = 1)', () => {
  const results = {
    claims: [{ sc: '2.4.7', claimFamily: 'focus-indicator-visible', observationOutcome: 'NO_BARRIER_OBSERVED', observationScope: scope('x'), supportRefs: ['experiment:focus-visual-retry'] }],
    shadowObservations: [{ source: 'deterministic', mechanism: 'focus-visual-retry', sc: '2.4.7', claimFamily: 'focus-indicator-visible', observationScope: scope('x'), wouldBe: { observationOutcome: 'NO_BARRIER_OBSERVED', wcagApplicability: 'APPLICABLE' } }],
  };
  const s = metrics.scoreClears(results, [{ xpath: 'x', sc: '2.4.7', goldOutcome: 'NO_BARRIER_OBSERVED' }], { mechanism: 'focus-visual-retry' });
  assert.equal(s.labelledClears, 1, 'two records on ONE gold cell count once (the 149-bound counts independent cells)');
});
