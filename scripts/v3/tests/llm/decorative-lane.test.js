'use strict';
// The "don't BLINDLY exclude decorative" lane: a SUBSTANTIAL, UNnamed removed-from-tree image is routed to the
// redundancy-aware decorative-image-verification rubric instead of being silently excluded; tiny/narrow spacers stay
// excluded; a named removed-from-tree image (decorativeConflict) still routes alt-text-adequacy; in-tree images
// unchanged. Covers the oracle predicate (size gate + exclusions + env toggles), the oracle mint, and the routing
// mutual-exclusivity in selectRubricSubjects.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const oracle = require('../../lib/applicability-oracle.js');
const { selectRubricSubjects } = require('../../lib/llm-adjudicator.js');

const img = (over) => ({ xpath: '/img', isImage: true, role: 'img', box: { width: 80, height: 60 }, removedFromA11yTree: true, decorativeConflict: false, ...over });

test('decorativeSuspect: a SUBSTANTIAL unnamed removed-from-tree image is a suspect', () => {
  assert.equal(oracle.decorativeSuspect(img()), true);
  assert.equal(oracle.decorativeSuspect(img({ role: '', isImage: true })), true, 'isImage alone qualifies (no role)');
});

test('decorativeSuspect: TINY / NARROW images stay excluded (the size gate — 0 recall loss bucket)', () => {
  assert.equal(oracle.decorativeSuspect(img({ box: { width: 8, height: 8 } })), false, '8x8 spacer excluded');
  assert.equal(oracle.decorativeSuspect(img({ box: { width: 600, height: 2 } })), false, 'a 2px-tall sliver/divider excluded (minDim)');
  assert.equal(oracle.decorativeSuspect(img({ box: { width: 16, height: 16 } })), false, '16x16 icon excluded at default threshold 24');
});

test('decorativeSuspect: tolerates BOTH collector box shapes ({width,height} and corpus {w,h})', () => {
  assert.equal(oracle.decorativeSuspect(img({ box: { w: 80, h: 60 } })), true, 'eval-page.js {w,h} box still gates');
  assert.equal(oracle.decorativeSuspect(img({ box: { w: 8, h: 8 } })), false, 'tiny {w,h} box still excluded');
});

test('decorativeSuspect: the already-handled / not-applicable cases are NOT suspects', () => {
  assert.equal(oracle.decorativeSuspect(img({ removedFromA11yTree: false })), false, 'in-tree image owes the normal obligation');
  assert.equal(oracle.decorativeSuspect(img({ decorativeConflict: true })), false, 'named-but-hidden is the Tier-0 #5 route');
  assert.equal(oracle.decorativeSuspect(img({ svgNamedDescendant: true })), false, 'svg named via <title> is not bare-decorative');
  assert.equal(oracle.decorativeSuspect({ xpath: '/x', isImage: false, removedFromA11yTree: true, box: { width: 80, height: 60 } }), false, 'non-image element');
  assert.equal(oracle.decorativeSuspect(img({ box: null })), false, 'no rendered box ⇒ not a suspect');
  assert.equal(oracle.decorativeSuspect(null), false);
});

// ─── Finding #10 (generalization audit): the 24px square wall must not silently clear ELONGATED informative
// images — WCAG 1.1.1 / ACT e88epe carry NO size floor, so only true spacer geometry may be size-excluded. ───
test('#10 RECALL: a 320x20 removed-from-tree unnamed image (image-of-text shape) IS a suspect despite min-dim 20 < 24', () => {
  assert.equal(oracle.decorativeSuspect(img({ box: { width: 320, height: 20 } })), true, 'elongated text-shaped strip escapes the square gate');
  assert.equal(oracle.decorativeSuspect(img({ box: { w: 20, h: 320 } })), true, 'vertical strip + {w,h} collector shape too (aspect is orientation-free)');
});

test('#10 RECALL: the 320x20 suspect MINTS the 1.1.1 + 1.4.5 verification obligations (was a silent false clear)', () => {
  const scs = oracle.deriveObligations({ elements: [img({ xpath: '/strip', box: { width: 320, height: 20 } })] })
    .filter((o) => o.xpath === '/strip').map((o) => o.sc);
  assert.ok(scs.includes('1.1.1'), 'sub-24px elongated decorated-away image owes the 1.1.1 verification obligation');
  assert.ok(scs.includes('1.4.5'), 'and 1.4.5 (an image-of-text is exactly the elongated shape)');
});

test('#10 OVER-FIRE guard: spacer geometry stays excluded (square icons, slivers, border stripes, sub-word shims)', () => {
  assert.equal(oracle.decorativeSuspect(img({ box: { width: 8, height: 8 } })), false, '8x8 spacer.gif: aspect 1 fails the text-shape test');
  assert.equal(oracle.decorativeSuspect(img({ box: { width: 16, height: 16 } })), false, '16x16 icon: square-ish stays under the square gate');
  assert.equal(oracle.decorativeSuspect(img({ box: { width: 600, height: 2 } })), false, '600x2 sliver: no glyph renders at 2px');
  assert.equal(oracle.decorativeSuspect(img({ box: { width: 300, height: 6 } })), false, '300x6 border stripe: below the legible-text height floor (10px) — the 23a2a8 decorative-stripe geometry');
  assert.equal(oracle.decorativeSuspect(img({ box: { width: 60, height: 6 } })), false, '60x6 shim: elongated but too narrow (and sub-word area) to hold text');
  assert.equal(oracle.decorativeSuspect(img({ box: { width: 40, height: 20 } })), false, '40x20 chip: aspect 2 < 4 — not text-shaped, still under the square gate');
});

