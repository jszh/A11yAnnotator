// Central tab allocator — unit + ADVERSARIAL coverage. No real Chrome: an injectable mock page factory drives
// the FIFO/cap/release-on-throw/timer-pause invariants deterministically. (A real-browser stress/memory probe
// lives in scripts/v3/tests/manual/ — run on demand, not in the unit suite.)
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createTabAllocator } = require('../lib/tab-allocator.js');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tick = () => new Promise((r) => setImmediate(r));
// a mock page: records close(); `delayMs` simulates newPage() latency so concurrent acquires genuinely overlap.
function mockFactory({ delayMs = 0, failOn = null } = {}) {
  let n = 0;
  const pages = [];
  const newPage = async () => {
    const i = n++;
    if (delayMs) await sleep(delayMs);
    if (failOn && failOn(i)) throw new Error(`open failed #${i}`);
    const p = { id: i, closed: false, close() { this.closed = true; } };
    pages.push(p);
    return p;
  };
  return { newPage, pages };
}

test('allocator: grants immediately under cap; opens a page; tracks inUse/peak', async () => {
  const { newPage, pages } = mockFactory();
  const alloc = createTabAllocator({ newPage, maxTabs: 3 });
  const a = await alloc.acquire();
  const b = await alloc.acquire();
  assert.equal(a.waitMs, 0, 'an under-cap acquire never waits');
  assert.equal(alloc.stats().inUse, 2);
  assert.equal(pages.length, 2, 'two real pages opened');
  await a.release(); await b.release();
  assert.equal(alloc.stats().inUse, 0);
  assert.ok(pages.every((p) => p.closed), 'release() closes the page (no reuse — Rule 3 isolation)');
});

test('allocator: at cap, overflow PARKS in FIFO and is granted in arrival order on release', async () => {
  const { newPage } = mockFactory();
  const alloc = createTabAllocator({ newPage, maxTabs: 2 });
  const a = await alloc.acquire();
  const b = await alloc.acquire();                        // cap reached
  const order = [];
  const pC = alloc.acquire().then((l) => { order.push('C'); return l; }); // parks
  const pD = alloc.acquire().then((l) => { order.push('D'); return l; }); // parks behind C
  await tick();
  assert.equal(alloc.stats().waiting, 2, 'both overflow acquires are parked');
  await a.release();                                       // → grants C (FIFO head)
  await tick();
  await b.release();                                       // → grants D
  const [c, d] = await Promise.all([pC, pD]);
  assert.deepEqual(order, ['C', 'D'], 'FIFO: C (queued first) is granted before D');
  await c.release(); await d.release();
  assert.equal(alloc.stats().inUse, 0);
});

test('allocator: the cap is NEVER exceeded under an acquire-storm (peak ≤ cap, cap actually reached)', async () => {
  const cap = 4, N = 24;
  const { newPage } = mockFactory({ delayMs: 3 });          // overlapping opens
  const alloc = createTabAllocator({ newPage, maxTabs: cap });
  let done = 0;
  const tasks = Array.from({ length: N }, () => (async () => {
    const lease = await alloc.acquire();
    assert.ok(alloc.stats().inUse <= cap, `inUse ${alloc.stats().inUse} never exceeds cap ${cap}`);
    await sleep(2);
    done++;
    await lease.release();
  })());
  await Promise.all(tasks);
  const s = alloc.stats();
  assert.equal(done, N, 'every acquire eventually completed');
  assert.ok(s.peak <= cap, `peak ${s.peak} ≤ cap ${cap}`);
  assert.equal(s.peak, cap, 'the cap was actually reached (real contention)');
  assert.ok(s.queued >= N - cap, 'the overflow really queued');
  assert.equal(s.inUse, 0, 'all slots returned');
});

test('allocator: a failed open() releases the slot (the cap is never leaked) and propagates', async () => {
  const { newPage } = mockFactory({ failOn: (i) => i === 0 }); // the FIRST open throws
  const alloc = createTabAllocator({ newPage, maxTabs: 1 });
  await assert.rejects(() => alloc.acquire(), /open failed/, 'the open failure propagates');
  assert.equal(alloc.stats().inUse, 0, 'the slot was given back, not leaked');
  const a = await alloc.acquire();                          // would deadlock if the slot had leaked
  assert.ok(a.page && !a.page.closed);
  await a.release();
});

