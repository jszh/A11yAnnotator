'use strict';
// FIXES: detectTrapsAfterReveal (kbd-graph.js) — revealed-state embedded-format + confinement detectors
// (RCA-residual-s10 §2.1.2, `modal-popover-legitimate-containment-vs-trap/case-06` shape, 0/3 stable miss).
//
// The blind spot: an F10 trap inside a same-origin srcdoc iframe inside a display:none modal. At rest every
// detector correctly declines (2 rendered focusables; the iframe's rect is 0x0). After the reveal pass opens
// the modal, detectKeyboardTraps nominates the dialog, observes both-direction confinement THROUGH the
// iframe, and then CLEARS it: its Esc probe resets focus to the region's first focusable in the PARENT
// document — where the parent's Escape handler works — while the trapped user is INSIDE the frame, where the
// keydown never reaches the parent document. Only detectEmbeddedFormatTraps presses Escape from inside the
// boundary, and it never ran in the revealed state. The fix runs it (and the fixed-set confinement detector)
// after the two originals, RE-OPENING the modal first because the region detector's Esc probe closes it.
//
// Fixtures are INVENTED inline HTML — nothing from any eval corpus.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const puppeteer = require('puppeteer');
const { detectTrapsAfterReveal } = require('../../lib/kbd-graph.js');
const { CHROME } = require('../../lib/run-experiments.js');

const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — kbd-reveal-embedded-trap SKIPPED');

// MACHINE-CONTENTION LAUNCH: one browser at a time (concurrency:false on every test); on the WS-endpoint
// timeout that heavy parallel Chrome load produces, wait 60s and retry (max 3 attempts).
async function launch() {
  for (let attempt = 1; ; attempt++) {
    try {
      return await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files'] });
    } catch (e) {
      const msg = String((e && e.message) || e);
      if (attempt < 3 && /WS endpoint URL/i.test(msg)) { await new Promise((r) => setTimeout(r, 60000)); continue; }
      throw e;
    }
  }
}

// detectTrapsAfterReveal reloads its url per opener (and now re-opens between detector groups), so the
// fixture must live at a real URL — a temp file, exactly like status-focus-and-reveal-restore does it.
function tmpPage(name, html) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'v3-revealtrap-'));
  const file = path.join(dir, name);
  fs.writeFileSync(file, html, 'utf8');
  return { file, url: 'file://' + file, dir };
}

async function revealTraps(html, opts = {}) {
  const { url } = tmpPage('page.html', html);
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'load' });
    return await detectTrapsAfterReveal(page, url, opts);
  } finally { await browser.close(); }
}

const escAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// The embedded vendor widget, as a srcdoc document: 2 inputs + 1 button. `confine: true` adds the trap —
// a Tab-wrap (last->first, first->last) plus a focusin re-grab, both scoped to the INNER document, and no
// Escape handling anywhere inside. `confine: false` is byte-identical except the script, so Tab walks out.
const widgetDoc = (confine) => `<!DOCTYPE html><html lang="en"><body>
  <h3>CardPay</h3>
  <label for="num">Card number</label><input id="num" type="text">
  <label for="exp">Expiry</label><input id="exp" type="text">
  <button id="pay" type="button">Pay now</button>
  ${confine ? `<script>
    function items(){return Array.from(document.querySelectorAll("input,button"));}
    document.addEventListener("keydown",function(e){
      if(e.key!=="Tab")return;
      var f=items(),first=f[0],last=f[f.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    });
    document.addEventListener("focusin",function(e){
      if(e.target===document.body){document.getElementById("num").focus();}
    });
  </script>` : ''}
</body></html>`;

// The host page: 2 focusables at rest (the case-06 shape — BELOW the confinement detector's >=3 floor, and
// the modal's controls all have offsetParent null), a hidden .overlay (TRAP_REGION_SEL via class AND
// role=dialog) whose OUTER modal is conformant in isolation: initial focus on Close, a parent-document
// Escape handler that closes it, a Tab wrap over its own controls, focus restored on close. The opener's
// name ("Begin checkout") deliberately matches NO reveal verb — this pins that rank-3 openers reach the pass.
const hostPage = (confineInner) => `<!DOCTYPE html><html lang="en"><head><style>
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: none; align-items: center; justify-content: center; }
  .overlay.show { display: flex; }
  .card { background: #fff; padding: 16px; width: 420px; }
  iframe { width: 100%; height: 160px; }
</style></head><body>
<main>
  <h1>Poster print shop</h1>
  <button id="begin" type="button">Begin checkout</button>
  <p><a href="#faq" id="faq">Delivery questions</a></p>
</main>
<div class="overlay" id="ov">
  <div class="card" role="dialog" aria-modal="true" aria-label="Payment" id="dlg">
    <button id="x" type="button">Close</button>
    <iframe id="payframe" title="CardPay secure payment" srcdoc="${escAttr(widgetDoc(confineInner))}"></iframe>
    <button id="cancel" type="button">Cancel</button>
  </div>
</div>
<script>
  var ov = document.getElementById('ov'), dlg = document.getElementById('dlg'), opener = null;
  function focusablesIn() {
    return Array.from(dlg.querySelectorAll('button, input, iframe')).filter(function (el) { return !el.disabled && el.offsetParent !== null; });
  }
  function openIt() { opener = document.activeElement; ov.classList.add('show'); document.getElementById('x').focus(); }
  function closeIt() { ov.classList.remove('show'); if (opener && opener.focus) opener.focus(); }
  document.getElementById('begin').addEventListener('click', openIt);
  document.getElementById('x').addEventListener('click', closeIt);
  document.getElementById('cancel').addEventListener('click', closeIt);
  document.addEventListener('keydown', function (e) {
    if (!ov.classList.contains('show')) return;
    if (e.key === 'Escape') { e.preventDefault(); closeIt(); return; }
    if (e.key !== 'Tab') return;
    var f = focusablesIn(), first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
</script>
</body></html>`;

test('srcdoc-in-hidden-modal trap: the revealed-state pass confirms the same-origin F10 embed trap', { skip: !chromeOK, concurrency: false }, async () => {
  const res = await revealTraps(hostPage(true));
  assert.ok(res, 'the reveal pass must return a result for the trapping widget');
  assert.ok(res.opener && /button\[1\]$/.test(res.opener.xpath), 'the rank-3 opener ("Begin checkout") was the one activated');
  assert.ok(!res.traps, 'the outer modal must NOT be reported as a region trap — its parent-document Escape works');
  assert.ok(!res.selfTraps, 'no self-refocus trap on this page');
  assert.ok(res.embedTraps && Array.isArray(res.embedTraps.traps), 'the embedded-format detector ran in the revealed state');
  assert.equal(res.embedTraps.traps.length, 1, 'exactly one embedded-format trap');
  const t = res.embedTraps.traps[0];
  assert.equal(t.sc, '2.1.2');
  assert.equal(t.kind, 'iframe');
  assert.equal(t.sameOrigin, true, 'srcdoc is same-origin — CONFIRMED authority, not review');
  assert.equal(t.innerFocusables, 3, 'the walk was sized from the widget\'s own 3 focusables');
  assert.match(t.xpath, /iframe\[1\]$/, 'the finding is anchored on the boundary element');
});

test('control: the SAME page whose widget does NOT confine Tab yields NO finding at all', { skip: !chromeOK, concurrency: false }, async () => {
  const res = await revealTraps(hostPage(false));
  assert.equal(res, null, 'a well-behaved embedded widget inside a conformant modal is not a trap — and the revealed confinement lane must not manufacture one from the modal\'s own legitimate containment');
});

// REGRESSION for the revealed confinement lane specifically: an APG-correct modal with NO iframe — contained
// in both directions, released by Escape, focus restored. The revealed-state confinement detector now RUNS on
// this page (5 rendered focusables once open, so the floor passes); its Escape guard must clear it.
const APG_MODAL = `<!DOCTYPE html><html lang="en"><head><style>
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: none; }
  .overlay.show { display: block; }
</style></head><body>
<main>
  <h1>Newsletter</h1>
  <button id="begin" type="button">Begin signup</button>
  <p><a href="#faq" id="faq">Why subscribe?</a></p>
</main>
<div class="overlay" id="ov">
  <div role="dialog" aria-modal="true" aria-label="Sign up" id="dlg">
    <button id="x" type="button">Close</button>
    <input id="email" type="text">
    <button id="go" type="button">Subscribe</button>
  </div>
</div>
<script>
  var ov = document.getElementById('ov'), dlg = document.getElementById('dlg'), opener = null;
  function focusablesIn() {
    return Array.from(dlg.querySelectorAll('button, input')).filter(function (el) { return !el.disabled && el.offsetParent !== null; });
  }
  function openIt() { opener = document.activeElement; ov.classList.add('show'); document.getElementById('x').focus(); }
  function closeIt() { ov.classList.remove('show'); if (opener && opener.focus) opener.focus(); }
  document.getElementById('begin').addEventListener('click', openIt);
  document.getElementById('x').addEventListener('click', closeIt);
  document.addEventListener('keydown', function (e) {
    if (!ov.classList.contains('show')) return;
    if (e.key === 'Escape') { e.preventDefault(); closeIt(); return; }
    if (e.key !== 'Tab') return;
    var f = focusablesIn(), first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
</script>
</body></html>`;

test('regression: an APG-correct revealed modal (no iframe) is cleared by the confinement detector\'s Escape guard — no held review result', { skip: !chromeOK, concurrency: false }, async () => {
  const res = await revealTraps(APG_MODAL);
  assert.equal(res, null, 'the modal carve-out (Understanding 2.1.2) must not become a revealed-state confinement finding');
});

// ────────────────────────────────────────────────────────────────────────────────────────────────
// RE-OPEN BEFORE THE CONFINEMENT DETECTOR (soundness probe 2026-08-17). The embedded-format detector is
// state-destructive: its escape probe presses Escape with focus inside each boundary, and from a SHADOW
// ROOT that keydown bubbles into the parent document — on an Escape-closable modal it CLOSES the dialog
// (correctly clearing the embed lane), after which the confinement detector used to run against the
// re-closed page, floor out under 3 rendered focusables, and miss the revealed set entirely.
//
// Fixture (invented): an Escape-closable modal holding (a) a two-button FORWARD wall (#w1/#w2 — Tab from
// #w2 is forced back to #w1, Shift+Tab escapes normally: a one-way loop the confinement detector reports
// as review), (b) a shadow-root widget whose three buttons wrap Tab in BOTH directions but let Escape
// bubble (this is what makes the embed detector close the modal and emit nothing), and (c) a button after
// the widget that forward Tab can never reach.
const SHADOW_ONEWAY_MODAL = `<!DOCTYPE html><html lang="en"><head><style>
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: none; }
  .overlay.show { display: block; }
  .card { background: #fff; padding: 14px; width: 420px; }
</style></head><body>
<main>
  <h1>Seed swap stand</h1>
  <button id="begin" type="button">Begin trade</button>
  <p><a href="#faq" id="faq">How trading works</a></p>
</main>
<div class="overlay" id="ov">
  <div class="card" role="dialog" aria-modal="true" aria-label="Trade" id="dlg">
    <button id="x" type="button">Close</button>
    <button id="w1" type="button">Offer seeds</button>
    <button id="w2" type="button">Request seeds</button>
    <div id="podhost"></div>
    <button id="after" type="button">Finish trade</button>
  </div>
</div>
<script>
  var ov = document.getElementById('ov'), opener = null;
  function openIt() { opener = document.activeElement; ov.classList.add('show'); document.getElementById('x').focus(); }
  function closeIt() { ov.classList.remove('show'); if (opener && opener.focus) opener.focus(); }
  document.getElementById('begin').addEventListener('click', openIt);
  document.getElementById('x').addEventListener('click', closeIt);
  document.addEventListener('keydown', function (e) {
    if (ov.classList.contains('show') && e.key === 'Escape') { e.preventDefault(); closeIt(); }
  });
  // the FORWARD wall: Tab from #w2 is forced back to #w1; Shift+Tab is untouched (escapes backward).
  document.getElementById('w2').addEventListener('keydown', function (e) {
    if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); document.getElementById('w1').focus(); }
  });
  // the shadow widget: three buttons, Tab wrapped in BOTH directions inside the root; Escape NOT handled,
  // so it bubbles to the document handler above (composed keyboard events cross the shadow boundary).
  var root = document.getElementById('podhost').attachShadow({ mode: 'open' });
  root.innerHTML = '<button type="button">Pea pods</button><button type="button">Bean pods</button><button type="button">Squash pods</button>';
  root.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var f = Array.prototype.slice.call(root.querySelectorAll('button'));
    var a = root.activeElement;
    if (e.shiftKey && a === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && a === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });
</script>
</body></html>`;

test('re-open after the embed detector: the confinement detector still sees the revealed set (one-way wall reported)', { skip: !chromeOK, concurrency: false }, async () => {
  const res = await revealTraps(SHADOW_ONEWAY_MODAL);
  assert.ok(res, 'the pass must return the held review result, not null — before the re-open the confinement detector ran on the re-closed page and floored out');
  assert.ok(!res.traps && !res.selfTraps && !res.embedTraps, 'no other detector decided this page (the embed Escape correctly cleared the widget by closing the modal)');
  assert.ok(res.confinement && Array.isArray(res.confinement.onewayTraps), `the confinement detector ran against the RE-OPENED modal — got ${JSON.stringify(res && res.confinement)}`);
  assert.equal(res.confinement.onewayTraps.length, 1);
  const ow = res.confinement.onewayTraps[0];
  assert.equal(ow.direction, 'forward');
  assert.equal(ow.setSize, 2, 'the wall pair is the confined set');
  assert.ok(ow.memberXpaths.every((x) => /button/.test(x)), `members are the wall buttons — ${JSON.stringify(ow.memberXpaths)}`);
  assert.ok(ow.unreachedCount >= 1, 'the button after the widget is walled off forward');
  assert.ok((res.confinement.traps || []).length === 0, 'never promoted to a both-direction confinement');
});
