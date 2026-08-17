'use strict';
// FACET-SPLIT ROUTING — 1.4.13 (dismissable / hoverable / persistent) and 2.4.3 (resting-order meaning /
// modal containment / reveal insertion / focus return / redundant stop).
//
// The property under test is the one that makes a split safe: routing is BY SC (see selectRubricSubjects), so
// a rubric added to an SC WITHOUT a gate fires on every subject of that SC. That is not a hypothetical — an
// ungated rubric on another SC produced 116 verdicts across every page of it, at high confidence, on rows
// whose premise was false, and displaced the incumbent rubric's barrier under the barrier-dominant merge.
//
// Two directions matter and both are asserted here:
//   · SUBTRACTION — a facet the deterministic probe POSITIVELY settled does not reach the LLM.
//   · FAIL-OPEN — a facet the probe merely reported nothing about DOES reach it. Absence ≠ pass, and for
//     1.4.13 specifically the probe's negatives are known-weak (it diffs the visibility of real ELEMENTS, so
//     a CSS pseudo-element tooltip is invisible to it while plainly on screen).
const { test } = require('node:test');
const assert = require('node:assert/strict');

const { selectRubricSubjects, precomputeSignals } = require('../../lib/llm-adjudicator.js');
const { loadRubrics } = require('../../lib/rubric-loader.js');
const oracle = require('../../lib/applicability-oracle.js');

const RUBRICS = loadRubrics().rubrics;
const HOVER_RUBRICS = ['hover-dismissable-v0', 'hover-hoverable-v0', 'hover-persistent-v0'];
const CLAUSE_RUBRICS = ['focus-modal-containment-v0', 'focus-reveal-adjacency-v0', 'focus-return-after-dismissal-v0', 'focus-redundant-stop-v0'];

const TRIG = '/html/body/span[1]';
const hoverCollect = { elements: [{ xpath: TRIG, tag: 'span', hasHoverContent: true }] };
const hoverLedger = [{ xpath: TRIG, sc: '1.4.13', claimFamily: 'hover-content', autoPartial: true }];
const hoverIds = (facets) => selectRubricSubjects(hoverCollect, hoverLedger, RUBRICS,
  { hoverFacets: facets ? { [TRIG]: facets } : null }).map((s) => s.rubricId).sort();

const FO = oracle.PAGE_FOCUSORDER_XPATH;
const foLedger = [{ xpath: FO, sc: '2.4.3', claimFamily: 'focus-order-meaning', autoPartial: true }];
const foIds = (stops) => selectRubricSubjects({ elements: [] }, foLedger, RUBRICS,
  { focusOrder: { forward: stops, backward: [], count: stops.length } }).map((s) => s.rubricId).sort();
const stop = (extra) => ({ index: 0, xpath: '/html/body/button[1]', tag: 'button', label: 'x', rect: { x: 0, y: 0, width: 10, height: 10 }, ...extra });

// ── 1.4.13 ──────────────────────────────────────────────────────────────────────────────────────────

test('1.4.13: the fused hover-content rubric is retired — the three facet rubrics replace it', () => {
  assert.equal(RUBRICS['hover-content-v0'], undefined, 'hover-content-v0 must not be loadable: with it present every 1.4.13 subject would take a FOURTH verdict fusing the same three questions');
  for (const id of HOVER_RUBRICS) assert.ok(RUBRICS[id], `${id} must load`);
});

test('1.4.13: with NO probe measurement every facet is open (fail-open — absence is not a pass)', () => {
  assert.deepEqual(hoverIds(null), HOVER_RUBRICS.slice().sort());
});

test('1.4.13: `contentAppeared:false` does NOT subtract any facet (the probe cannot see a pseudo-element tooltip)', () => {
  // The probe reports this on a page that plainly shows a tooltip whenever the content is drawn by
  // ::before/::after, painted into a canvas, or hosted in a namespace document.evaluate cannot address.
  // Subtracting on it would drop real barriers, so the gate must ignore it entirely.
  assert.deepEqual(hoverIds({ probeRan: true, contentAppeared: false, contentIsAdditional: false }), HOVER_RUBRICS.slice().sort());
});

test('1.4.13: `nativeTitleOnly` does NOT subtract any facet (an empty title="" SUPPRESSES the UA tooltip)', () => {
  assert.deepEqual(hoverIds({ probeRan: true, nativeTitleOnly: true, contentAppeared: false }), HOVER_RUBRICS.slice().sort());
});