test('allocator: double-release is idempotent (slot freed once, page closed once)', async () => {
  const { newPage } = mockFactory();
  const alloc = createTabAllocator({ newPage, maxTabs: 2 });
  const a = await alloc.acquire();
  await a.release();
  await a.release();                                        // no double-decrement
  assert.equal(alloc.stats().inUse, 0, 'inUse not driven negative by a double release');
  const b = await alloc.acquire(); const c = await alloc.acquire();
  assert.equal(alloc.stats().inUse, 2, 'both slots still available (cap intact)');
  await b.release(); await c.release();
});

test('allocator: close() rejects parked waiters and refuses new acquires', async () => {
  const { newPage } = mockFactory();
  const alloc = createTabAllocator({ newPage, maxTabs: 1 });
  const a = await alloc.acquire();
  const parked = alloc.acquire();                          // parks behind a
  await tick();
  alloc.close();
  await assert.rejects(() => parked, /closed/, 'a parked waiter is rejected on close');
  await assert.rejects(() => alloc.acquire(), /closed/, 'new acquires are refused after close');
  assert.equal(alloc.stats().closed, true);
  await a.release();                                        // releasing the live lease must not throw
});

test('allocator: onWaitStart/onWaitEnd stay BALANCED even when close() rejects a parked waiter', async () => {
  const { newPage } = mockFactory();
  let starts = 0, ends = 0;
  const alloc = createTabAllocator({ newPage, maxTabs: 1, onWaitStart: () => starts++, onWaitEnd: () => ends++ });
  const a = await alloc.acquire();
  const parked = alloc.acquire();                          // parks → onWaitStart fires
  await tick();
  alloc.close();                                           // rejects the parked waiter → must still emit onWaitEnd
  await assert.rejects(() => parked, /closed/);
  assert.equal(starts, 1, 'onWaitStart fired once');
  assert.equal(ends, 1, 'onWaitEnd fired once too — balanced despite the close-rejection (no leaked in-flight count)');
  assert.ok(alloc.stats().waitMsTotal >= 0, 'the parked time is credited');
  await a.release();
});

test('allocator: withTab() releases even when the body throws or its deadline fires', async () => {
  const { newPage, pages } = mockFactory();
  const alloc = createTabAllocator({ newPage, maxTabs: 1 });
  await assert.rejects(() => alloc.withTab(async () => { throw new Error('work blew up'); }), /work blew up/);
  assert.equal(alloc.stats().inUse, 0, 'the slot is freed despite the throw');
  assert.ok(pages[0].closed, 'the page is closed despite the throw');
  const out = await alloc.withTab(async (page) => { assert.ok(page); return 42; });
  assert.equal(out, 42);
});

test('allocator: TIMER-PAUSE — queue-wait is excluded from a wall-clock started after acquire()', async () => {
  const { newPage } = mockFactory();
  const alloc = createTabAllocator({ newPage, maxTabs: 1 });
  const held = await alloc.acquire();                      // task 1 holds the only slot
  let workMs = null, reportedWaitMs = null;
  const task2 = (async () => {
    const lease = await alloc.acquire();                   // PARKS ~50ms — this await IS the pause
    reportedWaitMs = lease.waitMs;
    const t0 = Date.now();                                  // a per-item wall starts AFTER the tab is in hand
    await sleep(10);                                        // 10ms of real "work"
    workMs = Date.now() - t0;
    await lease.release();
  })();
  await sleep(50);
  await held.release();                                     // unblock task 2 ~50ms in
  await task2;
  assert.ok(reportedWaitMs >= 40, `the parked time is reported (~50ms, got ${reportedWaitMs})`);
  assert.ok(workMs < 30, `the work clock excludes the ~50ms queue-wait (got ${workMs}ms) — timer paused while queued`);
});

test('allocator: requires a browser or newPage factory', () => {
  assert.throws(() => createTabAllocator({}), /browser.*newPage|newPage.*required/i);
});
