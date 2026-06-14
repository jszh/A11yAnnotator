// Unit tests for the pure harness helpers (no browser). Run: node --test scripts/tests/
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const L = require('../lib/a11y-eval.js');

// ---------------- T4: large-text threshold ----------------
test('T4 isLargeText: WCAG 18pt(24px)/14pt(18.66px) bold boundaries', () => {
  // normal weight: large only at >=24px (18pt)
  assert.equal(L.isLargeText(23.9, 400), false);
  assert.equal(L.isLargeText(24, 400), true);
  // bold: large at >=18.667px (14pt exact)
  assert.equal(L.isLargeText(18.67, 700), true);
  assert.equal(L.isLargeText(18.5, 700), false);
  // the historical bug cases: 16px bold and 14px bold are NOT large
  assert.equal(L.isLargeText(16, 700), false, '16px bold must NOT be large (was the Domino\'s bug)');
  assert.equal(L.isLargeText(14, 700), false, '14px bold must NOT be large (the literal >=14 bug)');
  // weight as string (computed style)
  assert.equal(L.isLargeText(20, '700'), true);
  assert.equal(L.isLargeText(20, '600'), false);
});

test('T4 contrastThresholdFor', () => {
  assert.equal(L.contrastThresholdFor(16, 700), 4.5); // Domino's JOIN NOW => must be 4.5
  assert.equal(L.contrastThresholdFor(24, 400), 3.0);
  assert.equal(L.contrastThresholdFor(19, 700), 3.0);
});

test('contrastRatio sanity', () => {
  assert.equal(L.contrastRatio([0, 0, 0], [255, 255, 255]), 21);
  // red on white ~ 4.0 (the boohooman/Domino's band)
  const rw = L.contrastRatio([255, 0, 0], [255, 255, 255]);
  assert.ok(rw > 3.9 && rw < 4.1, `red-on-white ~4, got ${rw}`);
});

