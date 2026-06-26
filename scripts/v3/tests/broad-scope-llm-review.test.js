'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const review = require('../lib/broad-scope-llm-review.js');
const judgments = require('../lib/judgments.js');
const { buildV3 } = require('../lib/build-v3.js');

const ID = { file: 'p', runId: 'R', pageDigest: 'sha256:d' };

test('broad-scope LLM prompts encode absence-is-not-pass and strict JSON expectations', () => {
  const packet = { aspect: 'text-spacing', evidenceRefs: ['vis1'], observation: 'after spacing text clipped' };
  const judge = review.buildJudgePrompt(packet);
  const critic = review.buildCriticPrompt(packet, { verdict: 'LIKELY_BARRIER' });
  assert.match(judge[0].content, /strict JSON/i);
  assert.match(judge[1].content, /Do not clear from absence/);
  assert.match(critic[0].content, /adversarial WCAG/i);
  assert.match(critic[1].content, /PARTIAL\/UNCERTAIN/);
});

test('media sidecar prompts are barrier-or-uncertain and encode the SC-specific alternative matrix', () => {
  const packet = {
    aspect: 'media-alternative-inventory',
    sc: '1.2.5',
    rawSc: '1.2.5',
    evidenceRefs: ['media'],
    observed: { detail: 'description track omits on-screen warning text' },
  };
  const judge = review.buildJudgePrompt(packet);
  const body = JSON.parse(judge[1].content);
  assert.deepEqual(body.allowedVerdicts, ['LIKELY_BARRIER', 'UNCERTAIN']);
  assert.match(body.task, /must not clear conformance/i);
  assert(body.rules.some((r) => /1\.2\.2.*captions/i.test(r)));
  assert(body.rules.some((r) => /1\.2\.3.*audio description.*media alternative/i.test(r)));
  assert(body.rules.some((r) => /1\.2\.5.*audio description/i.test(r)));
  assert(body.rules.some((r) => /Judge only the scoped SC/i.test(r)));
  assert(body.rules.some((r) => /screenshots corroborate target ownership/i.test(r)));
  assert(body.rules.some((r) => /Adequate alternatives.*UNCERTAIN/i.test(r)));
});

test('keyboard-trap prompts are barrier-or-uncertain and encode escape/advised-exit controls', () => {
  const packet = {
    aspect: 'keyboard-trap',
    sc: '2.1.2',
    rawSc: '2.1.2',
    evidenceRefs: ['trap'],
    observed: { detail: 'trusted tab cycle stayed in modal with no escape advice' },
  };
  const judge = review.buildJudgePrompt(packet);
  const body = JSON.parse(judge[1].content);
  assert.deepEqual(body.allowedVerdicts, ['LIKELY_BARRIER', 'UNCERTAIN']);
  assert(body.rules.some((r) => /trusted keyboard traversal/i.test(r)));
  assert(body.rules.some((r) => /Tab, Shift\+Tab, Escape, or an advised key sequence/i.test(r)));
  assert(body.rules.some((r) => /single-focusable page.*not proof/i.test(r)));
});

test('audio-control prompts are barrier-or-uncertain and encode muted/control/playback safeguards', () => {
  const packet = {
    aspect: 'audio-control',
    sc: '1.4.2',
    rawSc: '1.4.2',
    evidenceRefs: ['audio'],
    observed: { detail: 'known non-silent audio autoplayed for more than three seconds without controls' },
  };
  const judge = review.buildJudgePrompt(packet);
  const body = JSON.parse(judge[1].content);
  assert.deepEqual(body.allowedVerdicts, ['LIKELY_BARRIER', 'UNCERTAIN']);
  assert(body.rules.some((r) => /audible non-muted audio.*start automatically.*more than three seconds/i.test(r)));
  assert(body.rules.some((r) => /Muted media, native controls, independent page controls/i.test(r)));
  assert(body.rules.some((r) => /screenshots are contextual only/i.test(r)));
});

test('character-shortcut prompts are barrier-or-uncertain and encode exception safeguards', () => {
  const packet = {
    aspect: 'character-shortcut',
    sc: '2.1.4',
    rawSc: '2.1.4',
    evidenceRefs: ['shortcut'],
    observed: { detail: 'single key x changed page state' },
  };
  const judge = review.buildJudgePrompt(packet);
  const body = JSON.parse(judge[1].content);
  assert.deepEqual(body.allowedVerdicts, ['LIKELY_BARRIER', 'UNCERTAIN']);
  assert(body.rules.some((r) => /trusted single printable character key changes page state/i.test(r)));
  assert(body.rules.some((r) => /modified-key shortcuts.*focus-only shortcuts.*working off\/remap control/i.test(r)));
  assert(body.rules.some((r) => /visible off\/remap\/settings control counts only when.*prevented/i.test(r)));
});

test('status-announcement prompts are barrier-or-uncertain and encode programmatic-channel safeguards', () => {
  const packet = {
    aspect: 'status-announcement',
    sc: '4.1.3',
    rawSc: '4.1.3',
    evidenceRefs: ['status'],
    observed: { detail: 'trusted activation changed visible status text without live semantics' },
  };
  const judge = review.buildJudgePrompt(packet);
  const body = JSON.parse(judge[1].content);
  assert.deepEqual(body.allowedVerdicts, ['LIKELY_BARRIER', 'UNCERTAIN']);
  assert(body.rules.some((r) => /trusted activation creates or changes visible status information/i.test(r)));
  assert(body.rules.some((r) => /role=status.*role=alert.*role=log.*aria-live/i.test(r)));
  assert(body.rules.some((r) => /No observed status message change.*UNCERTAIN/i.test(r)));
  assert(body.rules.some((r) => /no registered publication claim family/i.test(r)));
});

test('target-size prompts are barrier-or-uncertain and encode exception safeguards', () => {
  const packet = {
    aspect: 'target-size-minimum',
    sc: '2.5.8',
    rawSc: '2.5.8',
    evidenceRefs: ['target-size'],
    observed: { detail: '18 by 18 pointer target with adjacent target intersection' },
  };
  const judge = review.buildJudgePrompt(packet);
  const body = JSON.parse(judge[1].content);
  assert.deepEqual(body.allowedVerdicts, ['LIKELY_BARRIER', 'UNCERTAIN']);
  assert(body.rules.some((r) => /smaller than 24 by 24 CSS pixels/i.test(r)));
  assert(body.rules.some((r) => /24px circle spacing test intersects another target/i.test(r)));
  assert(body.rules.some((r) => /inline\/in-sentence/i.test(r)));
  assert(body.rules.some((r) => /equivalent/i.test(r)));
  assert(body.rules.some((r) => /user-agent-control/i.test(r)));
  assert(body.rules.some((r) => /essential/i.test(r)));
  assert(body.rules.some((r) => /clean scoped control.*conformance pass/i.test(r)));
});

