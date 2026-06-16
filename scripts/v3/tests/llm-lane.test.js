// Harness 3.1 — the LLM evidence lane. The LLM is a FOURTH evidence source realized as a
// `source:'llm'` SHADOW-emitting mechanism: it rides results.shadowObservations as a non-authoritative
// annotation (never reconciled, so the obligation's disposition is untouched), is scored against gold
// PER MECHANISM with asymmetric thresholds + decision coverage, and is CAPPED at canary in authority.js
// (it never publishes authoritative). These tests pin every one of those invariants, plus the C3
// strict-scan safety (a raw legacy verdict in the artifact can never leak into the published results).
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const V = require('../lib/v3-schema.js');
const auth = require('../lib/authority.js');
const llmAdj = require('../lib/llm-adjudicator.js');
const metrics = require('../lib/metrics.js');
const { buildV3 } = require('../lib/build-v3.js');
const { withPipeline, reseal, promoted } = require('./helpers.js');

const ID = { file: 'p', runId: 'R', pageDigest: 'sha256:d' };
const scope = (xpath) => ({ actionTargetRef: xpath, state: 'fresh-load', action: 'inspect', environment: 'headless-chromium' });
const llmVerdict = (over = {}) => ({ verdictId: 'lv1', sc: '2.4.7', claimFamily: 'focus-indicator-visible', targetXpath: 'node:b1', observationScope: scope('node:b1'), agentVerdict: 'NOT REPRODUCED', confidence: 'medium', evidenceRefs: ['ev-1'], rationaleRef: 'lv1#basis', ...over });
const llmArt = (verdicts, over = {}) => ({ ...ID, model: 'claude-test', promptHash: 'sha256:prompt', verdicts, ...over });
const baseBundle = () => ({
  collect: { ...ID, collectedAt: 1, elements: [{ xpath: 'node:b1', focusable: true }] },
  experiments: { ...ID, catalogVersion: '3.0.0-phase0', startedAt: 2, results: [] },
  claimProposals: { ...ID, proposals: [] },
});

// ============================ verdict map (the single source of truth) ============================
test('V2_9_VERDICT_MAP: N/A is an ABSTENTION (→ INCONCLUSIVE), never INAPPLICABLE (H1)', () => {
  assert.equal(V.mapVerdict('REPRODUCED'), 'BARRIER_OBSERVED');
  assert.equal(V.mapVerdict('NOT REPRODUCED'), 'NO_BARRIER_OBSERVED');
  assert.equal(V.mapVerdict('PARTIAL'), 'INCONCLUSIVE');
  assert.equal(V.mapVerdict('N/A'), 'INCONCLUSIVE', 'N/A abstains — applicability is the oracle\'s job, not the LLM\'s');
  assert.equal(V.mapVerdict('  n/a  '), 'INCONCLUSIVE', 'case + padding tolerant');
  assert.equal(V.mapVerdict('not reproduced'), 'NO_BARRIER_OBSERVED', 'case tolerant');
  assert.equal(V.mapVerdict('garbage'), null, 'an unmappable verdict fails closed (null), never a guessed direction');
  assert.equal(V.mapVerdict('LIKELY_OK', V.RUBRIC_VERDICT_MAP), 'NO_BARRIER_OBSERVED');
});

