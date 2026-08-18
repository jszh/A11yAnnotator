// Batch-3 #11 (at-rest trap detectors hoisted above the 2.4.3 reveal pass) + #24 (late-arrival trap
// re-pass at lane end). Pure row-builder tests + source-order pins run everywhere; the end-to-end
// late-arrival tests are gated on a local Chrome. Invented inline fixtures only (nothing corpus-derived).
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');
const { trapFindingRowsFrom, runInstrumentsForUrl, renderedFocusableXpaths } = require('../../lib/run-instruments.js');
const { CHROME } = require('../../lib/run-experiments.js');

const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — instruments-trap-order browser tests SKIPPED');

// ===================================================================================
// #11 pure — trapFindingRowsFrom is the ONE source of the trap rows: shapes, order,
// review flags, fan-out and dedupe must match the pre-hoist inline code byte-for-byte.
// ===================================================================================
test('#11 pure: row shapes/order — confirmed, directional, self-refocus, confinement fan-out, oneway', () => {
  const rows = trapFindingRowsFrom(
    { traps: [{ sc: '2.1.2', regionXpath: '/html/body/div[1]' }], directionalTraps: [{ sc: '2.1.2', regionXpath: '/html/body/div[2]' }] },
    { traps: [{ sc: '2.1.2', xpath: '/html/body/input[1]' }] },
    { traps: [{ sc: '2.1.2', xpath: '/html/body/div[3]/button[1]', memberXpaths: ['/html/body/div[3]/button[1]', '/html/body/div[3]/button[2]', '/html/body/div[3]/button[1]'], setSize: 2, lyingAdvisory: false }],
      onewayTraps: [{ sc: '2.1.2', xpath: '/html/body/div[4]/a[1]', memberXpaths: ['/html/body/div[4]/a[1]'], setSize: 1, direction: 'forward', unreached: [{ tag: 'button', label: 'Send' }], unreachedCount: 3 }] },
  );
  assert.deepEqual(rows.map((r) => r.kind), [
    'keyboard-trap', 'keyboard-trap-directional', 'keyboard-trap-self-refocus',
    'keyboard-trap-confinement', 'keyboard-trap-confinement', 'keyboard-trap-oneway',
  ], `order preserved, member fan-out deduped — got ${JSON.stringify(rows.map((r) => r.kind))}`);
  assert.equal(rows[0].detail, 'confirmed keyboard trap: focus cannot escape by Tab, Shift+Tab, Esc, or a Close control');
  assert.equal(rows[0].review, undefined, 'a confirmed region trap is authoritative-candidate (no review flag)');
  assert.equal(rows[1].review, true);
  assert.equal(rows[2].detail, 'confirmed keyboard trap: this focusable re-grabs its own focus on blur, so Tab and Shift+Tab cannot move focus off it');
  assert.equal(rows[3].review, true, 'confinement without a lying advisory stays review');
  assert.match(rows[3].detail, /confined to a fixed set of 2 element\(s\)/);
  assert.equal(rows[5].direction, 'forward');
  assert.equal(rows[5].unreachedCount, 3);
  assert.match(rows[5].detail, /3 rendered focusable\(s\) outside the set are never reached/);
});

test('#11 pure: a lying advisory PROMOTES confinement out of review; null inputs yield no rows', () => {
  const rows = trapFindingRowsFrom(null, null,
    { traps: [{ sc: '2.1.2', xpath: '/html/body/div[1]/button[1]', memberXpaths: ['/html/body/div[1]/button[1]'], setSize: 1, lyingAdvisory: true }], onewayTraps: [] });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].review, false);
  assert.match(rows[0].detail, /documented escape key does NOT free focus \(a lying advisory\)/);
  assert.deepEqual(trapFindingRowsFrom(null, null, null), []);
});