test('label-in-name prompts are barrier-or-uncertain and encode visible-label containment safeguards', () => {
  const packet = {
    aspect: 'label-in-name',
    sc: '2.5.3',
    rawSc: '2.5.3',
    evidenceRefs: ['label'],
    observed: { detail: 'visible label Pay now has accessible name Submit order' },
  };
  const judge = review.buildJudgePrompt(packet);
  const body = JSON.parse(judge[1].content);
  assert.deepEqual(body.allowedVerdicts, ['LIKELY_BARRIER', 'UNCERTAIN']);
  assert(body.rules.some((r) => /visible text label.*accessible name.*does not contain/i.test(r)));
  assert(body.rules.some((r) => /visible label contained anywhere in the accessible name/i.test(r)));
  assert(body.rules.some((r) => /Label at the start.*best practice/i.test(r)));
  assert(body.rules.some((r) => /image-of-text labels.*localization.*mathematical symbols/i.test(r)));
  assert(body.rules.some((r) => /clean scoped control.*conformance pass/i.test(r)));
});

test('accessible-authentication prompts are barrier-or-uncertain and encode 3.3.8 exceptions', () => {
  const packet = {
    aspect: 'accessible-authentication',
    sc: '3.3.8',
    evidenceRefs: ['auth'],
    observed: { detail: 'password recall with no allowed alternative' },
  };
  const judge = review.buildJudgePrompt(packet);
  const body = JSON.parse(judge[1].content);
  assert.deepEqual(body.allowedVerdicts, ['LIKELY_BARRIER', 'UNCERTAIN']);
  assert.match(body.task, /must not clear conformance/i);
  assert(body.rules.some((r) => /authentication process/i.test(r)));
  assert(body.rules.some((r) => /cognitive function test/i.test(r)));
  assert(body.rules.some((r) => /password-manager.*paste.*autocomplete.*passkey.*magic-link/i.test(r)));
  assert(body.rules.some((r) => /CAPTCHA-like surface/i.test(r)));
});

test('redundant-entry prompts are barrier-or-uncertain and encode 3.3.7 exceptions', () => {
  const packet = {
    aspect: 'redundant-entry-review',
    sc: '3.3.7',
    evidenceRefs: ['redundant'],
    observed: { detail: 'same email required again with no reuse mechanism' },
  };
  const judge = review.buildJudgePrompt(packet);
  const body = JSON.parse(judge[1].content);
  assert.deepEqual(body.allowedVerdicts, ['LIKELY_BARRIER', 'UNCERTAIN']);
  assert.match(body.task, /must not clear conformance/i);
  assert(body.rules.some((r) => /previously entered by or provided to the user/i.test(r)));
  assert(body.rules.some((r) => /same information.*required again/i.test(r)));
  assert(body.rules.some((r) => /auto-populated.*available for selection.*security.*invalid.*essential/i.test(r)));
  assert(body.rules.some((r) => /one clean field pair/i.test(r)));
});

test('plain-language prompts are barrier-or-uncertain and encode 3.1.5 safeguards', () => {
  const packet = {
    aspect: 'plain-language-research',
    sc: '3.1.5',
    evidenceRefs: ['reading'],
    observed: { detail: 'required text above lower secondary with no supplement' },
  };
  const judge = review.buildJudgePrompt(packet);
  const body = JSON.parse(judge[1].content);
  assert.deepEqual(body.allowedVerdicts, ['LIKELY_BARRIER', 'UNCERTAIN']);
  assert.match(body.task, /must not clear conformance/i);
  assert(body.rules.some((r) => /SC 3\.1\.5 is AAA/i.test(r)));
  assert(body.rules.some((r) => /proper names and titles/i.test(r)));
  assert(body.rules.some((r) => /supplemental content.*lower-secondary version/i.test(r)));
  assert(body.rules.some((r) => /sentence length.*acronym count.*alone/i.test(r)));
  assert(body.rules.some((r) => /language or method is unsupported/i.test(r)));
});

test('judge barrier with agreeing critic remains a likely barrier', async () => {
  const out = await review.runBroadScopeLlmReview(
    {
      aspect: 'forced-colors',
      evidenceRefs: ['broad-vis:fc'],
      observed: {
        evidenceClaims: ['forced-colors-render', 'essential-meaning-or-affordance-loss'],
        observation: 'text invisible under forced colors',
      },
    },
    {
      runJudge: async () => ({ verdict: 'LIKELY_BARRIER', confidence: 'high', evidenceRefs: ['broad-vis:fc'], reasoning: 'essential text disappears' }),
      runCritic: async () => ({ response: 'AGREE', reason: 'positive visual evidence and no exception' }),
    },
  );
  assert.equal(out.verdict, 'LIKELY_BARRIER');
  assert.equal(out.confidence, 'high');
});

test('discovery-only aspects clamp agreed barrier verdicts to uncertain', async () => {
  for (const aspect of ['reveal-state-discovery', 'visual-structure-discovery', 'visual-content-discovery']) {
    const out = await review.runBroadScopeLlmReview(
      { aspect, evidenceRefs: ['broad:discovery'], observation: 'discovery surface found' },
      {
        runJudge: async () => ({ verdict: 'LIKELY_BARRIER', confidence: 'high', evidenceRefs: ['broad:discovery'], reasoning: 'model overread discovery as failure' }),
        runCritic: async () => ({ response: 'AGREE', reason: 'mistakenly agreed' }),
      },
    );
    assert.equal(out.verdict, 'UNCERTAIN', aspect);
    assert.equal(out.confidence, 'low', aspect);
    assert.match(out.reasoning, /discovery-only/);
  }
});

test('judge clear with agreeing critic remains a likely ok recommendation', async () => {
  const out = await review.runBroadScopeLlmReview(
    { aspect: 'text-spacing', evidenceRefs: ['vis-neg'], observation: 'text wraps and remains available' },
    {
      runJudge: async () => ({ verdict: 'LIKELY_OK', confidence: 'medium', evidenceRefs: ['vis-neg'], reasoning: 'negative fixture remains readable' }),
      runCritic: async () => ({ response: 'AGREE', reason: 'visual agreement supports no barrier in scoped fixture' }),
    },
  );
  assert.equal(out.verdict, 'LIKELY_OK');
  assert.equal(out.confidence, 'medium');
});

test('critic dispute collapses a proposed clear to UNCERTAIN', async () => {
  const out = await review.runBroadScopeLlmReview(
    { aspect: 'audio-control', evidenceRefs: ['dom'], observation: 'no audio heard by static probe' },
    {
      runJudge: async () => ({ verdict: 'LIKELY_OK', confidence: 'high', evidenceRefs: ['dom'], reasoning: 'no control needed' }),
      runCritic: async () => ({ response: 'DISPUTE', reason: 'offline browser may have blocked autoplay; absence of playback is not proof' }),
    },
  );
  assert.equal(out.verdict, 'UNCERTAIN');
  assert.equal(out.confidence, 'low');
  assert.match(out.reasoning, /offline browser/);
});