// ============================ consumer: processLlm ============================
test('processLlm: binds + maps a verdict into a structured source:llm shadow observation', () => {
  const { shadowObservations, errors } = llmAdj.processLlm(llmArt([llmVerdict()]));
  assert.deepEqual(errors, []);
  const o = shadowObservations[0];
  assert.equal(o.source, 'llm');
  assert.equal(o.mechanism, 'llm-agent');
  assert.equal(o.wouldBe.observationOutcome, 'NO_BARRIER_OBSERVED');
  assert.equal(o.wouldBe.wcagApplicability, 'APPLICABLE');
  assert.equal(o.rationaleRef, 'lv1#basis', 'free text is referenced, not embedded');
  assert.equal(Object.prototype.hasOwnProperty.call(o, 'basis'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(o, 'rationale'), false);
});

test('processLlm: N/A → INCONCLUSIVE shadow obs that can never be a clear or barrier', () => {
  const { shadowObservations } = llmAdj.processLlm(llmArt([llmVerdict({ agentVerdict: 'N/A' })]));
  assert.equal(shadowObservations[0].wouldBe.observationOutcome, 'INCONCLUSIVE');
  assert.equal(shadowObservations[0].wouldBe.wcagApplicability, 'UNKNOWN', 'abstention is never INAPPLICABLE');
});

test('processLlm: malformed verdicts are errors (unknown key / bad SC / bad agentVerdict)', () => {
  assert.ok(llmAdj.processLlm(llmArt([llmVerdict({ smuggled: 1 })])).errors.some((m) => /unknown key/.test(m)));
  assert.ok(llmAdj.processLlm(llmArt([llmVerdict({ sc: '9.9.9' })])).errors.some((m) => /known SC/.test(m)));
  assert.ok(llmAdj.processLlm(llmArt([llmVerdict({ agentVerdict: 'MAYBE' })])).errors.some((m) => /agentVerdict/.test(m)));
});

test('processLlm: a legacy-token evidenceRef is SCRUBBED so it can never reach the strict-scanned results (C3)', () => {
  const { shadowObservations } = llmAdj.processLlm(llmArt([llmVerdict({ evidenceRefs: ['N/A', 'ev-9', 'REPRODUCED'] })]));
  assert.deepEqual(shadowObservations[0].evidenceRefs, ['ev-9'], 'whole-value legacy tokens dropped from the id list');
});

// ============================ build-v3 integration ============================
test('build: an LLM shadow obs rides shadowObservations, never publishes authoritative, leaves the disposition AUTO-PARTIAL', () => {
  const b = withPipeline(baseBundle());
  b.llm = llmArt([llmVerdict()]); // opines NO_BARRIER on node:b1/2.4.7 — but there is no deterministic CLAIM
  const r = buildV3(reseal(b), { authority: promoted([]) });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.results.summary.authoritative, 0, 'the LLM never clears an obligation');
  assert.equal(r.results.summary.llmShadowObservations, 1);
  assert.ok(r.results.shadowObservations.some((o) => o.source === 'llm' && o.mechanism === 'llm-agent'));
  // the 2.4.7 obligation it opined on stays an AUTO-PARTIAL — the annotation did NOT clear it.
  const row = r.results.obligationLedger.find((o) => o.sc === '2.4.7' && o.claimFamily === 'focus-indicator-visible');
  assert.equal(row.disposition, 'PARTIAL');
  assert.equal(row.autoPartial, true);
  assert.equal(row.cleared, false);
});

test('build: an LLM opinion on an obligation a deterministic runner already CLAIMed does NOT crash reconciliation', () => {
  // goodBundle clears node:b1/2.4.7; the LLM ALSO opines on it — two records, one obligation.
  const good = {
    collect: { ...ID, collectedAt: 1000, elements: [{ xpath: 'node:b1', focusable: true }] },
    experiments: { ...ID, catalogVersion: '3.0.0-phase0', startedAt: 2000, results: [{ claimId: 'c1', experimentId: 'focus-visual-retry', targetXpath: 'node:b1', sc: '2.4.7', observationScope: { ...scope('node:b1'), action: 'tab-to' }, outcome: { targetIsFocusable: true, keyboardReachableInState: true, realKeyboardFocus: true, hydrationReady: true, focusDependentIndicator: true, obviouslyVisible: true, stableIndicatorAbsence: true, modeCompletenessProven: true }, applicabilityEvidence: { targetIsFocusable: true, keyboardReachableInState: true } }] },
    claimProposals: { ...ID, proposals: [{ claimId: 'c1', sc: '2.4.7', direction: 'NO_BARRIER_OBSERVED', experimentId: 'focus-visual-retry', claimFamily: 'focus-indicator-visible', observationScope: { ...scope('node:b1'), action: 'tab-to' } }] },
  };
  const b = withPipeline(good);
  b.llm = llmArt([llmVerdict({ observationScope: { ...scope('node:b1'), action: 'tab-to' } })]);
  const r = buildV3(reseal(b), { authority: promoted(['focus-visual-retry/NO_BARRIER_OBSERVED']) });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.ok(!r.errors.some((e) => /duplicate disposition/.test(e)), 'the annotation must NOT create a competing disposition');
  assert.equal(r.results.summary.authoritative, 1, 'the deterministic CLAIM still stands');
  const row = r.results.obligationLedger.find((o) => o.sc === '2.4.7');
  assert.equal(row.disposition, 'CLAIM');
  assert.equal(row.cleared, true);
});

