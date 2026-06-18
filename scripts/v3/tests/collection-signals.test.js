// Coverage round 2 — COLLECTION integration guard. Runs the REAL collector (scripts/eval-page.js) over a
// file:// fixture (no server: A11Y_BASE points at a temp dir) and asserts the new collection signals.
//
// THE MUST-FIX (#43): the ax-name-presence detector fires ONLY on an empty-STRING axName for an in-tree
// name-requiring element. The old `ax.name.value || null` coercion turned that '' into null, making the
// detector DEAD on real data while a hand-fed `{axName:''}` unit test stayed green. This test pins the
// real chain: CDP emits name.value:'' for an empty in-tree <button>/<img>, and eval-page (via
// A.coerceAxName) PRESERVES it as '' — so reintroducing `|| null` at the call site fails HERE, not just
// in the helper unit test. Also exercises #23 (event-listener inventory), #16 (pageIds) and #12
// (fieldsets) collection so the deterministic detectors that consume them have a real-collector witness.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const A = require('../../lib/a11y-eval.js');
const { CORPUS } = require('../../lib/asset-paths.js');

const REPO = path.join(__dirname, '..', '..', '..');
const EVAL = path.join(REPO, 'scripts', 'eval-page.js');
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chromeOK = fs.existsSync(CHROME);

