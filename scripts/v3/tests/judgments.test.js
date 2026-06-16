// Harness 3.0/3.1 — semantic judgment skills. Under the 3.1 unify (M1), an atomic rubric judgment is
// emitted as a `source:'llm'`, `mechanism:'llm-rubric:<rubricRef>'` SHADOW observation (non-authoritative
// by construction) — there is no parallel RUBRICS registry, and calibration lives in authority.js. The
// build surfaces these as a DERIVED adjudication-recommendation view; a judgment never clears/barriers.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const judgments = require('../lib/judgments.js');
const { buildV3 } = require('../lib/build-v3.js');
const { withPipeline, reseal, promoted } = require('./helpers.js');

const SCOPE = { actionTargetRef: 'node:b1', state: 'fresh-load', action: 'inspect', environment: 'headless-chromium' };
const judgment = (over = {}) => ({ judgmentId: 'j1', sc: '1.1.1', targetXpath: 'node:img', observationScope: { ...SCOPE, actionTargetRef: 'node:img' }, rubricRef: 'alt-text-adequacy-v0', verdict: 'LIKELY_OK', rationale: 'the alt text describes the image', ...over });

test('processJudgments: a judgment becomes a source:llm llm-rubric SHADOW observation (never authoritative)', () => {
  const { shadowObservations, errors } = judgments.processJudgments({ judgments: [judgment()] });
  assert.deepEqual(errors, []);
  assert.equal(shadowObservations.length, 1);
  const o = shadowObservations[0];
  assert.equal(o.source, 'llm');
  assert.equal(o.mechanism, 'llm-rubric:alt-text-adequacy-v0', 'each rubric is its own mechanism — calibrated independently');
  assert.equal(o.wouldBe.observationOutcome, 'NO_BARRIER_OBSERVED', 'LIKELY_OK → NO_BARRIER_OBSERVED');
  assert.equal(o.rationaleRef, 'j1', 'the free-text rationale is referenced, not embedded');
  assert.equal(Object.prototype.hasOwnProperty.call(o, 'rationale'), false, 'no free text in the structured record');
});

test('processJudgments: verdict mapping is total — LIKELY_BARRIER/UNCERTAIN → BARRIER/INCONCLUSIVE', () => {
  const barrier = judgments.processJudgments({ judgments: [judgment({ verdict: 'LIKELY_BARRIER' })] });
  assert.equal(barrier.shadowObservations[0].wouldBe.observationOutcome, 'BARRIER_OBSERVED');
  const uncertain = judgments.processJudgments({ judgments: [judgment({ verdict: 'UNCERTAIN' })] });
  assert.equal(uncertain.shadowObservations[0].wouldBe.observationOutcome, 'INCONCLUSIVE');
  assert.equal(uncertain.shadowObservations[0].wouldBe.wcagApplicability, 'UNKNOWN', 'INCONCLUSIVE is an abstention, never a clear/barrier');
});

test('processJudgments: malformed judgments are errors (verdict / SC / unknown key)', () => {
  assert.ok(judgments.processJudgments({ judgments: [judgment({ verdict: 'DEFINITELY_FINE' })] }).errors.some((m) => /verdict/.test(m)));
  assert.ok(judgments.processJudgments({ judgments: [judgment({ sc: '9.9.9' })] }).errors.some((m) => /known SC/.test(m)));
  assert.ok(judgments.processJudgments({ judgments: [{ ...judgment(), smuggled: 1 }] }).errors.some((m) => /unknown key/.test(m)));
});

test('the parallel RUBRICS registry is DELETED — there is one calibration gate (authority.js)', () => {
  assert.equal(judgments.RUBRICS, undefined, 'judgments must not export a parallel calibration registry');
  assert.equal(judgments.rubricState, undefined, 'rubric calibration no longer lives here');
});

test('buildV3: a judgment NEVER produces an authoritative claim — only a derived adjudication recommendation', () => {
  const b = withPipeline({
    collect: { file: 'p', runId: 'R', pageDigest: 'sha256:d', collectedAt: 1, elements: [{ xpath: 'node:b1', focusable: true }] },
    experiments: { file: 'p', runId: 'R', pageDigest: 'sha256:d', catalogVersion: '3.0.0-phase0', startedAt: 2, results: [] },
    claimProposals: { file: 'p', runId: 'R', pageDigest: 'sha256:d', proposals: [] },
  });
  b.judgments = { file: 'p', runId: 'R', pageDigest: 'sha256:d', judgments: [judgment({ verdict: 'LIKELY_OK' })] };
  const r = buildV3(reseal(b), { authority: promoted([]) });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.results.summary.authoritative, 0, 'a semantic judgment cannot clear anything');
  assert.equal(r.results.summary.adjudicationRecommendations, 1);
  assert.equal(r.results.adjudicationRecommendations[0].authoritative, false);
  assert.equal(r.results.adjudicationRecommendations[0].mechanism, 'llm-rubric:alt-text-adequacy-v0');
  assert.equal(r.results.adjudicationRecommendations[0].eligibleForAuthority, false, 'uncalibrated by default');
  // it also rides shadowObservations (for per-mechanism gold scoring) but never enters reconciliation:
  assert.ok(r.results.shadowObservations.some((o) => o.mechanism === 'llm-rubric:alt-text-adequacy-v0'));
  assert.equal(r.results.summary.llmShadowObservations, 1);
});

test('buildV3: a malformed judgments stage REFUSES the build', () => {
  const b = withPipeline({
    collect: { file: 'p', runId: 'R', pageDigest: 'sha256:d', collectedAt: 1, elements: [{ xpath: 'node:b1', focusable: true }] },
    experiments: { file: 'p', runId: 'R', pageDigest: 'sha256:d', catalogVersion: '3.0.0-phase0', startedAt: 2, results: [] },
    claimProposals: { file: 'p', runId: 'R', pageDigest: 'sha256:d', proposals: [] },
  });
  b.judgments = { file: 'p', runId: 'R', pageDigest: 'sha256:d', judgments: [{ judgmentId: 'x', sc: 'nope', targetXpath: '', rubricRef: '', verdict: 'bogus' }] };
  const r = buildV3(reseal(b), { authority: promoted([]) });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((m) => /judgments/.test(m)));
});
