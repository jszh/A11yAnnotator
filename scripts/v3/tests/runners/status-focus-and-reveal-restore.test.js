'use strict';
// Two defects found while root-causing the s9→s10 4.1.3 regression, both of the same family: a fact that is
// a property of the LANE being published as a property of the PAGE.
//
//  (A) 4.1.3 `focusMoved`. The status rubric reads `focusMoved: true` as "activation was a change of context,
//      so 4.1.3 does not apply" — the one fact that takes a page out of scope entirely. It was computed as
//      `document.activeElement !== focusBefore`, which is ALSO true when the activation DESTROYED the focused
//      element and focus fell back to <body>. That is the opposite situation: no context change, focus
//      nowhere, and the new content announced by nothing. Measured on
//      eval/act-augmented/4.1.3/pages/is-it-a-status-message-scope-boundary/case-06 — pristine load ⇒
//      focusMoved:false, focus parked on the trigger ⇒ focusMoved:true, same page, same click — and the
//      instrument lane parks focus on exactly that trigger before the sweep.
//
//  (B) The reveal-state pass's restore. `page.goto(url).catch(() => {})` cannot tell a reload that worked
//      from one that timed out, so a failed restore left every detector below running on an opened dialog
//      while the artifact claimed a page at rest — and the "an opener was clicked" fact lived only in the
//      return value, which a rejection destroys.
//
// Every test below is written against the shape that would make the fix WRONG as well as the shape it is
// meant to catch: a focus move into the new content must still read as a change of context, an element that
// SURVIVES the activation must never be reported as dropped, and a page with no opener must never be reloaded.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const puppeteer = require('puppeteer');
const { detectStatusMessages } = require('../../lib/status-detector.js');
const { CHROME } = require('../../lib/run-experiments.js');
const { BROWSER_ARGS } = require('../../lib/browser-args.js');
const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — status-focus / reveal-restore e2e SKIPPED');

async function withBrowser(fn) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: BROWSER_ARGS });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 800 });
    return await fn(page, browser);
  } finally { await browser.close(); }
}

// Run the 4.1.3 sweep over `html`, with focus first parked on `parkSel` — which is how the instrument lane
// hands the page over (every detector above the sweep drives focus).
async function sweepWithFocusOn(html, parkSel) {
  return withBrowser(async (page) => {
    await page.setContent(html, { waitUntil: 'load' });
    if (parkSel) await page.evaluate((s) => { const el = document.querySelector(s); if (el) el.focus(); }, parkSel);
    const active = await page.evaluate(() => (document.activeElement ? document.activeElement.tagName + '#' + (document.activeElement.id || '') : null));
    const res = await detectStatusMessages(page, {});
    return { active, ...res };
  });
}

function tmpPage(name, html) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'v3-statusfocus-'));
  const file = path.join(dir, name);
  fs.writeFileSync(file, html, 'utf8');
  return { file, url: 'file://' + file, dir };
}

// ── (A) the focus fact ───────────────────────────────────────────────────────────────────────────────────

// The regression shape, reduced: the trigger hides its own form and a plain-<div> success line appears. A
// real user activates this with focus ON the button, so focus falls to <body> — and the criterion applies
// with full force, because nothing announced anything.
const DROP_HTML = `<!doctype html><html><body>
  <form id="f"><button type="button" id="go">Request quote</button></form>
  <div id="out" hidden></div>
  <script>
    document.getElementById('go').addEventListener('click', function () {
      document.getElementById('f').style.display = 'none';
      var d = document.createElement('div');
      d.textContent = 'Your table is booked.';
      document.getElementById('out').removeAttribute('hidden');
      document.getElementById('out').appendChild(d);
    });
  </script>
</body></html>`;

test('4.1.3 focus: an activation that DESTROYS the focused element is a focus DROP, never a change of context',
  { skip: !chromeOK, concurrency: false }, async () => {
    const res = await sweepWithFocusOn(DROP_HTML, '#go');
    assert.equal(res.active, 'BUTTON#go', 'the page is handed over with focus on the trigger, as the lane leaves it');
    assert.equal(res.observations.length, 1);
    const o = res.observations[0];
    assert.equal(o.focusMoved, false, 'focus was destroyed, not moved — this page is IN scope for 4.1.3');
    assert.equal(o.focusDropped, true, 'and the destruction is reported in its own right');
    assert.equal(o.focusMovedIntoNewContent, false);
    // …and the BARRIER channel carried the same confusion in its own form: it clears a page when focus
    // "moved into the new content", testing that with `focusEl.contains(message)` — which <body> satisfies for
    // every message on the page. So a dropped focus cleared the barrier too, on exactly this family.
    assert.equal(res.findings.length, 1, 'the silent success line is still barriered');
    assert.equal(res.findings[0].sc, '4.1.3');
  });