test('build C3: a RAW legacy verdict in the artifact never leaks into the published results', () => {
  const b = withPipeline(baseBundle());
  // agentVerdict REPRODUCED (a legacy token) + an N/A evidenceRef — both must be absent from results.
  b.llm = llmArt([llmVerdict({ agentVerdict: 'REPRODUCED', evidenceRefs: ['N/A', 'ev-2'] })]);
  b.llmRationale = { ...ID, rationales: [{ id: 'lv1#basis', basis: 'the control is N/A in this state per the author' }] };
  const r = buildV3(reseal(b), { authority: promoted([]) });
  assert.equal(r.ok, true, 'structured-only results publish despite raw legacy tokens in the input artifact');
  const blob = JSON.stringify(r.results);
  assert.ok(!/REPRODUCED/.test(blob), 'the raw agent verdict is mapped away — never in results');
  assert.ok(!/"N\/A"/.test(blob), 'no whole-value legacy token reaches the strict-scanned results');
  assert.ok(r.results.shadowObservations.some((o) => o.wouldBe.observationOutcome === 'BARRIER_OBSERVED'));
});

test('build M5: a STALE llm artifact (wrong pageDigest) is REFUSED', () => {
  const b = withPipeline(baseBundle());
  b.llm = llmArt([llmVerdict()], { pageDigest: 'sha256:WRONGPAGE' });
  const r = buildV3(reseal(b), { authority: promoted([]) });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((m) => /pageDigest.*llm|llm.*pageDigest/i.test(m)), JSON.stringify(r.errors));
});

test('build: a malformed llm stage REFUSES the build', () => {
  const b = withPipeline(baseBundle());
  b.llm = { ...ID, verdicts: 'nope' };
  const r = buildV3(reseal(b), { authority: promoted([]) });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((m) => /llm/.test(m)));
});

test('build: adjudicationRecommendations is a DERIVED, structured-only view over the un-promoted source:llm obs', () => {
  const b = withPipeline(baseBundle());
  b.llm = llmArt([llmVerdict()]);
  const r = buildV3(reseal(b), { authority: promoted([]) });
  assert.equal(r.results.summary.adjudicationRecommendations, 1);
  const rec = r.results.adjudicationRecommendations[0];
  assert.equal(rec.authoritative, false);
  assert.equal(rec.eligibleForAuthority, false, 'default-shadow ⇒ not eligible');
  assert.equal(rec.mechanism, 'llm-agent');
  assert.equal(rec.wouldBeOutcome, 'NO_BARRIER_OBSERVED');
  assert.equal(rec.rationaleRef, 'lv1#basis');
  assert.equal(Object.prototype.hasOwnProperty.call(rec, 'agentVerdict'), false, 'no raw verdict in the review queue');
});

