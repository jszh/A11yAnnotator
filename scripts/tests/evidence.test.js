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
  assert.ok(f.focusAppearance.areaPx > 0 && typeof f.focusAppearance.minThicknessPx === 'number', 'area/thickness recorded for future 2.4.13');
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

test('H7 states: expanded/checked/disabled collected from DOM + AX', { skip: !serverUp }, () => {
  const o = runScript('eval-page.js', 'fx-states.html', STATE_XPS);
  const [expbtn, chk, disbtn] = o.elements;
  assert.equal(expbtn.states.expanded, 'false');
  assert.equal(chk.states.checked, 'true');
  assert.equal(disbtn.states.disabled, 'true');
  assert.ok(expbtn.axStates, 'authoritative axStates present');
});
