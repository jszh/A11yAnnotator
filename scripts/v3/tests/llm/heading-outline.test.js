// #5 fix — TT 10.C heading-level SUSPECT signal. The info-relationships-v0 rubric previously had ZERO
// instruction to check heading LEVEL NUMBER nesting (only presence — a real <h#> tag vs a styled <div>), so a
// real DHS Trusted-Tester defect (an <h6> section immediately followed by <h4>/<h5> "subsections" — level going
// SHALLOWER onto an intermediate level, not a full reset) was structurally unfindable regardless of model. This
// pins the deterministic `headingOutline` signal computed in precomputeSignals: SKIP_DEEPER (a classic forward
// skip, e.g. h2 -> h4) and JUMP_SHALLOWER (landing on an INTERMEDIATE level more than one shallower, e.g.
// h6 -> h4) are marked SUSPECT ONLY — never a verdict, the rubric must confirm via the viewport screenshot.
//
// A full-corpus noise scan (44 DHS Trusted-Tester pages + 458 ACT reaches-llm fixtures) found the ONLY
// clearly-benign false trigger: a full reset to h1 (e.g. h4 -> h1, closing several nested sections and starting
// a brand-new top-level one — completely normal, universal). That's why JUMP_SHALLOWER excludes level===1.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const llmAdj = require('../../lib/llm-adjudicator.js');

const outlineFor = (levels) => {
  const headings = levels.map((level, i) => ({ level, text: `h${i}`, xpath: `/h${i}` }));
  const el = { xpath: '/page-level::info-relationships', __pageStructure: { title: 't', headings, lists: [], tables: [] } };
  return llmAdj.precomputeSignals(el, 'grouping-and-reading-order', '1.3.1').structure.headingOutline;
};
const suspects = (levels) => outlineFor(levels).sequence.map((e) => e.suspect);

test('headingOutline: a clean, logically-nested sequence has NO suspects', () => {
  assert.deepEqual(suspects([1, 2, 3, 2, 3, 2]), [null, null, null, null, null, null]);
});

test('headingOutline #5: a classic forward skip (h2 -> h4, h3 skipped) is SKIP_DEEPER', () => {
  assert.deepEqual(suspects([1, 2, 4]), [null, null, 'SKIP_DEEPER']);
});

test('headingOutline #5: the real DHS Trusted-Tester 405382-14 shape (h6 immediately followed by h4/h5) flags JUMP_SHALLOWER on the h6->h4 transition', () => {
  const s = suspects([2, 3, 1, 2, 6, 4, 5]);
  assert.equal(s[4], 'SKIP_DEEPER', 'h2 -> h6 is also a genuine forward skip');
  assert.equal(s[5], 'JUMP_SHALLOWER', 'h6 -> h4 lands on an intermediate level, shallower by more than 1 — the real bug transition');
  assert.equal(s[6], null, 'h4 -> h5 is a normal one-level descent');
});

test('headingOutline #5 NO OVER-SUPPRESSION GUARD: a full reset to h1 (h4 -> h1) is NOT flagged — closing several nested sections to start a new top-level one is universal and normal', () => {
  // the exact false-trigger the corpus noise scan caught before this refinement (DHS 513246-28-ee7a83).
  assert.deepEqual(suspects([1, 2, 2, 2, 4, 1, 3, 4, 4, 4, 3, 3]),
    [null, null, null, null, 'SKIP_DEEPER', null, 'SKIP_DEEPER', null, null, null, null, null]);
});

test('headingOutline: a normal shallower-by-one descent (h4 -> h3) is never flagged', () => {
  assert.deepEqual(suspects([1, 2, 3, 4, 3]), [null, null, null, null, null]);
});

test('headingOutline: headings with missing/non-numeric level (role=heading, no aria-level) do not corrupt the sequence or crash', () => {
  const s = outlineFor([1, 2]).sequence; // baseline
  const withNull = llmAdj.precomputeSignals(
    { xpath: '/page-level::info-relationships', __pageStructure: { title: 't', lists: [], tables: [], headings: [{ level: 1, text: 'a', xpath: '/a' }, { level: null, text: 'b', xpath: '/b' }, { level: 3, text: 'c', xpath: '/c' }] } },
    'grouping-and-reading-order', '1.3.1',
  ).structure.headingOutline;
  assert.equal(withNull.sequence.length, 3);
  assert.equal(withNull.sequence[1].suspect, null, 'a null-level heading is never itself flagged');
  assert.equal(withNull.sequence[2].suspect, 'SKIP_DEEPER', 'the level check resumes from the last KNOWN level (1), not the null one — 1 -> 3 skips level 2');
});

test('headingOutline: suspectCount matches the number of flagged entries', () => {
  const o = outlineFor([1, 2, 4, 1, 6, 3]); // 2->4 SKIP_DEEPER; 4->1 excluded (full reset); 1->6 SKIP_DEEPER; 6->3 JUMP_SHALLOWER
  assert.deepEqual(o.sequence.map((e) => e.suspect), [null, null, 'SKIP_DEEPER', null, 'SKIP_DEEPER', 'JUMP_SHALLOWER']);
  assert.equal(o.suspectCount, 3);
});

test('headingOutline: an empty heading list produces an empty, non-crashing outline', () => {
  assert.deepEqual(outlineFor([]), { sequence: [], suspectCount: 0 });
});