// 1x1 transparent PNG so the <img> elements have a real box (an unrendered img is ignored by the AX tree).
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const FIXTURE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>collection signals fixture</title></head><body>
<button id="b-empty"></button>
<button id="b-named">Save</button>
<img id="i-noalt" src="${PNG}" style="width:32px;height:32px">
<img id="i-decorative" alt="" src="${PNG}" style="width:32px;height:32px">
<input id="in-dangling" aria-labelledby="no-such-id">
<input id="in-described" aria-describedby="desc1">
<span id="desc1">helpful description</span>
<fieldset id="fs-nolegend"><input type="radio" name="a" id="r1"><input type="radio" name="a" id="r2"></fieldset>
<fieldset id="fs-legend"><legend>Contact preference</legend><input type="radio" name="b" id="r3"><input type="radio" name="b" id="r4"></fieldset>
<fieldset id="fs-wrapper"><fieldset id="fs-inner"><legend>Inner</legend><input type="radio" name="c" id="r5"><input type="radio" name="c" id="r6"></fieldset></fieldset>
<div id="js-orphan">Click me</div>
<script>document.getElementById('js-orphan').addEventListener('click', function(){});</script>
</body></html>`;

const XPATHS = {
  'b-empty':      '/html[1]/body[1]/button[1]',
  'b-named':      '/html[1]/body[1]/button[2]',
  'i-noalt':      '/html[1]/body[1]/img[1]',
  'i-decorative': '/html[1]/body[1]/img[2]',
  'in-dangling':  '/html[1]/body[1]/input[1]',
  'js-orphan':    '/html[1]/body[1]/div[1]',
};

function runCollector() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'coll-sig-'));
  const savedDir = path.join(tmp, 'assets', CORPUS); // the collector loads a not-in-repo file from the CORPUS dir under A11Y_BASE — the temp fixture must live there
  fs.mkdirSync(savedDir, { recursive: true });
  fs.writeFileSync(path.join(savedDir, 'fx.html'), FIXTURE);
  const xpathsFile = path.join(tmp, 'xpaths.json');
  fs.writeFileSync(xpathsFile, JSON.stringify(Object.values(XPATHS)));
  const stdout = execFileSync('node', [EVAL, '--file', 'fx.html', '--xpaths', xpathsFile, '--run-id', 'coll-sig-test', '--scripts', '--settle', '300'], {
    env: { ...process.env, A11Y_BASE: 'file://' + tmp },
    encoding: 'utf8', timeout: 90000, maxBuffer: 64 * 1024 * 1024,
  });
  const line = stdout.trim().split('\n').filter(Boolean).pop();
  return JSON.parse(line);
}

test('coerceAxName: empty resolved name stays "" (presence barrier), unresolved stays null (#43 helper guard)', () => {
  assert.equal(A.coerceAxName(''), '', 'an empty resolved name is "" (the name-presence signal), NOT null');
  assert.equal(A.coerceAxName('Save'), 'Save');
  assert.equal(A.coerceAxName(undefined), null, 'no name property ⇒ null (unresolved, uncertain)');
  assert.equal(A.coerceAxName(null), null);
  assert.equal(A.coerceAxName(0), '0', 'a falsy-but-present value must NOT collapse to null (the `|| null` bug)');
});

test('collector (#43): an empty in-tree name-requiring element yields axName:"" (not null) end-to-end', { skip: !chromeOK, concurrency: false }, () => {
  const out = runCollector();
  const byXpath = Object.fromEntries((out.elements || []).map((e) => [e.xpath, e]));
  const emptyBtn = byXpath[XPATHS['b-empty']];
  assert.ok(emptyBtn, 'the empty button was collected');
  assert.equal(emptyBtn.inTree, true, 'a nameless <button> is exposed in the AX tree');
  assert.equal(emptyBtn.axName, '', 'its accessible name is the empty STRING, not null — the dead-detector regression #43 guards');

  const named = byXpath[XPATHS['b-named']];
  assert.equal(named.axName, 'Save', 'a named button keeps its name');

  const decorative = byXpath[XPATHS['i-decorative']];
  assert.equal(decorative.inTree, false, 'an <img alt=""> is decorative ⇒ ignored ⇒ NOT in tree ⇒ ax-name-presence skips it');
});

test('collector (#23/#14): event-listener inventory captures a JS-wired pointer handler on a non-interactive div', { skip: !chromeOK, concurrency: false }, () => {
  const out = runCollector();
  const byXpath = Object.fromEntries((out.elements || []).map((e) => [e.xpath, e]));
  const orphan = byXpath[XPATHS['js-orphan']];
  assert.ok(orphan, 'the JS-wired div was collected');
  assert.ok(Array.isArray(orphan.listenerTypes), 'listenerTypes is collected');
  assert.ok(orphan.listenerTypes.includes('click'), 'the addEventListener("click") handler is seen (invisible to the static snapshot)');
  assert.equal(orphan.pointerActivationListener, true);
  assert.equal(orphan.keyListener, false, 'no keyboard handler ⇒ a keyboard-orphan candidate');
});

test('collector (#16/#12): structure carries pageIds + fieldset inventory for the deterministic detectors', { skip: !chromeOK, concurrency: false }, () => {
  const out = runCollector();
  const st = out.structure || {};
  // #16 pageIds: present id → text length; the detector resolves IDREFs against this map.
  assert.ok(st.pageIds && typeof st.pageIds === 'object', 'pageIds map is collected');
  assert.ok(Object.prototype.hasOwnProperty.call(st.pageIds, 'desc1'), 'a referenced id is present');
  assert.equal(st.pageIds.desc1 > 0, true, 'desc1 has non-empty text');
  assert.ok(!('no-such-id' in st.pageIds), 'the dangling target id is absent (⇒ aria-labelledby is dangling)');
  // #12 fieldsets: the no-legend group is nameless; the legend group is named.
  const fs2 = st.fieldsets || [];
  const nolegend = fs2.find((f) => f.controlCount >= 2 && !f.hasLegend && !f.ariaLabel && !f.labelledbyText);
  assert.ok(nolegend, 'the legend-less radio group with ≥2 controls is captured nameless (a 3.3.2 group-label barrier)');
  const legend = fs2.find((f) => f.legendText === 'Contact preference');
  assert.ok(legend && legend.hasLegend, 'the legend group is captured WITH its accessible group name (negative)');
  // controlCount must count DIRECT controls only: the nameless wrapper fieldset owns 0 direct controls
  // (its 2 controls belong to the legended inner fieldset), so it must NOT read as a nameless group.
  const wrapper = fs2.find((f) => !f.hasLegend && f.controlCount === 0);
  assert.ok(wrapper, 'a nameless wrapper fieldset around a legended inner fieldset has controlCount 0 (no false group-label barrier)');
});