test('1.4.13: a POSITIVELY settled dismissable/hoverable is subtracted; persistence never is', () => {
  // Escape worked (or the content obscures nothing) AND a real pointer travel survived — both are sufficient
  // conditions under the criterion, so both questions are closed. The bounded dwell is not sufficient, so the
  // persistence question survives its own `true` — that residue is the whole reason the rubric exists.
  const ids = hoverIds({ probeRan: true, contentAppeared: true, contentIsAdditional: true, dismissible: true, hoverable: true, persistent: true, revealMode: 'hover' });
  assert.deepEqual(ids, ['hover-persistent-v0']);
});

test('1.4.13: a FOCUS-only reveal makes Hoverable vacuous, and only that facet is dropped', () => {
  // The Hoverable condition is about pointer-hover-triggered content; the runner records revealMode 'focus'
  // exactly when hovering revealed nothing, so there is no pointer channel to travel along.
  assert.deepEqual(hoverIds({ probeRan: true, contentAppeared: true, contentIsAdditional: true, revealMode: 'focus' }), ['hover-dismissable-v0', 'hover-persistent-v0']);
});

test('1.4.13: the per-facet measurements REACH the prompt, with persistence flagged as bounded', () => {
  const facets = { probeRan: true, contentAppeared: true, contentIsAdditional: true, dismissible: false, hoverable: true, persistent: true, revealMode: 'hover', dwellMs: 1600 };
  const sub = selectRubricSubjects(hoverCollect, hoverLedger, RUBRICS, { hoverFacets: { [TRIG]: facets } })
    .find((s) => s.rubricId === 'hover-dismissable-v0');
  assert.ok(sub, 'the dismissable subject must exist');
  const sig = precomputeSignals(sub.element, sub.skill, sub.sc);
  assert.equal(sig.hoverFacets.dismissible, false);
  assert.equal(sig.hoverFacets.dwellMs, 1600);
  assert.match(sig.hoverFacets.note, /still present after `dwellMs`/, 'the note must state that a persistent:true is a BOUNDED observation, not a clearance');
  assert.match(sig.hoverFacets.note, /never as "nothing appears"/, 'the note must state that the probe negatives are weak');
});

test('1.4.13: the facet signals do NOT leak onto other color-and-visual-text subjects', () => {
  // 1.4.1 / 1.4.3 element rubrics share this skill; their prompts must stay byte-identical.
  const sig = precomputeSignals({ xpath: '/p[1]', text: 'x' }, 'color-and-visual-text', '1.4.1');
  assert.equal(sig.hoverFacets, undefined);
});

// ── 2.4.3 ──────────────────────────────────────────────────────────────────────────────────────────

test('2.4.3: with a bare ring only the residual meaning rubric fires — no clause rubric is ungated', () => {
  // This is the property that keeps the split from multiplying calls: a page carrying none of the clause
  // facts costs exactly what it costs today, one call.
  assert.deepEqual(foIds([stop({}), stop({ index: 1 })]), ['focus-order-meaning-v0']);
});

test('2.4.3: each clause rubric fires ONLY on its own pre-computed fact', () => {
  const cases = [
    [{ modalOpen: true, insideOpenModal: false }, 'focus-modal-containment-v0'],
    [{ reveal: { adjacent: false, focusMovedIntoRevealed: false } }, 'focus-reveal-adjacency-v0'],
    [{ reveal: { regionHiddenAfterDismiss: true, returnedToOpener: false, openerStillPresent: true } }, 'focus-return-after-dismissal-v0'],
    [{ wrapsNextStop: true }, 'focus-redundant-stop-v0'],
    [{ genericContainerStop: true }, 'focus-redundant-stop-v0'],
  ];
  for (const [facts, expected] of cases) {
    const ids = foIds([stop(facts)]);
    assert.deepEqual(ids, ['focus-order-meaning-v0', expected].sort(), `stop facts ${JSON.stringify(facts)} must route to ${expected} and nothing else`);
  }
});

test('2.4.3: the two reveal halves are INDEPENDENT — insertion facts alone do not summon the return rubric', () => {
  // A page can satisfy insertion and fail the return, and vice versa; they are measured by different fields
  // and the return requirement is owed only once something was actually dismissed.
  assert.deepEqual(foIds([stop({ reveal: { adjacent: true, focusMovedIntoRevealed: false, regionHiddenAfterDismiss: false } })]),
    ['focus-order-meaning-v0', 'focus-reveal-adjacency-v0'].sort());
});

