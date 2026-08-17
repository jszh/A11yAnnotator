'use strict';
// Item 7 (route-by-facet rubric gating): the complex-backdrop 1.4.3 rubric fires only on a non-computable
// backdrop; long-description-completeness fires only on a data-bearing (complex) image.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { selectRubricSubjects } = require('../../lib/llm-adjudicator.js');

const RUBRICS = {
  'contrast-over-complex-backdrop-v0': { id: 'contrast-over-complex-backdrop-v0', sc: '1.4.3', skill: 'color-and-visual-text', visionEvidence: ['element-crop'] },
  'alt-text-adequacy-v0': { id: 'alt-text-adequacy-v0', sc: '1.1.1', skill: 'name-role-state', visionEvidence: ['element-crop'] },
  'long-description-completeness-v0': { id: 'long-description-completeness-v0', sc: '1.1.1', skill: 'name-role-state', visionEvidence: ['element-crop'] },
};
const ids = (subs, xp) => subs.filter((s) => s.xpath === xp).map((s) => s.rubricId).sort();

test('7a: complex-backdrop 1.4.3 rubric is SKIPPED when contrast is reliably computable, KEPT when not', () => {
  // The three contrast keys travel TOGETHER by construction — collect-colour-peers.js sets
  // `contrastThreshold` unconditionally and assigns `contrastSolid` inside `if (reliable)`. So
  // `contrastReliable: true` with no ratio is not a state the collector can emit, and the fixture states
  // the realistic pair. This matters because the gate now distinguishes a sound ratio that PASSES from one
  // that FAILS: until the collector began emitting `contrastReliable` the predicate was unconditionally
  // true in production, and switching it on drops every sound-ratio subject unless that split is made.
  const collect = { elements: [
    { xpath: '/reliable', contrastReliable: true, contrastSolid: 7.2, contrastThreshold: 4.5 },
    { xpath: '/complex', contrastReliable: false, needsPixelContrast: true },
    { xpath: '/reliable-failing', contrastReliable: true, contrastSolid: 2.1, contrastThreshold: 4.5 },
  ] };
  const ledger = [
    { xpath: '/reliable', sc: '1.4.3', claimFamily: 'text-contrast', autoPartial: true },
    { xpath: '/complex', sc: '1.4.3', claimFamily: 'text-contrast', autoPartial: true },
    { xpath: '/reliable-failing', sc: '1.4.3', claimFamily: 'text-contrast', autoPartial: true },
  ];
  const subs = selectRubricSubjects(collect, ledger, RUBRICS);
  assert.deepEqual(ids(subs, '/reliable'), [], 'a reliably-computable ratio that PASSES is the runner\'s job — not routed to the complex-backdrop rubric');
  assert.deepEqual(ids(subs, '/complex'), ['contrast-over-complex-backdrop-v0'], 'a non-computable backdrop IS routed');
  // FN protection: this subject reaches the LLM lane only because the deterministic pixel runner abstained on
  // it. Its ratio is sound AND below threshold, so dropping it would leave no lane able to see a real barrier.
  assert.deepEqual(ids(subs, '/reliable-failing'), ['contrast-over-complex-backdrop-v0'], 'a sound ratio that FAILS is still routed — the LLM is the last lane that can see it');
});

test('7b: long-description fires only on a complex image; a logo gets alt-adequacy only', () => {
  const collect = { elements: [
    { xpath: '/logo', complexImageHint: false },
    { xpath: '/chart', complexImageHint: true },
  ] };
  const ledger = [
    { xpath: '/logo', sc: '1.1.1', claimFamily: 'non-text-content', autoPartial: true },
    { xpath: '/chart', sc: '1.1.1', claimFamily: 'non-text-content', autoPartial: true },
  ];
  const subs = selectRubricSubjects(collect, ledger, RUBRICS);
  assert.deepEqual(ids(subs, '/logo'), ['alt-text-adequacy-v0'], 'a logo gets alt-adequacy only (no long-desc noise)');
  assert.deepEqual(ids(subs, '/chart'), ['alt-text-adequacy-v0', 'long-description-completeness-v0'], 'a data-bearing image gets both');
});
