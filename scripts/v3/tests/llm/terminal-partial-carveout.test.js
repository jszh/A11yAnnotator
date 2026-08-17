'use strict';
// Generalised a3 APERTURE-STARVED carve-out (s10 residual RCA): an experiment that runs and terminally
// ABSTAINS (disposition PARTIAL, autoPartial=false) must still reach the rubric lane — before this, the
// obligation existed, was undecided, and no judge ever saw it (scored `noObligation`). The carve-out is
// bounded: shadow dispositions, PROVISIONAL-filled rows, and decided (BARRIER/cleared) rows stay excluded.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { selectRubricSubjects, precomputeSignals } = require('../../lib/llm-adjudicator.js');

// hover-persistent-v0 is the real starved lane (1.4.13): its facet gate is the obligation itself, and
// hoverFacetOpen(null) is open — so admission at the ROW filter is the only thing this shape needed.
const RUBRICS = {
  'hover-persistent-v0': { id: 'hover-persistent-v0', sc: '1.4.13', skill: 'hover-focus-content', visionEvidence: ['element-crop'] },
};
const collect = { elements: [{ xpath: '/trigger' }] };
const row = (over) => ({ obligationId: 'o1', xpath: '/trigger', sc: '1.4.13', claimFamily: 'hover-content', disposition: 'PARTIAL', cleared: false, autoPartial: false, shadow: false, ...over });

test('a terminal-PARTIAL row reaches the rubric lane and is marked as a deterministic abstention', () => {
  const subs = selectRubricSubjects(collect, [row({})], RUBRICS);
  assert.equal(subs.length, 1, 'the starved row is routed');
  assert.equal(subs[0].rubricId, 'hover-persistent-v0');
  assert.equal(subs[0].element.__terminalPartial, true, 'the subject carries the abstention marker');
  const signals = precomputeSignals(subs[0].element, subs[0].skill, subs[0].sc);
  assert.ok(signals.deterministicAbstained, 'precomputeSignals surfaces the abstention');
  assert.match(signals.deterministicAbstained.uncertainReason, /NOT evidence of a pass/);
});

test('the carve-out is bounded: shadow, PROVISIONAL-filled, decided, and cleared rows stay excluded', () => {
  assert.equal(selectRubricSubjects(collect, [row({ shadow: true })], RUBRICS).length, 0, 'a shadow abstention is never judged');
  assert.equal(selectRubricSubjects(collect, [row({ disposition: 'PROVISIONAL' })], RUBRICS).length, 0, 'a filled obligation is settled');
  assert.equal(selectRubricSubjects(collect, [row({ disposition: 'BARRIER_OBSERVED' })], RUBRICS).length, 0, 'a decided barrier needs no judge');
  assert.equal(selectRubricSubjects(collect, [row({ cleared: true })], RUBRICS).length, 0, 'a cleared row needs no judge');
});

test('the carve-out is ALLOWLISTED by claim family: a collateral terminal-PARTIAL (field-label) does NOT route', () => {
  // Adversarial soundness finding #3: unconstrained, the field-label probe's routine abstentions on
  // textbook for/id fields became a per-field LLM-call flood on an SC the RCA never priced. Only the
  // measured starved families (hover-content / no-keyboard-trap / error-identification) are admitted.
  const FIELD_RUBRICS = {
    'field-programmatic-association-v0': { id: 'field-programmatic-association-v0', sc: '3.3.2', skill: 'forms-instructions-errors', visionEvidence: ['element-crop'] },
  };
  const fieldRow = { obligationId: 'o2', xpath: '/field', sc: '3.3.2', claimFamily: 'field-label', disposition: 'PARTIAL', cleared: false, autoPartial: false, shadow: false };
  assert.equal(selectRubricSubjects({ elements: [{ xpath: '/field' }] }, [fieldRow], FIELD_RUBRICS).length, 0,
    'a field-label terminal PARTIAL stays out of the lane until a measured run prices it');
});

test('an ordinary auto-PARTIAL row routes as before and carries NO abstention marker', () => {
  const subs = selectRubricSubjects(collect, [row({ disposition: 'PARTIAL', autoPartial: true })], RUBRICS);
  assert.equal(subs.length, 1);
  assert.notEqual(subs[0].element.__terminalPartial, true, 'auto-PARTIAL means the experiment never decided — no abstention to report');
  const signals = precomputeSignals(subs[0].element, subs[0].skill, subs[0].sc);
  assert.equal(signals.deterministicAbstained, undefined);
});