test('2.4.3: an all-null reveal record summons NEITHER reveal rubric (never argue from a null)', () => {
  // `null` means the question could not be asked on this page. Both rubrics are told never to argue from one,
  // so routing them there would buy a guaranteed abstain at the price of an LLM call.
  assert.deepEqual(foIds([stop({ reveal: { adjacent: null, focusMovedIntoRevealed: null } })]), ['focus-order-meaning-v0']);
});

test('2.4.3: every clause rubric that fires is HANDED the ring it is written around', () => {
  const stops = [stop({ modalOpen: true, insideOpenModal: false, wrapsNextStop: true, reveal: { adjacent: false, focusMovedIntoRevealed: false, regionHiddenAfterDismiss: true, returnedToOpener: false, openerStillPresent: true } })];
  const subs = selectRubricSubjects({ elements: [] }, foLedger, RUBRICS, { focusOrder: { forward: stops, backward: [], count: 1 } });
  assert.deepEqual(subs.map((s) => s.rubricId).sort(), ['focus-order-meaning-v0', ...CLAUSE_RUBRICS].sort());
  for (const s of subs) {
    const sig = precomputeSignals(s.element, s.skill, s.sc);
    assert.ok(sig.focusOrder && Array.isArray(sig.focusOrder.forward) && sig.focusOrder.forward.length,
      `${s.rubricId} must receive the recorded sequence — a rubric written around an artifact it never gets can only abstain or confabulate`);
  }
});

test('2.4.3: the clause rubrics do NOT leak onto the element-level focus-management subjects', () => {
  // 2.4.7 focus-visible and 2.4.11 focus-not-obscured share the `focus-management` skill. Routing is by SC,
  // so they are separated by SC alone — assert it, because a widened skill-keyed thread would break it.
  const subs = selectRubricSubjects({ elements: [{ xpath: '/a[1]', tag: 'a' }] },
    [{ xpath: '/a[1]', sc: '2.4.7', claimFamily: 'focus-visible', autoPartial: true }], RUBRICS,
    { focusOrder: { forward: [stop({ modalOpen: true, insideOpenModal: false })], backward: [], count: 1 } });
  for (const id of ['focus-order-meaning-v0', ...CLAUSE_RUBRICS]) {
    assert.ok(!subs.some((s) => s.rubricId === id), `${id} must not fire on a 2.4.7 subject`);
  }
});

// ── shared invariants ───────────────────────────────────────────────────────────────────────────────

test('every rubric on a split SC declares a gate, and every new rubric asks ONE question', () => {
  // Routing is by SC. Any rubric on 1.4.13 or 2.4.3 that is neither the residual owner nor gated would fire
  // on every subject of its SC — the defect this split exists to avoid, reintroduced.
  const src = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', '..', 'lib', 'llm-adjudicator.js'), 'utf8');
  for (const id of HOVER_RUBRICS) assert.ok(src.includes(`'${id}'`), `${id} must be named in a gate`);
  for (const id of CLAUSE_RUBRICS) assert.ok(src.includes(`'${id}'`), `${id} must be named in a gate`);
  // Exactly one "Your one question" per new rubric — the atomicity contract, stated in the prompt itself.
  const fs = require('node:fs'); const path = require('node:path');
  for (const id of [...HOVER_RUBRICS, ...CLAUSE_RUBRICS]) {
    const t = fs.readFileSync(path.join(__dirname, '..', '..', 'llm-rubrics', `${id}.md`), 'utf8');
    assert.equal((t.match(/\*\*Your one question:\*\*/g) || []).length, 1, `${id} must state exactly ONE question`);
  }
});

test('the dwell the persistence rubric is told to rely on matches the dwell the runner measures', () => {
  // The judge is told `persistent: true` means "still present after dwellMs" and invited to reason about a
  // timer longer than that window. If the two numbers drift, that reasoning is silently wrong.
  const fs = require('node:fs'); const path = require('node:path');
  const lib = path.join(__dirname, '..', '..', 'lib');
  const runner = fs.readFileSync(path.join(lib, 'exp-runners.js'), 'utf8');
  const orch = fs.readFileSync(path.join(lib, 'orchestrator.js'), 'utf8');
  const m = runner.match(/await H\.settle\(page, (\d+)\);\s*\n\s*o\.persistent =/);
  assert.ok(m, 'the persistence dwell must still be a literal settle() immediately before o.persistent');
  const declared = orch.match(/const HOVER_PERSIST_DWELL_MS = (\d+);/);
  assert.ok(declared, 'orchestrator must declare the dwell it reports to the judge');
  assert.equal(declared[1], m[1], `the reported dwell (${declared && declared[1]}ms) must equal the measured dwell (${m[1]}ms)`);
});
