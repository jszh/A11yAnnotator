// Harness 3.0 — the 8 experiment runners (C1/C3–C9) against deterministic fixtures on real Chrome.
// Each fixture bundles the CLEAR/BARRIER/INCONCLUSIVE cases (incl. the adversarial vectors the design
// agents enumerated). Gated on a local Chrome, like runner.test.js. Verdict = the deterministic
// proposer direction (directionFor); null ⇒ INCONCLUSIVE ⇒ PARTIAL.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { runPlan, CHROME } = require('../lib/run-experiments.js');
const { directionFor } = require('../lib/proposer.js');
const { buildV3 } = require('../lib/build-v3.js');
const { withPipeline, promoted } = require('./helpers.js');

const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — v3 experiments suite SKIPPED');
const { assetFileUrl: fx } = require('../../lib/asset-paths.js');

// run one fixture: returns { [targetXpath]: direction } and the raw results by xpath.
async function run(experimentId, fixture, xpaths) {
  const plan = { file: fixture, runId: 'R', pageDigest: 'sha256:x', _startedAt: 1000, requests: xpaths.map((xp, i) => ({ candidateId: 'c' + i, experimentId, targetXpath: xp, sc: 'x' })) };
  const exp = await runPlan(plan, { resolveUrl: () => fx(fixture) });
  const byXp = {}; for (const r of exp.results) byXp[r.targetXpath] = r;
  return { byXp, exp };
}
const dir = (experimentId, r) => directionFor(experimentId, r.outcome);

test('C3 text-contrast-pixel: clear / barrier / inconclusive incl. rgba, gradient, animation, large', { skip: !chromeOK, concurrency: false }, async () => {
  const { byXp } = await run('text-contrast-pixel', 'fx-v3-c3-contrast.html', ['/html/body/div[1]/span', '/html/body/div[2]/span', '/html/body/div[3]/span', '/html/body/div[4]/span', '/html/body/div[5]/span', '/html/body/div[6]/span']);
  assert.equal(dir('text-contrast-pixel', byXp['/html/body/div[1]/span']), 'NO_BARRIER_OBSERVED', 'black/white clears');
  assert.equal(dir('text-contrast-pixel', byXp['/html/body/div[2]/span']), 'BARRIER_OBSERVED', 'grey/white fails');
  assert.equal(dir('text-contrast-pixel', byXp['/html/body/div[3]/span']), 'BARRIER_OBSERVED', 'rgba composited fails (no false clear)');
  assert.equal(dir('text-contrast-pixel', byXp['/html/body/div[4]/span']), null, 'gradient backdrop ⇒ inconclusive (cannot clear)');
  assert.equal(dir('text-contrast-pixel', byXp['/html/body/div[5]/span']), 'NO_BARRIER_OBSERVED', 'large bold clears at the 3:1 threshold');
  assert.equal(dir('text-contrast-pixel', byXp['/html/body/div[6]/span']), null, 'colour animation ⇒ inconclusive (unstable)');
});

test('C6 field-label-probe: clear / placeholder-barrier / sr-only / title / unassociated / dangling', { skip: !chromeOK, concurrency: false }, async () => {
  const { byXp } = await run('field-label-probe', 'fx-v3-c6-fields.html', ['/html/body/div[1]/input', '/html/body/div[2]/input', '/html/body/div[3]/input', '/html/body/div[4]/input', '/html/body/div[5]/input', '/html/body/div[6]/input']);
  assert.equal(dir('field-label-probe', byXp['/html/body/div[1]/input']), 'NO_BARRIER_OBSERVED', 'associated visible label clears');
  assert.equal(dir('field-label-probe', byXp['/html/body/div[2]/input']), 'BARRIER_OBSERVED', 'placeholder-only is a barrier');
  assert.equal(dir('field-label-probe', byXp['/html/body/div[3]/input']), null, 'sr-only label ⇒ inconclusive (no visible label)');
  assert.equal(dir('field-label-probe', byXp['/html/body/div[4]/input']), null, 'unassociated VISIBLE label ⇒ inconclusive, NOT a barrier (3.3.2 ≠ 1.3.1, audit V3R2-H2)');
  assert.equal(dir('field-label-probe', byXp['/html/body/div[5]/input']), null, 'title-only ⇒ inconclusive (not visible)');
  assert.equal(dir('field-label-probe', byXp['/html/body/div[6]/input']), 'BARRIER_OBSERVED', 'dangling aria-labelledby is a barrier');
});