test('4.1.3 focus: the SAME page read from a pristine load reports the same facts (the observation is about the PAGE)',
  { skip: !chromeOK, concurrency: false }, async () => {
    const parked = await sweepWithFocusOn(DROP_HTML, '#go');
    const pristine = await sweepWithFocusOn(DROP_HTML, null);
    assert.equal(pristine.active, 'BODY#');
    // focusMoved must be STABLE across the two entry states — it was not before: parked ⇒ true, pristine ⇒ false.
    assert.equal(pristine.observations[0].focusMoved, parked.observations[0].focusMoved);
    assert.equal(pristine.observations[0].focusMoved, false);
  });

test('4.1.3 focus: a genuine move INTO the new content still reads as a change of context',
  { skip: !chromeOK, concurrency: false }, async () => {
    const html = `<!doctype html><html><body>
      <button type="button" id="go">Show</button><div id="out"></div>
      <script>document.getElementById('go').addEventListener('click', function () {
        var d = document.createElement('div'); d.tabIndex = -1; d.textContent = 'Your order was placed.';
        document.getElementById('out').appendChild(d); d.focus();
      });</script></body></html>`;
    const res = await sweepWithFocusOn(html, '#go');
    const o = res.observations[0];
    assert.equal(o.focusMoved, true, 'focus came to rest on a real element — the exclusion must still fire');
    assert.equal(o.focusMovedIntoNewContent, true, 'and it landed in the new content, which is what announces it');
    assert.equal(o.focusDropped, false);
    assert.equal(res.findings.length, 0, 'the barrier channel already excluded it — unchanged by this fix');
  });

test('4.1.3 focus: a move to an UNRELATED element is a move, but not one that announces the change',
  { skip: !chromeOK, concurrency: false }, async () => {
    const html = `<!doctype html><html><body>
      <button type="button" id="go">Apply</button><input id="other"><div id="out"></div>
      <script>document.getElementById('go').addEventListener('click', function () {
        var d = document.createElement('div'); d.textContent = 'Filter applied.';
        document.getElementById('out').appendChild(d); document.getElementById('other').focus();
      });</script></body></html>`;
    const o = (await sweepWithFocusOn(html, '#go')).observations[0];
    assert.equal(o.focusMoved, true);
    assert.equal(o.focusMovedIntoNewContent, false, 'focus went somewhere else — it announced nothing about the message');
    assert.equal(o.focusDropped, false);
  });

test('4.1.3 focus: an element that SURVIVES the activation is never reported as dropped (the adversarial half)',
  { skip: !chromeOK, concurrency: false }, async () => {
    const html = `<!doctype html><html><body>
      <button type="button" id="go">Add</button>
      <div id="live" role="status" aria-live="polite"></div>
      <script>document.getElementById('go').addEventListener('click', function () {
        document.getElementById('live').textContent = '3 items in cart';
      });</script></body></html>`;
    const o = (await sweepWithFocusOn(html, '#go')).observations[0];
    assert.equal(o.focusMoved, false, 'nothing moved focus');
    assert.equal(o.focusDropped, false, 'the trigger is still there holding focus — nothing was destroyed');
  });

// ── (B) the lane hands the sweep a known focus state ─────────────────────────────────────────────────────

test('lane: the instruments lane neutralises focus before the 4.1.3 sweep, so the observation is order-independent',
  { skip: !chromeOK, concurrency: false }, async () => {
    const { url } = tmpPage('drop.html', DROP_HTML);
    const { runInstruments } = require('../../lib/run-instruments.js');
    const laneObs = await withBrowser(async (page) => {
      await page.goto(url, { waitUntil: 'load' });
      const res = await runInstruments(page, { url });
      return res.statusObservations;
    });
    const pristine = await sweepWithFocusOn(DROP_HTML, null);
    assert.equal(laneObs.length, 1);
    // the fields the 4.1.3 rubric reasons over must be identical whether the sweep ran alone or after the
    // whole focus-driving lane. Before the blur, the lane's run reported focusMoved:true here.
    for (const k of ['focusMoved', 'focusDropped', 'focusMovedIntoNewContent']) {
      assert.equal(laneObs[0][k], pristine.observations[0][k], `${k} must not depend on which detector ran last`);
    }
    assert.equal(laneObs[0].focusMoved, false);
  });

