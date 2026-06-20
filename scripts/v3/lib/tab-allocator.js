'use strict';
// CENTRAL TAB ALLOCATOR — one chokepoint for every "I need a tab" in the harness.
//
// Today ~8 sites independently launch their own browser and open tabs bounded by scattered per-lane caps
// (experimentConcurrency, llmToolConcurrency, …). This module replaces those artificial limits with ONE real
// limit: a hard cap on CONCURRENTLY-OPEN tabs (maxTabs), demand-allocated through a single acquire()/release()
// with a FIFO queue for the overflow. A shared browser can then serve many pages at once (page-level
// parallelism) without any single lane having to guess its own cap — the allocator is the global throttle.
//
// TIMER-PAUSE-WHILE-QUEUED is structural, not a bolt-on. acquire() resolves ONLY when a slot is granted, so the
// canonical caller —
//     const lease = await alloc.acquire();        // may PARK in the FIFO; this await is the "pause"
//     const t0 = Date.now();                       // start the wall-clock AFTER the tab is in hand
//     try { ...work bounded by a per-item wall... } finally { await lease.release(); }
// — never charges queue-wait to its wall-clock budget, because the timer starts after the await returns. For a
// caller that MUST arm a deadline before acquiring (e.g. an already-running model turn that then needs a tab),
// acquire() also returns `waitMs` so the caller can credit the parked time back to its deadline.
//
// SLOT ACCOUNTING (the one invariant): a slot is taken exactly once per acquire() — either inline (free slot)
// or by grantNext() when dequeued — BEFORE the page is opened, and given back exactly once via release() or on
// an open() failure. So `inUse` is always the true number of checked-out tabs and never drifts.
//
// ISOLATION: release() CLOSES the page (no reuse) — matching the harness's fresh-page-per-attempt rule (Rule 3);
// the slot, not the page, is the reusable resource. CPU caveat: opening 50 tabs is cheap, but running 50
// CPU-bound tabs (layout/paint/screenshot) is not — effective parallelism is ~cores; lower maxTabs for heavy
// pages so per-item wall-clock deadlines stay honest.

const LIMITS = require('./limits.js');

