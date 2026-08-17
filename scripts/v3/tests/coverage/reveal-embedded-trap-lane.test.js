'use strict';
// PURE-NODE source pins for the revealed-state embedded-format + confinement lane in detectTrapsAfterReveal
// (kbd-graph.js). The behavioural fixtures live in tests/runners/kbd-reveal-embedded-trap.test.js (browser,
// skip-gated); these pins hold the contract shape without standing up Chrome — the same pattern the
// rootcause-round2 suite uses for probeDirectionalEscape ("pinned at the source level because the
// alternative is a live browser fixture for a one-line predicate").
//
// The mechanism being pinned (RCA-residual-s10 §2.1.2, modal-popover-…-vs-trap/case-06): detectKeyboardTraps
// observes the both-direction confinement through a srcdoc iframe and still clears the region, because its
// Esc probe resets focus to the region's first focusable in the PARENT document (where the parent's Escape
// handler works) — while the trapped user is INSIDE the frame, where the keydown never reaches the parent.
// Only detectEmbeddedFormatTraps presses Escape from inside the boundary; it (and the fixed-set confinement
// detector) must therefore run in the revealed state, on a RE-OPENED modal, after the two original detectors.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const kbdSrc = fs.readFileSync(path.join(__dirname, '..', '..', 'lib', 'kbd-graph.js'), 'utf8');
const fn = kbdSrc.slice(kbdSrc.indexOf('async function detectTrapsAfterReveal'), kbdSrc.indexOf('// ── EMBEDDED-FORMAT traps'));
assert.ok(fn.length > 0, 'detectTrapsAfterReveal must precede the embedded-format section');

test('revealed state runs ALL FOUR detectors, in order: region → self-refocus → embedded-format → confinement', () => {
  const order = ['detectKeyboardTraps(page', 'detectFocusRetentionTraps(page', 'detectEmbeddedFormatTraps(page', 'detectFixedSetConfinementTraps(page']
    .map((name) => ({ name, at: fn.indexOf(name) }));
  for (const o of order) assert.ok(o.at >= 0, `${o.name} must be invoked in the revealed state`);
  for (let i = 1; i < order.length; i++) {
    assert.ok(order[i].at > order[i - 1].at, `${order[i].name} must run after ${order[i - 1].name} — the cheap/authoritative lanes decide first`);
  }
});

test('the revealed state is RE-OPENED before the embed/confinement detectors — the region Esc probe is destructive', () => {
  // detectKeyboardTraps' Escape probe CLOSES a conformant outer modal (that is exactly how the case-06
  // region candidate is cleared), so running the new detectors without re-opening would probe a re-closed
  // page and read it as boundary-free — the at-rest blindness one reload later.
  const selfAt = fn.indexOf('detectFocusRetentionTraps(page');
  const embedAt = fn.indexOf('detectEmbeddedFormatTraps(page');
  const between = fn.slice(selfAt, embedAt);
  assert.match(between, /await openState\(\)/, 'openState must be re-invoked between the original detectors and the embed detector');
  const opens = fn.split('await openState()').length - 1;
  // Three guarded opens per opener: the original open, the re-open before the embed detector (the region
  // Esc probe is destructive), and the re-open before the confinement detector (the embed detector's own
  // parent-document Escape / blur+Tab walks are destructive too — soundness review 2026-08-17, finding 4).
  assert.equal(opens, 3, 'exactly three open calls per opener: the original open and both re-opens (each guarded)');
});

test('confirmed-wins gates: same-origin embed and lying-advisory confinement return immediately; everything else is HELD review', () => {
  assert.match(fn, /embed\.traps\.some\(\(t\) => t\.sameOrigin === true\)\) return \{ opener: op, embedTraps: embed \}/,
    'only a SAME-ORIGIN embed trap is confirmed authority — a cross-origin "trap" is indistinguishable from "slower than we waited"');
  assert.match(fn, /confine\.traps\.some\(\(t\) => t\.lyingAdvisory === true\)\) return \{ opener: op, confinement: confine \}/,
    'only a LYING-advisory confinement is confirmed authority — an unadvised confinement stays rubric-routed review');
  assert.match(fn, /return firstReview;\s*\}\s*$/,
    'review-grade results are returned only AFTER the opener loop, so a weaker signal from opener 1 never pre-empts a confirmed trap behind opener 2');
});

test('return shape is ADDITIVE — the existing carrier keys are untouched, so the lane is inert until the run-instruments hunk lands', () => {
  // Existing consumers read only revealed.traps.traps / revealed.selfTraps.traps; the new results travel
  // under NEW keys. A held-review return carries neither existing key, so the current emission block simply
  // appends nothing for it — inert, never wrong. (HUNK-revealed-embed-confinement.md carries the emission.)
  assert.match(fn, /return \{ opener: op, traps \}/, 'region result keeps its key');
  assert.match(fn, /return \{ opener: op, selfTraps: self \}/, 'self-refocus result keeps its key');
  assert.match(fn, /\{ opener: op, embedTraps: embed \}/, 'embed results travel under embedTraps');
  assert.match(fn, /\{ opener: op, confinement: confine \}/, 'confinement results travel under confinement');
  const ri = fs.readFileSync(path.join(__dirname, '..', '..', 'lib', 'run-instruments.js'), 'utf8');
  assert.match(ri, /revealed\.traps && revealed\.traps\.traps/, 'run-instruments still consumes the region key');
  assert.match(ri, /revealed\.selfTraps && revealed\.selfTraps\.traps/, 'run-instruments still consumes the self-refocus key');
});

test('at-rest behaviour is NOT widened: the reveal pass precondition and the at-rest embed visibility gate are unchanged', () => {
  // The fix must fire only through the reveal pass. At rest the case-06 shape is correctly declined:
  // the confinement floor (2 rendered focusables < 3) and the embed detector's rendered-rect gate
  // (a 0x0 iframe inside a display:none scrim is never a boundary) both stand.
  assert.match(kbdSrc, /focs\.length < 3\) return \{ traps: \[\], focusableCount/, 'the confinement >=3 floor stands');
  const embedFn = kbdSrc.slice(kbdSrc.indexOf('async function detectEmbeddedFormatTraps'));
  assert.match(embedFn, /r\.width > 1 && r\.height > 1/, 'the embed boundary must still be RENDERED to be nominated');
  assert.match(fn, /if \(!hasHiddenRegion\) return null;/, 'the reveal pass still requires a hidden trap-region-shaped container');
});

test('every internal guard travels with the detectors unchanged (no revealed-state forks of the detectors exist)', () => {
  // The revealed state calls the SAME functions — so the observed-cycle guard, transient-reach guard,
  // backward mirror, Escape probe and advisory grammar of the confinement detector, and the Tab+Shift+Tab+Esc
  // triple requirement of the embed detector, all apply as at rest. Pin that no duplicated variant crept in.
  assert.equal(kbdSrc.split('async function detectEmbeddedFormatTraps').length - 1, 1, 'exactly one embed detector');
  assert.equal(kbdSrc.split('async function detectFixedSetConfinementTraps').length - 1, 1, 'exactly one confinement detector');
});
