// Residual RCA S10 — the 4.1.3 MULTI-STEP OBSERVATION TIMELINE (phase B), the Task-3 colour deltas,
// and the DOCUMENT-START live-region birth observer, each against an invented inline fixture (nothing
// corpus-derived). Gated on a local Chrome like the other instrument suites.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');
const { detectStatusMessages } = require('../../lib/status-detector.js');
const { installLiveRegionBirthObserver, readLiveRegionBirths, birthFindingsFrom, markLiveBirthHarnessActive, runInstrumentsForUrl } = require('../../lib/run-instruments.js');
const { CHROME } = require('../../lib/run-experiments.js');

const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — v3 status-timeline suite SKIPPED');

async function launchWithRetry() {
  let lastErr;
  for (let i = 0; i < 3; i++) {
    try { return await puppeteer.launch({ executablePath: CHROME, headless: 'new', timeout: 60000, args: ['--no-sandbox', '--disable-dev-shm-usage'] }); }
    catch (e) { lastErr = e; if (!/WS endpoint|Timed out/i.test(String(e && e.message))) throw e; }
  }
  throw lastErr;
}

async function withHtml(html, fn, { init } = {}) {
  const browser = await launchWithRetry();
  try {
    const page = await browser.newPage();
    if (init) {
      await init(page);                               // e.g. the document-start birth observer
      // evaluateOnNewDocument only fires on a REAL navigation; setContent swaps the document
      // in place and skips document-start scripts (the production lane installs then goto()s —
      // page-lease.js runInstrumentsForUrl — so the test must navigate the same way).
      await page.goto('data:text/html;charset=utf-8,' + encodeURIComponent(html), { waitUntil: 'load' });
    } else {
      await page.setContent(html, { waitUntil: 'load' });
    }
    return await fn(page);
  } finally { await browser.close(); }
}

const kinds = (tl) => tl.timeline.map((e) => e.kind);

// ===================================================================================
// TASK 1 — the timeline extends past the legacy window WITHOUT changing the legacy fields.
// Shape: a progress pill (role=status) fills, empties, then a PLAIN div fills at 3.1 s —
// beyond the 2.5 s legacy cap, so only the timeline can see the outcome transition.
// ===================================================================================
test('timeline: progress-pill empties, then a plain div conveys the outcome AFTER the legacy window', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html><body>
    <button id="go">Store my edits</button>
    <div id="pill" role="status"></div>
    <div id="done"></div>
    <script>
      document.getElementById('go').addEventListener('click', () => {
        const pill = document.getElementById('pill');
        pill.textContent = 'Working on it, hold tight';
        setTimeout(() => { pill.textContent = ''; }, 900);
        setTimeout(() => { document.getElementById('done').textContent = 'Every edit is now on the server'; }, 3100);
      });
    </script>
  </body></html>`;
  const r = await withHtml(html, (p) => detectStatusMessages(p, {}));
  // the sidecar exists and is ORDERED: added-in-region → region-emptied → added-outside-region
  assert.equal(r.timelines.length, 1, `one active trigger ⇒ one timeline — got ${JSON.stringify(r.timelines)}`);
  const tl = r.timelines[0];
  const iAdd = kinds(tl).indexOf('content-added');
  const iEmpty = kinds(tl).indexOf('live-region-emptied');
  const late = tl.timeline.find((e) => e.kind === 'content-added' && /on the server/i.test(e.text || ''));
  assert.ok(iAdd !== -1 && iEmpty !== -1 && late, `all three phases recorded — got ${JSON.stringify(tl.timeline)}`);
  assert.ok(iAdd < iEmpty, 'the fill precedes the empty');
  assert.ok(late.atMs > 2500, `the outcome transition lies BEYOND the legacy window (atMs=${late.atMs})`);
  assert.equal(late.inLiveRegion, false, 'the outcome landed in NO live region — the case-cracking fact');
  // …and the LEGACY observation is byte-identical to the pre-timeline world: the late text is NOT in it.
  assert.equal(r.observations.length, 1);
  const o = r.observations[0];
  assert.ok(!o.addedOutsideLiveRegion.some((t) => /on the server/i.test(t)),
    `legacy fields must stop at the legacy window — got ${JSON.stringify(o.addedOutsideLiveRegion)}`);
  assert.ok(!('timeline' in o) && !('colourStateDeltas' in o), 'observation objects stay sidecar-free (prompt byte-identity)');
});

// ===================================================================================
// TASK 1 — an outcome conveyed ONLY by disabled=false flipping (attribute/state change).
// ===================================================================================
test('timeline: a disabled=false flip on another control is recorded as a state-change', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html><body>
    <button id="check">See if seats remain</button>
    <button id="buy" disabled>Take the seats</button>
    <div id="st" role="status"></div>
    <script>
      document.getElementById('check').addEventListener('click', () => {
        const st = document.getElementById('st');
        st.textContent = 'Counting the empty seats';
        setTimeout(() => { st.textContent = ''; document.getElementById('buy').disabled = false; }, 1200);
      });
    </script>
  </body></html>`;
  const r = await withHtml(html, (p) => detectStatusMessages(p, {}));
  const tl = r.timelines.find((t) => t.timeline.some((e) => e.kind === 'state-change'));
  assert.ok(tl, `a timeline with the state-change exists — got ${JSON.stringify(r.timelines)}`);
  const flip = tl.timeline.find((e) => e.kind === 'state-change' && e.attribute === 'disabled');
  assert.ok(flip, `the disabled flip is recorded — got ${JSON.stringify(tl.timeline)}`);
  assert.equal(flip.to, null, 'disabled was REMOVED (control re-enabled)');
  assert.match(flip.xpath, /button\[2\]/, 'on the re-enabled control, not the trigger');
  assert.ok(tl.timeline.some((e) => e.kind === 'live-region-emptied'), 'the empty is in the same ordered record');
});

