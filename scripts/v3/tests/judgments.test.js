// Harness 3.0 — semantic judgment skills (plan Phase 3 / Rule 6): judgments are NON-DEFINITE
// adjudication recommendations and CANNOT authorize an observation until their rubric is calibrated.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const judgments = require('../lib/judgments.js');
const { buildV3 } = require('../lib/build-v3.js');
const { withPipeline, reseal, promoted } = require('./helpers.js');

const SCOPE = { actionTargetRef: 'node:b1', state: 'fresh-load', action: 'inspect', environment: 'headless-chromium' };
const judgment = (over = {}) => ({ judgmentId: 'j1', sc: '1.1.1', targetXpath: 'node:img', observationScope: { ...SCOPE, actionTargetRef: 'node:img' }, rubricRef: 'alt-text-adequacy-v0', verdict: 'LIKELY_OK', rationale: 'the alt text describes the image', ...over });

test('processJudgments: an uncalibrated rubric ⇒ recommendation only, never authoritative', () => {
  const { recommendations, errors } = judgments.processJudgments({ judgments: [judgment()] });
  assert.deepEqual(errors, []);
  assert.equal(recommendations.length, 1);
  assert.equal(recommendations[0].authoritative, false);
  assert.equal(recommendations[0].eligibleForAuthority, false, 'no rubric is calibrated in Phase 0');
  assert.equal(recommendations[0].status, 'adjudication-recommendation');
});

test('processJudgments: a CALIBRATED rubric flags eligibility but is STILL a recommendation (Phase 3 not exited)', () => {
  const rubrics = { 'alt-text-adequacy-v0': { calibrated: true, bothDirectionPrecisionMet: true, goldRef: 'gold://alt-text' } };
  const { recommendations } = judgments.processJudgments({ judgments: [judgment()] }, rubrics);
  assert.equal(recommendations[0].eligibleForAuthority, true);
  assert.equal(recommendations[0].authoritative, false, 'even a calibrated rubric does not auto-publish in this implementation');
});

test('processJudgments: UNCERTAIN stays unresolved; malformed judgments are errors', () => {
  const u = judgments.processJudgments({ judgments: [judgment({ verdict: 'UNCERTAIN' })] });
  assert.equal(u.recommendations[0].verdict, 'UNCERTAIN');
  assert.ok(judgments.processJudgments({ judgments: [judgment({ verdict: 'DEFINITELY_FINE' })] }).errors.some((m) => /verdict/.test(m)));
  assert.ok(judgments.processJudgments({ judgments: [judgment({ sc: '9.9.9' })] }).errors.some((m) => /known SC/.test(m)));
  assert.ok(judgments.processJudgments({ judgments: [{ ...judgment(), smuggled: 1 }] }).errors.some((m) => /unknown key/.test(m)));
});

test('buildV3: a judgment NEVER produces an authoritative claim — only an adjudication recommendation', () => {
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