test('C5 keyboard-trap-escape: proper modal (Esc closes) clears; true trap is a barrier', { skip: !chromeOK, concurrency: false }, async () => {
  const modal = await run('keyboard-trap-escape', 'fx-v3-c5-modal.html', ['/html/body/dialog/button[1]']);
  assert.equal(dir('keyboard-trap-escape', modal.byXp['/html/body/dialog/button[1]']), 'NO_BARRIER_OBSERVED', 'a modal that closes on Esc is NOT a trap');
  const trap = await run('keyboard-trap-escape', 'fx-v3-c5-trap.html', ['/html/body/div/input[1]']);
  assert.equal(dir('keyboard-trap-escape', trap.byXp['/html/body/div/input[1]']), 'BARRIER_OBSERVED', 'a cycle with no escape mechanism is a trap');
});

test('C4 keyboard-activation: honest control clears; div-button & synthetic-only are barriers', { skip: !chromeOK, concurrency: false }, async () => {
  const { byXp } = await run('keyboard-activation', 'fx-v3-c4-keyboard.html', ['/html/body/div[1]/button', '/html/body/div[2]/div', '/html/body/div[3]/button']);
  assert.equal(dir('keyboard-activation', byXp['/html/body/div[1]/button']), 'NO_BARRIER_OBSERVED', 'Enter+Space both operate a real native button');
  assert.equal(dir('keyboard-activation', byXp['/html/body/div[2]/div']), 'BARRIER_OBSERVED', 'div[role=button] with no key handler fails');
  assert.equal(dir('keyboard-activation', byXp['/html/body/div[3]/button']), 'BARRIER_OBSERVED', 'a synthetic-only handler fails real keys');
});

test('C1 ax-state-diff: disclosure with reflected state clears; nameless widget is a barrier', { skip: !chromeOK, concurrency: false }, async () => {
  const { byXp } = await run('ax-state-diff', 'fx-v3-c1-ax.html', ['/html/body/div[1]/button', '/html/body/div[2]/div']);
  assert.equal(dir('ax-state-diff', byXp['/html/body/div[1]/button']), 'NO_BARRIER_OBSERVED', 'aria-expanded reflected in the AX tree clears');
  assert.equal(dir('ax-state-diff', byXp['/html/body/div[2]/div']), 'BARRIER_OBSERVED', 'a widget with no accessible name is a barrier');
});

test('C8 reflow-overflow-probe: non-exempt overflow barriers; an exempt table is inconclusive', { skip: !chromeOK, concurrency: false }, async () => {
  const ov = await run('reflow-overflow-probe', 'fx-v3-c8-overflow.html', ['/page-level::reflow']);
  assert.equal(dir('reflow-overflow-probe', ov.byXp['/page-level::reflow']), 'BARRIER_OBSERVED', 'a 900px block at 320px is a reflow barrier');
  const tbl = await run('reflow-overflow-probe', 'fx-v3-c8-table.html', ['/page-level::reflow']);
  assert.equal(dir('reflow-overflow-probe', tbl.byXp['/page-level::reflow']), null, 'a wide data table is 2D-exempt ⇒ inconclusive');
});

test('C7 focus-obscured-barrier: a consent overlay barriers; a sticky header revealed on scroll does not', { skip: !chromeOK, concurrency: false }, async () => {
  const consent = await run('focus-obscured-barrier', 'fx-v3-c7-consent.html', ['/html/body/button']);
  assert.equal(dir('focus-obscured-barrier', consent.byXp['/html/body/button']), 'BARRIER_OBSERVED', 'a full opaque consent overlay obscures the focused control');
  const sticky = await run('focus-obscured-barrier', 'fx-v3-c7-sticky.html', ['/html/body/button']);
  assert.equal(dir('focus-obscured-barrier', sticky.byXp['/html/body/button']), null, 'revealed after scroll ⇒ not entirely obscured ⇒ inconclusive');
});