// ===================================================================================
// TASK 1 — value-property emptying and class-driven visibility flips are both recorded.
// ===================================================================================
test('timeline: value-emptied (property write) and a class-driven visibility flip are recorded', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html><body>
    <style>.tucked{display:none}</style>
    <button id="wipe">Begin again</button>
    <input id="fld" value="half a postcode">
    <div id="panel">Directions for the second step</div>
    <script>
      document.getElementById('wipe').addEventListener('click', () => {
        setTimeout(() => {
          document.getElementById('fld').value = '';
          document.getElementById('panel').classList.add('tucked');
        }, 400);
      });
    </script>
  </body></html>`;
  const r = await withHtml(html, (p) => detectStatusMessages(p, {}));
  const tl = r.timelines[0];
  assert.ok(tl, `state-only activity still yields a timeline — got ${JSON.stringify(r.timelines)}`);
  assert.ok(tl.timeline.some((e) => e.kind === 'value-emptied' && /input\[1\]/.test(e.xpath)), `value emptied — ${JSON.stringify(tl.timeline)}`);
  const flip = tl.timeline.find((e) => e.kind === 'visibility-flip');
  assert.ok(flip && flip.nowVisible === false, `the panel hide is a visibility flip — ${JSON.stringify(tl.timeline)}`);
  // legacy channel: no text was added/removed, so the legacy observation must remain ABSENT (byte-identity)
  assert.equal(r.observations.length, 0, 'state-only activity adds no legacy observation row');
  assert.equal(r.findings.length, 0, 'and certainly no barrier');
});

// ===================================================================================
// TASK 3 — post-activation COLOUR DELTA on a row (the row-turns-a-colour-after-save shape).
// ===================================================================================
test('colour delta: a row whose background flips on activation is a colourStateDeltas fact', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html><body>
    <style>.tinted{background:#2e7d32;color:#fff}</style>
    <table><tbody>
      <tr id="r1"><td>First entry</td><td><button id="keep1">Keep this entry</button></td></tr>
      <tr><td>Second entry</td><td><button>Keep that entry</button></td></tr>
    </tbody></table>
    <script>
      document.getElementById('keep1').addEventListener('click', () => {
        document.getElementById('r1').classList.add('tinted');
      });
    </script>
  </body></html>`;
  const r = await withHtml(html, (p) => detectStatusMessages(p, {}));
  const tl = r.timelines.find((t) => Array.isArray(t.colourStateDeltas) && t.colourStateDeltas.length);
  assert.ok(tl, `a colour delta was recorded — got ${JSON.stringify(r.timelines)}`);
  const d = tl.colourStateDeltas.find((x) => /tr\[1\]/.test(x.xpath));
  assert.ok(d, `the delta is on the row — got ${JSON.stringify(tl.colourStateDeltas)}`);
  assert.notEqual(d.backgroundBefore, d.backgroundAfter, 'before/after computed backgrounds differ');
  assert.match(d.backgroundAfter, /46, 125, 50/, 'the after-colour is the applied tint');
  assert.equal(d.textAlsoChangedNearby, false, 'colour-only: no text changed with it — the 1.4.1 signature');
});