// ============================ per-mechanism gold scoring ============================
const scoredResults = () => ({
  claims: [],
  shadowObservations: [
    { source: 'deterministic', mechanism: 'focus-visual-retry', sc: '2.4.7', observationScope: scope('det'), wouldBe: { observationOutcome: 'NO_BARRIER_OBSERVED', wcagApplicability: 'APPLICABLE' } },
    { source: 'llm', mechanism: 'llm-agent', sc: '1.1.1', observationScope: scope('img'), wouldBe: { observationOutcome: 'NO_BARRIER_OBSERVED', wcagApplicability: 'APPLICABLE' } },
    { source: 'llm', mechanism: 'llm-agent', sc: '1.4.1', observationScope: scope('color'), wouldBe: { observationOutcome: 'BARRIER_OBSERVED', wcagApplicability: 'APPLICABLE' } },
    { source: 'llm', mechanism: 'llm-agent', sc: '2.4.2', observationScope: scope('title'), wouldBe: { observationOutcome: 'INCONCLUSIVE', wcagApplicability: 'UNKNOWN' } },
  ],
});
const scoredGold = [
  { xpath: 'det', sc: '2.4.7', goldOutcome: 'NO_BARRIER_OBSERVED' },
  { xpath: 'img', sc: '1.1.1', goldOutcome: 'BARRIER_OBSERVED' },   // an LLM FALSE clear
  { xpath: 'color', sc: '1.4.1', goldOutcome: 'BARRIER_OBSERVED' }, // an LLM TRUE barrier
];

test('scoreClears groups by mechanism — an LLM false clear is scored APART from the clean deterministic clear', () => {
  const s = metrics.scoreClears(scoredResults(), scoredGold);
  assert.equal(s.byMechanism['focus-visual-retry'].falseClears, 0);
  assert.equal(s.byMechanism['llm-agent'].falseClears, 1);
  const llm = metrics.scoreClears(scoredResults(), scoredGold, { mechanism: 'llm-agent' });
  assert.equal(llm.labelledClears, 1);
  assert.equal(llm.falseClears, 1);
  assert.equal(llm.promotionEligible, false, 'a false clear blocks promotion — the clear lane stays deterministic');
});

test('scoreBarriers is ASYMMETRIC and reports the false-barrier rate (review-noise tolerance)', () => {
  const s = metrics.scoreBarriers(scoredResults(), scoredGold, { mechanism: 'llm-agent' });
  assert.equal(s.labelledBarriers, 1);
  assert.equal(s.falseBarriers, 0, 'the one barrier matches gold');
  assert.equal(s.falseBarrierRate, 0);
  assert.equal(s.barrierThreshold, 0.10, 'a false barrier is tolerated up to a small rate (asymmetric vs clears)');
});

test('decisionCoverage exposes abstention — an LLM that punts on hard cases has < 1.0 coverage (H2)', () => {
  const cov = metrics.decisionCoverage(scoredResults(), 'llm-agent');
  assert.equal(cov.decided, 2);   // 1.1.1 clear + 1.4.1 barrier
  assert.equal(cov.abstained, 1); // 2.4.2 INCONCLUSIVE
  assert.equal(cov.coverage, 0.6667);
});

test('scoreMechanism: barrier MAY reach canary (rate within tolerance + adequate coverage); clear may not', () => {
  const m = metrics.scoreMechanism(scoredResults(), scoredGold, 'llm-agent');
  assert.equal(m.clears.promotionEligible, false);
  assert.equal(m.barrierCanaryEligible, true);
});

// ============================ authority: LLM mechanisms cap at canary ============================
test('authority: an LLM mechanism can NEVER be authoritative (capped at canary, H4)', () => {
  const fullProv = { goldRef: 'g', sealedRef: 's', raterRef: 'r', measurementSuiteHash: 'h', modelRef: 'm', promptHash: 'ph', goldBlindedRef: 'gb' };
  const reg = { 'llm-agent/BARRIER_OBSERVED': { state: 'authoritative', readiness: { goldSized: true, sealedEval: true, independentRaters: true, measurementValidated: true }, provenance: fullProv } };
  const a = auth.authorityFor('llm-agent', 'BARRIER_OBSERVED', reg);
  assert.equal(a.mayPublish, false);
  assert.match(a.reason, /capped at canary/);
  assert.ok(auth.validateAuthority(reg).some((m) => /cannot be 'authoritative'/.test(m)), 'the registry itself is rejected');
});