// ---------------- T3 / C4: target-size with NORMATIVE geometry ----------------
test('C4 evalTargetSize: meets size (with a positive dense hit-test)', () => {
  assert.equal(L.evalTargetSize({ x: 0, y: 0, w: 40, h: 40 }, { squareFits: true }).passes, true);
  // R2.5-E: a bare bbox with NO hit-test evidence is no longer a definite pass
  assert.equal(L.evalTargetSize({ x: 0, y: 0, w: 40, h: 40 }).verdict, 'needs-judgment');
});
test('R2.4-D/R2.5-E evalTargetSize: a definite PASS requires a positive dense hit-test; sparse/absent never passes', () => {
  // squareFits=true (densely on-target) → pass, even for a transformed-but-fitting target
  assert.equal(L.evalTargetSize({ w: 40, h: 40 }, { squareFits: true, transformed: true }).verdict, 'pass');
  // squareFits=false → needs-judgment (the grid DISPROVED fit)
  assert.equal(L.evalTargetSize({ w: 40, h: 40 }, { squareFits: false }).verdict, 'needs-judgment');
  // R2.5-E: null (could not be measured) is NEVER a pass — no flag fallback
  assert.equal(L.evalTargetSize({ w: 40, h: 40 }, { squareFits: null }).verdict, 'needs-judgment');
  assert.equal(L.evalTargetSize({ w: 40, h: 40 }, { squareFits: null, transformed: true }).verdict, 'needs-judgment');
});
test('C4 evalTargetSize: spacing exception — small target clear of all neighbours', () => {
  // 98x15 footer link at (0,100); nearest neighbour rect is far → 24px circle clears it
  const r = L.evalTargetSize({ x: 0, y: 100, w: 98, h: 15 }, { neighbors: [{ x: 0, y: 200, w: 98, h: 15 }] });
  assert.equal(r.passes, true);
  assert.match(r.reason, /spacing exception/);
});
test('C4 evalTargetSize: AUDITOR COUNTEREXAMPLE — small target near a LARGE neighbour fails despite 30px centre gap', () => {
  // 10x10 target centred at (5,5). A large neighbour whose nearest EDGE is <12px away
  // (centre ~30px away) → the 24px circle intersects the large rect → FAIL.
  const r = L.evalTargetSize({ x: 0, y: 0, w: 10, h: 10 }, { neighbors: [{ x: 14, y: 0, w: 200, h: 50 }] });
  assert.equal(r.passes, false, 'circle-to-rectangle must catch the large neighbour');
});
test('R2.3-A evalTargetSize: inline is NEVER an auto-pass — even with inSentence hint it is needs-judgment', () => {
  // the harness cannot PROVE "in a sentence"; an inline target that fails geometry is
  // needs-judgment regardless of the inSentence hint (lowercase-nav boilerplate defeats it)
  const proseHint = L.evalTargetSize({ x: 0, y: 0, w: 30, h: 16 }, { inlineCandidate: true, inSentence: true, neighbors: [{ x: 0, y: 18, w: 30, h: 16 }] });
  assert.equal(proseHint.verdict, 'needs-judgment');
  assert.equal(proseHint.passes, false);
  const noHint = L.evalTargetSize({ x: 0, y: 0, w: 30, h: 16 }, { inlineCandidate: true, inSentence: false, neighbors: [{ x: 0, y: 18, w: 30, h: 16 }] });
  assert.equal(noHint.verdict, 'needs-judgment');
});
test('R2.3-A evalTargetSize: SHAPE — bbox≥24x24 is a definite pass ONLY for a hit-tested axis-aligned rectangle', () => {
  assert.equal(L.evalTargetSize({ x: 0, y: 0, w: 24, h: 24 }, { squareFits: true }).verdict, 'pass'); // plain rect, hit-tested solid
  // rotated 18x18 → 25x25 bbox: transformed → needs-judgment (page-aligned square may not fit)
  assert.equal(L.evalTargetSize({ x: 0, y: 0, w: 25, h: 25 }, { transformed: true }).verdict, 'needs-judgment');
  // clip-path → needs-judgment
  assert.equal(L.evalTargetSize({ x: 0, y: 0, w: 40, h: 40 }, { clipped: true }).verdict, 'needs-judgment');
  // tightly-rounded 24x24 (r=6) can't fit a 24x24 square → needs-judgment
  assert.equal(L.evalTargetSize({ x: 0, y: 0, w: 24, h: 24 }, { cornerRadius: 6 }).verdict, 'needs-judgment');
  // generously-sized rounded 40x40 (r=6) easily fits — pass requires the dense hit-test
  assert.equal(L.evalTargetSize({ x: 0, y: 0, w: 40, h: 40 }, { cornerRadius: 6, squareFits: true }).verdict, 'pass');
});
test('C4 evalTargetSize: zero-size element is not a target', () => {
  assert.equal(L.evalTargetSize({ x: 0, y: 0, w: 0, h: 34 }).passes, true);
});
test('C4 evalTargetSize: tightly stacked undersized targets (circle-circle) => FAIL', () => {
  const r = L.evalTargetSize({ x: 0, y: 0, w: 16, h: 16 }, { neighbors: [{ x: 0, y: 18, w: 16, h: 16 }] });
  assert.equal(r.passes, false);
});
test('C4 evalTargetSize: no neighbour geometry => spacing unproven (fail + flag)', () => {
  const r = L.evalTargetSize({ x: 0, y: 0, w: 16, h: 16 }, {});
  assert.equal(r.passes, false);
  assert.equal(r.indeterminateSpacing, true);
});
test('R21-H3 evalTargetSize: TRI-STATE — unresolved cases are needs-judgment, not definite', () => {
  // no neighbour geometry → can't prove/disprove spacing → needs-judgment
  const a = L.evalTargetSize({ x: 0, y: 0, w: 16, h: 16 }, {});
  assert.equal(a.verdict, 'needs-judgment'); assert.equal(a.requiresJudgment, true); assert.equal(a.passes, false);
  // display:inline but in-sentence unproven, fails geometry → needs-judgment (might be exempt)
  const b = L.evalTargetSize({ x: 0, y: 0, w: 30, h: 16 }, { inlineCandidate: true, inSentence: false, neighbors: [{ x: 0, y: 17, w: 30, h: 16 }] });
  assert.equal(b.verdict, 'needs-judgment');
  // transformed target whose bbox is 24x24 → can't assume a 24x24 square fits → judgment
  const c = L.evalTargetSize({ x: 0, y: 0, w: 24, h: 24 }, { transformed: true });
  assert.equal(c.verdict, 'needs-judgment');
});
test('R21-H3 evalTargetSize: a definite FAIL still flags Equivalent/Essential to check', () => {
  const r = L.evalTargetSize({ x: 0, y: 0, w: 10, h: 10 }, { neighbors: [{ x: 14, y: 0, w: 200, h: 50 }] });
  assert.equal(r.verdict, 'fail'); assert.equal(r.passes, false);
  assert.deepEqual(r.checkExceptions, ['equivalent', 'essential']);
});
test('R2-H5 evalTargetSize: UA-control exception (bare 13x13 checkbox) => pass', () => {
  const r = L.evalTargetSize({ x: 0, y: 0, w: 13, h: 13 }, { uaControl: true, neighbors: [{ x: 0, y: 16, w: 13, h: 13 }] });
  assert.equal(r.passes, true);
  assert.match(r.reason, /user-agent control/);
});
test('R2-H5/R2.3-A evalTargetSize: a non-inline undersized target with a neighbour is a definite FAIL', () => {
  const r = L.evalTargetSize({ x: 0, y: 0, w: 20, h: 20 }, { neighbors: [{ x: 0, y: 21, w: 20, h: 20 }] });
  assert.equal(r.verdict, 'fail');
  assert.deepEqual(r.checkExceptions, ['equivalent', 'essential']);
});