// ── (C) the reveal pass proves its restore ───────────────────────────────────────────────────────────────

// A declared opener (aria-haspopup + aria-expanded=false) over a dialog that is hidden at rest — the shape
// the reveal-state pass exists for, so the pass really activates something here.
const REVEAL_HTML = `<!doctype html><html><body>
  <a href="#a">Home</a>
  <button type="button" id="open" aria-haspopup="dialog" aria-expanded="false" aria-controls="dlg">Open settings</button>
  <a href="#b">Help</a>
  <div id="dlg" role="dialog" aria-modal="true" style="display:none">
    <button type="button" id="c1">Save</button>
    <button type="button" id="close">Close</button>
  </div>
  <script>
    document.getElementById('open').addEventListener('click', function () {
      document.getElementById('dlg').style.display = 'block';
      this.setAttribute('aria-expanded', 'true');
    });
    document.getElementById('close').addEventListener('click', function () {
      document.getElementById('dlg').style.display = 'none';
    });
  </script>
</body></html>`;

test('reveal restore: a pass that ACTIVATED an opener leaves a page it can PROVE it restored',
  { skip: !chromeOK, concurrency: false }, async () => {
    const { url } = tmpPage('reveal.html', REVEAL_HTML);
    const { runInstruments } = require('../../lib/run-instruments.js');
    const out = await withBrowser(async (page) => {
      await page.goto(url, { waitUntil: 'load' });
      const res = await runInstruments(page, { url });
      // The page's END state is NOT the thing to assert: the 4.1.3 sweep legitimately clicks every safe
      // trigger, "Open settings" among them, so the dialog is open again by the time the lane finishes. The
      // marker attributes are the honest probe — the pass wrote them, only a document load removes them, and
      // no later detector adds or clears them.
      const markers = await page.evaluate((sel) => document.querySelectorAll(sel).length,
        require('../../lib/kbd-graph.js').REVEAL_MARKER_SEL);
      return { rp: res.tabOrder.revealPass, markers, liveness: res.collectorLiveness };
    });
    assert.ok(out.rp, 'the pass publishes its provenance');
    assert.equal(out.rp.activated, true, 'this page has a declared opener, so the pass clicked one');
    assert.equal(out.rp.restoreAttempted, true);
    assert.equal(out.rp.restored, true, 'and the restore was PROVEN, not assumed');
    assert.equal(out.markers, 0, 'a real reload wipes every marker the pass wrote — that is the proof');
    assert.deepEqual(out.liveness.filter((l) => String(l.phase).startsWith('revealFocusPass')), [],
      'a healthy pass records no liveness failure');
  });

test('reveal restore: a page with NO declared opener is never reloaded, and says so',
  { skip: !chromeOK, concurrency: false }, async () => {
    // hidden focusable content exists (so the precondition passes) but nothing DECLARES that it reveals it
    const html = `<!doctype html><html><body>
      <button type="button" id="b">Ordinary button</button>
      <div id="panel" style="display:none"><button type="button">Inside</button><a href="#x">Also inside</a></div>
    </body></html>`;
    const { url } = tmpPage('noopener.html', html);
    const { runInstruments } = require('../../lib/run-instruments.js');
    const rp = await withBrowser(async (page) => {
      await page.goto(url, { waitUntil: 'load' });
      return (await runInstruments(page, { url })).tabOrder.revealPass;
    });
    assert.equal(rp.activated, false);
    assert.equal(rp.openersFound, 0);
    assert.equal(rp.restoreAttempted, false, 'no activation ⇒ no speculative page load');
    assert.equal(rp.restored, null, '"not asked" is null, never a claimed true');
  });