test('aspect allowedVerdicts clamp disallowed clears to UNCERTAIN', async () => {
  const out = await review.runBroadScopeLlmReview(
    { aspect: 'redundant-entry-review', evidenceRefs: ['redundant'], observed: { evidenceClaims: ['auto-populate-selection-or-exception-declared'] } },
    {
      runJudge: async () => ({ verdict: 'LIKELY_OK', confidence: 'high', evidenceRefs: ['redundant'], reasoning: 'model tried to clear a scoped control' }),
      runCritic: async () => ({ response: 'AGREE', reason: 'critic mistakenly agreed' }),
    },
  );
  assert.equal(out.verdict, 'UNCERTAIN');
  assert.equal(out.confidence, 'low');
  assert.match(out.reasoning, /does not allow LIKELY_OK/);
});

test('malformed judge or critic output fails closed to UNCERTAIN', async () => {
  const badJudge = await review.runBroadScopeLlmReview(
    { aspect: 'media' },
    { runJudge: async () => 'not json', runCritic: async () => ({ response: 'AGREE' }) },
  );
  assert.equal(badJudge.verdict, 'UNCERTAIN');

  const badCritic = await review.runBroadScopeLlmReview(
    { aspect: 'media' },
    { runJudge: async () => ({ verdict: 'LIKELY_BARRIER', confidence: 'high' }), runCritic: async () => 'wat' },
  );
  assert.equal(badCritic.verdict, 'UNCERTAIN');
});

test('reviewToJudgment maps only known v3 SC/family/target packets into the existing judgment lane', () => {
  const packet = {
    aspect: 'reduced-motion',
    sc: '2.2.2',
    claimFamily: 'motion-control',
    targetXpath: '/m',
    evidenceRefs: ['broad:motion'],
    observed: { evidenceClaims: ['auto-motion-persists', 'duration-or-looping', 'no-working-pause-stop-hide', 'parallel-non-essential-content'] },
  };
  const j = review.reviewToJudgment(packet, { verdict: 'LIKELY_BARRIER', confidence: 'high', evidenceRefs: ['broad:motion'] });
  assert.equal(j.sc, '2.2.2');
  assert.equal(j.claimFamily, 'motion-control');
  assert.equal(j.targetXpath, '/m');
  assert.equal(j.observationScope.actionTargetRef, '/m');
  assert.equal(j.verdict, 'LIKELY_BARRIER');
  assert.deepEqual(judgments.validateJudgmentsShape({ judgments: [j] }), []);

  assert.equal(review.reviewToJudgment({ sc: 'EN-C.9.7', claimFamily: 'forced-colors', targetXpath: '/x' }, { verdict: 'LIKELY_BARRIER' }), null);
  assert.equal(review.reviewToJudgment({ sc: '2.2.2', claimFamily: 'fictional-motion-family', targetXpath: '/m' }, { verdict: 'LIKELY_BARRIER' }), null);
  assert.equal(review.reviewToJudgment({ sc: '1.4.3', claimFamily: 'motion-control', targetXpath: '/m' }, { verdict: 'LIKELY_BARRIER' }), null);
  assert.equal(review.reviewToJudgment({ sc: '2.2.2', claimFamily: 'motion-control' }, { verdict: 'LIKELY_BARRIER' }), null);
  assert.equal(review.reviewToJudgment(packet, { verdict: 'LIKELY_OK', confidence: 'high', evidenceRefs: ['broad:motion'] }), null, 'broad-scope clears are sidecar-only by default');
  assert.equal(review.reviewToJudgment(packet, { verdict: 'LIKELY_OK', confidence: 'high', evidenceRefs: ['broad:motion'] }, { allowClearJudgments: true }), null, 'no-human broad-scope bridge has no clear-lifting escape hatch');
  assert.equal(review.reviewToJudgment(
    { aspect: 'reduced-motion', sc: '2.2.2', claimFamily: 'motion-control', targetXpath: '/m', evidenceRefs: ['broad:motion'] },
    { verdict: 'LIKELY_BARRIER', confidence: 'high', evidenceRefs: ['broad:motion'] },
  ), null, 'LLM agreement alone cannot lift a packet without structural evidence claims');
  assert.equal(review.reviewToJudgment(
    {
      aspect: 'reduced-motion',
      sc: '2.2.2',
      claimFamily: 'motion-control',
      targetXpath: '/m',
      evidenceRefs: ['broad:motion'],
      observed: { evidenceClaims: ['auto-motion-persists', 'duration-or-looping', 'no-working-pause-stop-hide'] },
    },
    { verdict: 'LIKELY_BARRIER', confidence: 'high', evidenceRefs: ['broad:motion'] },
  ), null, 'motion-control also needs parallel/non-essential scope evidence before lifting');
});

test('buildReviewPacketsFromBroadScope creates bounded LLM packets without converting review-only aspects', () => {
  const packets = review.buildReviewPacketsFromBroadScope({
    file: 'p', runId: 'R', pageDigest: 'sha256:d',
    scopeWarnings: ['cross-origin-frame-untested'],
    visualChecks: [{ id: 'vis1', detector: 'reduced-motion', xpath: '/m', agreement: true }],
    findings: [
      { detector: 'reduced-motion', sc: '2.2.2', kind: 'candidate', xpath: '/m', detail: 'motion persists', visualRef: 'vis1' },
      { detector: 'forced-colors', sc: 'EN-C.9.7', kind: 'candidate', xpath: '/fc', detail: 'forced-color-adjust:none', visualRef: 'vis2' },
      { detector: 'pointer-operation', sc: '2.5.1/2.5.2/2.5.7', kind: 'candidate', xpath: '/drag', detail: 'drag surface' },
    ],
  });
  assert.equal(packets.length, 3);
  const motion = packets.find((p) => p.aspect === 'reduced-motion');
  assert.equal(motion.sc, '2.2.2');
  assert.equal(motion.claimFamily, 'motion-control');
  assert.equal(motion.observed.visualAgreement, true);
  assert.deepEqual(motion.observed.evidenceClaims, []);
  assert(motion.requiredEvidence.includes('no-working-pause-stop-hide'));
  assert(motion.requiredEvidence.includes('parallel-non-essential-content'));
  assert(motion.questions.some((q) => /pause, stop, hide/i.test(q)));
  assert.equal(review.reviewToJudgment(motion, { verdict: 'LIKELY_BARRIER', confidence: 'high', evidenceRefs: motion.evidenceRefs }), null);
  const provenMotion = review.buildReviewPacketsFromBroadScope({
    findings: [{
      detector: 'reduced-motion',
      sc: '2.2.2',
      kind: 'candidate',
      xpath: '/m',
      detail: 'motion persists and no control exists',
      evidenceClaims: ['auto-motion-persists', 'duration-or-looping', 'no-working-pause-stop-hide', 'parallel-non-essential-content'],
    }],
  })[0];
  assert.equal(review.structuralEvidenceStatus(provenMotion).ok, true);
  assert.equal(review.reviewToJudgment(provenMotion, { verdict: 'LIKELY_BARRIER', confidence: 'high', evidenceRefs: provenMotion.evidenceRefs }).claimFamily, 'motion-control');

  const forced = packets.find((p) => p.aspect === 'forced-colors');
  assert.equal(forced.sc, 'EN-C.9.7');
  assert.equal(forced.claimFamily, null);
  assert.equal(review.reviewToJudgment(forced, { verdict: 'LIKELY_BARRIER' }), null);

  const pointer = packets.find((p) => p.aspect === 'pointer-operation');
  assert.equal(pointer.sc, '2.5.1');
  assert.equal(pointer.rawSc, '2.5.1/2.5.2/2.5.7');
  assert.deepEqual(pointer.relatedScs, ['2.5.1', '2.5.2', '2.5.7']);
  assert.equal(pointer.claimFamily, null);
  assert(pointer.limitations.some((l) => /No registered v3 claim family/.test(l)));

  const captcha = review.buildReviewPacketsFromBroadScope({
    findings: [{ detector: 'captcha-authentication', sc: '3.3.8/1.1.1', xpath: '#captcha', detail: 'captcha-like surface' }],
  })[0];
  assert.equal(captcha.sc, '3.3.8');
  assert.deepEqual(captcha.relatedScs, ['3.3.8', '1.1.1']);
  assert.equal(review.reviewToJudgment(captcha, { verdict: 'LIKELY_BARRIER' }), null);
});