// ---------------- T9/T10: VSR phrase filtering ----------------
test('T9 isVsrNoisePhrase filters document/landmark/empty', () => {
  for (const p of ['document', 'Document', ' main ', 'banner', '', null, 'end of main', 'navigation'])
    assert.equal(L.isVsrNoisePhrase(p), true, `${JSON.stringify(p)} should be noise`);
  for (const p of ['link, Home', 'button, Add to bag', 'Search'])
    assert.equal(L.isVsrNoisePhrase(p), false, `${JSON.stringify(p)} should be real`);
});
test('T9/T10 meaningfulAnnouncement: drops "document" and sticky repeats', () => {
  assert.equal(L.meaningfulAnnouncement('document', null), null);           // LinkedIn artifact
  assert.equal(L.meaningfulAnnouncement('link, Home', 'link, Home'), null); // sticky/stale (Reddit)
  assert.equal(L.meaningfulAnnouncement('Added to bag', 'button, Add'), 'Added to bag');
});

// ---------------- T12: media artifacts ----------------
test('T12 isMediaErrorName', () => {
  assert.equal(L.isMediaErrorName('Unable to play media.'), true);
  assert.equal(L.isMediaErrorName('No compatible source was found'), true);
  assert.equal(L.isMediaErrorName('Play video about pricing'), false);
});
test('T12 isBlankFrame', () => {
  assert.equal(L.isBlankFrame({ meanLuma: 3, stdLuma: 1, darkFraction: 1 }), true);  // black video frame
  assert.equal(L.isBlankFrame({ meanLuma: 130, stdLuma: 60, darkFraction: 0.2 }), false); // real content
  assert.equal(L.isBlankFrame(null), false);
});