test('reveal restore: a pass that THROWS after activating still restores — the fact does not ride on the return value',
  { skip: !chromeOK, concurrency: false }, async () => {
    const { url } = tmpPage('revealthrow.html', REVEAL_HTML);
    // Patch the collector on the SHARED kbd-graph module object, then load a FRESH run-instruments so its
    // top-level destructure binds the stub. The stub reproduces the exact hazard: it opens the dialog, records
    // the activation through the progress sink, and then rejects — which used to make `rev` null and skip the
    // restore entirely, leaving every detector below on an opened dialog.
    const kbdPath = require.resolve('../../lib/kbd-graph.js');
    const riPath = require.resolve('../../lib/run-instruments.js');
    const kbd = require(kbdPath);
    const realCollect = kbd.collectRevealedFocusOrder;
    kbd.collectRevealedFocusOrder = async (page, u, opts) => {
      if (opts && opts.progress) { opts.progress.ran = true; opts.progress.openersFound = 1; }
      await page.evaluate(() => {
        document.getElementById('open').setAttribute('data-v3-revopener', '1');
        document.getElementById('open').click();
      });
      if (opts && opts.progress) opts.progress.activated = true;
      throw new Error('reveal pass exploded after activating');
    };
    delete require.cache[riPath];
    let out;
    try {
      const { runInstruments } = require(riPath);
      out = await withBrowser(async (page) => {
        await page.goto(url, { waitUntil: 'load' });
        const res = await runInstruments(page, { url });
        // the stub's own `data-v3-revopener` is the discriminator: nothing but a document load clears it, so
        // its absence proves the restore ran even though the pass rejected. (The dialog itself is a red
        // herring — the 4.1.3 sweep re-opens it later by design.)
        const markers = await page.evaluate((sel) => document.querySelectorAll(sel).length, kbd.REVEAL_MARKER_SEL);
        return { rp: res.tabOrder.revealPass, markers, liveness: res.collectorLiveness };
      });
    } finally {
      kbd.collectRevealedFocusOrder = realCollect;
      delete require.cache[riPath];
    }
    assert.equal(out.rp.activated, true, 'the activation was recorded before the throw, so it survived it');
    assert.equal(out.rp.restoreAttempted, true, 'and the caller restored on that fact alone');
    assert.equal(out.rp.restored, true);
    assert.match(out.rp.error, /exploded after activating/, 'the swallowed error is published, not lost');
    assert.equal(out.markers, 0, 'the page really was reloaded — the marker the stub wrote is gone');
    const rows = out.liveness.filter((l) => l.phase === 'revealFocusPass');
    assert.equal(rows.length, 1, 'the throw is visible in the artifact, not only in a live console');
  });

test('reveal restore: a reload that did not replace the document FAILS CLOSED and retries',
  { skip: !chromeOK, concurrency: false }, async () => {
    const { restoreLoadedPage } = require('../../lib/run-instruments.js');
    // a stub page whose goto "succeeds" while the markers survive — i.e. the document was never replaced.
    let gotos = 0, spyInstalls = 0;
    const stuck = {
      goto: async () => { gotos++; },
      evaluate: async () => false,          // querySelectorAll(markerSel).length === 0  →  false
    };
    const r = await restoreLoadedPage(stuck, { url: 'file:///x.html' }, async () => { spyInstalls++; });
    assert.equal(r.ok, false, 'an unproven restore is a FAILED restore');
    assert.match(r.error, /markers survived/);
    assert.equal(gotos, 2, 'and it is retried once before giving up');
    assert.equal(spyInstalls, 0, 'the ariaNotify spy is only re-installed on a restore that actually happened');

    // …and the goto itself throwing is reported as such, not silently swallowed
    let thrown = 0;
    const dead = { goto: async () => { thrown++; throw new Error('Navigation timeout of 30000 ms exceeded'); }, evaluate: async () => true };
    const r2 = await restoreLoadedPage(dead, { url: 'file:///x.html' }, async () => {});
    assert.equal(r2.ok, false);
    assert.match(r2.error, /Navigation timeout/);
    assert.equal(thrown, 2);

    // the healthy path still returns ok and re-installs the spy
    let ok = 0;
    const good = { goto: async () => {}, evaluate: async () => true };
    const r3 = await restoreLoadedPage(good, { url: 'file:///x.html' }, async () => { ok++; });
    assert.deepEqual(r3, { ok: true, error: null });
    assert.equal(ok, 1);
  });
