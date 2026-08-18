'use strict';
// Batch-3 fixes to kbd-graph.js, two polarities each. Fixtures are INVENTED inline HTML — nothing
// corpus-derived.
//
//  #26b ZERO-FOCUSABLE EARLY EXIT: collectTabOrder used to burn the full 2000-press safety cap on a
//       page with no focusables (measured 67.6 s/page across both directions); N consecutive boundary
//       sentinels before ANY stop now end the walk with the byte-identical empty result.
//  #25  PER-STOP OCCLUSION + PAGE-SET INITIAL FOCUS: probeActive records `occludedBy` (topmost element
//       at the stop's centre when outside the stop's subtree) and collectTabOrder surfaces the seeded
//       page-set initial-focus stop (per-stop `initialFocus:true` + top-level `initialFocus` record) —
//       the undeclared-scrim shape clause C could never see.
//  #10  RANK-3 OPENER ADMISSION + `containmentLeak`: collectRevealedFocusOrder admits "any other safe
//       button" openers ONLY when a hidden dialog-shaped region with >=2 focusables exists, and keeps
//       the opened-ring modal-containment facts as an aggregate on each state.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const puppeteer = require('puppeteer');
const { collectTabOrder, collectRevealedFocusOrder } = require('../../lib/kbd-graph.js');
const { CHROME } = require('../../lib/run-experiments.js');

const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — batch3-kbd-facts suite SKIPPED');

async function launch() {
  let lastErr;
  for (let i = 0; i < 3; i++) {
    try { return await puppeteer.launch({ executablePath: CHROME, headless: 'new', timeout: 60000, args: ['--no-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files'] }); }
    catch (e) { lastErr = e; if (!/WS endpoint|Timed out/i.test(String(e && e.message))) throw e; }
  }
  throw lastErr;
}

function tmpPage(name, html) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'v3-b3kbd-'));
  const file = path.join(dir, name);
  fs.writeFileSync(file, html, 'utf8');
  return { file, url: 'file://' + file, dir };
}

async function withPage(html, fn) {
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    if (/^file:/.test(html)) await page.goto(html, { waitUntil: 'load' });
    else await page.setContent(html, { waitUntil: 'load' });
    return await fn(page);
  } finally { await browser.close(); }
}

// ─── #26b ──────────────────────────────────────────────────────────────────────────────────────────
test('#26b: a zero-focusable page ends the walk in well under the old 33 s per direction', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html><body><h1>Colour legend</h1><p>Nothing here takes focus.</p>
    <div>plain <span>text</span> only</div></body></html>`;
  const { fwd, bwd, ms } = await withPage(html, async (page) => {
    const t0 = Date.now();
    const f = await collectTabOrder(page);
    const b = await collectTabOrder(page, { backward: true });
    return { fwd: f, bwd: b, ms: Date.now() - t0 };
  });
  assert.ok(ms < 5000, `both directions completed in ${ms}ms (old behavior: ~67 s)`);
  // byte-identical to what the full-cap walk produced for this page
  for (const t of [fwd, bwd]) {
    assert.deepEqual(t.order, []);
    assert.equal(t.wrapped, false);
    assert.equal(t.exhausted, false, 'an empty ring is NOT an exhausted recording');
    assert.equal(t.count, 0);
    assert.equal(t.boundaryAt, -1);
    assert.equal(t.initialFocus, null);
  }
});

test('#26b: a focusable page still walks its full ring and wraps — the early exit never fires after a stop', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html><body>
    <a href="#a" id="a1">Alpha</a> <a href="#b" id="a2">Beta</a> <button id="b1">Gamma</button>
  </body></html>`;
  const tab = await withPage(html, (page) => collectTabOrder(page));
  assert.equal(tab.count, 3, 'all three stops recorded');
  assert.equal(tab.wrapped, true, 'the ring wrapped normally');
});

// ─── #25 ───────────────────────────────────────────────────────────────────────────────────────────
// An UNDECLARED overlay: a plain fixed scrim (no dialog[open], no aria-modal) painted over the page,
// with the page-set initial focus forced INTO it. The underlying header stops stay tabbable.
const SCRIM_PAGE = `<!doctype html><html><body style="margin:0">
  <header><a href="#archive" id="top-link">Archive</a> <button id="top-btn">Search</button></header>
  <main><p>Article text under the overlay.</p></main>
  <div id="scrim" style="position:fixed;inset:0;background:rgba(20,24,30,.6)">
    <section style="background:#fff;width:300px;margin:120px auto;padding:20px">
      <input id="news" type="email" placeholder="name@mail.test">
      <button id="sub">Join list</button>
    </section>
  </div>
  <script>document.getElementById('news').focus();</script>
</body></html>`;

