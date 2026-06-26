'use strict';
// Post-`load` SETTLE wait — DEFAULT-ON (opt out with V3_SETTLE_WAIT=0). Was opt-in/inert while under evaluation; the
// determinism work concluded settle + per-lease isolation are what remove the ±3 FP instability, so settle now ships on.
//
// Every navigation in the harness uses `waitUntil:'load'`, which fires before web-fonts finish loading AND before
// layout/reflow has fully settled. Under CPU contention (high page-concurrency) that gap widens, so vision capture
// and the instruments/runner state reads catch a not-yet-settled page — the measured root cause of the ±3 FP
// pipeline instability (collect+subjects are deterministic; vision crops + ledger disposition drift ONLY under load,
// and a per-frame probe shows the frames are byte-identical when captured with the page settled).
//
// awaitSettle blocks until `document.fonts.ready` resolves AND layout is stable (two consecutive equal rAF geometry
// reads), bounded so it can never hang. Measured cost on static ACT fixtures: ~5-16ms (fonts already ready at load;
// layout settles within ~1 frame). On real web-font pages fonts.ready may add ~50-300ms — exactly where instability
// is worst, so the trade favors it. Call AFTER each goto/reload, BEFORE any screenshot or state read.
async function awaitSettle(page, opts = {}) {
  if (process.env.V3_SETTLE_WAIT === '0' && !opts.force) return; // DEFAULT-ON; opt out with V3_SETTLE_WAIT=0
  if (!page || typeof page.evaluate !== 'function') return;
  const maxFrames = Number(opts.maxFrames) || 60;     // hard cap: ≤ maxFrames rAF ticks (~1s) — never hangs
  const fontsTimeoutMs = Number(opts.fontsTimeoutMs) || 1000;
  // FLOOR: a node-side (wall-clock) delay AFTER the rAF-stable check. rAF is throttled under concurrent-Chrome load,
  // so the in-page settle can fire before the compositor has actually repainted; a wall-clock floor gives the GPU
  // time to land the frame regardless of rAF scheduling. Tunable via V3_SETTLE_MS (low-frequency capture/nav points
  // only — callers on the high-frequency keyboard walk pass floorMs:0). This is the knob the delay sweep varies.
  const floorMs = opts.floorMs != null ? Number(opts.floorMs) : (Number(process.env.V3_SETTLE_MS) || 0);
  try {
    await page.evaluate(async (maxFrames, fontsTimeoutMs) => {
      try { await Promise.race([document.fonts && document.fonts.ready, new Promise((r) => setTimeout(r, fontsTimeoutMs))]); } catch (e) {}
      const de = document.documentElement;
      // layout geometry (catches a viewport/reflow change) + scroll position (catches a scrollIntoView).
      const sig = () => { const b = document.body; if (!b) return '0'; const r = b.getBoundingClientRect(); return r.width + 'x' + r.height + ':' + b.scrollHeight + ':' + de.scrollWidth + 'x' + de.scrollHeight + ':' + (window.scrollX | 0) + ',' + (window.scrollY | 0); };
      // require TWO consecutive stable frames before returning — one stable frame can precede a late reflow/repaint,
      // and a post-scroll compositor repaint needs a frame to land (min ~2 rAF even when geometry is already stable).
      let prev = sig(), stable = 0;
      for (let i = 0; i < maxFrames; i++) { await new Promise((r) => requestAnimationFrame(r)); const s = sig(); if (s === prev) { if (++stable >= 2) return; } else stable = 0; prev = s; }
    }, maxFrames, fontsTimeoutMs).catch(() => {});
    if (floorMs > 0) await new Promise((r) => setTimeout(r, floorMs)); // wall-clock floor (rAF-throttle-robust)
  } catch (e) { /* never let settle break a run */ }
}
// awaitFocusSettle — the settle for the KEYBOARD WALK (after each Tab, before reading activeElement). awaitSettle is
// WRONG here: its signature includes window.scrollX/Y, but every Tab scrolls the newly-focused element into view, so
// the signature never converges and it burns the full ~1s frame cap PER TAB (× up to thousands of tabs ⇒ minutes).
// What the focus read actually needs is for the FOCUSED ELEMENT to stop changing — scroll is expected, not drift. So
// the signature is the activeElement NODE identity (compared by reference within one evaluate), require two
// consecutive equal frames, with a TIGHT cap (focus lands in 1-2 frames). Cost ~2 frames (~33ms) on the common case,
// ≤ maxFrames worst case (~130ms), vs ~1000ms before. DEFAULT-ON via its call site (kbd-graph.js); opt out V3_SETTLE_KBD=0.
async function awaitFocusSettle(page, opts = {}) {
  if (!page || typeof page.evaluate !== 'function') return;
  const maxFrames = Number(opts.maxFrames) || 16;      // enough for a focus-triggered reflow to settle; bounded (awaitSettle used 60)
  const floorMs = opts.floorMs != null ? Number(opts.floorMs) : (Number(process.env.V3_SETTLE_KBD_MS) || 0);
  try {
    await page.evaluate(async (maxFrames) => {
      // activeElement can be in a shadow root — descend to the real focus target, not the shadow host.
      const active = () => { let a = document.activeElement; while (a && a.shadowRoot && a.shadowRoot.activeElement) a = a.shadowRoot.activeElement; return a; };
      // LAYOUT signature compared FRAME-TO-FRAME — body dims + scrollHeight, i.e. REFLOW detectors. It deliberately
      // EXCLUDES window.scrollX/Y: the kbd walk's read (probeActive) records the focused element's rect as PAGE-ABSOLUTE
      // (r.left + scrollX), which is scroll-INVARIANT — so a focus-scroll never changes what we read and waiting for it
      // to finish is wasted; only a focus-triggered REFLOW (which moves absolute positions / changes scrollHeight) is
      // worth waiting for. (This is why awaitSettle was wrong here: its signature includes scrollX/Y, so every Tab's
      // focus-scroll kept it from converging — burning the full frame cap per Tab for a change that doesn't matter.)
      const geom = () => { const b = document.body; const r = b ? b.getBoundingClientRect() : { width: 0, height: 0 }; return (r.width | 0) + 'x' + (r.height | 0) + ':' + (b ? b.scrollHeight : 0) + 'x' + document.documentElement.scrollWidth; };
      let pa = active(), pg = geom();
      // ONE frame first: if focus + geometry/scroll did not change, the focus landed with NO scroll/reflow in progress
      // → return immediately (the common case — "only wait when a change actually happens"). This is the key cost cut:
      // the static tab pays one frame, not the full stability loop.
      await new Promise((r) => requestAnimationFrame(r));
      let a = active(), g = geom();
      if (a === pa && g === pg) return;
      // a scroll/layout change IS in progress (smooth scroll, focus-revealed reflow) → wait for it to stabilize
      // (two consecutive frames with no change to focus OR geometry/scroll), bounded.
      let stable = 0; pa = a; pg = g;
      for (let i = 1; i < maxFrames; i++) {
        await new Promise((r) => requestAnimationFrame(r));
        a = active(); g = geom();
        if (a === pa && g === pg) { if (++stable >= 2) return; } else stable = 0;
        pa = a; pg = g;
      }
    }, maxFrames).catch(() => {});
    if (floorMs > 0) await new Promise((r) => setTimeout(r, floorMs)); // optional small wall-clock floor for a focus-triggered async reveal
  } catch (e) { /* never let settle break the walk */ }
}

// robustScreenshot — a one-shot page.screenshot transiently returns null / throws under heavy page-concurrency,
// which silently drops a vision crop OR flakes a runner/tool measurement to INCONCLUSIVE (RCA: the focus-visual
// experiment's null after-crop -> a dropped 2.4.7 proposal -> a ledger autoPartial flip). Retry on null/throw with a
// short wait between. A first-try success is byte-identical to the one-shot, so this only RECOVERS a spurious failure
// — never alters a good capture, and makes the outcome MORE deterministic. Drop-in: pass the same screenshot opts.
async function robustScreenshot(page, opts = {}, tries = 3) {
  if (!page || typeof page.screenshot !== 'function') return null;
  for (let i = 0; i < tries; i++) {
    const s = await page.screenshot(opts).catch(() => null);
    if (s) return s;
    if (i < tries - 1) await new Promise((r) => setTimeout(r, 80)); // give the compositor/page a moment, then retry
  }
  return null;
}

module.exports = { awaitSettle, awaitFocusSettle, robustScreenshot };
