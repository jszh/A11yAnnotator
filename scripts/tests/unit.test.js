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

// ---------------- T3: target-size with exceptions ----------------
test('T3 evalTargetSize: meets size', () => {
  assert.equal(L.evalTargetSize({ w: 40, h: 40 }).passes, true);
});
test('T3 evalTargetSize: height-only fail but spacing exception (Home Artera footer)', () => {
  // 98x15 footer link, neighbours ~31px apart center-to-center => spacing exempt => PASS
  const r = L.evalTargetSize({ w: 98, h: 15 }, { nearestTargetCenterDist: 31 });
  assert.equal(r.passes, true);
  assert.match(r.reason, /spacing exception/);
});
test('T3 evalTargetSize: tightly stacked undersized targets => FAIL', () => {
  // 200x18 links stacked with 18px centre spacing (<24) and not inline => genuine fail
  const r = L.evalTargetSize({ w: 200, h: 18 }, { nearestTargetCenterDist: 18, isInline: false });
  assert.equal(r.passes, false);
});
test('T3 evalTargetSize: inline link in a sentence is exempt', () => {
  assert.equal(L.evalTargetSize({ w: 30, h: 16 }, { isInline: true }).passes, true);
});
test('T3 evalTargetSize: zero-size element is not a target', () => {
  assert.equal(L.evalTargetSize({ w: 0, h: 34 }).passes, true);
});
test('T3 evalTargetSize: small icon with no spacing relief => fail', () => {
  assert.equal(L.evalTargetSize({ w: 16, h: 16 }, { nearestTargetCenterDist: 18 }).passes, false);
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

// ---------------- T1/T8: focus ring decision ----------------
test('T1/T8 focusRingDecision: outline:auto while focused => present even if diff 0 (crop drift)', () => {
  const r = L.focusRingDecision({ diffPct: 0, cropValid: false, focusedOutline: 'auto 1px rgb(0, 95, 204)', focusedBoxShadow: 'none' });
  assert.equal(r.present, true);
  assert.equal(r.basis, 'computed-while-focused-outline');
});
test('T1/T8 focusRingDecision: forced diff is authoritative', () => {
  assert.equal(L.focusRingDecision({ forcedDiffPct: 8.44, focusedOutline: 'none', cropValid: false }).present, true);
  assert.equal(L.focusRingDecision({ forcedDiffPct: 0.1, focusedOutline: 'none 3px rgb(0,0,0)', focusedBoxShadow: 'none', cropValid: true, diffPct: 0 }).present, false);
});
test('T1/T8 focusRingDecision: genuine no-ring (Reebok) => false', () => {
  const r = L.focusRingDecision({ diffPct: 0, cropValid: true, focusedOutline: 'none 3px rgb(0,0,0)', focusedBoxShadow: 'none' });
  assert.equal(r.present, false);
});
test('T1/T8 focusRingDecision: no crop, no forced diff, no computed ring => indeterminate', () => {
  const r = L.focusRingDecision({ diffPct: null, cropValid: false, focusedOutline: 'none', focusedBoxShadow: 'none' });
  assert.equal(r.present, null);
});