test('C9 hover-content-tri: a tooltip that auto-hides while hovered is a Persistent barrier', { skip: !chromeOK, concurrency: false }, async () => {
  const { byXp } = await run('hover-content-tri', 'fx-v3-c9-autohide.html', ['/html/body/button']);
  const r = byXp['/html/body/button'];
  assert.equal(dir('hover-content-tri', r), 'BARRIER_OBSERVED', 'auto-hide while hovered ⇒ Persistent fails ⇒ barrier');
  assert.equal(r.outcome.persistent, false);
});

// ---- adversarial regressions (red-team round over the 8 runners; all reproduced + fixed) ----
test('ADV C3: semi-transparent ancestor composited (no false clear/barrier); mixed-colour child ⇒ inconclusive', { skip: !chromeOK, concurrency: false }, async () => {
  const { byXp } = await run('text-contrast-pixel', 'fx-v3-c3-adversarial.html', ['/html/body/div[1]/p/span', '/html/body/div[2]/p', '/html/body/div[3]/p/span']);
  assert.equal(dir('text-contrast-pixel', byXp['/html/body/div[1]/p/span']), 'BARRIER_OBSERVED', 'white on a translucent scrim over black is illegible (was a false clear)');
  assert.equal(dir('text-contrast-pixel', byXp['/html/body/div[2]/p']), null, 'a differently-coloured child run ⇒ inconclusive (was a false clear)');
  assert.equal(dir('text-contrast-pixel', byXp['/html/body/div[3]/p/span']), 'NO_BARRIER_OBSERVED', 'black on near-opaque white over black is readable (was a false barrier)');
});

test('ADV C4: native checkbox, native submit, and off-board-effect button all clear (were false barriers)', { skip: !chromeOK, concurrency: false }, async () => {
  const { byXp } = await run('keyboard-activation', 'fx-v3-c4-adversarial.html', ['/html/body/div[1]/input', '/html/body/div[2]/form/button', '/html/body/div[3]/button']);
  assert.equal(dir('keyboard-activation', byXp['/html/body/div[1]/input']), 'NO_BARRIER_OBSERVED', 'native checkbox operable by Space');
  assert.equal(dir('keyboard-activation', byXp['/html/body/div[2]/form/button']), 'NO_BARRIER_OBSERVED', 'native submit (idempotent off-board effect)');
  assert.equal(dir('keyboard-activation', byXp['/html/body/div[3]/button']), 'NO_BARRIER_OBSERVED', 'a same-length off-board counter change is detected');
});

test('ADV C7: an opacity:0 overlay does not obscure (was a false barrier)', { skip: !chromeOK, concurrency: false }, async () => {
  const { byXp } = await run('focus-obscured-barrier', 'fx-v3-c7-adversarial.html', ['/html/body/button']);
  assert.equal(dir('focus-obscured-barrier', byXp['/html/body/button']), null, 'an invisible (opacity:0) overlay does not obscure a sighted keyboard user');
});

test('ADV C9: a compliant tooltip is not a barrier (test ordering no longer poisons Hoverable)', { skip: !chromeOK, concurrency: false }, async () => {
  const { byXp } = await run('hover-content-tri', 'fx-v3-c9-adversarial.html', ['/html/body/div[1]/button', '/html/body/div[2]/button']);
  assert.equal(dir('hover-content-tri', byXp['/html/body/div[1]/button']), 'BARRIER_OBSERVED', 'a non-dismissible tooltip is a barrier');
  assert.equal(dir('hover-content-tri', byXp['/html/body/div[2]/button']), null, 'a dismissible+hoverable+persistent tooltip is NOT a barrier (was a false barrier)');
});

// ---- Second-pass independent audit regressions (all reproduced + fixed) ----
test('R2-C2: a text input and an arrow-operable role=tab are PARTIAL, not a false clear/barrier', { skip: !chromeOK, concurrency: false }, async () => {
  const { byXp } = await run('keyboard-activation', 'fx-v3-r2-c2.html', ['/html/body/div[1]/input', '/html/body/div[2]/div/button']);
  assert.equal(dir('keyboard-activation', byXp['/html/body/div[1]/input']), null, 'a text input is not an activation control (Space types, not activates)');
  assert.equal(dir('keyboard-activation', byXp['/html/body/div[2]/div/button']), null, 'an arrow-operable role=tab is out of the Enter/Space recipe ⇒ PARTIAL, not a barrier');
});