function createTabAllocator(opts = {}) {
  const { browser = null, newPage = null, onWaitStart = null, onWaitEnd = null } = opts;
  // `newPage` is injectable (defaults to browser.newPage()) so the queue/cap logic is unit-testable with a mock
  // page factory — no real Chrome needed for the FIFO/cap/release-on-throw tests.
  const open = typeof newPage === 'function' ? newPage : (browser ? () => browser.newPage() : null);
  if (typeof open !== 'function') throw new Error('createTabAllocator: a `browser` or a `newPage()` factory is required');
  const cap = Math.max(1, Math.floor(Number(opts.maxTabs) || LIMITS.concurrency.maxTabs));

  let inUse = 0;            // tabs currently checked out (granted, not yet released)
  let peak = 0;            // high-water mark of inUse — the number that actually drives memory
  let granted = 0;        // lifetime acquire() grants
  let queuedTotal = 0;    // how many acquire() calls had to PARK in the FIFO
  let waitMsTotal = 0;    // cumulative parked time (for reporting; queue-wait is NOT charged to callers)
  let openFailures = 0;
  let closed = false;
  const waiters = [];      // FIFO: { resolve, reject } of parked acquire() calls

  const takeSlot = () => { inUse++; if (inUse > peak) peak = inUse; };

  // Free one slot and immediately hand it to the next parked waiter (FIFO), if any. Called on every release
  // and on an open() failure, so a freed slot never strands the queue.
  const releaseSlot = () => {
    inUse = Math.max(0, inUse - 1);
    if (closed || inUse >= cap) return;
    const w = waiters.shift();
    if (w) { takeSlot(); w.resolve(); } // re-take the slot ON BEHALF of the dequeued waiter (it skips the inline take)
  };

  async function acquire() {
    if (closed) throw new Error('tab-allocator: closed');
    const parked = inUse >= cap;
    const t0 = parked ? Date.now() : 0;
    if (!parked) {
      takeSlot();
    } else {
      queuedTotal++;
      if (onWaitStart) { try { onWaitStart(); } catch (e) {} }
      // Park until releaseSlot() dequeues us; it ALREADY took the slot on our behalf, so we do not take it again.
      // Carry t0 so close() can emit a symmetric onWaitEnd if it rejects us before we're ever granted.
      await new Promise((resolve, reject) => waiters.push({ resolve, reject, t0 }));
      if (closed) { releaseSlot(); throw new Error('tab-allocator: closed while queued'); }
    }
    const waitMs = parked ? (Date.now() - t0) : 0;
    if (parked) { waitMsTotal += waitMs; if (onWaitEnd) { try { onWaitEnd(waitMs); } catch (e) {} } }

    // Open the page only AFTER the slot is held, so a slow/failed open() can never let more than `cap` opens run
    // at once, and a failed open() gives the slot straight back to the queue (never leaks the cap).
    let page;
    try { page = await open(); }
    catch (e) { openFailures++; releaseSlot(); throw e; }
    granted++;

    // DOWNLOAD GUARD: deny file downloads on EVERY tab. Saved fixture pages can link to real external resources
    // Chrome serves as a download — e.g. ACT 5effbb links to gutenberg.org's Ulysses `.epub` — and a runner that
    // ACTIVATES such a link (keyboard-activation's Enter, a click) makes Chrome fetch + SAVE that file on every
    // element×state×runner pass. Page-scoped `deny` cancels the download navigation (no fetch, no saved file).
    // Best-effort: a mock/no-CDP page (the allocator's unit tests) or an old Chrome simply skips it — never blocks
    // acquire(), never throws. This is the single chokepoint for experiment, vision-capture and run-pages tabs.
    try {
      if (page && typeof page.target === 'function') {
        const _dl = await page.target().createCDPSession();
        await _dl.send('Page.setDownloadBehavior', { behavior: 'deny' }).catch(() => {});
        await _dl.detach().catch(() => {});
      }
    } catch (e) { /* CDP unavailable / mock page ⇒ downloads simply not denied (no-op) */ }

    // NETWORK-EGRESS GUARD: the saved fixtures are self-contained (file://), so ANY http(s) request to a real
    // EXTERNAL host is a leak — a link the keyboard probe activated (5effbb's gutenberg `.epub`), a meta-refresh,
    // a stray sub-resource. The download-deny above cancels the SAVE but NOT the network fetch (the 30-75s
    // gutenberg stall). Abort every non-local http(s) request so no external fetch / download / stall happens in
    // ANY lane. localhost is exempted (a fixture server); file:/data:/blob:/about: always continue. Each acquired
    // page is fresh (open() above), so this single listener never accumulates.
    try {
      if (page && typeof page.setRequestInterception === 'function') {
        await page.setRequestInterception(true);
        page.on('request', (req) => {
          let block = false;
          try { const u = new URL(req.url()); block = /^https?:$/.test(u.protocol) && !/^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$/.test(u.hostname); } catch (e) { block = false; }
          if (block) req.abort('blockedbyclient').catch(() => {}); else req.continue().catch(() => {});
        });
      }
    } catch (e) { /* interception unsupported (mock page) ⇒ no egress guard (no-op) */ }

    let released = false;
    const release = async () => {
      if (released) return; released = true;
      try { if (page && typeof page.close === 'function') await page.close(); } catch (e) {}
      releaseSlot();
    };
    return { page, release, waitMs };
  }

  // Convenience: acquire → run(page) → release (release guaranteed even if run throws or the deadline fires).
  async function withTab(run) {
    const lease = await acquire();
    try { return await run(lease.page, lease); }
    finally { await lease.release(); }
  }

  // Reject every parked waiter (their acquire() throws) and refuse new acquires. Does NOT close the browser —
  // the allocator borrows it; the owner closes it. Idempotent.
  function close() {
    if (closed) return;
    closed = true;
    while (waiters.length) {
      const w = waiters.shift();
      // a waiter rejected here was parked but NEVER granted — emit the symmetric onWaitEnd + credit its parked
      // time so onWaitStart/onWaitEnd stay balanced and waitMsTotal isn't under-counted (callback-contract parity).
      const waitMs = Math.max(0, Date.now() - (w.t0 || Date.now()));
      waitMsTotal += waitMs;
      if (onWaitEnd) { try { onWaitEnd(waitMs); } catch (e) {} }
      try { w.reject(new Error('tab-allocator: closed while queued')); } catch (e) {}
    }
  }

  const stats = () => ({ cap, inUse, peak, granted, queued: queuedTotal, waiting: waiters.length, waitMsTotal, openFailures, closed });

  return { acquire, withTab, close, stats, get cap() { return cap; } };
}

module.exports = { createTabAllocator };