test('process and site-set analyses create scope packets only when warnings exist by default', () => {
  const processPackets = review.buildReviewPacketsFromProcessAnalysis({
    kind: 'process-scope',
    stepCount: 3,
    warnings: ['process-step-missing-target:pay', 'process-step-duplicate:start'],
  }, { id: 'process-p1' });
  assert.equal(processPackets.length, 1);
  assert.equal(processPackets[0].aspect, 'complete-process');
  assert.equal(processPackets[0].targetXpath, null);
  assert(processPackets[0].limitations.some((l) => /Process-scope/.test(l)));
  assert.deepEqual(review.buildReviewPacketsFromProcessAnalysis({ kind: 'process-scope', warnings: [] }), []);

  const sitePackets = review.buildReviewPacketsFromSiteSetAnalysis({
    kind: 'site-set-scope',
    pageCount: 2,
    duplicateTitles: [{ title: 'help', count: 2 }],
    warnings: ['duplicate-page-title-in-set'],
  }, { id: 'site-p1' });
  assert.equal(sitePackets.length, 1);
  assert.equal(sitePackets[0].aspect, 'site-set-consistency');
  assert.equal(sitePackets[0].targetXpath, null);
  assert(sitePackets[0].limitations.some((l) => /Site-set/.test(l)));
  assert.deepEqual(review.buildReviewPacketsFromSiteSetAnalysis({ kind: 'site-set-scope', warnings: [] }), []);
});

test('complete-process control packets are opt-in and cannot clear conformance', () => {
  const packets = review.buildReviewPacketsFromProcessAnalysis({
    kind: 'process-scope',
    stepCount: 2,
    requiredStepIds: ['cart', 'pay'],
    measuredStepIds: ['cart', 'pay'],
    evidenceClaims: ['declared-process-steps', 'process-scope-comparison', 'all-required-steps-measured', 'per-step-results'],
    warnings: [],
  }, { id: 'process-n1', includeControls: true });

  assert.equal(packets.length, 1);
  assert.equal(packets[0].aspect, 'complete-process');
  const promptBody = JSON.parse(review.buildJudgePrompt(packets[0])[1].content);
  assert.deepEqual(promptBody.allowedVerdicts, ['LIKELY_BARRIER', 'UNCERTAIN']);
  assert(promptBody.rules.some((r) => /clean or fully measured process manifest/i.test(r)));
  assert(promptBody.rules.some((r) => /coverage gaps, not as barriers/i.test(r)));
  assert.equal(review.structuralEvidenceStatus(packets[0]).ok, false);
  assert(review.structuralEvidenceStatus(packets[0]).missing.includes('process-failure-observed'));
  assert.equal(review.reviewToJudgment(packets[0], { verdict: 'LIKELY_BARRIER' }), null);
  assert.equal(review.reviewToJudgment(packets[0], { verdict: 'UNCERTAIN' }), null);
});

test('complete-process coverage gaps are scoped uncertainty, not barrier-ready evidence', () => {
  const packets = review.buildReviewPacketsFromProcessAnalysis({
    kind: 'process-scope',
    stepCount: 2,
    requiredStepIds: ['cart', 'pay'],
    measuredStepIds: ['cart'],
    missingRequiredSteps: ['pay'],
    evidenceClaims: ['declared-process-steps', 'process-scope-comparison', 'process-coverage-gap-observed'],
    warnings: ['process-required-step-unmeasured:pay'],
  }, { id: 'process-gap' });

  assert.equal(packets.length, 1);
  assert.equal(review.structuralEvidenceStatus(packets[0]).ok, false);
  assert(review.structuralEvidenceStatus(packets[0]).claims.includes('process-coverage-gap-observed'));
  assert(review.structuralEvidenceStatus(packets[0]).missing.includes('process-failure-observed'));
});

test('complete-process coverage-gap overclaim is clamped to uncertain in sidecar rationale', async () => {
  const packet = review.buildReviewPacketsFromProcessAnalysis({
    kind: 'process-scope',
    stepCount: 2,
    requiredStepIds: ['cart', 'pay'],
    measuredStepIds: ['cart'],
    missingRequiredSteps: ['pay'],
    evidenceClaims: ['declared-process-steps', 'process-scope-comparison', 'process-coverage-gap-observed'],
    warnings: ['process-required-step-unmeasured:pay'],
  }, { id: 'process-gap' })[0];

  const out = await review.runBroadScopePacketReviews({
    file: 'process-gap.json',
    runId: 'R',
    pageDigest: 'sha256:process-gap',
    reviewPackets: [packet],
  }, {
    runJudge: async () => ({
      verdict: 'LIKELY_BARRIER',
      confidence: 'high',
      evidenceRefs: ['process-manifest'],
      summary: 'overclaimed coverage gap',
      reasoning: 'missing required process step',
    }),
    runCritic: async () => ({ response: 'AGREE', reason: 'intentionally bad critic for regression' }),
  });

  assert.equal(out.broadScopeRationale.rationales[0].verdict, 'UNCERTAIN');
  assert.match(out.broadScopeRationale.rationales[0].reasoning, /missing process-failure-observed/);
  assert.equal(out.judgments.judgments.length, 0);
});