// ===================================================================================
// TASK 2 — document-start birth observer: born-filled mount (self-removing) vs healthy shapes.
// Timings are compressed (invented fixture): mount at 400 ms, self-remove 500 ms later.
// ===================================================================================
test('birth observer: a live region mounted after load with content pre-filled (then self-removing) is recorded and flagged', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html><body>
    <div id="static-region" role="status"></div>
    <script>
      setTimeout(() => {
        const w = document.createElement('div');
        w.innerHTML = '<p role="status">The number you watch just moved a lot</p>';
        document.body.appendChild(w);
        setTimeout(() => w.remove(), 500);
        // …and the healthy counterpart: the STATIC region receives its first content
        document.getElementById('static-region').textContent = 'Quiet routine update';
      }, 400);
    </script>
  </body></html>`;
  const births = await withHtml(html, async (p) => {
    await new Promise((r) => setTimeout(r, 1300)); // past mount + self-removal
    return readLiveRegionBirths(p, { birthWatchMs: 0 });
  }, { init: (p) => installLiveRegionBirthObserver(p) });
  assert.ok(births && births.installed, 'the recorder was installed and readable');
  const born = births.regions.find((r) => r.mountedAfterLoad === true && r.emptyAtBirth === false);
  assert.ok(born, `the born-filled mount is recorded — got ${JSON.stringify(births.regions)}`);
  assert.ok(Number.isFinite(born.removedAtMs) && born.removedAtMs > born.atMs, 'the self-removal is stamped');
  const healthy = births.regions.find((r) => /static-region|div\[1\]/.test(r.xpath) || r.emptyAtBirth === true);
  assert.ok(healthy && healthy.emptyAtBirth === true && Number.isFinite(healthy.firstContentAtMs),
    `the static region reads existed-empty-then-filled — got ${JSON.stringify(births.regions)}`);
  // the pure finding mapper flags exactly the mount, never the healthy region
  const rows = birthFindingsFrom(births);
  assert.equal(rows.length, 1, `one review row — got ${JSON.stringify(rows)}`);
  assert.equal(rows[0].review, true);
  assert.equal(rows[0].xpath, born.xpath);
});

test('birth observer: not installed ⇒ readLiveRegionBirths reports null, never "no births"', { skip: !chromeOK, concurrency: false }, async () => {
  const births = await withHtml('<!doctype html><html><body><div role="status"></div></body></html>',
    (p) => readLiveRegionBirths(p, { birthWatchMs: 0 }));
  assert.equal(births, null);
});

// ===================================================================================
// STARVATION GUARD (soundness probe 2026-08-17) — several ACTIVE conformant triggers must never spend
// the sweep budget the LAST trigger's legacy window needs. Shape: three buttons that each update a
// pre-existing polite region (conformant, all ACTIVE so each would love a phase-B horizon), then a
// fourth whose new text lands in NO live region — the classic 4.1.3 barrier. Before the phase-B pool +
// per-remaining-trigger reserve, the default config probed 3/4 and MISSED the barrier.
// ===================================================================================
test('phase-B budget: every trigger keeps its legacy window — the late barrier is still probed AND a timeline is still recorded', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html><body>
    <div aria-live="polite" id="tally"></div>
    <button id="q1">Queue the mug batch</button>
    <button id="q2">Queue the bowl batch</button>
    <button id="q3">Queue the plate batch</button>
    <button id="q4">Ask about kiln space</button>
    <div id="floor"></div>
    <script>
      let k = 0;
      for (const id of ['q1','q2','q3']) {
        document.getElementById(id).addEventListener('click', () => {
          document.getElementById('tally').textContent = 'Batch ' + (++k) + ' waiting for the kiln';
        });
      }
      document.getElementById('q4').addEventListener('click', () => {
        document.getElementById('floor').textContent = 'No kiln space until Thursday!';
      });
    </script>
  </body></html>`;
  const r = await withHtml(html, (p) => detectStatusMessages(p, {})); // DEFAULT config — the probed shape
  assert.equal(r.triggersProbed, r.triggersTotal, `all triggers probed — got ${r.triggersProbed}/${r.triggersTotal}`);
  assert.equal(r.triggersTotal, 4);
  assert.equal(r.budgetExhausted, false, 'the sweep finished inside its budget');
  const barrier = r.findings.find((f) => f.kind === 'status-not-announced' && /button\[4\]/.test(f.trigger));
  assert.ok(barrier, `the fourth trigger's barrier was found — got ${JSON.stringify(r.findings)}`);
  assert.ok(r.timelines.length >= 1, 'the timeline keeps its value where budget allows — at least one recorded');
});

