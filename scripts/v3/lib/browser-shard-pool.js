'use strict';

// Split one aggregate tab budget across several independent Chromium processes.
// Each page worker stays pinned to one shard, so a page's collect/orchestrate
// lifecycle shares a browser and allocator without funneling every page through
// one Chromium control process.

function splitCapacity(total, count) {
  const capacity = Math.max(1, Math.floor(Number(total) || 1));
  const size = Math.max(1, Math.min(capacity, Math.floor(Number(count) || 1)));
  const base = Math.floor(capacity / size);
  const remainder = capacity % size;
  return Array.from({ length: size }, (_, i) => base + (i < remainder ? 1 : 0));
}

async function closeBrowser(browser, timeoutMs) {
  if (!browser) return;
  let timer;
  try {
    await Promise.race([
      Promise.resolve().then(() => browser.close()),
      new Promise((resolve) => { timer = setTimeout(resolve, timeoutMs); }),
    ]);
  } catch (e) { /* best effort; force-kill below */ }
  finally { if (timer) clearTimeout(timer); }
  try {
    const proc = browser.process && browser.process();
    if (proc && proc.exitCode == null && proc.signalCode == null) proc.kill('SIGKILL');
  } catch (e) { /* already gone */ }
}

async function createBrowserShardPool(opts = {}) {
  const launchBrowser = opts.launchBrowser;
  const createAllocator = opts.createAllocator;
  if (typeof launchBrowser !== 'function') throw new TypeError('browser-shard-pool: launchBrowser is required');
  if (typeof createAllocator !== 'function') throw new TypeError('browser-shard-pool: createAllocator is required');

  const caps = splitCapacity(opts.totalTabs, opts.browserCount);
  const closeTimeoutMs = Math.max(1, Number(opts.closeTimeoutMs) || 10000);
  const shards = caps.map((cap, index) => ({
    index, cap, browser: null, alloc: null, gen: 0, heals: 0,
    consecTransient: 0, healing: null,
  }));
  let closed = false;
  let aggregatePeak = 0;

  const closeShard = async (shard) => {
    const alloc = shard.alloc;
    const browser = shard.browser;
    shard.alloc = null;
    shard.browser = null;
    try { if (alloc && typeof alloc.close === 'function') alloc.close(); } catch (e) { /* noop */ }
    await closeBrowser(browser, closeTimeoutMs);
  };

  try {
    await Promise.all(shards.map(async (shard) => {
      shard.browser = await launchBrowser(shard.index);
      shard.alloc = createAllocator(shard.browser, shard.cap, shard.index);
    }));
  } catch (e) {
    await Promise.all(shards.map(closeShard));
    throw e;
  }

  const shardFor = (workerIndex) => shards[Math.abs(Math.floor(Number(workerIndex) || 0)) % shards.length];

  const stats = () => {
    const perShard = shards.map((shard) => {
      let allocStats = {};
      try { allocStats = shard.alloc && shard.alloc.stats ? shard.alloc.stats() : {}; } catch (e) { /* noop */ }
      return {
        index: shard.index,
        gen: shard.gen,
        cap: shard.cap,
        healing: !!shard.healing,
        heals: shard.heals,
        ...allocStats,
      };
    });
    const sum = (key) => perShard.reduce((n, shard) => n + (Number(shard[key]) || 0), 0);
    const inUse = sum('inUse');
    aggregatePeak = Math.max(aggregatePeak, inUse);
    return {
      browsers: shards.length,
      cap: sum('cap'),
      inUse,
      peak: aggregatePeak,
      shardPeakSum: sum('peak'),
      granted: sum('granted'),
      queued: sum('queued'),
      waiting: sum('waiting'),
      waitMsTotal: sum('waitMsTotal'),
      openFailures: sum('openFailures'),
      heals: shards.reduce((n, shard) => n + shard.heals, 0),
      closed,
      shards: perShard,
    };
  };

  const heal = (shardOrIndex, genAtFailure) => {
    const shard = typeof shardOrIndex === 'number' ? shards[shardOrIndex] : shardOrIndex;
    if (!shard || !shards.includes(shard)) return Promise.reject(new Error('browser-shard-pool: unknown shard'));
    if (closed) return Promise.reject(new Error('browser-shard-pool: closed'));
    if (shard.gen !== genAtFailure) return shard.healing || Promise.resolve(false);
    if (!shard.healing) {
      shard.healing = (async () => {
        shard.gen += 1;
        shard.heals += 1;
        await closeShard(shard);
        if (closed) return false;
        shard.browser = await launchBrowser(shard.index);
        shard.alloc = createAllocator(shard.browser, shard.cap, shard.index);
        shard.consecTransient = 0;
        return true;
      })().finally(() => { shard.healing = null; });
    }
    return shard.healing;
  };

  const close = async () => {
    if (closed) return;
    closed = true;
    await Promise.all(shards.map(closeShard));
  };

  return { shards, shardFor, stats, heal, close };
}

module.exports = { splitCapacity, createBrowserShardPool };