test('site-set controls are opt-in and coverage gaps are not barrier-ready', async () => {
  const control = review.buildReviewPacketsFromSiteSetAnalysis({
    kind: 'site-set-scope',
    pageCount: 2,
    sameStateBreakpointContext: true,
    comparisonCounts: { navigationLists: 2 },
    evidenceClaims: ['declared-page-set', 'same-state-breakpoint-context', 'repeated-mechanism-comparison'],
    warnings: [],
  }, { id: 'site-n1', includeControls: true })[0];
  assert.equal(control.aspect, 'site-set-consistency');
  assert.deepEqual(JSON.parse(review.buildJudgePrompt(control)[1].content).allowedVerdicts, ['LIKELY_BARRIER', 'UNCERTAIN']);
  assert.equal(review.structuralEvidenceStatus(control).ok, false);
  assert(review.structuralEvidenceStatus(control).missing.includes('site-set-inconsistency-observed'));
  assert.equal(review.reviewToJudgment(control, { verdict: 'LIKELY_BARRIER' }), null);

  const scopeGap = review.buildReviewPacketsFromSiteSetAnalysis({
    kind: 'site-set-scope',
    pageCount: 2,
    sameStateBreakpointContext: false,
    comparisonCounts: { navigationLists: 2 },
    evidenceClaims: ['declared-page-set', 'repeated-mechanism-comparison', 'site-set-scope-gap-observed'],
    warnings: ['site-set-state-breakpoint-context-unproven'],
  }, { id: 'site-gap' })[0];
  assert.equal(review.structuralEvidenceStatus(scopeGap).ok, false);
  assert(review.structuralEvidenceStatus(scopeGap).claims.includes('site-set-scope-gap-observed'));
  assert(review.structuralEvidenceStatus(scopeGap).missing.includes('same-state-breakpoint-context'));
  assert(review.structuralEvidenceStatus(scopeGap).missing.includes('site-set-inconsistency-observed'));

  const out = await review.runBroadScopePacketReviews({
    file: 'site-gap.json',
    runId: 'R',
    pageDigest: 'sha256:site-gap',
    reviewPackets: [scopeGap],
  }, {
    runJudge: async () => ({
      verdict: 'LIKELY_BARRIER',
      confidence: 'high',
      evidenceRefs: ['site-set-manifest'],
      summary: 'overclaimed scope gap',
      reasoning: 'same breakpoint context is unproven',
    }),
    runCritic: async () => ({ response: 'AGREE', reason: 'intentionally bad critic for regression' }),
  });
  assert.equal(out.broadScopeRationale.rationales[0].verdict, 'UNCERTAIN');
  assert.match(out.broadScopeRationale.rationales[0].reasoning, /site-set-inconsistency-observed/);
  assert.equal(out.judgments.judgments.length, 0);
});

test('site-set scope gaps disqualify barrier-ready packets even with an inconsistency', async () => {
  const packet = review.buildReviewPacketsFromSiteSetAnalysis({
    kind: 'site-set-scope',
    pageCount: 2,
    sameStateBreakpointContext: true,
    comparisonCounts: { navigationLists: 2 },
    evidenceClaims: [
      'declared-page-set',
      'same-state-breakpoint-context',
      'repeated-mechanism-comparison',
      'site-set-scope-gap-observed',
      'site-set-inconsistency-observed',
    ],
    warnings: ['site-page-missing-url', 'duplicate-page-title-in-set'],
  }, { id: 'site-mixed-gap' })[0];

  const status = review.structuralEvidenceStatus(packet);
  assert.equal(status.ok, false);
  assert(status.disqualifyingFound.includes('site-set-scope-gap-observed'));
  assert.equal(status.missing.length, 0);

  const out = await review.runBroadScopePacketReviews({
    file: 'site-mixed-gap.json',
    runId: 'R',
    pageDigest: 'sha256:site-mixed-gap',
    reviewPackets: [packet],
  }, {
    runJudge: async () => ({
      verdict: 'LIKELY_BARRIER',
      confidence: 'high',
      evidenceRefs: ['site-set-manifest'],
      summary: 'overclaimed mixed scope gap',
      reasoning: 'duplicate title exists but one page URL is missing',
    }),
    runCritic: async () => ({ response: 'AGREE', reason: 'intentionally bad critic for regression' }),
  });
  assert.equal(out.broadScopeRationale.rationales[0].verdict, 'UNCERTAIN');
  assert.match(out.broadScopeRationale.rationales[0].reasoning, /site-set-scope-gap-observed/);
  assert.equal(out.judgments.judgments.length, 0);
});

test('media adequate alternatives are scoped controls, not barrier-ready or clears', async () => {
  const packet = {
    packetId: 'media-control:n1',
    aspect: 'media-alternative-inventory',
    detector: 'media-alternative-inventory',
    sc: '1.2.2',
    rawSc: '1.2.2',
    targetXpath: '#target',
    observed: {
      evidenceClaims: ['owned-media-element', 'media-content-model-observed', 'adequate-alternative-or-exception-observed'],
      fixtureMeta: { mediaType: 'synchronized-video', audioContent: 'chef says add salt and pepper', captionText: 'chef says add salt and pepper' },
      warnings: [],
    },
    requiredEvidence: ['owned-media-element', 'media-content-model-observed', 'alternative-missing-or-inadequate-observed'],
    evidenceRefs: ['media-inventory'],
  };
  const status = review.structuralEvidenceStatus(packet);
  assert.equal(status.ok, false);
  assert(status.missing.includes('alternative-missing-or-inadequate-observed'));
  assert.equal(review.reviewToJudgment(packet, { verdict: 'LIKELY_BARRIER' }), null);

  const out = await review.runBroadScopePacketReviews({
    file: 'media-control.html',
    runId: 'R',
    pageDigest: 'sha256:media-control',
    reviewPackets: [packet],
  }, {
    runJudge: async () => ({
      verdict: 'LIKELY_BARRIER',
      confidence: 'high',
      evidenceRefs: ['media-inventory'],
      summary: 'overclaimed adequate caption',
      reasoning: 'caption exists but judge overclaimed it',
    }),
    runCritic: async () => ({ response: 'AGREE', reason: 'intentionally bad critic for regression' }),
  });
  assert.equal(out.broadScopeRationale.rationales[0].verdict, 'UNCERTAIN');
  assert.match(out.broadScopeRationale.rationales[0].reasoning, /alternative-missing-or-inadequate-observed/);
  assert.equal(out.judgments.judgments.length, 0);
});

test('keyboard-trap clean controls are scoped uncertainty, not barrier-ready or clears', async () => {
  const packet = {
    packetId: 'trap-control:n1',
    aspect: 'keyboard-trap',
    detector: 'keyboard-trap',
    sc: '2.1.2',
    rawSc: '2.1.2',
    claimFamily: 'no-keyboard-trap',
    targetXpath: '#target',
    observed: {
      evidenceClaims: ['trusted-keyboard-navigation-observed', 'focus-escape-or-advised-exit-observed'],
      detail: 'focus escaped with Tab or an advised key sequence',
    },
    requiredEvidence: ['trusted-tab-or-shift-tab-trap', 'focus-cannot-leave-region-or-element', 'no-advised-keyboard-exit'],
    evidenceRefs: ['keyboard-trap-control'],
  };
  const status = review.structuralEvidenceStatus(packet);
  assert.equal(status.ok, false);
  assert(status.missing.includes('trusted-tab-or-shift-tab-trap'));
  assert(status.missing.includes('focus-cannot-leave-region-or-element'));
  assert(status.missing.includes('no-advised-keyboard-exit'));
  assert.equal(review.reviewToJudgment(packet, { verdict: 'LIKELY_OK' }), null);
  assert.equal(review.reviewToJudgment(packet, { verdict: 'LIKELY_BARRIER' }), null);

  const out = await review.runBroadScopePacketReviews({
    file: 'trap-control.html',
    runId: 'R',
    pageDigest: 'sha256:trap-control',
    reviewPackets: [packet],
  }, {
    runJudge: async () => ({
      verdict: 'LIKELY_BARRIER',
      confidence: 'high',
      evidenceRefs: ['keyboard-trap-control'],
      summary: 'overclaimed clean trap control',
      reasoning: 'focus escaped, but judge overclaimed it',
    }),
    runCritic: async () => ({ response: 'AGREE', reason: 'intentionally bad critic for regression' }),
  });
  assert.equal(out.broadScopeRationale.rationales[0].verdict, 'UNCERTAIN');
  assert.match(out.broadScopeRationale.rationales[0].reasoning, /trusted-tab-or-shift-tab-trap/);
  assert.equal(out.judgments.judgments.length, 0);
});