// ---------------- T2: roving tabindex / keyboard ----------------
test('T2 isRovingTabindexItem', () => {
  assert.equal(L.isRovingTabindexItem('tab', '-1'), true);
  assert.equal(L.isRovingTabindexItem('tab', '0'), false);
  assert.equal(L.isRovingTabindexItem('button', '-1'), false);
});
test('T2 keyboardOperabilitySignal: roving tab not reached by Tab => indeterminate not failure', () => {
  const s = L.keyboardOperabilitySignal({ role: 'tab', tabindex: '-1', reachedByTab: false, respondedToSyntheticKey: false, respondsToArrows: false });
  assert.equal(s.operable, null, 'must be indeterminate (PARTIAL), not a confident keyboard failure');
  assert.equal(s.confident, false);
});
test('T2 keyboardOperabilitySignal: roving tab operated by arrows => operable', () => {
  const s = L.keyboardOperabilitySignal({ role: 'tab', tabindex: '-1', respondsToArrows: true });
  assert.equal(s.operable, true);
});
test('T2 keyboardOperabilitySignal: custom widget no response => indeterminate (offline synthetic)', () => {
  const s = L.keyboardOperabilitySignal({ role: 'button', tabindex: '0', reachedByTab: true, respondedToSyntheticKey: false, focusable: true });
  assert.equal(s.operable, null);
});
test('C3 keyboardOperabilitySignal: non-focusable NON-composite (div+onclick) => operable:false', () => {
  const s = L.keyboardOperabilitySignal({ role: null, tabindex: null, reachedByTab: false, respondedToSyntheticKey: false, focusable: false });
  assert.equal(s.operable, false);
  assert.equal(s.confident, false);
});
test('C3 keyboardOperabilitySignal: non-focusable COMPOSITE (div[role=tab], un-hydrated) => null not false', () => {
  const s = L.keyboardOperabilitySignal({ role: 'tab', tabindex: null, reachedByTab: false, respondedToSyntheticKey: false, focusable: false });
  assert.equal(s.operable, null, 'a composite-role widget stays indeterminate on a snapshot, not a confident failure');
});

// ---------------- T1/T8/H1: focus ring decision (focus-dependent + real-keyboard-first) ----------------
test('H1 focusRingDecision: ALWAYS-ON shadow, real focus no change => present:false (kills FP)', () => {
  // focused shadow == unfocused shadow => not focus-dependent; real pixels didn't move
  const r = L.focusRingDecision({ realTabDiffPct: 0, realTabCropValid: true, focusedOutline: 'none', unfocusedOutline: 'none', focusedBoxShadow: 'rgba(0,0,0,0.2) 0px 2px 4px', unfocusedBoxShadow: 'rgba(0,0,0,0.2) 0px 2px 4px' });
  assert.equal(r.present, false);
  assert.equal(r.focusDependentComputed, false);
});
test('H1 focusRingDecision: JS-driven focus class — REAL Tab diff => present:true (forced-only would miss)', () => {
  const r = L.focusRingDecision({ realTabDiffPct: 6.9, realTabCropValid: true, focusedOutline: 'none', unfocusedOutline: 'none', forcedDiffPct: 0 });
  assert.equal(r.present, true);
  assert.match(r.basis, /real-keyboard/);
});
test('H1 focusRingDecision: genuine no-ring (real focus, no focus-dependent change) => false', () => {
  const r = L.focusRingDecision({ realTabDiffPct: 0.1, realTabCropValid: true, focusedOutline: 'none 3px rgb(0,0,0)', unfocusedOutline: 'none 3px rgb(0,0,0)', focusedBoxShadow: 'none', unfocusedBoxShadow: 'none' });
  assert.equal(r.present, false);
});
test('H1 focusRingDecision: computed ring changed but real pixels did not => null (conflict, clipped/wrong-crop)', () => {
  const r = L.focusRingDecision({ realTabDiffPct: 0, realTabCropValid: true, focusedOutline: 'solid 2px rgb(0,95,204)', unfocusedOutline: 'none 3px rgb(0,0,0)' });
  assert.equal(r.present, null);
});
test('H1 focusRingDecision: forced corroborates computed change when no real crop => present:true', () => {
  const r = L.focusRingDecision({ realTabCropValid: false, forcedDiffPct: 8.44, focusedOutline: 'auto 1px rgb(0,95,204)', unfocusedOutline: 'none 3px rgb(0,0,0)' });
  assert.equal(r.present, true);
});
test('H1 focusRingDecision: forced is NOT independent proof (forced diff but no focus-dependent computed change) => not auto-true', () => {
  const r = L.focusRingDecision({ realTabCropValid: false, forcedDiffPct: 2.0, focusedOutline: 'none', unfocusedOutline: 'none', focusedBoxShadow: 'none', unfocusedBoxShadow: 'none' });
  assert.notEqual(r.present, true); // null or false, never a confident true on forced-only
});
test('H1 focusRingDecision: off-screen element, no pixels, but forced outline none→auto => present:true', () => {
  // Apple el7: tab-unreachable + can\'t screenshot, but forcing focus-visible changes
  // the computed outline from none to a real rendered line → sufficient for 2.4.7.
  const r = L.focusRingDecision({ realTabCropValid: false, forcedDiffPct: null, unfocusedOutline: 'none 3px rgb(227,227,227)', focusedOutline: 'auto 1px rgb(153,200,255)' });
  assert.equal(r.present, true);
});
test('H1 focusRingDecision: off-screen, shadow-only focus-dependence, no pixels => null (can\'t confirm visible)', () => {
  const r = L.focusRingDecision({ realTabCropValid: false, forcedDiffPct: null, unfocusedOutline: 'none', focusedOutline: 'none', unfocusedBoxShadow: 'none', focusedBoxShadow: 'rgb(0,0,0) 0 0 0 1px' });
  assert.equal(r.present, null);
});
test('H1 focusRingDecision: nothing usable => indeterminate (null)', () => {
  const r = L.focusRingDecision({ realTabCropValid: false, focusedOutline: 'none', unfocusedOutline: 'none' });
  assert.equal(r.present, null);
});