// ===================================================================================
// #11 source pins — the hoist itself: the three at-rest detectors run BEFORE the 2.4.3
// reveal pass, and the reveal pass's pageIsFresh is now perturbation-gated.
// ===================================================================================
test('#11 pin: at-rest trap block sits ABOVE the reveal pass in runInstruments', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'lib', 'run-instruments.js'), 'utf8');
  const iTraps = src.indexOf("guard('keyboardTraps', detectKeyboardTraps(page))");
  const iSelf = src.indexOf("guard('focusRetentionTraps'");
  const iConfine = src.indexOf("guard('confinementTraps'");
  const iReveal = src.indexOf('collectRevealedFocusOrder(page, opts.url');
  assert.ok(iTraps > 0 && iSelf > 0 && iConfine > 0 && iReveal > 0, 'all four call sites exist');
  assert.ok(iTraps < iReveal && iSelf < iReveal && iConfine < iReveal,
    `the three at-rest trap detectors precede the reveal pass (starvation keystone) — got ${JSON.stringify({ iTraps, iSelf, iConfine, iReveal })}`);
  assert.match(src, /pageIsFresh: trapPerturbed !== true/, 'the reveal pass reloads when the trap block perturbed the page');
});

test('#24 pin: the late-arrival re-pass exists, is gated, and reuses the SAME row builder', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'lib', 'run-instruments.js'), 'utf8');
  assert.match(src, /LATE-ARRIVAL RE-PASS \(batch-3 #24/);
  assert.match(src, /opts\.lateArrivalRePass !== false/);
  const uses = src.split('trapFindingRowsFrom(').length - 1;
  assert.ok(uses >= 3, `builder + at-rest + re-pass all share trapFindingRowsFrom — got ${uses} mentions`);
});

// ===================================================================================
// #24 end-to-end — a page that opens its own trap AFTER the walk is caught by the
// re-pass; a page whose panel never opens pays the bounded hold and adds NOTHING.
// ===================================================================================
const LATE_OPEN = `<!doctype html><html lang="en"><head><title>Tide tables</title></head><body>
  <main>
    <h1>Tide tables for the estuary</h1>
    <p>Readings for the spring series. <a id="more" href="#tables">see the full tables</a>.</p>
  </main>
  <div id="panel" popover="manual" role="dialog" aria-labelledby="pt">
    <h2 id="pt">Get the tide alerts</h2>
    <label for="pmail">Where should we send them?</label>
    <input id="pmail" type="email">
    <button id="pgo" type="button">Send me the alerts</button>
  </div>
  <script>
    var panel = document.getElementById('panel');
    window.addEventListener('load', function () {
      setTimeout(function () { panel.showPopover(); document.getElementById('pmail').focus(); }, 600);
    });
    document.addEventListener('focusin', function (e) {
      if (panel.matches(':popover-open') && !panel.contains(e.target)) {
        e.stopPropagation();
        document.getElementById('pmail').focus();
      }
    });
  <\/script>
</body></html>`;

// identical page, but the panel NEVER opens (the polarity twin)
const NEVER_OPEN = LATE_OPEN.replace(/window\.addEventListener\('load'[\s\S]*?}, 600\);\s*}\);/, '');

async function launchWithRetry() {
  let lastErr;
  for (let i = 0; i < 3; i++) {
    try { return await puppeteer.launch({ executablePath: CHROME, headless: 'new', timeout: 60000, args: ['--no-sandbox', '--disable-dev-shm-usage'] }); }
    catch (e) { lastErr = e; if (!/WS endpoint|Timed out/i.test(String(e && e.message))) throw e; }
  }
  throw lastErr;
}

