// Integration tests — run the harness against the live annotator server (:3001)
// on saved pages with KNOWN-correct answers, asserting each fix end to end.
//
//   node --test scripts/tests/integration.test.js
//
// Requires `node server.js` running on :3001. If it isn't, the whole suite is
// skipped (not failed). Each (script,file) is executed once and cached, so the
// browser launches are amortised across assertions.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const A = require('../lib/a11y-eval.js');

const ROOT = path.join(__dirname, '..', '..');
const cache = new Map();
// Synchronous server probe at module load so `skip` resolves correctly.
let serverUp = false;
try { execFileSync('curl', ['-sf', '-o', '/dev/null', '--max-time', '3', 'http://127.0.0.1:3001/'], { stdio: 'ignore' }); serverUp = true; }
catch (e) { console.log('# server :3001 not running — integration suite SKIPPED'); }

function run(script, file, extra = []) {
  const key = script + '|' + file + '|' + extra.join(',');
  if (cache.has(key)) return cache.get(key);
  const out = execFileSync('node', [path.join('scripts', script), '--file', file, ...extra], {
    cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'],
  });
  const json = JSON.parse(out);
  cache.set(key, json);
  return json;
}
const byIdx = (o, i) => o.elements.find(e => e.idx === i);
const byXpathName = (o, re) => o.elements.find(e => re.test(e.axName || '') || re.test(e.text || ''));

// The integration suite MUST run, not silently skip-green. This precondition FAILS
// (not skips) when the server is down, so a no-server run can never pass with zero
// executed integration assertions. Run `node server.js` (port 3001) first.
test('integration precondition: annotator server is up on :3001', () => {
  assert.ok(serverUp, 'server :3001 not reachable — start it with `node server.js` before the integration suite');
});

// ---- T4 + T3 + T14 via eval-page on Domino's ----
test('T4 Domino\'s JOIN NOW (16px bold) gets the 4.5 threshold', { skip: !serverUp }, () => {
  const o = run('eval-page.js', "Domino's.htm");
  const join = byXpathName(o, /JOIN NOW/i);
  assert.ok(join, 'JOIN NOW element present');
  assert.equal(join.fontPx, 16);
  assert.equal(join.contrastThreshold, 4.5, '16px bold must NOT be treated as large text');
});
test('T14 Domino\'s consent overlay hidden', { skip: !serverUp }, () => {
  const o = run('eval-page.js', "Domino's.htm");
  assert.ok(o.consentHidden && o.consentHidden.count >= 1, 'at least one consent container hidden');
});

// ---- C4: 2.5.8 uses real circle geometry (not the old box<24, not blanket exemption).
// Deterministic pass/fail is proven on the fixture (evidence.test.js); here we assert
// the geometry DISCRIMINATES on a real page and every verdict cites a geometry reason. ----
test('C4 Home Artera target-size is geometry-based (discriminates, not all-fail box<24)', { skip: !serverUp }, () => {
  const o = run('eval-page.js', 'Home - Artera.htm');
  const footer = o.elements.filter(e => e.targetSize && e.box && e.box.h > 0 && e.box.h < 24 && e.tag === 'a');
  assert.ok(footer.length >= 1, 'has undersized footer links');
  assert.ok(footer.some(e => e.targetSize.passes), 'at least one undersized link PASSES via spacing (not the old all-fail box<24)');
  for (const e of footer) assert.match(e.targetSize.reason, /spacing|inline|24x24|circle/, 'verdict must cite the normative geometry');
});

// ---- T11 container/overlay contrast unreliability via Calendly ----
test('T11 Calendly button-over-card contrast flagged unreliable → pixel', { skip: !serverUp }, () => {
  const o = run('eval-page.js', 'Calendly.htm');
  const readNow = byXpathName(o, /Read now/i);
  assert.ok(readNow, 'Read now button present');
  assert.equal(readNow.needsPixelContrast, true);
  assert.equal(readNow.contrastReliable, false);
});

// ---- T1/T8 focus ring via drive on Apple/Yahoo (the false-positive page) ----
test('T1/T8 Apple focus rings detected (former false positives now present)', { skip: !serverUp }, () => {
  const o = run('drive-page.js', 'Apple Inc. (AAPL) Stock Price, News, Quote & History - Yahoo Finance.html', ['--shotdir', '/tmp/ittest_apple', '--maxtab', '30']);
  for (const i of [7, 10]) {
    const e = byIdx(o, i);
    assert.ok(e && e.focusIndicator, `el${i} has focusIndicator`);
    assert.equal(e.focusIndicator.present, true, `el${i} ring must be detected (was false positive)`);
  }
});
test('T1/T8 Apple el4 (page suppresses outline) correctly reports NO ring', { skip: !serverUp }, () => {
  const o = run('drive-page.js', 'Apple Inc. (AAPL) Stock Price, News, Quote & History - Yahoo Finance.html', ['--shotdir', '/tmp/ittest_apple', '--maxtab', '30']);
  const e = byIdx(o, 4);
  assert.ok(e && e.focusIndicator);
  assert.equal(e.focusIndicator.present, false, 'el4 genuinely has outline:none on focus-visible → no ring');
});

// ---- T2 roving / synthetic-only keyboard via Google Drive tabs ----
test('T2 Google Drive tab is indeterminate (PARTIAL), not a confident keyboard failure', { skip: !serverUp }, () => {
  const o = run('drive-page.js', 'Home - Google Drive.htm', ['--shotdir', '/tmp/ittest_gd', '--maxtab', '40']);
  const e = byIdx(o, 20);
  assert.ok(e && e.keyboardSignal, 'el20 has keyboardSignal');
  assert.equal(e.keyboardSignal.operable, null, 'must be indeterminate, not a definite failure');
  assert.equal(e.keyboardSignal.confident, false);
});

// ---- T9 VSR "document" artifact filtered via BuzzFeed ----
test('T9 BuzzFeed: the "document" root phrase is never a recorded announcement', { skip: !serverUp }, () => {
  const o = run('drive-page.js', 'BuzzFeed.htm', ['--shotdir', '/tmp/ittest_bf', '--maxtab', '30']);
  const docAsAnnouncement = o.elements.filter(e => e.activate && A.isVsrNoisePhrase(e.activate.vsrAnnouncement || ''));
  assert.equal(docAsAnnouncement.length, 0, 'no element should report a noise/root phrase as its announcement');
  // (round-2 also stops/restarts the VSR cleanly, so the raw "document" artifact may no
  // longer surface at all — a strictly better outcome than filtering it after the fact.)
});

// ---- T15 forms: junk (0-field) forms are skipped via Reebok ----
test('T15 Reebok 0-field cookie/modal forms are skipped, not submitted', { skip: !serverUp }, () => {
  const o = run('drive-page.js', 'Reebok® Official Site.htm', ['--shotdir', '/tmp/ittest_rb', '--maxtab', '30']);
  assert.ok(o.forms.some(f => f.skipped), 'at least one junk form skipped');
  assert.ok(o.forms.some(f => !f.skipped && f.fields >= 1), 'the real field-bearing form is still probed');
});
