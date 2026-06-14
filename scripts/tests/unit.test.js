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
test('C4 evalTargetSize: meets size', () => {
  assert.equal(L.evalTargetSize({ x: 0, y: 0, w: 40, h: 40 }).passes, true);
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
test('C4 evalTargetSize: inline only via PROVEN in-sentence, not raw display:inline', () => {
  assert.equal(L.evalTargetSize({ x: 0, y: 0, w: 30, h: 16 }, { inSentence: true }).passes, true);
  // display:inline alone is NOT enough — without inSentence and without clearing neighbours it fails
  const r = L.evalTargetSize({ x: 0, y: 0, w: 30, h: 16 }, { neighbors: [{ x: 0, y: 18, w: 30, h: 16 }] });
  assert.equal(r.passes, false);
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
test('H1 focusRingDecision: nothing usable => indeterminate (null)', () => {
  const r = L.focusRingDecision({ realTabCropValid: false, focusedOutline: 'none', unfocusedOutline: 'none' });
  assert.equal(r.present, null);
});