// ===================================================================================
// HARNESS ATTRIBUTION (soundness probe 2026-08-17) — two polarities on one page. A region the PAGE
// mounts on its own timer (before any interaction) is flagged; a region mounted by a click AFTER the
// harness-interaction boundary is tagged in the artifact and produces NO row. Also pins (c): the
// bounded top-up must not hold the page open for a harness-caused birth.
// ===================================================================================
test('birth observer: pre-interaction mount still flagged; a harness-click mount is tagged and NOT flagged', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html><body>
    <button id="pin">Pin this recipe</button>
    <script>
      setTimeout(() => {
        const s = document.createElement('div');
        s.setAttribute('role', 'status');
        s.textContent = 'Prices refreshed a moment ago';
        document.body.appendChild(s);
      }, 300);
      document.getElementById('pin').addEventListener('click', () => {
        const d = document.createElement('div');
        d.setAttribute('role', 'status');
        d.textContent = 'Recipe pinned to your board';
        document.body.appendChild(d);
      });
    </script>
  </body></html>`;
  const births = await withHtml(html, async (p) => {
    await new Promise((r) => setTimeout(r, 700));            // past the page's own spontaneous mount
    await markLiveBirthHarnessActive(p);                      // the lane's boundary, as runInstruments stamps it
    await markLiveBirthHarnessActive(p);                      // earliest wins — a second stamp must not move it
    await p.evaluate(() => document.getElementById('pin').click());
    await new Promise((r) => setTimeout(r, 400));
    return readLiveRegionBirths(p, { birthWatchMs: 0 });      // instant snapshot — production's deferred shape
  }, { init: (p) => installLiveRegionBirthObserver(p) });
  assert.ok(births && births.installed);
  assert.ok(Number.isFinite(births.harnessActiveAtMs), 'the boundary mark rides on the artifact');
  const spont = births.regions.find((r) => /refreshed a moment ago/i.test(r.textAtBirth || ''));
  const clicked = births.regions.find((r) => /pinned to your board/i.test(r.textAtBirth || ''));
  assert.ok(spont && spont.harnessInteraction !== true, `the page's own mount is untagged — ${JSON.stringify(births.regions)}`);
  assert.ok(clicked && clicked.harnessInteraction === true, `the click-caused mount is tagged — ${JSON.stringify(births.regions)}`);
  assert.ok(spont.atMs < births.harnessActiveAtMs && clicked.atMs >= births.harnessActiveAtMs, 'the tag follows the boundary in time');
  const rows = birthFindingsFrom(births);
  assert.equal(rows.length, 1, `exactly the spontaneous mount is flagged — got ${JSON.stringify(rows)}`);
  assert.equal(rows[0].xpath, spont.xpath);
});