// ---------------- R2-H4: spatial focus verdict (area-independent) + 2.4.13 capture ----------------
test('R2-H4 focusSpatialVerdict: THIN ring on a BIG control (tiny %) => present via perimeter', () => {
  // 1px ring on a 600x100 button: ~1.8% of pixels, but 93% of the change is in the border band
  const v = L.focusSpatialVerdict({ changedPixels: 1400, totalPixels: 77000, borderPixels: 20000, borderChanged: 1300, minThicknessPx: 1, maxContrastChange: 4.2, bbox: { x: 0, y: 0, w: 624, h: 124 } });
  assert.equal(v.present, true);
  assert.equal(v.ringLike, true);
});
test('R2-H4 focusSpatialVerdict: a blinking caret (few interior pixels) => not a ring', () => {
  const v = L.focusSpatialVerdict({ changedPixels: 16, totalPixels: 8000, borderPixels: 3000, borderChanged: 0, minThicknessPx: 1, maxContrastChange: 10 });
  assert.equal(v.present, false);
});
test('R2-H4 focusSpatialVerdict: a focus background fill => present via area', () => {
  const v = L.focusSpatialVerdict({ changedPixels: 4000, totalPixels: 8000, borderPixels: 3000, borderChanged: 1500, minThicknessPx: 40, maxContrastChange: 3.5 });
  assert.equal(v.present, true);
  assert.equal(v.fillLike, true);
});
test('R2-H4 focusSpatialVerdict: captures 2.4.13 metrics but does NOT enforce the AAA threshold', () => {
  const v = L.focusSpatialVerdict({ changedPixels: 1400, totalPixels: 77000, borderPixels: 20000, borderChanged: 1300, minThicknessPx: 3, maxContrastChange: 4.2 });
  assert.equal(v.focusAppearance2413.enforced, false);
  assert.equal(v.focusAppearance2413.areaPx, 1400);
  assert.equal(v.focusAppearance2413.thicknessProxyPx, 3);
  assert.equal(v.focusAppearance2413.roughMeetsProxy, true); // proxy hint only, recorded not gated
  assert.equal(v.focusAppearance2413.proxyOnly, true);
});
test('R2-H4 focusRingDecision: spatial present overrides a sub-1.5% scalar (thin-large fix)', () => {
  const r = L.focusRingDecision({ realTabCropValid: true, realTabDiffPct: 1.28,
    realTabSpatial: { changedPixels: 1400, totalPixels: 77000, borderPixels: 20000, borderChanged: 1300, minThicknessPx: 1, maxContrastChange: 4 },
    unfocusedOutline: 'none', focusedOutline: 'solid 1px rgb(255,0,0)' });
  assert.equal(r.present, true, 'a visible thin ring must be present despite <1.5% area');
});
