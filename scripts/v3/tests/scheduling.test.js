// Harness 3.0 — candidate generation + deterministic scheduling + plan merge.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const cg = require('../lib/candidate-generator.js');
const sch = require('../lib/scheduler.js');

const collect = () => ({
  file: 'p', runId: 'R', pageDigest: 'sha256:d',
  elements: [
    { xpath: 'a', focusable: true, role: 'button', hasText: true },   // indeterminate baseline (no drive entry)
    { xpath: 'b', focusable: true, role: 'link', hasText: false },     // baseline determinate (present:true) ⇒ no candidate
    { xpath: 'c', focusable: false, hasText: true },                   // not focusable ⇒ no focus candidate
  ],
});
const drive = () => ({ elements: [{ xpath: 'b', focusIndicator: { present: true } }] });

test('applicableScs derivation maps role/evidence to the obligation set', () => {
  assert.deepEqual(cg.applicableScsFor({ focusable: true, role: 'button', hasText: true }), ['1.4.3', '2.1.1', '2.4.7', '4.1.2']);
  assert.deepEqual(cg.applicableScsFor({ focusable: false, hasText: true }), ['1.4.3']);
});

test('candidate generation is deterministic: focusable + indeterminate baseline ⇒ Level-1 focus candidate', () => {
  const out = cg.generateCandidates(collect(), drive());
  assert.equal(out.candidates.length, 1);
  assert.equal(out.candidates[0].xpath, 'a');
  assert.equal(out.candidates[0].sc, '2.4.7');
  assert.equal(out.candidates[0].selectionLevel, 1);
});

test('scheduler schedules Level-1/2 automatically with NO agent and a selection source', () => {
  const plan = sch.schedulePlan(cg.generateCandidates(collect(), drive()));
  assert.equal(plan.requests.length, 1);
  assert.equal(plan.requests[0].selectionSource, 'mandatory-automatic');
  assert.equal(plan.escalations.length, 0);
});

test('budget defers candidates to escalation — never silently dropped', () => {
  const cands = { candidates: [
    { candidateId: 'c1', xpath: 'a', sc: '2.4.7', experimentId: 'focus-visual-retry', selectionLevel: 1 },
    { candidateId: 'c2', xpath: 'b', sc: '2.4.7', experimentId: 'focus-visual-retry', selectionLevel: 1 },
  ] };
  const plan = sch.schedulePlan(cands, { maxAutomatic: 1 });
  assert.equal(plan.requests.length, 1);
  assert.equal(plan.escalations.length, 1);
  assert.match(plan.escalations[0].reason, /budget-deferred/);
});

test('plan merger requires exact candidate identity and an experiment that measures the candidate SC (audit V3-H3)', () => {
  const cands = { candidates: [
    { candidateId: 'c1', xpath: 'a', sc: '2.4.7', claimFamily: 'focus-indicator-visible', experimentId: 'focus-visual-retry', allowedExperiments: ['focus-visual-retry'], selectionLevel: 1 },
    { candidateId: 'c3', xpath: 'z', sc: '2.4.7', claimFamily: 'focus-indicator-visible', experimentId: 'focus-visual-retry', allowedExperiments: ['focus-visual-retry'], selectionLevel: 3 },
  ] };
  const auto = sch.schedulePlan(cands);
  // valid: a real L3 candidate, real experiment, exact identity, experiment measures the candidate SC
  const ok = sch.mergeAgentPlan(auto, { requests: [{ candidateId: 'c3', experimentId: 'focus-visual-retry', targetXpath: 'z', sc: '2.4.7' }] }, cands);
  assert.deepEqual(ok.errors, []);
  assert.ok(ok.plan.requests.some((r) => r.selectionSource === 'agent-selected'));
  // reject: escalating a Level-1 candidate
  assert.ok(sch.mergeAgentPlan(auto, { requests: [{ candidateId: 'c1', experimentId: 'focus-visual-retry', targetXpath: 'a', sc: '2.4.7' }] }, cands).errors.some((m) => /not a catalog-declared Level-3/.test(m)));
  // reject: unknown experiment (prompt-injection style)
  assert.ok(sch.mergeAgentPlan(auto, { requests: [{ candidateId: 'c3', experimentId: 'evil-arbitrary-exp', targetXpath: 'z', sc: '2.4.7' }] }, cands).errors.some((m) => /unknown experiment/.test(m)));
  // reject: RETARGET candidate c3 (z) onto a different element
  assert.ok(sch.mergeAgentPlan(auto, { requests: [{ candidateId: 'c3', experimentId: 'focus-visual-retry', targetXpath: 'a', sc: '2.4.7' }] }, cands).errors.some((m) => /retargets/.test(m)));
  // reject: RE-SC candidate c3 to a different SC the experiment does not measure
  assert.ok(sch.mergeAgentPlan(auto, { requests: [{ candidateId: 'c3', experimentId: 'focus-visual-retry', targetXpath: 'z', sc: '2.1.2' }] }, cands).errors.some((m) => /re-SCs/.test(m)));
});