test('R2-C3: white text over a white sibling backdrop does NOT clear (real paint order)', { skip: !chromeOK, concurrency: false }, async () => {
  const { byXp } = await run('text-contrast-pixel', 'fx-v3-r2-c3.html', ['/html/body/p']);
  assert.notEqual(dir('text-contrast-pixel', byXp['/html/body/p']), 'NO_BARRIER_OBSERVED', 'a sibling-painted backdrop is resolved via elementsFromPoint, not the ancestor chain');
});

test('R2-H3: an overlay leaving a visible strip is NOT "entirely obscured"', { skip: !chromeOK, concurrency: false }, async () => {
  const { byXp } = await run('focus-obscured-barrier', 'fx-v3-r2-h3.html', ['/html/body/button']);
  assert.equal(dir('focus-obscured-barrier', byXp['/html/body/button']), null, 'a ~12px visible strip ⇒ not entirely obscured (dense grid)');
});

test('R2-H4: an advised alternative keyboard exit (press Z) is honored', { skip: !chromeOK, concurrency: false }, async () => {
  const { byXp } = await run('keyboard-trap-escape', 'fx-v3-r2-h4.html', ['/html/body/div/input[1]']);
  assert.notEqual(dir('keyboard-trap-escape', byXp['/html/body/div/input[1]']), 'BARRIER_OBSERVED', 'an advised "press Z to leave" exit is not a trap');
});

test('R2-M1: a bare LAYOUT table that overflows at 320px is a barrier; a data table (th) is exempt', { skip: !chromeOK, concurrency: false }, async () => {
  const layout = await run('reflow-overflow-probe', 'fx-v3-r2-m1.html', ['/page-level::reflow']);
  assert.equal(dir('reflow-overflow-probe', layout.byXp['/page-level::reflow']), 'BARRIER_OBSERVED', 'a layout table (no th/caption) is not blanket-exempt');
});

test('R2-M2: an opaque pointer-events:none overlay still obscures the focused control', { skip: !chromeOK, concurrency: false }, async () => {
  const { byXp } = await run('focus-obscured-barrier', 'fx-v3-r2-m2.html', ['/html/body/button']);
  assert.equal(dir('focus-obscured-barrier', byXp['/html/body/button']), 'BARRIER_OBSERVED', 'pointer-events:none is irrelevant to visual obscuration');
});

// ---- Third-pass independent audit regressions (all reproduced + fixed) ----
test('R3-H1: white text over a non-uniform solid backdrop (black|white split) does NOT clear', { skip: !chromeOK, concurrency: false }, async () => {
  const { byXp } = await run('text-contrast-pixel', 'fx-v3-r3-h1.html', ['/html/body/p']);
  assert.notEqual(dir('text-contrast-pixel', byXp['/html/body/p']), 'NO_BARRIER_OBSERVED',
    'a centre sample lands on black but the run is illegible over the white half ⇒ uniformity unproven ⇒ no clear');
});

test('R3-H2: opaque overlays leaving a 1px strip are NOT "entirely obscured" (exact rect-union)', { skip: !chromeOK, concurrency: false }, async () => {
  const { byXp } = await run('focus-obscured-barrier', 'fx-v3-r3-h2.html', ['/html/body/button']);
  assert.equal(dir('focus-obscured-barrier', byXp['/html/body/button']), null,
    'a 1px uncovered remainder ⇒ not entirely obscured (rectangle subtraction, not sampling)');
});

test('R3-H3: a cross-stacking-context overlay painting BELOW the target is not a barrier', { skip: !chromeOK, concurrency: false }, async () => {
  const { byXp } = await run('focus-obscured-barrier', 'fx-v3-r3-h3.html', ['/html/body/button']);
  assert.equal(dir('focus-obscured-barrier', byXp['/html/body/button']), null,
    'z-index:999 inside a z-index:0 parent paints below a z-index:10 target ⇒ true paint order shows the button on top');
});

// ---- Third-pass self-adversarial red-team regressions (found + fixed beyond the audit) ----
test('R3-H1b: a ::before pseudo-element backdrop behind half the text does NOT clear', { skip: !chromeOK, concurrency: false }, async () => {
  const { byXp } = await run('text-contrast-pixel', 'fx-v3-r3-h1b-pseudo.html', ['/html/body/div/span']);
  assert.notEqual(dir('text-contrast-pixel', byXp['/html/body/div/span']), 'NO_BARRIER_OBSERVED',
    'a pseudo-element background (unseen by elementsFromPoint AND querySelectorAll) defeats the uniformity proof');
});

