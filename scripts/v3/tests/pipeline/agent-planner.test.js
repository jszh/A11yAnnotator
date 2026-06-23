// Harness 3.0 — Level-3 contextual planner (plan Phase 2): the planner is UNTRUSTED; its output is
// re-validated by the deterministic merger and can never escape the catalog allowlist or inject.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const planner = require('../../lib/agent-planner.js');
const sch = require('../../lib/scheduler.js');

// a candidate set with ONE Level-3 candidate (a 2.1.2 trap whose recipe is context-dependent).
const cands = () => ({ file: 'p', runId: 'R', pageDigest: 'sha256:d', candidates: [
  { candidateId: 'L3a', xpath: '/html/body/div/input', sc: '2.1.2', claimFamily: 'no-keyboard-trap', experimentId: 'keyboard-trap-escape', allowedExperiments: ['keyboard-trap-escape'], selectionLevel: 3 },
  { candidateId: 'L1a', xpath: '/html/body/span', sc: '1.4.3', claimFamily: 'text-contrast', experimentId: 'text-contrast-pixel', allowedExperiments: ['text-contrast-pixel'], selectionLevel: 1 },
] });

test('no Level-3 candidate ⇒ planLevel3 is a no-op (scheduling stays deterministic)', () => {
  const cs = { file: 'p', runId: 'R', pageDigest: 'd', candidates: cands().candidates.filter((c) => c.selectionLevel === 1) };
  const auto = sch.schedulePlan(cs);
  const { plan, errors } = planner.planLevel3(auto, cs);
  assert.deepEqual(errors, []);
  assert.equal(plan.requests.length, 1, 'only the Level-1 automatic request');
});

test('the deterministic planner schedules a Level-3 candidate via its allowed experiment', () => {
  const cs = cands();
  const auto = sch.schedulePlan(cs); // L3 escalated, L1 scheduled
  assert.equal(auto.requests.length, 1);
  assert.ok(auto.escalations.some((e) => e.candidateId === 'L3a'));
  const { plan, errors } = planner.planLevel3(auto, cs);
  assert.deepEqual(errors, []);
  assert.ok(plan.requests.some((r) => r.candidateId === 'L3a' && r.experimentId === 'keyboard-trap-escape' && r.selectionSource === 'agent-selected'));
});

test('an UNTRUSTED planner cannot escape the allowlist (retarget / swap / inject / add)', () => {
  const cs = cands();
  const auto = sch.schedulePlan(cs);
  const before = auto.requests.length;
  // retarget a different element
  let r = planner.planLevel3(auto, cs, () => ({ requests: [{ candidateId: 'L3a', experimentId: 'keyboard-trap-escape', targetXpath: '/evil', sc: '2.1.2' }] }));
  assert.ok(r.errors.some((m) => /retargets/.test(m)) && r.plan.requests.length === before);
  // swap in an experiment not in allowedExperiments (and that measures a different SC)
  r = planner.planLevel3(auto, cs, () => ({ requests: [{ candidateId: 'L3a', experimentId: 'text-contrast-pixel', targetXpath: '/html/body/div/input', sc: '2.1.2' }] }));
  assert.ok(r.errors.some((m) => /not in allowedExperiments|measures SC/.test(m)) && r.plan.requests.length === before);
  // claim a candidateId that is not a Level-3 candidate (e.g. the L1 one, or a fabricated id)
  r = planner.planLevel3(auto, cs, () => ({ requests: [{ candidateId: 'L1a', experimentId: 'text-contrast-pixel', targetXpath: '/html/body/span', sc: '1.4.3' }] }));
  assert.ok(r.errors.some((m) => /not a catalog-declared Level-3 candidate/.test(m)) && r.plan.requests.length === before);
  r = planner.planLevel3(auto, cs, () => ({ requests: [{ candidateId: 'FORGED', experimentId: 'keyboard-trap-escape', targetXpath: '/x', sc: '2.1.2' }] }));
  assert.ok(r.errors.some((m) => /not a catalog-declared Level-3 candidate/.test(m)) && r.plan.requests.length === before);
});

test('a planner that throws or returns garbage never widens the plan', () => {
  const cs = cands();
  const auto = sch.schedulePlan(cs);
  assert.deepEqual(planner.planLevel3(auto, cs, () => { throw new Error('boom'); }).plan.requests, auto.requests);
  assert.deepEqual(planner.planLevel3(auto, cs, () => null).plan.requests, auto.requests);
  assert.deepEqual(planner.planLevel3(auto, cs, () => ({ requests: 'not-an-array' })).plan.requests, auto.requests);
});

// gap-fill red-team: a non-object request ELEMENT (null/undefined/scalar) must be dropped-and-reported,
// never dereferenced — the explicitly-untrusted planner must not crash the deterministic merger FAIL-OPEN.
test('a planner whose requests array holds null/undefined/scalar elements is contained, never crashes', () => {
  const cs = cands();
  const auto = sch.schedulePlan(cs);
  for (const bad of [[null], [undefined], [42], ['str'], [[]], [true]]) {
    let r;
    assert.doesNotThrow(() => { r = planner.planLevel3(auto, cs, () => ({ requests: bad })); }, `requests:${JSON.stringify(bad)} must not throw`);
    assert.deepEqual(r.plan.requests, auto.requests, 'the plan is not widened by a malformed request element');
    assert.ok(r.errors.some((m) => /not an object/.test(m)), `rejected with a report: ${JSON.stringify(r.errors)}`);
  }
  // a valid request mixed with a null element: the valid one still merges, the null is dropped-and-reported.
  const r = planner.planLevel3(auto, cs, () => ({ requests: [null, { candidateId: 'L3a', experimentId: 'keyboard-trap-escape', targetXpath: '/html/body/div/input', sc: '2.1.2' }] }));
  assert.ok(r.errors.some((m) => /not an object/.test(m)));
  assert.ok(r.plan.requests.some((x) => x.candidateId === 'L3a' && x.selectionSource === 'agent-selected'), 'the valid request still merges');
});

// defense-in-depth: even if the merge itself throws (a pathological requests array), planLevel3 fails
// CLOSED to the un-widened autoPlan rather than letting the exception escape orchestrate().
test('mergeAgentPlan throwing is contained by planLevel3 (fail-closed to the un-widened plan)', () => {
  const cs = cands();
  const auto = sch.schedulePlan(cs);
  const bombArray = new Proxy([{}], { get(t, k) { if (k === '0') throw new Error('elem-bomb'); return t[k]; } });
  let r;
  assert.doesNotThrow(() => { r = planner.planLevel3(auto, cs, () => ({ requests: bombArray })); });
  assert.deepEqual(r.plan.requests, auto.requests);
  assert.ok(r.errors.length >= 1, JSON.stringify(r.errors));
});
