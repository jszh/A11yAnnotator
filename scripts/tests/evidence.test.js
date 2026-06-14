// W6 — evidence redesign tests on DETERMINISTIC fixtures (served by the annotator).
// Proves the normative behaviour by construction (the auditor's counterexamples):
// focus-dependence (H1), target-size circle geometry (C4), AX states (H7).
//   node --test scripts/tests/evidence.test.js   (needs `node server.js` on :3001)
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
let serverUp = false;
try { execFileSync('curl', ['-sf', '-o', '/dev/null', '--max-time', '3', 'http://127.0.0.1:3001/'], { stdio: 'ignore' }); serverUp = true; }
catch (e) { console.log('# server :3001 not running — evidence suite SKIPPED'); }

function xpFile(arr) { const p = path.join(os.tmpdir(), 'evxp_' + Math.abs(arr.join().length + arr[0].length) + '.json'); fs.writeFileSync(p, JSON.stringify(arr)); return p; }
function runScript(script, file, xps) {
  const out = execFileSync('node', [path.join('scripts', script), '--file', file, '--xpaths', xpFile(xps), '--shotdir', path.join(os.tmpdir(), 'evshots')], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
  return JSON.parse(out);
}

const FOCUS_XPS = ['/html/body/button[1]', '/html/body/button[2]', '/html/body/button[3]'];
const TARGET_XPS = ['/html/body/div[1]/a[1]', '/html/body/div[1]/a[2]', '/html/body/div[1]/a[3]'];
const STATE_XPS = ['/html/body/button[1]', '/html/body/input[1]', '/html/body/button[2]'];

test('H1 focus: always-on shadow => present:false; real :focus-visible => present:true; suppressed => false', { skip: !serverUp }, () => {
  const o = runScript('drive-page.js', 'fx-focus.html', FOCUS_XPS);
  const [alwayson, realring, noring] = o.elements;
  assert.equal(alwayson.focusIndicator.present, false, 'always-on shadow must NOT be a focus indicator');
  assert.equal(realring.focusIndicator.present, true, 'real :focus-visible ring must be detected');
  assert.equal(noring.focusIndicator.present, false, 'suppressed outline => no ring');
});

test('R2-H4 focus: a THIN 1px ring on a BIG control is present (spatial), with 2.4.13 metrics captured', { skip: !serverUp }, () => {
  const o = runScript('drive-page.js', 'fx-focus-thin.html', ['/html/body/button[1]']);
  const f = o.elements[0].focusIndicator;
  assert.equal(f.present, true, 'thin ring must be present despite tiny area %');
  assert.ok(f.focusAppearance && f.focusAppearance.enforced === false, '2.4.13 metrics captured but not enforced');
  assert.ok(f.focusAppearance.areaPx > 0 && typeof f.focusAppearance.thicknessProxyPx === 'number' && f.focusAppearance.proxyOnly === true, 'area/thickness PROXIES recorded (not enforced)');
});

test('R2-H4 focus: a JS-event-driven ring (forced :focus-visible would miss) is caught by REAL keyboard', { skip: !serverUp }, () => {
  const o = runScript('drive-page.js', 'fx-focus-js.html', ['/html/body/button[1]']);
  assert.equal(o.elements[0].focusIndicator.present, true, 'real Tab fires the JS focus handler → ring detected');
});

test('C4 target-size: small target near a LARGE neighbour fails; isolated small target passes', { skip: !serverUp }, () => {
  const o = runScript('eval-page.js', 'fx-target.html', TARGET_XPS);
  const [smallNearLarge, , isolated] = o.elements;
  assert.equal(smallNearLarge.targetSize.passes, false, '10x10 near a large neighbour must fail (circle-to-rect)');
  assert.equal(isolated.targetSize.passes, true, 'isolated 16x16 with no neighbour passes via spacing');
});

test('R2-H5 target exceptions: prose-link PASS (inline), nav-link FAIL (no prose), checkbox PASS (UA-control)', { skip: !serverUp }, () => {
  const o = runScript('eval-page.js', 'fx-target-exc.html', ['/html/body/p[1]/a[1]', '/html/body/nav[1]/a[1]', '/html/body/input[1]']);
  const [prose, nav, checkbox] = o.elements;
  assert.equal(prose.targetSize.passes, true, 'inline link in real prose => exempt');
  assert.equal(nav.targetSize.passes, false, 'inline nav link with NO surrounding prose must NOT be auto-exempt (auditor false-pass)');
  assert.equal(checkbox.targetSize.passes, true, 'bare native checkbox => UA-control exempt (auditor false-fail)');
});

test('R21-H2: a STYLESHEET-resized checkbox is NOT a UA control (true iframe default)', { skip: !serverUp }, () => {
  const o = runScript('eval-page.js', 'fx-target-exc2.html', ['/html/body/div[1]/input[1]', '/html/body/p[1]/a[1]']);
  const [cb, navlabel] = o.elements;
  assert.ok(o.uaDefaults && o.uaDefaults.checkbox.w >= 12, 'measured the true UA default in an isolated iframe');
  assert.equal(cb.uaControl, false, 'a 10x10 stylesheet-resized checkbox is author-modified, not a UA control');
  assert.equal(cb.targetSize.passes, false, 'with a neighbour it can no longer hide behind spacing → FAIL');
  assert.equal(navlabel.inSentence, false, 'all-caps nav labels are NOT a sentence (no real prose)');
});

test('R2.5-E target-size (R24-H3/#7): a 2px pointer-dead strip across a 24×24 target is caught (dense grid) → needs-judgment', { skip: !serverUp }, () => {
  const o = runScript('eval-page.js', 'fx-target-strip.html', ['/html/body/div[1]/a[1]']);
  assert.equal(o.elements[0].squareFits, false, 'a non-target strip between samples is hit by the ~2px grid');
  assert.equal(o.elements[0].targetSize.verdict, 'needs-judgment');
});
test('R2.5-E target-size (#5): an off-viewport overflow-clipped target is MEASURED (scrollIntoView), not flag-passed', { skip: !serverUp }, () => {
  const o = runScript('eval-page.js', 'fx-target-belowfold.html', ['/html/body/div[2]/a[1]']);
  assert.notEqual(o.elements[0].targetSize.verdict, 'pass', 'a below-fold clipped target must never be a definite pass via flag fallback');
});
test('R2.5-E target-size: a solid 30×30 link still PASSES (no false needs-judgment from edge sampling)', { skip: !serverUp }, () => {
  const o = runScript('eval-page.js', 'fx-target-solid.html', ['/html/body/a[1]']);
  assert.equal(o.elements[0].squareFits, true);
  assert.equal(o.elements[0].targetSize.verdict, 'pass');
});

test('R2.4-D target-size (R23-H3): an OVERFLOW-clipped 40×40 link → needs-judgment; a plain 30×30 → pass', { skip: !serverUp }, () => {
  const o = runScript('eval-page.js', 'fx-target-overflow.html', ['/html/body/div[1]/a[1]', '/html/body/a[1]']);
  const [clipped, plain] = o.elements;
  assert.equal(clipped.squareFits, false, 'only 20px of the 40px-wide target is usable (ancestor overflow:hidden)');
  assert.equal(clipped.targetSize.verdict, 'needs-judgment', 'a 24×24 square is not fully on the clipped target');
  assert.equal(plain.squareFits, true);
  assert.equal(plain.targetSize.verdict, 'pass', 'a plain 30×30 rectangle positively fits a 24×24 square');
});
test('R2.4-D target-size: an SVG circle (30×30 bbox) hit-tests as needs-judgment (corners not on the circle)', { skip: !serverUp }, () => {
  const o = runScript('eval-page.js', 'fx-target-svg.html', ["/html/body/*[name()='svg']/*[name()='a']"]);
  const e = o.elements[0];
  assert.equal(e.squareFits, false, 'a 30px circle cannot contain a page-aligned 24×24 square');
  assert.equal(e.targetSize.verdict, 'needs-judgment');
});

test('R2.3-A target-size SHAPE/exception (root: necessary≠sufficient => needs-judgment)', { skip: !serverUp }, () => {
  const o = runScript('eval-page.js', 'fx-shape.html', ['/html/body/div[1]/a[1]', '/html/body/div[1]/button[1]', '/html/body/div[1]/button[2]', '/html/body/div[2]/input[1]']);
  const [rotated, rounded24, rounded40, appnone] = o.elements;
  assert.equal(rotated.targetSize.verdict, 'needs-judgment', 'rotated 45° bbox≥24 cannot be assumed to fit a page-aligned 24×24 square');
  assert.equal(rounded24.targetSize.verdict, 'needs-judgment', '24×24 with r=6 cannot contain a 24×24 square');
  assert.equal(rounded40.targetSize.verdict, 'pass', '40×40 with r=6 easily fits a 24×24 square');
  assert.equal(appnone.uaControl, false, 'appearance:none checkbox is author-restyled, NOT a UA control even at default size');
});
test('R2.3-A inline is never an auto-pass: an inline link is pass-via-spacing or needs-judgment, never inline-exempt', { skip: !serverUp }, () => {
  const o = runScript('eval-page.js', 'fx-target-exc.html', ['/html/body/p[1]/a[1]', '/html/body/nav[1]/a[1]', '/html/body/input[1]']);
  const [prose, nav, checkbox] = o.elements;
  assert.ok(!/inline exception/.test(prose.targetSize.reason), 'no auto-pass via an inline exception');
  assert.equal(nav.targetSize.verdict, 'needs-judgment', 'inline nav link failing geometry → judgment, not a definite pass/fail');
  assert.equal(checkbox.uaControl, true, 'a genuine default native checkbox is still a UA control');
});

test('R2-H2 trap: a two-control A↔B keyboard trap is detected (not just same-element repeat)', { skip: !serverUp }, () => {
  const o = runScript('drive-page.js', 'fx-trap.html', ['/html/body/button[2]']);
  assert.equal(o.tabWalk.trapDetected, true, 'A↔B cycle that cannot escape is a trap');
  assert.ok((o.tabWalk.trapCycle || []).length >= 2, 'trap cycle records the multiple controls');
});
test('R2-H2 trap: ordinary wraparound is NOT a trap', { skip: !serverUp }, () => {
  const o = runScript('drive-page.js', 'fx-wraparound.html', ['/html/body/button[1]']);
  assert.equal(o.tabWalk.trapDetected, false);
});
test('R21-H1 trap: a FOUR-control inescapable cycle is detected (no CYCMAX=3 cap)', { skip: !serverUp }, () => {
  const o = runScript('drive-page.js', 'fx-trap4.html', ['/html/body/button[2]']);
  assert.equal(o.tabWalk.trapDetected, true);
  assert.ok((o.tabWalk.trapCycle || []).length >= 4, 'records all 4 trapped controls');
});
test('R21-H1 trap: a modal that releases on Escape is NOT a trap (standard exit, 2.1.2)', { skip: !serverUp }, () => {
  const o = runScript('drive-page.js', 'fx-modal-escape.html', ['/html/body/div[1]/button[1]']);
  assert.equal(o.tabWalk.trapDetected, false, 'Escape is a standard exit method');
  assert.equal(o.tabWalk.escapableComponent && o.tabWalk.escapableComponent.via, 'Escape');
});
test('R2.2-B trap: a 12-control inescapable cycle is detected (seenAll escape ref, not a small window)', { skip: !serverUp }, () => {
  const o = runScript('drive-page.js', 'fx-trap-large.html', ['/html/body/div[2]/button[1]']);
  assert.equal(o.tabWalk.trapDetected, true, 'a large cycle must not "escape" to one of its own members');
});
test('R2.3-B trap: a TRAP-ONLY page (cycle == every focusable) is detected without any DOM mutation', { skip: !serverUp }, () => {
  const o = runScript('drive-page.js', 'fx-trap-only.html', ['/html/body/button[1]']);
  assert.equal(o.tabWalk.trapDetected, true, 'focus cannot leave and the page interferes with Tab');
  assert.equal(o.tabWalk.totalFocusables, 2, 'the whole page is the trap');
  assert.ok((o.tabWalk.trapCycle || []).length >= 2);
});
test('R2.4-C trap (R23-H1): a DELEGATED handler enumerating all buttons is caught (no sentinel to absorb)', { skip: !serverUp }, () => {
  const o = runScript('drive-page.js', 'fx-trap-delegated.html', ['/html/body/button[1]']);
  assert.equal(o.tabWalk.trapDetected, true, 'preventDefault on Tab is seen by a passive, non-focusable listener');
  assert.equal(o.tabWalk.trapInterference, 'preventDefault');
});
test('R2.4-C trap: a focusout-REDIRECT trap (no preventDefault) is caught via an outcome signal', { skip: !serverUp }, () => {
  const o = runScript('drive-page.js', 'fx-trap-redirect.html', ['/html/body/div[1]/button[1]']);
  assert.equal(o.tabWalk.trapDetected, true, 'programmatic refocus is caught (focus-redirect or focus-frozen)');
  assert.ok(['focus-redirect', 'focus-frozen', 'background-defocus'].includes(o.tabWalk.trapInterference), 'an outcome-layer interference channel fired');
});
test('R2.5-D trap (R24-H2): a stopImmediatePropagation modal that blocks both listeners is INDETERMINATE, not a false wraparound', { skip: !serverUp }, () => {
  const o = runScript('drive-page.js', 'fx-trap-stopimmediate.html', ['/html/body/div[1]/button[1]']);
  assert.equal(o.tabWalk.trapDetected, null, 'absence of OBSERVED interference is not proof of wraparound');
  assert.equal(o.tabWalk.trapIndeterminate, true, 'focus confined in a dialog with no demonstrated escape ⇒ indeterminate (agent → PARTIAL)');
});
test('R2.6-D trap (#4): a FREEZE trap (preventDefault all Tab) leaves count:0 but is no longer a silent "not a trap"', { skip: !serverUp }, () => {
  const o = runScript('drive-page.js', 'fx-trap-freeze.html', ['/html/body/button[1]']);
  assert.equal(o.tabWalk.count, 0, 'Tab never placed focus on any control');
  assert.notEqual(o.tabWalk.trapDetected, false, 'must NOT read as "not a trap" — frozen focus with focusables present');
  assert.match(o.tabWalk.trapReason || '', /no focusable was reached/);
});
test('R2.6-D trap (#7): an EVER-FRESH-focusable trap (never converges) is INDETERMINATE, not a silent pass', { skip: !serverUp }, () => {
  const o = runScript('drive-page.js', 'fx-trap-everfresh.html', ['/html/body/div[1]/button[1]']);
  assert.equal(o.tabWalk.trapDetected, null);
  assert.equal(o.tabWalk.trapIndeterminate, true, 'a walk that never converges cannot assess keyboard/focus');
});
test('R2.5-D trap (my #3): a DISABLE-the-background trap (tabindex=-1 on outside controls) is caught', { skip: !serverUp }, () => {
  const o = runScript('drive-page.js', 'fx-trap-disable.html', ['/html/body/div[1]/button[1]']);
  assert.equal(o.tabWalk.trapDetected, true, 'the page removed the escape routes ⇒ background-defocus interference');
  assert.equal(o.tabWalk.trapInterference, 'background-defocus');
});
test('R2.3-B+ trap: a non-standard exit that is ADVISED emits advisedExitHint (agent → PARTIAL, not a definite trap)', { skip: !serverUp }, () => {
  const o = runScript('drive-page.js', 'fx-trap-advised.html', ['/html/body/div[1]/button[1]']);
  assert.equal(o.tabWalk.trapDetected, true, 'standard keys cannot escape');
  assert.ok(o.tabWalk.advisedExitHint && /f6/.test(o.tabWalk.advisedExitHint.key || ''), 'instructional text naming the exit key is surfaced for judgment');
});
test('R2.3-B+ trap: a plain trap with NO advisement has advisedExitHint=null (definite trap)', { skip: !serverUp }, () => {
  const o = runScript('drive-page.js', 'fx-trap-only.html', ['/html/body/button[1]']);
  assert.equal(o.tabWalk.trapDetected, true);
  assert.equal(o.tabWalk.advisedExitHint == null, true, 'no advisement → not downgraded');
});
test('R2.3-B trap: ordinary wraparound is NOT a trap (no Tab interference observed)', { skip: !serverUp }, () => {
  const o = runScript('drive-page.js', 'fx-wraparound.html', ['/html/body/button[1]']);
  assert.equal(o.tabWalk.trapDetected, false, 'no preventDefault / focus-redirect ⇒ bounded wraparound, not a trap');
});
test('R2.2-B trap: a DISABLED control in the tab order does NOT inflate focusables (no false trap)', { skip: !serverUp }, () => {
  const o = runScript('drive-page.js', 'fx-disabled-skip.html', ['/html/body/button[1]']);
  assert.equal(o.tabWalk.totalFocusables, 2, 'disabled control excluded from focusables');
  assert.equal(o.tabWalk.trapDetected, false);
});
test('R2-H3 first-focusable: the first focusable target is reached by real Tab (sentinel reset)', { skip: !serverUp }, () => {
  const o = runScript('drive-page.js', 'fx-firstfocus.html', ['/html/body/button[1]']);
  const lt = o.elements[0].localTabWalk;
  assert.equal(lt.reachedByTab, true, 'first focusable must be reachable');
  assert.ok(lt.stopsToReach <= 1, `should reach at stop 0, got ${lt.stopsToReach}`);
});

test('R2-H6 forms: TRUSTED submit, OBSERVED invalid events, per-field validity; native validation MEETS 3.3.1', { skip: !serverUp }, () => {
  const o = runScript('drive-page.js', 'fx-form.html', ['/html/body/form[1]/input[1]']);
  const f = o.forms[0];
  assert.equal(f.submitMethod, 'trusted', 'submit must be a trusted click');
  assert.equal(f.submitBlocked, true, 'observed via the invalid event, not inferred');
  assert.ok(f.invalidEventsFired >= 1);
  assert.ok(f.perField[0].validity.valueMissing, 'per-field validity captured');
  assert.ok(f.validationMessages.length >= 1, 'native validationMessage captured');
  assert.equal(f.nativeTextIdentification, true);
  assert.equal(f.noTextIdentificationAtAll, false, 'native validation provides text → NOT a 3.3.1 failure');
});

test('R2.3-D isolation: the activation probe is ALWAYS reloaded → behavioralTrust marks it trusted+isolated', { skip: !serverUp }, () => {
  const o = runScript('drive-page.js', 'fx-states.html', ['/html/body/button[1]']);
  const bt = o.elements[0].behavioralTrust;
  assert.ok(bt, 'driver emits per-element behavioralTrust for the PARTIAL rule');
  assert.equal(bt.activation.isolated, true, 'a native control’s activation is now isolated unconditionally (R22-H3 hole closed)');
  assert.equal(bt.activation.trusted, true, 'activation used a trusted ElementHandle click');
});

test('R2.3-A+ edge: an ANCESTOR clip-path crops the target → needs-judgment (not just the element’s own)', { skip: !serverUp }, () => {
  const o = runScript('eval-page.js', 'fx-shape-ancestorclip.html', ['/html/body/div[1]/a[1]']);
  const e = o.elements[0];
  assert.equal(e.clipped, true, 'ancestor clip-path is detected, mirroring the ancestor-transform walk');
  assert.equal(e.targetSize.verdict, 'needs-judgment', 'a clipped hit area cannot be asserted to fit 24×24');
});
test('R2.3-E+ edge: NESTED consent containers count ONCE (no double-counted controls)', { skip: !serverUp }, () => {
  const o = runScript('eval-page.js', 'fx-consent-nested.html', ['/html/body/main[1]/p[1]']);
  const c = o.consentHidden;
  assert.equal(c.count, 1, 'a matched container nested in another matched one is not a second container');
  assert.equal(c.consentState.visibleControls, 2, 'the inner container’s control is counted once, via the top-level subtree');
});

test('R2.3-E consent (R22-M1): inventory is VISIBLE-only, container counted ONCE, marked PARTIAL-basis', { skip: !serverUp }, () => {
  const o = runScript('eval-page.js', 'fx-consent.html', ['/html/body/main[1]/p[1]']);
  const c = o.consentHidden;
  assert.equal(c.count, 1, 'a container matching multiple selectors is neutralised/counted once');
  assert.equal(c.consentState.visibleControls, 2, 'only the two visible buttons count — the display:none input is excluded');
  assert.equal(c.consentState.unlabelledVisibleControls, 1, 'the hidden input must NOT inflate the unlabelled-control 4.1.2 signal');
  assert.ok(/PARTIAL/.test(c.consentState.basis), 'inventory declares its static/visible-only basis');
});

test('H7 states: expanded/checked/disabled collected from DOM + AX', { skip: !serverUp }, () => {
  const o = runScript('eval-page.js', 'fx-states.html', STATE_XPS);
  const [expbtn, chk, disbtn] = o.elements;
  assert.equal(expbtn.states.expanded, 'false');
  assert.equal(chk.states.checked, 'true');
  assert.equal(disbtn.states.disabled, 'true');
  assert.ok(expbtn.axStates, 'authoritative axStates present');
});