test('R3-H1c: text overflowing its solid backdrop onto the page canvas does NOT clear', { skip: !chromeOK, concurrency: false }, async () => {
  const { byXp } = await run('text-contrast-pixel', 'fx-v3-r3-h1c-overflow.html', ['/html/body/div']);
  assert.notEqual(dir('text-contrast-pixel', byXp['/html/body/div']), 'NO_BARRIER_OBSERVED',
    'the ink rect (Range.getClientRects) covers the spilled run, so its backdrop is not the dark box');
});

test('R3-H2b: a sub-pixel (~0.49px) visible strip of the control is NOT entirely obscured', { skip: !chromeOK, concurrency: false }, async () => {
  const { byXp } = await run('focus-obscured-barrier', 'fx-v3-r3-h2b-subpixel.html', ['/html/body/button']);
  assert.equal(dir('focus-obscured-barrier', byXp['/html/body/button']), null,
    'near-zero coverage tolerance keeps a real ~1-device-px hairline from reading as a full barrier');
});

test('R3-H2c: a genuinely-covering overlay with an identity transform IS a barrier (recall)', { skip: !chromeOK, concurrency: false }, async () => {
  const { byXp } = await run('focus-obscured-barrier', 'fx-v3-r3-h2c-transform-cover.html', ['/html/body/button']);
  assert.equal(dir('focus-obscured-barrier', byXp['/html/body/button']), 'BARRIER_OBSERVED',
    'translateZ(0)/identity transforms keep the painted box axis-aligned ⇒ a full cover still barriers');
});

test('R3-H1d: an SVG sibling painting behind the text (no CSS background) does NOT clear', { skip: !chromeOK, concurrency: false }, async () => {
  const { byXp } = await run('text-contrast-pixel', 'fx-v3-r3-h1d-svg.html', ['/html/body/div/span']);
  assert.notEqual(dir('text-contrast-pixel', byXp['/html/body/div/span']), 'NO_BARRIER_OBSERVED',
    'the rendered-pixel backdrop oracle catches an SVG <rect> that CSS-property enumeration cannot');
});

test('R3-H1e: a ::first-line background making line 1 invisible does NOT clear', { skip: !chromeOK, concurrency: false }, async () => {
  const { byXp } = await run('text-contrast-pixel', 'fx-v3-r3-h1e-firstline.html', ['/html/body/p']);
  assert.notEqual(dir('text-contrast-pixel', byXp['/html/body/p']), 'NO_BARRIER_OBSERVED',
    'sentinel glyph-geometry locates even invisible (black-on-black) first-line text; its backdrop differs ⇒ not uniform');
});

test('R3-H2d: an axis-aligned overlay with a ROTATED ancestor is not a false barrier', { skip: !chromeOK, concurrency: false }, async () => {
  const { byXp } = await run('focus-obscured-barrier', 'fx-v3-r3-h2d-rotated-ancestor.html', ['/html/body/button']);
  assert.equal(dir('focus-obscured-barrier', byXp['/html/body/button']), null,
    'getBoundingClientRect reflects ancestor transforms, so the whole chain must be axis-aligned to trust the AABB');
});

// ---- Fourth-pass independent audit regressions (all reproduced + fixed) ----
test('R4-H1: white text over a UNIFORM foreign (SVG) backdrop does NOT clear (pixel/CSS colour must agree)', { skip: !chromeOK, concurrency: false }, async () => {
  const { byXp } = await run('text-contrast-pixel', 'fx-v3-r4-h1-svg-uniform.html', ['/html/body/p']);
  const r = byXp['/html/body/p'];
  assert.notEqual(dir('text-contrast-pixel', r), 'NO_BARRIER_OBSERVED',
    'the pixel backdrop (white SVG) disagrees with the CSS-resolved backdrop (black body) used in the ratio ⇒ PARTIAL');
  assert.equal(r.measurement.pixelAgrees, false, 'colour-agreement gate caught the wrong-surface ratio');
});