test('#24: a self-opening popover trap is caught by the late-arrival re-pass', { skip: !chromeOK, concurrency: false }, async () => {
  const browser = await launchWithRetry();
  try {
    const url = 'data:text/html;charset=utf-8,' + encodeURIComponent(LATE_OPEN);
    const res = await runInstrumentsForUrl(url, { browser, file: 'late-open-fixture' });
    const trap = res.findings.find((f) => f.sc === '2.1.2' && f.kind === 'keyboard-trap' && !f.review);
    assert.ok(trap, `the confirmed trap is found — findings: ${JSON.stringify(res.findings.map((f) => f.kind))}`);
    assert.ok(res.lateArrival, 'the lateArrival summary rides the artifact');
    // On idle hardware the walk beats the 600 ms open, so the catch comes from the re-pass and says so.
    // Under heavy load the walk itself can slip past the open and the at-rest block catches it — the same
    // trap either way; only the provenance suffix differs.
    if (res.lateArrival.rePassRan) {
      assert.match(trap.detail, /late-arrival re-pass/, 'the re-pass catch carries its provenance');
      assert.ok(res.lateArrival.grew === true && res.lateArrival.addedFindings >= 1, JSON.stringify(res.lateArrival));
    }
    assert.ok(!('renderedFocusablesAtWalk' in res), 'the raw walk snapshot is replaced by the compact summary');
  } finally { await browser.close(); }
});

test('#24 polarity: a never-opening panel adds nothing (bounded hold, no re-pass, no findings)', { skip: !chromeOK, concurrency: false }, async () => {
  const browser = await launchWithRetry();
  try {
    const url = 'data:text/html;charset=utf-8,' + encodeURIComponent(NEVER_OPEN);
    const res = await runInstrumentsForUrl(url, { browser, file: 'never-open-fixture' });
    assert.ok(!res.findings.some((f) => f.sc === '2.1.2'), `no 2.1.2 finding — got ${JSON.stringify(res.findings.map((f) => f.kind))}`);
    assert.equal(res.lateArrival.grew, false);
    assert.equal(res.lateArrival.rePassRan, false, 'no growth ⇒ the trap block never re-runs');
  } finally { await browser.close(); }
});

// ===================================================================================
// F1 (soundness review 2026-08-17) — HARNESS-CAUSED growth must never be minted by the late-arrival
// re-pass as "the page changed itself". A button the 4.1.3 sweep itself clicks opens a genuine focus trap
// (real, not review-only — Tab/Shift+Tab cycle inside it, Escape does nothing); the growth is entirely
// the SWEEP's own doing. Before the fix, the late-arrival gate diffed against the EARLY walk-time
// snapshot (taken before the sweep ever ran), so this exact growth minted a `review:false` "confirmed
// keyboard trap" whose detail falsely claimed "the page changed itself after load" — measured directly
// against this fixture. The polarity twin (#24 above, LATE_OPEN) proves the opposite case still mints: a
// GENUINELY self-opening panel, with no harness click ever preceding its growth.
// ===================================================================================
const HARNESS_OPENED_TRAP = `<!doctype html><html lang="en"><head><title>Newsletter signup</title></head>
<body style="font:15px system-ui;margin:24px">
  <h1>Weekly digest</h1>
  <p>Join the list for a Monday summary.</p>
  <button id="join" type="button">Join the list</button>
  <div id="live" role="status" aria-live="polite"></div>
  <script>
    // Clicking the button announces a status AND opens a modal-shaped confirm panel that is CREATED on
    // click (nothing hidden at rest) and holds focus — a real 2.1.2 trap, entirely harness-caused.
    document.getElementById('join').addEventListener('click', function () {
      document.getElementById('live').textContent = 'Confirm your email to finish joining.';
      if (document.getElementById('confirm')) return;
      var d = document.createElement('div');
      d.id = 'confirm';
      d.setAttribute('role', 'dialog');
      d.setAttribute('aria-modal', 'true');
      d.style.cssText = 'position:fixed;left:40px;top:120px;width:360px;padding:16px;background:#fff;border:2px solid #333';
      d.innerHTML = '<h2>Confirm email</h2><input id="e1" type="email" placeholder="you@example.com">'
        + '<input id="e2" type="email" placeholder="repeat email"><button id="go" type="button">Finish</button>';
      document.body.appendChild(d);
      d.addEventListener('keydown', function (ev) {
        if (ev.key !== 'Tab') return;
        var f = d.querySelectorAll('input,button');
        var i = Array.prototype.indexOf.call(f, document.activeElement);
        ev.preventDefault();
        var n = ev.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : (i >= f.length - 1 ? 0 : i + 1);
        f[n].focus();
      });
      document.getElementById('e1').focus();
    });
  </script>
</body></html>`;