test('decorativeSuspect: V3_DECORATIVE_MIN_DIM tunes the gate; V3_DECORATIVE_LANE=0 disables the lane', () => {
  const prevDim = process.env.V3_DECORATIVE_MIN_DIM, prevLane = process.env.V3_DECORATIVE_LANE;
  try {
    process.env.V3_DECORATIVE_MIN_DIM = '100';
    assert.equal(oracle.decorativeSuspect(img({ box: { width: 80, height: 60 } })), false, '60px < tuned threshold 100');
    assert.equal(oracle.decorativeSuspect(img({ box: { width: 120, height: 110 } })), true, '110px >= tuned threshold');
    delete process.env.V3_DECORATIVE_MIN_DIM;
    process.env.V3_DECORATIVE_LANE = '0';
    assert.equal(oracle.decorativeSuspect(img()), false, 'lane disabled ⇒ no suspects (reverts to blanket exclusion)');
  } finally {
    if (prevDim === undefined) delete process.env.V3_DECORATIVE_MIN_DIM; else process.env.V3_DECORATIVE_MIN_DIM = prevDim;
    if (prevLane === undefined) delete process.env.V3_DECORATIVE_LANE; else process.env.V3_DECORATIVE_LANE = prevLane;
  }
});

test('oracle mints 1.1.1 + 1.4.5 for a decorative-suspect, and NOT for a tiny one', () => {
  const big = oracle.deriveObligations({ elements: [img({ xpath: '/big' })] }).filter((o) => o.xpath === '/big').map((o) => o.sc);
  assert.ok(big.includes('1.1.1'), 'substantial decorative-suspect owes 1.1.1');
  assert.ok(big.includes('1.4.5'), 'and 1.4.5 (image-of-text)');
  const tiny = oracle.deriveObligations({ elements: [img({ xpath: '/tiny', box: { width: 8, height: 8 } })] }).filter((o) => o.xpath === '/tiny').map((o) => o.sc);
  assert.ok(!tiny.includes('1.1.1'), 'a tiny decorative image owes NO 1.1.1 alt obligation (stays excluded)');
});

const RUBRICS = {
  'alt-text-adequacy-v0': { id: 'alt-text-adequacy-v0', sc: '1.1.1', skill: 'name-role-state', visionEvidence: ['element-crop'] },
  'long-description-completeness-v0': { id: 'long-description-completeness-v0', sc: '1.1.1', skill: 'name-role-state', visionEvidence: ['element-crop'] },
  'decorative-image-verification-v0': { id: 'decorative-image-verification-v0', sc: '1.1.1', skill: 'name-role-state', visionEvidence: ['element-crop'] },
};
const ids = (subs, xp) => subs.filter((s) => s.xpath === xp).map((s) => s.rubricId).sort();

test('routing: a decorative-suspect routes ONLY decorative-image-verification (alt-adequacy/long-desc gated off)', () => {
  const collect = { elements: [
    img({ xpath: '/suspect' }),                                              // substantial unnamed removed-from-tree
    img({ xpath: '/conflict', decorativeConflict: true }),                   // named-but-hidden → alt-adequacy
    img({ xpath: '/intree', removedFromA11yTree: false, complexImageHint: true }), // in-tree data-bearing image
  ] };
  const ledger = collect.elements.map((e) => ({ xpath: e.xpath, sc: '1.1.1', claimFamily: 'non-text-content', autoPartial: true }));
  const subs = selectRubricSubjects(collect, ledger, RUBRICS);
  assert.deepEqual(ids(subs, '/suspect'), ['decorative-image-verification-v0'], 'suspect → ONLY the verification rubric');
  assert.deepEqual(ids(subs, '/conflict'), ['alt-text-adequacy-v0'], 'a named conflict still gets alt-adequacy, NOT the decorative rubric');
  assert.deepEqual(ids(subs, '/intree'), ['alt-text-adequacy-v0', 'long-description-completeness-v0'], 'an in-tree complex image is unchanged');
});

test('#10 routing: the elongated suspect routes ONLY decorative-image-verification (same mutual exclusivity as big suspects)', () => {
  const collect = { elements: [img({ xpath: '/strip', box: { width: 320, height: 20 } })] };
  const ledger = [{ xpath: '/strip', sc: '1.1.1', claimFamily: 'non-text-content', autoPartial: true }];
  const subs = selectRubricSubjects(collect, ledger, RUBRICS);
  assert.deepEqual(ids(subs, '/strip'), ['decorative-image-verification-v0'], 'recovered strip goes to the redundancy-aware rubric, not alt-adequacy');
});