test('audio-control clean controls are scoped uncertainty, not barrier-ready or clears', async () => {
  const packet = {
    packetId: 'audio-control:n1',
    aspect: 'audio-control',
    detector: 'audio-control-dynamic',
    sc: '1.4.2',
    rawSc: '1.4.2',
    targetXpath: '#target',
    observed: {
      evidenceClaims: ['audio-playback-measured-or-applicability-checked', 'muted-audio-observed'],
      detail: 'audio was autoplaying but muted',
    },
    requiredEvidence: ['audible-autoplay-more-than-three-seconds', 'no-independent-control'],
    evidenceRefs: ['audio-control'],
  };
  const status = review.structuralEvidenceStatus(packet);
  assert.equal(status.ok, false);
  assert(status.missing.includes('audible-autoplay-more-than-three-seconds'));
  assert(status.missing.includes('no-independent-control'));
  assert.equal(review.reviewToJudgment(packet, { verdict: 'LIKELY_OK' }), null);
  assert.equal(review.reviewToJudgment(packet, { verdict: 'LIKELY_BARRIER' }), null);

  const out = await review.runBroadScopePacketReviews({
    file: 'audio-control.html',
    runId: 'R',
    pageDigest: 'sha256:audio-control',
    reviewPackets: [packet],
  }, {
    runJudge: async () => ({
      verdict: 'LIKELY_BARRIER',
      confidence: 'high',
      evidenceRefs: ['audio-control'],
      summary: 'overclaimed muted audio',
      reasoning: 'audio is muted, but judge overclaimed it',
    }),
    runCritic: async () => ({ response: 'AGREE', reason: 'intentionally bad critic for regression' }),
  });
  assert.equal(out.broadScopeRationale.rationales[0].verdict, 'UNCERTAIN');
  assert.match(out.broadScopeRationale.rationales[0].reasoning, /audible-autoplay-more-than-three-seconds/);
  assert.equal(out.judgments.judgments.length, 0);
});

test('character-shortcut controls are scoped uncertainty, not barrier-ready or clears', async () => {
  const packet = {
    packetId: 'shortcut:n2',
    aspect: 'character-shortcut',
    detector: 'character-shortcut-dynamic',
    sc: '2.1.4',
    rawSc: '2.1.4',
    targetXpath: '#target',
    observed: {
      evidenceClaims: ['trusted-keyboard-shortcut-procedure-run', 'off-or-remap-control-observed'],
      detail: 'single character shortcut was checked, and a working off control prevented activation',
    },
    requiredEvidence: ['trusted-keyboard-action', 'single-printable-character-shortcut-observed', 'no-off-remap-or-focus-scope-exception'],
    evidenceRefs: ['character-shortcut'],
  };
  const status = review.structuralEvidenceStatus(packet);
  assert.equal(status.ok, false);
  assert(status.missing.includes('trusted-keyboard-action'));
  assert(status.missing.includes('single-printable-character-shortcut-observed'));
  assert(status.missing.includes('no-off-remap-or-focus-scope-exception'));
  assert.equal(review.reviewToJudgment(packet, { verdict: 'LIKELY_OK' }), null);
  assert.equal(review.reviewToJudgment(packet, { verdict: 'LIKELY_BARRIER' }), null);

  const out = await review.runBroadScopePacketReviews({
    file: 'shortcut.html',
    runId: 'R',
    pageDigest: 'sha256:shortcut',
    reviewPackets: [packet],
  }, {
    runJudge: async () => ({
      verdict: 'LIKELY_BARRIER',
      confidence: 'high',
      evidenceRefs: ['character-shortcut'],
      summary: 'overclaimed shortcut control',
      reasoning: 'working off control exists, but judge overclaimed it',
    }),
    runCritic: async () => ({ response: 'AGREE', reason: 'intentionally bad critic for regression' }),
  });
  assert.equal(out.broadScopeRationale.rationales[0].verdict, 'UNCERTAIN');
  assert.match(out.broadScopeRationale.rationales[0].reasoning, /trusted-keyboard-action/);
  assert.equal(out.judgments.judgments.length, 0);
});

test('status-announcement controls are scoped uncertainty, not barrier-ready or clears', async () => {
  const packet = {
    packetId: 'status:n1',
    aspect: 'status-announcement',
    detector: 'status-announcement-dynamic',
    sc: '4.1.3',
    rawSc: '4.1.3',
    targetXpath: '#status',
    observed: {
      evidenceClaims: [
        'trusted-status-message-procedure-run',
        'trusted-activation-action',
        'status-message-observed',
        'live-region-or-programmatic-status-channel-observed',
      ],
      detail: 'trusted activation changed visible status text in role=status',
    },
    requiredEvidence: ['trusted-activation-action', 'status-message-observed', 'focus-not-moved-to-message', 'no-live-region-or-programmatic-status-role'],
    evidenceRefs: ['status-announcement'],
  };
  const status = review.structuralEvidenceStatus(packet);
  assert.equal(status.ok, false);
  assert(status.missing.includes('focus-not-moved-to-message'));
  assert(status.missing.includes('no-live-region-or-programmatic-status-role'));
  assert.equal(review.reviewToJudgment(packet, { verdict: 'LIKELY_OK' }), null);
  assert.equal(review.reviewToJudgment(packet, { verdict: 'LIKELY_BARRIER' }), null);

  const out = await review.runBroadScopePacketReviews({
    file: 'status.html',
    runId: 'R',
    pageDigest: 'sha256:status',
    reviewPackets: [packet],
  }, {
    runJudge: async () => ({
      verdict: 'LIKELY_BARRIER',
      confidence: 'high',
      evidenceRefs: ['status-announcement'],
      summary: 'overclaimed status control',
      reasoning: 'live region exists, but judge overclaimed it',
    }),
    runCritic: async () => ({ response: 'AGREE', reason: 'intentionally bad critic for regression' }),
  });
  assert.equal(out.broadScopeRationale.rationales[0].verdict, 'UNCERTAIN');
  assert.match(out.broadScopeRationale.rationales[0].reasoning, /focus-not-moved-to-message|no-live-region/);
  assert.equal(out.judgments.judgments.length, 0);
});