test('authority: an LLM canary promotion REQUIRES sealedEval + model/prompt pinning + gold-blinding (H3/H4/H5)', () => {
  assert.ok(auth.validateAuthority({ 'llm-agent/BARRIER_OBSERVED': { state: 'canary', readiness: { sealedEval: true } } }).some((m) => /modelRef|promptHash|goldBlindedRef/.test(m)), 'missing LLM provenance ⇒ rejected');
  assert.ok(auth.validateAuthority({ 'llm-agent/BARRIER_OBSERVED': { state: 'canary', readiness: {}, provenance: { modelRef: 'm', promptHash: 'p', goldBlindedRef: 'g' } } }).some((m) => /sealedEval/.test(m)), 'missing sealed eval ⇒ rejected');
  const ok = { 'llm-agent/BARRIER_OBSERVED': { state: 'canary', reason: 'canary', readiness: { sealedEval: true }, provenance: { modelRef: 'm', promptHash: 'p', goldBlindedRef: 'g' } } };
  assert.deepEqual(auth.validateAuthority(ok), [], 'a well-formed canary validates');
  const a = auth.authorityFor('llm-agent', 'BARRIER_OBSERVED', ok);
  assert.equal(a.state, 'canary');
  assert.equal(a.mayPublish, false, 'even a valid canary never publishes authoritative');
});

test('authority: rubric mechanisms are recognized as LLM; a deterministic runner is not', () => {
  assert.equal(auth.isLlmMechanism('llm-agent'), true);
  assert.equal(auth.isLlmMechanism('llm-rubric:alt-text-adequacy-v0'), true);
  assert.equal(auth.isLlmMechanism('focus-visual-retry'), false);
  assert.equal(auth.mechanismOf('llm-rubric:alt-text-adequacy-v0/BARRIER_OBSERVED'), 'llm-rubric:alt-text-adequacy-v0');
  assert.equal(auth.authorityFor('llm-agent', 'BARRIER_OBSERVED', {}).mayPublish, false, 'no entry ⇒ default shadow');
});

// ============================ producer (offline; injectable agent) ============================
test('selectSubjects prioritizes auto-PARTIAL obligations and collapses to (element, skill)', () => {
  const collect = { elements: [{ xpath: 'node:b1', focusable: true }] };
  const ledger = [
    { xpath: 'node:b1', sc: '2.4.7', claimFamily: 'focus-indicator-visible', disposition: 'CLAIM', autoPartial: false },
    { xpath: 'node:b1', sc: '2.1.1', claimFamily: 'keyboard-operable', disposition: 'PARTIAL', autoPartial: true },
  ];
  const subjects = llmAdj.selectSubjects(collect, ledger);
  assert.ok(subjects.some((s) => s.skill === 'keyboard-operability'), 'the runner-less auto-PARTIAL is judged');
  assert.ok(!subjects.some((s) => s.skill === 'focus-visibility'), 'the already-CLAIMed obligation is NOT re-judged');
});

test('runAdjudication: a stub agent produces structured verdicts + a side rationale; the default agent REFUSES', async () => {
  const subjects = [{ xpath: 'node:b1', skill: 'keyboard-operability', sc: '2.1.1', claimFamily: 'keyboard-operable', element: { xpath: 'node:b1', focusable: false } }];
  const stub = async () => ({ verdict: 'REPRODUCED', confidence: 'high', summary: 'The control is not keyboard operable. Extra.', reasoning: 'No focus and no key handler were observed on the element. Extra.', evidenceRefs: ['e1'] });
  const transcriptByXpath = { 'node:b1': { phrase: 'button', name: '', role: 'button', states: '', axName: '', rawName: 'Apple' } };
  const { llm, llmRationale } = await llmAdj.runAdjudication(subjects, { runAgent: stub, transcriptByXpath, ...ID });
  assert.equal(llm.verdicts.length, 1);
  assert.equal(llm.verdicts[0].agentVerdict, 'REPRODUCED');
  assert.equal(llm.model, null); // not pinned in this stub run
  // ANNOTATION COMPANION: 1-sentence summary + reasoning + the EVIDENCE the LLM saw (signals + VSR).
  const r = llmRationale.rationales[0];
  assert.equal(r.summary, 'The control is not keyboard operable.', 'summary is trimmed to one sentence');
  assert.match(r.reasoning, /^No focus and no key handler were observed on the element\.$/, 'reasoning is one sentence');
  assert.ok(r.evidence && r.evidence.signals && r.evidence.signals.keyboard, 'the deterministic signals the LLM saw are recorded');
  assert.equal(r.evidence.vsr.role, 'button', 'the VSR announcement is recorded for the annotator');
  assert.equal(r.targetXpath, 'node:b1');
  // the produced artifact round-trips cleanly through the consumer:
  const { shadowObservations, errors } = llmAdj.processLlm(llm);
  assert.deepEqual(errors, []);
  assert.equal(shadowObservations[0].wouldBe.observationOutcome, 'BARRIER_OBSERVED');
  // default (no runAgent) refuses → no verdicts, no accidental API call.
  const empty = await llmAdj.runAdjudication(subjects, { ...ID });
  assert.equal(empty.llm.verdicts.length, 0);
});