test('F1: growth the 4.1.3 sweep itself causes is never late-arrival-minted as "the page changed itself"', { skip: !chromeOK, concurrency: false }, async () => {
  const browser = await launchWithRetry();
  try {
    const url = 'data:text/html;charset=utf-8,' + encodeURIComponent(HARNESS_OPENED_TRAP);
    // revealPass:false isolates the late-arrival gate from the SEPARATE bounded-reveal-trap pass, which
    // reloads the page at its own entry (and would otherwise wipe the sweep's growth before this gate ever
    // sees it, masking the bug) — the same isolation the review's own probe used to reproduce it.
    const res = await runInstrumentsForUrl(url, { browser, file: 'f1-harness-opened-trap', revealPass: false });
    assert.equal(res.lateArrival.grew, false,
      `growth is gated against the POST-HARNESS baseline, which already includes the sweep's own click — got ${JSON.stringify(res.lateArrival)}`);
    assert.equal(res.lateArrival.rePassRan, false, 'no growth relative to the new baseline ⇒ no re-pass, no mint');
    assert.ok(!res.findings.some((f) => f.kind && f.kind.startsWith('keyboard-trap') && /the page changed itself/.test(f.detail || '')),
      `no finding carries the false causal claim — got ${JSON.stringify(res.findings.filter((f) => f.detector === 'keyboard-trap'))}`);
  } finally { await browser.close(); }
});

// ===================================================================================
// F12 (soundness review round 2) — the hidden predicate renderedFocusableXpaths used (offsetParent-only)
// disagreed with the OTHER hidden check this same late-arrival machinery uses (hasHiddenTrapRegion, which
// also reads `visibility`) — and NEITHER read `opacity`. offsetParent tracks LAYOUT, not PAINT: a
// `visibility:hidden`/`opacity:0` focusable keeps a non-null offsetParent and was already counted as
// "rendered" at walk time, so its later reveal — no `display` change, just a visibility/opacity flip —
// registered as ZERO growth (its xpath was already in the walk-time baseline from the very first read).
// ===================================================================================
test('F12: renderedFocusableXpaths excludes visibility:hidden and opacity:0 focusables (display:none stays excluded too)', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html><body>
    <a href="#p" id="plain">Plain</a>
    <a href="#h" id="hidden-vis" style="visibility:hidden">Hidden by visibility</a>
    <a href="#o" id="hidden-op" style="opacity:0">Hidden by opacity</a>
    <a href="#d" id="hidden-disp" style="display:none">Hidden by display</a>
  </body></html>`;
  const browser = await launchWithRetry();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const xps = await renderedFocusableXpaths(page);
    const resolvedIds = await page.evaluate((list) => list.map((xp) => {
      const el = document.evaluate(xp, document, null, 9, null).singleNodeValue;
      return el ? el.id : null;
    }), xps);
    assert.deepEqual(resolvedIds, ['plain'], `only the plain link is rendered — got ${JSON.stringify(resolvedIds)}`);
  } finally { await browser.close(); }
});

// The DIRECT mechanism proof, independent of the full lane's internal timing (VSR/tab-order-walk speed
// varies with machine load, so racing a fixed setTimeout against "has the walk-time snapshot happened
// yet" — as the end-to-end test below does — is not a reliable way to pin the PREDICATE itself). Snapshot
// renderedFocusableXpaths while the panel is genuinely visibility:hidden (this IS the walk-time read the
// late-arrival gate takes), flip it exactly as the fixture's own timer would, and snapshot again: the
// diff the late-arrival gate computes must see growth — before F12 it never could, because the panel's
// focusables were already counted as "rendered" (non-null offsetParent) in the FIRST snapshot.
test('F12 mechanism: a visibility flip registers as growth in the SAME diff the late-arrival gate computes', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html><body>
    <a href="#p" id="plain">Plain</a>
    <div id="panel" style="visibility:hidden">
      <input id="e1" type="text"><input id="e2" type="text"><button id="go" type="button">Go</button>
    </div>
  </body></html>`;
  const browser = await launchWithRetry();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const before = await renderedFocusableXpaths(page);
    assert.equal(before.length, 1, `only the plain link is rendered while the panel is visibility:hidden — got ${JSON.stringify(before)}`);
    await page.evaluate(() => { document.getElementById('panel').style.visibility = 'visible'; });
    const after = await renderedFocusableXpaths(page);
    const beforeSet = new Set(before);
    const grew = after.some((x) => !beforeSet.has(x));
    assert.ok(grew, `the flip registers as growth (a new xpath not in the "before" set) — before=${JSON.stringify(before)} after=${JSON.stringify(after)}`);
    assert.equal(after.length, 4, 'all three panel focusables plus the plain link are now counted');
  } finally { await browser.close(); }
});