test('R4-H2: an overlay clipped by an ancestor (overflow:hidden) is NOT entirely obscured', { skip: !chromeOK, concurrency: false }, async () => {
  const { byXp } = await run('focus-obscured-barrier', 'fx-v3-r4-h2-ancestor-clip.html', ['/html/body/button']);
  assert.equal(dir('focus-obscured-barrier', byXp['/html/body/button']), null,
    'coverage uses the candidate’s clipped effective rect, so the visible right strip defeats the barrier');
});

test('R4-H3: a native button with a mouse-only secondary function (ondblclick) does NOT clear 2.1.1', { skip: !chromeOK, concurrency: false }, async () => {
  const { byXp } = await run('keyboard-activation', 'fx-v3-r4-h3-dblclick.html', ['/html/body/button']);
  const r = byXp['/html/body/button'];
  assert.notEqual(dir('keyboard-activation', r), 'NO_BARRIER_OBSERVED', 'an observable pointer-only secondary handler breaks the closed mode inventory');
  assert.equal(r.outcome.singleModeControl, false, 'singleModeControl is false when a secondary pointer handler is visible');
});

// 2.1.1 clearing authority is WITHDRAWN at the registry (audit V3R4-H3): even a clean honest button
// that the proposer would mark NO_BARRIER cannot publish a 2.1.1 clear — it resolves to PARTIAL.
test('R4-H3 build-through: a clean keyboard-activated button does NOT publish a 2.1.1 clear (barrier-only)', { skip: !chromeOK, concurrency: false }, async () => {
  const { byXp } = await run('keyboard-activation', 'fx-v3-c4-keyboard.html', ['/html/body/div[1]/button']);
  const r = byXp['/html/body/div[1]/button'];
  const SCOPE = r.observationScope;
  const bundle = withPipeline({
    collect: { file: 'f', runId: 'R', pageDigest: 'sha256:d', collectedAt: 100, elements: [{ xpath: r.targetXpath, focusable: true, role: 'button' }] },
    experiments: { file: 'f', runId: 'R', pageDigest: 'sha256:d', catalogVersion: '3.0.0-phase0', startedAt: 200, results: [{ ...r, claimId: 'k1' }] },
    claimProposals: { file: 'f', runId: 'R', pageDigest: 'sha256:d', proposals: [{ claimId: 'k1', sc: '2.1.1', direction: 'NO_BARRIER_OBSERVED', experimentId: 'keyboard-activation', claimFamily: 'keyboard-operable', observationScope: SCOPE }] },
  });
  const r2 = buildV3(bundle, { authority: promoted(['keyboard-activation/NO_BARRIER_OBSERVED']) });
  assert.equal(r2.ok, true, JSON.stringify(r2.errors));
  assert.equal(r2.results.summary.cleared, 0, '2.1.1 NO_BARRIER is open-scope-never-clearable ⇒ no authoritative clear');
});

// ---- Fourth-pass self-adversarial red-team regressions (found + fixed beyond the audit) ----
test('R4b-H1: -webkit-text-fill-color override does NOT clear (the ratio reads the rendered fill colour)', { skip: !chromeOK, concurrency: false }, async () => {
  const { byXp } = await run('text-contrast-pixel', 'fx-v3-r4b-h1-textfill.html', ['/html/body/p']);
  assert.notEqual(dir('text-contrast-pixel', byXp['/html/body/p']), 'NO_BARRIER_OBSERVED',
    'near-white -webkit-text-fill-color on white is illegible — the fill colour, not cs.color, drives the ratio');
});

test('R4b-H1: a filter:invert ink override does NOT clear (caught as a non-trivial composition)', { skip: !chromeOK, concurrency: false }, async () => {
  const { byXp } = await run('text-contrast-pixel', 'fx-v3-r4b-h1-filter.html', ['/html/body/p']);
  assert.notEqual(dir('text-contrast-pixel', byXp['/html/body/p']), 'NO_BARRIER_OBSERVED', 'a filter on the text element ⇒ non-trivial composition ⇒ PARTIAL');
});

test('R4b-H2: an overlay clipped by a contain:paint ancestor is NOT entirely obscured', { skip: !chromeOK, concurrency: false }, async () => {
  const { byXp } = await run('focus-obscured-barrier', 'fx-v3-r4b-h2-contain.html', ['/html/body/button']);
  assert.equal(dir('focus-obscured-barrier', byXp['/html/body/button']), null, 'contain:paint clips like overflow:hidden ⇒ the right strip stays visible');
});