test('#25: under-scrim stops carry occludedBy and the page-set initial focus is surfaced', { skip: !chromeOK, concurrency: false }, async () => {
  const tab = await withPage(SCRIM_PAGE, async (page) => {
    await new Promise((r) => setTimeout(r, 150));   // let the page-set focus land before the walk seeds it
    return collectTabOrder(page);
  });
  const byId = {};
  for (const s of tab.order) byId[s.xpath] = s;
  const topLink = tab.order.find((s) => /header\[1\]\/a\[1\]$/.test(s.xpath));
  const topBtn = tab.order.find((s) => /header\[1\]\/button\[1\]$/.test(s.xpath));
  const news = tab.order.find((s) => /input\[1\]$/.test(s.xpath));
  assert.ok(topLink && topBtn && news, 'all stops recorded (the scrim does not remove them from the ring)');
  assert.equal(topLink.occludedBy, '/html/body/div[1]', 'the header link hit-tests to the scrim');
  assert.equal(topBtn.occludedBy, '/html/body/div[1]', 'the header button hit-tests to the scrim');
  assert.ok(!('occludedBy' in news), 'stops inside the overlay carry no occlusion fact');
  assert.equal(news.initialFocus, true, 'the seeded stop is flagged as the page-set initial focus');
  assert.ok(tab.initialFocus && tab.initialFocus.xpath === news.xpath, 'the initial-focus record is surfaced at the top level');
  assert.ok(!('occludedBy' in tab.initialFocus), 'the overlay input itself is not occluded');
});

test('#25: a plain page yields NO occlusion facts and a null initialFocus — no fact flood', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html><body>
    <a href="#a">Alpha</a> <button>Beta</button> <input aria-label="Gamma">
  </body></html>`;
  const tab = await withPage(html, (page) => collectTabOrder(page));
  assert.equal(tab.count, 3);
  assert.ok(tab.order.every((s) => !('occludedBy' in s)), 'no stop carries occludedBy');
  assert.ok(tab.order.every((s) => s.initialFocus !== true), 'no stop is claimed as page-set initial focus');
  assert.equal(tab.initialFocus, null);
});

// ─── F10 (soundness review round 2) ───────────────────────────────────────────────────────────────────
// occludedBy alone cannot tell a modal SCRIM from a routine STICKY HEADER — both hit-test identically.
// The fix records the occluder's computed position, rect, and viewport-coverage fraction ALONGSIDE the
// xpath (occlusionSpread) so the focus-modal-containment-v0 rubric's scrim test (fixed/absolute + large
// viewport share, or background inert) can tell them apart. These two fixtures pin the DETERMINISTIC
// facts on each side: the full-bleed scrim from #25 above passes the scrim test; a sticky/fixed header
// that merely covers a stop scrolled underneath it — the routine, non-modal shape — does not.
test('F10: the #25 SCRIM fixture records a SCRIM-SHAPED occluder — fixed position, large viewport coverage', { skip: !chromeOK, concurrency: false }, async () => {
  const tab = await withPage(SCRIM_PAGE, async (page) => {
    await new Promise((r) => setTimeout(r, 150));
    return collectTabOrder(page);
  });
  const topLink = tab.order.find((s) => /header\[1\]\/a\[1\]$/.test(s.xpath));
  assert.ok(topLink && topLink.occludedBy, 'the header link is occluded');
  assert.equal(topLink.occluderPosition, 'fixed', 'the scrim is position:fixed');
  assert.ok(Number.isFinite(topLink.occluderViewportCoverage) && topLink.occluderViewportCoverage >= 0.5,
    `the scrim visually dominates the viewport — got ${topLink.occluderViewportCoverage}`);
  assert.ok(topLink.occluderRect && topLink.occluderRect.w > 0 && topLink.occluderRect.h > 0, 'the occluder rect rides too');
});

// A permanent NEGATIVE fixture: a `position:fixed` site header (48px tall, full width) sitting directly
// over the first tab stop — no `padding-top` compensates for it, so the stop is occluded at REST, no
// scroll needed. This is the sticky-header shape the review measured firing routinely: `occludedBy` fires
// (the header IS the topmost element at the stop's centre) but the header is a thin band, not a scrim.
const STICKY_HEADER_PAGE = `<!doctype html><html><body style="margin:0">
  <header id="hdr" style="position:fixed;top:0;left:0;right:0;height:48px;background:#222"></header>
  <main>
    <a href="#hidden" id="under1" style="display:block;padding:12px 0 0 0">Link sitting under the fixed header</a>
    <p style="margin-top:60px">Ordinary page content — nothing modal here, just an unpadded fixed header.</p>
  </main>
</body></html>`;

test('F10: a STICKY/FIXED HEADER occludes a stop but is NOT scrim-shaped — small viewport coverage', { skip: !chromeOK, concurrency: false }, async () => {
  const tab = await withPage(STICKY_HEADER_PAGE, (page) => collectTabOrder(page));
  const under1 = tab.order.find((s) => /a\[1\]$/.test(s.xpath));
  assert.ok(under1, `the link is a recorded stop — got ${JSON.stringify(tab.order)}`);
  assert.ok(under1.occludedBy, 'the fixed header occludes it — occludedBy fires exactly as a real scrim would');
  assert.match(under1.occludedBy, /header\[1\]$/, 'the occluder is the header element');
  assert.equal(under1.occluderPosition, 'fixed', 'the header IS fixed-positioned (passes leg (a) of the scrim test alone)');
  assert.ok(Number.isFinite(under1.occluderViewportCoverage) && under1.occluderViewportCoverage < 0.3,
    `a 48px header covers a small SLICE of the viewport, not a scrim's majority — got ${under1.occluderViewportCoverage}`);
});