const VISIBILITY_FLIP_TRAP = `<!doctype html><html lang="en"><head><title>Visibility flip trap</title></head><body>
  <main><p><a id="more" href="#tables">see more</a></p></main>
  <div id="panel" role="dialog" aria-modal="true"
       style="visibility:hidden;position:fixed;left:40px;top:80px;width:300px;padding:16px;background:#fff;border:2px solid #333">
    <h2>Confirm</h2>
    <input id="e1" type="text"><input id="e2" type="text">
    <button id="go" type="button">Finish</button>
  </div>
  <script>
    // self-opens on a load+600ms timer via a PURE VISIBILITY FLIP — no display:none/block toggle at all,
    // and no popover API — exactly the shape offsetParent-only occlusion detection is blind to.
    window.addEventListener('load', function () {
      setTimeout(function () {
        document.getElementById('panel').style.visibility = 'visible';
        document.getElementById('e1').focus();
      }, 600);
    });
    document.getElementById('panel').addEventListener('keydown', function (ev) {
      if (ev.key !== 'Tab') return;
      var f = this.querySelectorAll('input,button');
      var i = Array.prototype.indexOf.call(f, document.activeElement);
      ev.preventDefault();
      var n = ev.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : (i >= f.length - 1 ? 0 : i + 1);
      f[n].focus();
    });
  </script>
</body></html>`;

test('F12: a VISIBILITY-FLIP self-opening trap (no display change) is caught by the late-arrival re-pass', { skip: !chromeOK, concurrency: false }, async () => {
  const browser = await launchWithRetry();
  try {
    const url = 'data:text/html;charset=utf-8,' + encodeURIComponent(VISIBILITY_FLIP_TRAP);
    const res = await runInstrumentsForUrl(url, { browser, file: 'f12-visibility-flip-trap' });
    // The F12 claim is specifically that the VISIBILITY-ONLY reveal registers as GROWTH at all (before the
    // fix its xpaths were already in the walk-time baseline, so grew stayed false forever); which detector
    // ultimately classifies the resulting trap (region-confirmed vs fixed-set-confinement) is incidental.
    const trap = res.findings.find((f) => f.sc === '2.1.2' && /^keyboard-trap/.test(f.kind || ''));
    assert.ok(trap, `a 2.1.2 finding is produced — findings: ${JSON.stringify(res.findings.map((f) => f.kind))}`);
    // On idle hardware the walk beats the 600ms flip, so the catch comes from the re-pass; under heavy
    // load the at-rest block itself can slip past the flip — same trap either way (mirrors the #24 test).
    if (res.lateArrival.rePassRan) {
      assert.ok(res.lateArrival.grew === true, `growth registered for a visibility-only reveal — got ${JSON.stringify(res.lateArrival)}`);
    }
  } finally { await browser.close(); }
});