test('R4b-H2: an overlay clipping its OWN paint with clip:rect(...) is NOT entirely obscured', { skip: !chromeOK, concurrency: false }, async () => {
  const { byXp } = await run('focus-obscured-barrier', 'fx-v3-r4b-h2-cliprect.html', ['/html/body/button']);
  assert.equal(dir('focus-obscured-barrier', byXp['/html/body/button']), null, 'the deprecated clip:rect on the candidate clips its own box ⇒ the right strip stays visible');
});

// ---- #8 experiment fidelity: 3.3.1 Error Identification (form-error-probe), barrier-only ----
test('C6b form-error-probe: a constrained field that identifies NO error is a 3.3.1 barrier; native/custom identification is not', { skip: !chromeOK, concurrency: false }, async () => {
  const { byXp } = await run('form-error-probe', 'fx-v3-c6b-formerror.html', [
    '/html/body/form[1]/div/label/input', '/html/body/form[2]/div/label/input', '/html/body/form[3]/div/label/input', '/html/body/form[4]/div/label/input',
  ]);
  assert.equal(dir('form-error-probe', byXp['/html/body/form[1]/div/label/input']), 'BARRIER_OBSERVED', 'required+novalidate, no error shown ⇒ error not identified (vision-confirmed: no message)');
  assert.notEqual(dir('form-error-probe', byXp['/html/body/form[2]/div/label/input']), 'BARRIER_OBSERVED', 'native HTML5 validation identifies the error');
  assert.notEqual(dir('form-error-probe', byXp['/html/body/form[3]/div/label/input']), 'BARRIER_OBSERVED', 'custom aria-invalid + a visible referenced message identifies it (vision-confirmed: "Name is required.")');
  assert.equal(dir('form-error-probe', byXp['/html/body/form[4]/div/label/input']), null, 'an unconstrained field has no detectable error condition ⇒ applicability fails ⇒ PARTIAL');
});