// ============================ adversarial regressions (skeptic round) ============================
test('adversarial HIGH: a BOXED String legacy token (claimFamily) can NEVER leak into published results', () => {
  const b = withPipeline(baseBundle());
  // `new String('N/A')` is typeof 'object' (evades a naive typeof-string scan) but serializes to "N/A".
  b.llm = llmArt([llmVerdict({ claimFamily: new String('N/A') })]); // eslint-disable-line no-new-wrappers
  const r = buildV3(reseal(b), { authority: promoted([]) });
  assert.equal(r.ok, false, 'the boxed-wrapper legacy token must be REFUSED, not published');
  assert.ok(r.errors.some((m) => /legacy verdict token/.test(m)), JSON.stringify(r.errors));
  // and even the strict scanner is hardened: a boxed token in results is caught as a backstop.
  const xa = require('../lib/cross-artifact.js');
  assert.ok(xa.findLegacyLabelStrict({ x: new String('N/A') }), 'strict scan coerces boxed primitives'); // eslint-disable-line no-new-wrappers
});

test('adversarial MED: a legacy token in a structural field fails EARLY with a clear message (not the terminal strict scan)', () => {
  for (const over of [{ verdictId: 'N/A' }, { targetXpath: 'N/A' }, { rationaleRef: 'N/A' }, { observationScope: { ...scope('node:b1'), state: 'N/A' } }]) {
    const { errors } = llmAdj.processLlm(llmArt([llmVerdict(over)]));
    assert.ok(errors.some((m) => /legacy verdict token/.test(m)), `${JSON.stringify(over)} → ${JSON.stringify(errors)}`);
  }
  // judgments lane too
  const judgments = require('../lib/judgments.js');
  const j = { judgmentId: 'j1', sc: '1.1.1', targetXpath: 'node:img', rubricRef: 'r', verdict: 'LIKELY_OK', claimFamily: 'N/A' };
  assert.ok(judgments.processJudgments({ judgments: [j] }).errors.some((m) => /legacy verdict token/.test(m)));
});

test('adversarial MED: precomputeSignals does NOT crash on a malformed element (one bad element can\'t deny the lane)', () => {
  assert.doesNotThrow(() => llmAdj.precomputeSignals({ xpath: 'x', fg: {}, bg: {}, box: 'nope' }, 'color-and-visual-text'));
  assert.doesNotThrow(() => llmAdj.precomputeSignals(null, 'keyboard-operability'));
});

test('adversarial LOW: a contradictory BARRIER+INAPPLICABLE record is not double-counted across directions', () => {
  const results = { claims: [], shadowObservations: [{ source: 'llm', mechanism: 'llm-agent', sc: '1.1.1', observationScope: scope('x'), wouldBe: { observationOutcome: 'BARRIER_OBSERVED', wcagApplicability: 'INAPPLICABLE' } }] };
  const gold = [{ xpath: 'x', sc: '1.1.1', goldOutcome: 'BARRIER_OBSERVED' }];
  assert.equal(metrics.scoreClears(results, gold).labelledClears, 1, 'INAPPLICABLE counts as a clear');
  assert.equal(metrics.scoreBarriers(results, gold).labelledBarriers, 0, 'and NOT also as a barrier');
});