test('target-size controls are scoped uncertainty, not barrier-ready or clears', async () => {
  const packet = {
    packetId: 'targetsize:n4',
    aspect: 'target-size-minimum',
    detector: 'target-size-minimum',
    sc: '2.5.8',
    rawSc: '2.5.8',
    targetXpath: '#target',
    observed: {
      evidenceClaims: [
        'target-size-procedure-run',
        'rendered-pointer-target',
        'measured-target-size-below-24',
        'equivalent-target-exception-observed',
      ],
      detail: 'trusted geometry measured an undersized target with a fixture-scoped equivalent-target exception',
    },
    requiredEvidence: ['rendered-pointer-target', 'measured-target-size-below-24', 'target-spacing-intersection'],
    evidenceRefs: ['target-size-minimum'],
  };
  const status = review.structuralEvidenceStatus(packet);
  assert.equal(status.ok, false);
  assert(status.missing.includes('target-spacing-intersection'));
  assert(status.disqualifyingFound.includes('equivalent-target-exception-observed'));
  assert.equal(review.reviewToJudgment(packet, { verdict: 'LIKELY_OK' }), null);
  assert.equal(review.reviewToJudgment(packet, { verdict: 'LIKELY_BARRIER' }), null);

  const out = await review.runBroadScopePacketReviews({
    file: 'targetsize.html',
    runId: 'R',
    pageDigest: 'sha256:targetsize',
    reviewPackets: [packet],
  }, {
    runJudge: async () => ({
      verdict: 'LIKELY_BARRIER',
      confidence: 'high',
      evidenceRefs: ['target-size-minimum'],
      summary: 'overclaimed target-size control',
      reasoning: 'equivalent target exists, but judge overclaimed it',
    }),
    runCritic: async () => ({ response: 'AGREE', reason: 'intentionally bad critic for regression' }),
  });
  assert.equal(out.broadScopeRationale.rationales[0].verdict, 'UNCERTAIN');
  assert.match(out.broadScopeRationale.rationales[0].reasoning, /target-spacing-intersection|equivalent-target/);
  assert.equal(out.judgments.judgments.length, 0);
});

test('label-in-name controls are scoped uncertainty, not barrier-ready or clears', async () => {
  const packet = {
    packetId: 'label:n5',
    aspect: 'label-in-name',
    detector: 'label-in-name',
    sc: '2.5.3',
    rawSc: '2.5.3',
    targetXpath: '#target',
    observed: {
      evidenceClaims: [
        'label-in-name-procedure-run',
        'visible-text-label',
        'accessible-name-observed',
        'accessible-name-contains-visible-text',
        'accessible-name-source-aria-label',
      ],
      detail: 'visible label Pay now 5 is contained in accessible name Pay now 5, submit order',
    },
    requiredEvidence: ['visible-text-label', 'accessible-name-observed', 'accessible-name-missing-visible-text'],
    evidenceRefs: ['label-in-name'],
  };
  const status = review.structuralEvidenceStatus(packet);
  assert.equal(status.ok, false);
  assert(status.missing.includes('accessible-name-missing-visible-text'));
  assert(status.disqualifyingFound.includes('accessible-name-contains-visible-text'));
  assert.equal(review.reviewToJudgment(packet, { verdict: 'LIKELY_OK' }), null);
  assert.equal(review.reviewToJudgment(packet, { verdict: 'LIKELY_BARRIER' }), null);

  const out = await review.runBroadScopePacketReviews({
    file: 'label.html',
    runId: 'R',
    pageDigest: 'sha256:label',
    reviewPackets: [packet],
  }, {
    runJudge: async () => ({
      verdict: 'LIKELY_BARRIER',
      confidence: 'high',
      evidenceRefs: ['label-in-name'],
      summary: 'overclaimed label-in-name control',
      reasoning: 'visible label is contained, but judge overclaimed it',
    }),
    runCritic: async () => ({ response: 'AGREE', reason: 'intentionally bad critic for regression' }),
  });
  assert.equal(out.broadScopeRationale.rationales[0].verdict, 'UNCERTAIN');
  assert.match(out.broadScopeRationale.rationales[0].reasoning, /accessible-name-missing-visible-text|accessible-name-contains-visible-text/);
  assert.equal(out.judgments.judgments.length, 0);
});

test('character-shortcut positives can bridge to a barrier-only provisional judgment', async () => {
  const broadScope = {
    file: 'shortcut.html',
    runId: 'R',
    pageDigest: 'sha256:shortcut',
    findings: [{
      detector: 'character-shortcut-dynamic',
      kind: 'character-shortcut-probe',
      sc: '2.1.4',
      xpath: '#target',
      detail: 'trusted single-character key changed page state outside focus and no exception worked',
      evidenceClaims: [
        'trusted-keyboard-action',
        'single-printable-character-shortcut-observed',
        'no-off-remap-or-focus-scope-exception',
      ],
    }],
  };
  const packet = review.buildReviewPacketsFromBroadScope(broadScope)[0];
  assert.equal(packet.claimFamily, 'character-key-shortcut');
  assert.equal(review.structuralEvidenceStatus(packet).ok, true);

  const judgment = review.reviewToJudgment(packet, {
    verdict: 'LIKELY_BARRIER',
    confidence: 'high',
    evidenceRefs: packet.evidenceRefs,
    summary: 'single printable key shortcut without exception',
    reasoning: 'trusted keypress changed page state and no off/remap/focus-only exception was observed',
  });
  assert.equal(judgment.sc, '2.1.4');
  assert.equal(judgment.claimFamily, 'character-key-shortcut');
  assert.equal(judgment.verdict, 'LIKELY_BARRIER');
  assert.equal(
    review.reviewToJudgment(packet, { verdict: 'LIKELY_OK', confidence: 'high', evidenceRefs: packet.evidenceRefs }),
    null,
    'the broad-scope bridge remains barrier-only',
  );
});

test('broad-scope judgment can fill an enumerated auto-PARTIAL obligation as provisional, never authoritative', () => {
  const packet = {
    aspect: 'reduced-motion',
    sc: '2.2.2',
    claimFamily: 'motion-control',
    targetXpath: '/m',
    evidenceRefs: ['broad:motion'],
    observed: { evidenceClaims: ['auto-motion-persists', 'duration-or-looping', 'no-working-pause-stop-hide', 'parallel-non-essential-content'] },
  };
  const j = review.reviewToJudgment(packet, { verdict: 'LIKELY_BARRIER', confidence: 'high', evidenceRefs: ['broad:motion'] });
  const r = buildV3({
    collect: { ...ID, collectedAt: 1, elements: [{ xpath: '/m', tag: 'marquee', autoMotion: true }], structure: { title: 't', headings: [] } },
    experiments: { ...ID, catalogVersion: '3.0.0-phase0', startedAt: 2, results: [] },
    claimProposals: { ...ID, proposals: [] },
    judgments: { ...ID, judgments: [j] },
  });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.results.summary.authoritative, 0);
  assert.equal(r.results.summary.provisionalBarrier, 1);
  assert.equal(r.results.summary.provisionalByMechanism['llm-rubric:broad-scope-motion-control-v0'], 1);
  assert.equal(r.results.obligationLedger.some((row) => row.sc === '2.2.2' && row.claimFamily === 'motion-control' && row.disposition === 'PROVISIONAL'), true);
});