// ---- gap-fill red-team: 3.3.1 identification is AUTHOR-VISIBLE, not only aria-wired (fb1-6/fc1) ----
// Every verdict below was vision-confirmed on Chrome (screenshots under /tmp/c6fx/v2-*.png): the false
// barriers showed a clear red message; the barriers showed NO visible error text for the field.
test('C6b2 form-error-probe: visible error surfaces (inline/toast/summary/described) are identification, not barriers; title-only + silent are', { skip: !chromeOK, concurrency: false }, async () => {
  const xp = (id) => `//input[@id='${id}']`;
  const { byXp } = await run('form-error-probe', 'fx-v3-c6b2-formerror.html', ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7'].map(xp));
  // NOT barriers — a visible, error-associated message surfaced on submit (vision-confirmed red text):
  assert.notEqual(dir('form-error-probe', byXp[xp('q1')]), 'BARRIER_OBSERVED', 'sibling .error div shown, unreferenced (fb1)');
  assert.notEqual(dir('form-error-probe', byXp[xp('q2')]), 'BARRIER_OBSERVED', 'aria-describedby node populated, aria-invalid omitted (fb6)');
  assert.notEqual(dir('form-error-probe', byXp[xp('q3')]), 'BARRIER_OBSERVED', 'visible red message, aria-invalid set but unreferenced (fb5)');
  assert.notEqual(dir('form-error-probe', byXp[xp('q4')]), 'BARRIER_OBSERVED', 'GOV.UK error summary linking to the field (fb3)');
  assert.notEqual(dir('form-error-probe', byXp[xp('q5')]), 'BARRIER_OBSERVED', 'toast/snackbar with no role/aria-live (fb2)');
  // BARRIERS — no VISIBLE TEXT identifies the error for THIS field (vision-confirmed: none shown):
  assert.equal(dir('form-error-probe', byXp[xp('q6')]), 'BARRIER_OBSERVED', 'title-only tooltip + red outline is not visible-text identification (fb4)');
  assert.equal(dir('form-error-probe', byXp[xp('q7')]), 'BARRIER_OBSERVED', 'nothing shown; an unrelated global live region must NOT mask it (fc1/mc1)');
});

// ---- build-through: shadow by default; AT-independent C3 clears authoritative when PROMOTED ----
test('C3 build-through: default-shadow; PROMOTED ⇒ authoritative clear (AT-independent, no baseline needed)', { skip: !chromeOK, concurrency: false }, async () => {
  const { byXp } = await run('text-contrast-pixel', 'fx-v3-c3-contrast.html', ['/html/body/div[1]/span']);
  const r = byXp['/html/body/div[1]/span'];
  const SCOPE = r.observationScope;
  const bundle = withPipeline({
    collect: { file: 'f', runId: 'R', pageDigest: 'sha256:d', collectedAt: 100, elements: [{ xpath: r.targetXpath, hasText: true }] },
    experiments: { file: 'f', runId: 'R', pageDigest: 'sha256:d', catalogVersion: '3.0.0-phase0', startedAt: 200, results: [{ ...r, claimId: 'tc' }] },
    claimProposals: { file: 'f', runId: 'R', pageDigest: 'sha256:d', proposals: [{ claimId: 'tc', sc: '1.4.3', direction: 'NO_BARRIER_OBSERVED', experimentId: 'text-contrast-pixel', claimFamily: 'text-contrast', observationScope: SCOPE }] },
  });
  assert.equal(buildV3(bundle).results.summary.authoritative, 0, 'shadow by default');
  const PROMOTED = promoted(['text-contrast-pixel/NO_BARRIER_OBSERVED']);
  const r2 = buildV3(bundle, { authority: PROMOTED });
  assert.equal(r2.ok, true, JSON.stringify(r2.errors));
  assert.equal(r2.results.summary.cleared, 1, 'a flat-backdrop contrast clear publishes when promoted (complete bundle + provenance)');
});

// ---- V3R6-MAXTAB: the keyboard reach must not give up at a fixed step cap ----
// Grounded in LOTUS (ICSE'23): legitimate reach distances run to ~160 Tab steps, so the old fixed
// MAX_TAB=60 manufactured false "unreachable" verdicts. The deep target sits at tab position 75.
test('reach: target beyond the old 60-tab cap is reached + cleared; tabindex=-1 wraps (no false barrier)', { skip: !chromeOK, concurrency: false }, async () => {
  const { byXp } = await run('focus-visual-retry', 'fx-v3-reach-deep.html', ['/html/body/button[1]', '/html/body/button[7]']);
  const deep = byXp['/html/body/button[1]'];   // #b75 — visible green focus ring, at tab position 75
  const unreach = byXp['/html/body/button[7]']; // #unreach — tabindex=-1, genuinely not in the tab order

  // the deep target is now reached past the old cap and clears 2.4.7 (was a false-negative INCONCLUSIVE)
  assert.equal(deep.outcome.keyboardReachableInState, true, 'deep target (tab 75) is keyboard-reachable');
  assert.equal(deep.outcome.realKeyboardFocus, true, 'real keyboard focus landed on the deep target');
  assert.equal(deep.outcome.focusDependentIndicator, true, 'its focus ring is detected as focus-dependent');
  assert.equal(deep.valid, true, 'the measurement is valid (reached + usable crop)');
  assert.equal(deep.measurement.reachExhausted, false, 'reach did not exhaust the safety cap');
  assert.ok(deep.measurement.reachTabs > 60, `reach walked past the old 60 cap (tabs=${deep.measurement.reachTabs})`);
  assert.equal(dir('focus-visual-retry', deep), 'NO_BARRIER_OBSERVED', 'a deep, visibly-focused control clears');

  // a genuinely-unreachable control is reach:false via a full ring WRAP (not a premature give-up), and
  // it must NEVER become a false barrier — every barrier flag stays gated behind `reached`.
  assert.equal(unreach.outcome.keyboardReachableInState, false, 'tabindex=-1 control is not keyboard-reachable');
  assert.equal(unreach.outcome.stableIndicatorAbsence, false, 'unreachable ⇒ no false 2.4.7 barrier');
  assert.equal(unreach.measurement.reachExhausted, false, 'unreachable target WRAPPED (sound), did not exhaust the cap');
  assert.equal(dir('focus-visual-retry', unreach), null, 'unreachable ⇒ INCONCLUSIVE/PARTIAL, never a confident verdict');
});