// ─── #10 ───────────────────────────────────────────────────────────────────────────────────────────
// Rank-3-only openers ("Archive note" matches no verb list, declares nothing) + a hidden aria-modal
// confirm dialog with two focusables. Without the structural gate this page yielded openersFound: 0.
const RANK3_DIALOG = `<!doctype html><html><body style="margin:0">
  <header><a href="#l" id="hl">Ledger</a></header>
  <ul>
    <li>Note 12 <button class="act" id="arch1">Archive note</button></li>
    <li>Note 13 <button class="act" id="arch2">Archive note</button></li>
  </ul>
  <div id="scrim" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5)">
    <div id="confirm" role="alertdialog" aria-modal="true" style="background:#fff;width:280px;margin:100px auto;padding:16px">
      <p>Archive this note?</p>
      <button id="keep">Not now</button> <button id="go">Archive</button>
    </div>
  </div>
  <script>
    for (const b of document.querySelectorAll('.act')) b.addEventListener('click', () => {
      document.getElementById('scrim').style.display = 'block';
      document.getElementById('keep').focus();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { document.getElementById('scrim').style.display = 'none'; }
    });
  </script>
</body></html>`;

test('#10: rank-3 openers are admitted when a hidden dialog-shaped region exists; containmentLeak is surfaced', { skip: !chromeOK, concurrency: false }, async () => {
  const { url, file, dir } = tmpPage('rank3-dialog.html', RANK3_DIALOG);
  try {
    const progress = {};
    const rev = await withPage(url, (page) => collectRevealedFocusOrder(page, url, { pageIsFresh: true, progress }));
    assert.ok(progress.openersFound >= 1, 'the rank-3 opener is admitted under the hidden-dialog gate');
    assert.ok(rev.states.length >= 1, 'the opened state was recorded');
    const st = rev.states.find((s) => s.containmentLeak) || rev.states[0];
    assert.ok(st.containmentLeak, 'the opened-ring containment aggregate is kept and surfaced');
    assert.ok(st.containmentLeak.leakedStops >= 1, 'stops outside the open aria-modal dialog are counted as leaks');
    assert.ok(st.containmentLeak.leakedSample.some((s) => /a\[1\]$/.test(s.xpath)), 'the leaked header link is sampled');
    assert.equal(typeof st.containmentLeak.openedStops, 'number');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('#10: WITHOUT a hidden dialog-shaped region, rank-3 openers stay excluded (the gate holds)', { skip: !chromeOK, concurrency: false }, async () => {
  // same buttons, but the hidden region is a plain div reveal — not dialog-shaped
  const html = RANK3_DIALOG.replace(' role="alertdialog" aria-modal="true"', '');
  const { url, dir } = tmpPage('rank3-plain.html', html);
  try {
    const progress = {};
    const rev = await withPage(url, (page) => collectRevealedFocusOrder(page, url, { pageIsFresh: true, progress }));
    assert.equal(progress.openersFound, 0, 'no declared-intent opener and no dialog-shaped region ⇒ nothing is clicked');
    assert.deepEqual(rev.states, []);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('#10: a contained modal (inert background) reports leakedStops 0 — evidence of containment, not a finding', { skip: !chromeOK, concurrency: false }, async () => {
  // native <dialog> + showModal(): everything outside the top layer is inert, so the opened ring is
  // only the dialog's own stops — modalOpen with zero leaks.
  const html = `<!doctype html><html><body style="margin:0">
    <header><a href="#l">Ledger</a></header>
    <button id="open1">Archive note</button>
    <dialog id="dlg"><p>Archive?</p><button id="keep">Cancel</button> <button id="go">Archive</button></dialog>
    <script>document.getElementById('open1').addEventListener('click', () => document.getElementById('dlg').showModal());</script>
  </body></html>`;
  const { url, dir } = tmpPage('rank3-native.html', html);
  try {
    const progress = {};
    const rev = await withPage(url, (page) => collectRevealedFocusOrder(page, url, { pageIsFresh: true, progress }));
    assert.ok(progress.openersFound >= 1, 'the closed <dialog> with two focusables admits the rank-3 opener');
    const st = rev.states.find((s) => s.containmentLeak);
    assert.ok(st, 'the aggregate exists whenever a modal was rendered open during the walk');
    assert.equal(st.containmentLeak.leakedStops, 0, 'a properly contained modal leaks nothing');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

// ─── #11-assist: adaptive confinement-sweep settle ─────────────────────────────────────────────────
// detectFixedSetConfinementTraps' sweep used to pay a flat REFOCUS_SETTLE_MS (180 ms) x 3 CDP
// round-trips per press (~20 s idle on a region-loop page; past the 90 s lane cap under corpus
// concurrency). The settle window is now adaptive behind an event-driven focusin-log guard: short
// only while the page has demonstrably shown zero async focus behavior, with a one-time full-window
// sweep RESTART the moment any async signal appears (settled != immediate, or a between-press focus
// event none of the adjacent reads saw). Polarities: a sync loop gets identical verdicts at a
// fraction of the wall-time; an async-bounce page trips the guard and gets the byte-identical
// full-window sweep.
const { detectFixedSetConfinementTraps, cfPressSettleRead, installCfFocusinLog, tagFocusables } = require('../../lib/kbd-graph.js');

const SYNC_LOOP = `<!doctype html><html><body>
  <a href="#top" id="l1">Overview</a> <a href="#mid" id="l2">Pricing</a>
  <div id="loop">
    <button id="b1">One</button><button id="b2">Two</button><button id="b3">Three</button><button id="b4">Four</button>
  </div>
  <a href="#end" id="l3">Contact</a>
  <script>
    const ms = ['b1','b2','b3','b4'].map((i) => document.getElementById(i));
    document.getElementById('loop').addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      e.preventDefault();
      const i = ms.indexOf(document.activeElement);
      ms[(i + (e.shiftKey ? ms.length - 1 : 1)) % ms.length].focus();   // SYNC confinement
    });
  </script>
</body></html>`;

// async bounce-back sitting PAST the calibration presses: Tab away from #guard lands on the next
// link, then a 90 ms timer pulls focus back — the bounce lands BETWEEN presses under a short window,
// which only the focusin log can see.
const ASYNC_BOUNCE = `<!doctype html><html><body>
  <a href="#1" id="a1">One</a> <a href="#2" id="a2">Two</a> <a href="#3" id="a3">Three</a>
  <a href="#4" id="a4">Four</a> <a href="#5" id="a5">Five</a>
  <button id="guard">Guard</button>
  <a href="#6" id="a6">Six</a> <a href="#7" id="a7">Seven</a>
  <script>
    document.getElementById('guard').addEventListener('focusout', () => {
      setTimeout(() => document.getElementById('guard').focus(), 90);
    });
  </script>
</body></html>`;

async function confineBoth(html) {
  // fresh PAGE per arm — the detector drives keys/focus hard, and a reused page (even after
  // setContent) is not a clean control arm.
  const browser = await launch();
  const run = async (opts) => {
    const page = await browser.newPage();
    try {
      await page.setViewport({ width: 1280, height: 900 });
      await page.setContent(html, { waitUntil: 'load' });
      const t0 = Date.now();
      const res = await detectFixedSetConfinementTraps(page, opts);
      return { res, ms: Date.now() - t0 };
    } finally { await page.close(); }
  };
  try {
    const a = await run({});
    const f = await run({ adaptiveSettle: false });
    return { adaptiveRes: a.res, adaptiveMs: a.ms, fullRes: f.res, fullMs: f.ms };
  } finally { await browser.close(); }
}

test('#11-assist two-polarity: sync loop — identical confinement verdict at a fraction of the wall-time', { skip: !chromeOK, concurrency: false }, async () => {
  const { adaptiveRes, adaptiveMs, fullRes, fullMs } = await confineBoth(SYNC_LOOP);
  assert.deepEqual(adaptiveRes, fullRes, 'verdict byte-identical to the full-window sweep');
  assert.ok(adaptiveRes.traps.length === 1, 'the sync loop is still a confirmed confinement trap');
  assert.ok(adaptiveMs < fullMs * 0.8, `adaptive (${adaptiveMs}ms) is meaningfully cheaper than full (${fullMs}ms)`);
});

test('#11-assist two-polarity: async bounce past calibration — the log guard restores the full-window sweep', { skip: !chromeOK, concurrency: false }, async () => {
  const { adaptiveRes, fullRes } = await confineBoth(ASYNC_BOUNCE);
  assert.deepEqual(adaptiveRes, fullRes, 'the restart path reproduces the full-window verdict exactly');
  assert.equal(adaptiveRes.traps.length, 0, 'an async bounce-back is never a confinement confirmation');
});

// ─── F11 (soundness review round 2) ─────────────────────────────────────────────────────────────────
// The confinement sweep's per-press settle-read carried an early exit ("stop once a bounce has held
// stable >= 64 ms") that used to apply on EVERY press, including a FULL-window one — so a CHAINED bounce
// (hop 1 settles and holds, then a SECOND hop fires LATER in the same window) read as if only hop 1 had
// ever happened. That silently broke `adaptiveSettle: false`'s promise of "the exact old timing envelope"
// (an unconditional full wait) too — a full-window press could still bail the instant one bounce settled.
// This pins the primitive DIRECTLY: `cfPressSettleRead` is the literal function production calls (not a
// hand-duplicated copy), called with allowEarlyExit=false (the F11-fixed full-window shape, which must
// observe BOTH hops) and =true (the pre-fix shape, forced onto a full window, which must truncate at the
// first) against one fixture whose focus bounces twice inside a single 180 ms window.
test('F11: a CHAINED two-hop bounce is read to its FINAL position on a full-window press; forcing the old early-exit truncates at the first hop', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html><body>
    <button id="stopA">A</button><button id="stopB">B</button><button id="stopC">C</button>
    <script>
      // hop 1 (A -> B) at ~30ms settles and holds well past the 64ms "settled" threshold; hop 2 (B -> C)
      // fires ~120ms LATER — both land comfortably inside a 180ms full settle window.
      document.getElementById('stopA').addEventListener('focus', () => {
        setTimeout(() => document.getElementById('stopB').focus(), 30);
      });
      document.getElementById('stopB').addEventListener('focus', () => {
        setTimeout(() => document.getElementById('stopC').focus(), 120);
      });
    </script>
  </body></html>`;
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(tagFocusables, 'button');
    await page.evaluate(installCfFocusinLog);
    const idOf = (elId) => page.evaluate((i) => document.getElementById(i).getAttribute('data-v3-foc'), elId);
    const [idB, idC] = await Promise.all([idOf('stopB'), idOf('stopC')]);

    // F11-FIXED shape: a full-window press (allowEarlyExit=false) must observe BOTH chained hops.
    await page.evaluate((i) => document.getElementById(i).focus(), 'stopA');
    await page.evaluate(() => { window.__cfLog = []; }); // the .focus() call above is ours, not the page's
    const fixed = await page.evaluate(cfPressSettleRead, 180, false);
    assert.equal(fixed.cur, idC, `the full window reads the chained bounce's FINAL position (C) — got ${JSON.stringify(fixed)}`);

    // Replay identically with the PRE-FIX shape (allowEarlyExit=true forced onto a full-window read) —
    // proves the bug this fixes: it stops the instant the first hop (A->B) has held for 64ms, at ~94ms,
    // never seeing the second hop that lands at ~150ms.
    await page.evaluate((i) => document.getElementById(i).focus(), 'stopA');
    await page.evaluate(() => { window.__cfLog = []; });
    const preFix = await page.evaluate(cfPressSettleRead, 180, true);
    assert.equal(preFix.cur, idB, `pre-fix (early exit allowed on a full-window read) truncates at the FIRST hop (B), missing the chained second — got ${JSON.stringify(preFix)}`);
  } finally { await browser.close(); }
});