test('critic-disputed broad-scope clear remains an abstention and does not fill the ledger', async () => {
  const out = await review.runBroadScopeLlmReview(
    { sc: '2.2.2', claimFamily: 'motion-control', targetXpath: '/m', evidenceRefs: ['dom'] },
    {
      runJudge: async () => ({ verdict: 'LIKELY_OK', confidence: 'high', evidenceRefs: ['dom'], reasoning: 'pause button might exist' }),
      runCritic: async () => ({ response: 'DISPUTE', reason: 'control was not exercised and motion duration was not established' }),
    },
  );
  const j = review.reviewToJudgment({ sc: '2.2.2', claimFamily: 'motion-control', targetXpath: '/m' }, out);
  const r = buildV3({
    collect: { ...ID, collectedAt: 1, elements: [{ xpath: '/m', tag: 'marquee', autoMotion: true }], structure: { title: 't', headings: [] } },
    experiments: { ...ID, catalogVersion: '3.0.0-phase0', startedAt: 2, results: [] },
    claimProposals: { ...ID, proposals: [] },
    judgments: { ...ID, judgments: [j].filter(Boolean) },
  });
  assert.equal(out.verdict, 'UNCERTAIN');
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.results.summary.provisionalCleared, 0);
  assert.equal(r.results.summary.provisionalBarrier, 0);
  const row = r.results.obligationLedger.find((o) => o.sc === '2.2.2' && o.claimFamily === 'motion-control');
  assert.equal(row.disposition, 'PARTIAL');
});

test('runBroadScopePacketReviews persists rationale and converts only registered packets into judgments', async () => {
  const broadScope = {
    ...ID,
    reviewPackets: [
      {
        packetId: 'pkt-motion',
        aspect: 'reduced-motion',
        sc: '2.2.2',
        claimFamily: 'motion-control',
        targetXpath: '/m',
        mode: 'hybrid-temporal',
        evidenceRefs: ['probe:motion'],
        observed: { evidenceClaims: ['auto-motion-persists', 'duration-or-looping', 'no-working-pause-stop-hide', 'parallel-non-essential-content'] },
        questions: ['Does motion persist?'],
      },
      {
        packetId: 'pkt-forced',
        aspect: 'forced-colors',
        sc: 'EN-C.9.7',
        claimFamily: null,
        targetXpath: '/fc',
        mode: 'review-only',
        evidenceRefs: ['probe:forced'],
        questions: ['Is there visible loss?'],
      },
    ],
  };
  const out = await review.runBroadScopePacketReviews(broadScope, {
    runJudge: async (_messages, packet) => ({
      verdict: 'LIKELY_BARRIER',
      confidence: 'high',
      evidenceRefs: packet.evidenceRefs,
      summary: `${packet.aspect} issue`,
      reasoning: 'positive packet evidence supports review barrier',
    }),
    runCritic: async () => ({ response: 'AGREE', reason: 'packet has positive evidence' }),
  });
  assert.equal(out.reviews.length, 2);
  assert.equal(out.judgments.judgments.length, 1);
  assert.equal(out.judgments.judgments[0].targetXpath, '/m');
  assert.equal(out.broadScopeRationale.rationales.length, 2);
  assert.equal(out.broadScopeRationale.rationales.find((r) => r.packetId === 'pkt-forced').convertedToJudgment, false);
  assert.equal(out.broadScopeRationale.rationales.find((r) => r.packetId === 'pkt-motion').convertedToJudgment, true);
});

test('runBroadScopePacketReviews integrates with buildV3 through judgments and keeps rationale out of strict results', async () => {
  const broadScope = {
    ...ID,
    reviewPackets: [{
      packetId: 'pkt-motion',
      aspect: 'reduced-motion',
      sc: '2.2.2',
      claimFamily: 'motion-control',
      targetXpath: '/m',
      mode: 'hybrid-temporal',
      evidenceRefs: ['probe:motion'],
      observed: { evidenceClaims: ['auto-motion-persists', 'duration-or-looping', 'no-working-pause-stop-hide', 'parallel-non-essential-content'] },
      questions: ['Does motion persist?'],
    }],
  };
  const out = await review.runBroadScopePacketReviews(broadScope, {
    runJudge: async () => ({ verdict: 'LIKELY_BARRIER', confidence: 'high', evidenceRefs: ['probe:motion'], summary: 'motion persists', reasoning: 'no pause control in packet' }),
    runCritic: async () => ({ response: 'AGREE', reason: 'positive evidence' }),
  });
  const r = buildV3({
    collect: { ...ID, collectedAt: 1, elements: [{ xpath: '/m', tag: 'marquee', autoMotion: true }], structure: { title: 't', headings: [] } },
    experiments: { ...ID, catalogVersion: '3.0.0-phase0', startedAt: 2, results: [] },
    claimProposals: { ...ID, proposals: [] },
    broadScope,
    judgments: out.judgments,
  });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.results.summary.provisionalBarrier, 1);
  assert.equal(r.results.shadowObservations.some((o) => o.rationaleRef === 'broad:2.2.2:motion-control:m'), true);
  assert.equal(JSON.stringify(r.results).includes('no pause control in packet'), false, 'free-text rationale stays outside strict results');
});

test('runBroadScopePacketReviews critic dispute produces rationale but no judgment/provisional fill', async () => {
  const broadScope = {
    ...ID,
    reviewPackets: [{
      packetId: 'pkt-motion',
      aspect: 'reduced-motion',
      sc: '2.2.2',
      claimFamily: 'motion-control',
      targetXpath: '/m',
      mode: 'hybrid-temporal',
      evidenceRefs: ['probe:motion'],
    }],
  };
  const out = await review.runBroadScopePacketReviews(broadScope, {
    runJudge: async () => ({ verdict: 'LIKELY_OK', confidence: 'high', evidenceRefs: ['probe:motion'], reasoning: 'no barrier found' }),
    runCritic: async () => ({ response: 'DISPUTE', reason: 'absence of pause-control evidence cannot clear motion' }),
  });
  assert.equal(out.judgments.judgments.length, 0, 'UNCERTAIN/clear-side broad-scope reviews stay sidecar-only');
  assert.equal(out.broadScopeRationale.rationales.length, 1);
  assert.equal(out.broadScopeRationale.rationales[0].verdict, 'UNCERTAIN');
  const r = buildV3({
    collect: { ...ID, collectedAt: 1, elements: [{ xpath: '/m', tag: 'marquee', autoMotion: true }], structure: { title: 't', headings: [] } },
    experiments: { ...ID, catalogVersion: '3.0.0-phase0', startedAt: 2, results: [] },
    claimProposals: { ...ID, proposals: [] },
    judgments: out.judgments,
  });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.results.summary.provisionalBarrier, 0);
  assert.equal(r.results.summary.provisionalCleared, 0);
  assert.equal(r.results.obligationLedger.find((row) => row.sc === '2.2.2').disposition, 'PARTIAL');
});