test('birth observer: the bounded top-up does NOT hold the page open for a harness-caused birth', { skip: !chromeOK, concurrency: false }, async () => {
  // the ONLY post-load mount is the one the click causes — with the harnessInteraction gate the read
  // returns immediately; without it, the top-up would have slept ~7 s watching the harness's own toast.
  const html = `<!doctype html><html><body>
    <button id="keep">Keep my draft</button>
    <script>
      document.getElementById('keep').addEventListener('click', () => {
        const d = document.createElement('div');
        d.setAttribute('role', 'status');
        d.textContent = 'Draft kept on this device';
        document.body.appendChild(d);
      });
    </script>
  </body></html>`;
  const out = await withHtml(html, async (p) => {
    await new Promise((r) => setTimeout(r, 300));
    await markLiveBirthHarnessActive(p);
    await p.evaluate(() => document.getElementById('keep').click());
    await new Promise((r) => setTimeout(r, 300));
    const t0 = Date.now();
    const births = await readLiveRegionBirths(p, { birthWatchMs: 8500 });
    return { births, readMs: Date.now() - t0 };
  }, { init: (p) => installLiveRegionBirthObserver(p) });
  assert.ok(out.births && out.births.regions.length === 1);
  assert.equal(out.births.regions[0].harnessInteraction, true);
  assert.deepEqual(birthFindingsFrom(out.births), [], 'no review row for the harness toast');
  assert.ok(out.readMs < 3000, `instant read despite the fresh mountedAfterLoad birth — took ${out.readMs}ms`);
});

// ===================================================================================
// F7 (soundness review 2026-08-17) — END-TO-END through the REAL 4.1.3 sweep, not a hand-simulated click.
// The tests above prove the primitive (arm/stamp); this proves the wiring: run the full lane
// (runInstrumentsForUrl), and a toast the SWEEP itself clicks into existence must still come out tagged —
// the lazy stamp must not have broken the very case the boundary exists for.
// ===================================================================================
test('F7 end-to-end: a toast the 4.1.3 sweep itself clicks into existence is tagged harness-caused', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html lang="en"><head><title>Notes</title></head><body>
    <h1>Your notes</h1>
    <button id="save" type="button">Save note</button>
    <script>
      document.getElementById('save').addEventListener('click', function () {
        var d = document.createElement('div');
        d.setAttribute('role', 'status');
        d.textContent = 'Note saved';
        document.body.appendChild(d);
      });
    </script>
  </body></html>`;
  const url = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
  const res = await runInstrumentsForUrl(url, { file: 'f7-sweep-click' });
  const born = (res.liveRegionBirths && res.liveRegionBirths.regions || []).find((r) => /Note saved/i.test(r.textAtBirth || ''));
  assert.ok(born, `the sweep-caused mount is recorded — got ${JSON.stringify(res.liveRegionBirths)}`);
  assert.equal(born.harnessInteraction, true, 'the sweep\'s own click tags the birth it causes');
  assert.ok(!res.findings.some((f) => f.detector === 'live-region-birth' && f.xpath === born.xpath),
    'a harness-caused birth never earns a live-region-birth review row');
});
