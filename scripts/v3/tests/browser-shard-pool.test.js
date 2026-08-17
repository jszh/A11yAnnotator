'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { splitCapacity, createBrowserShardPool } = require('../lib/browser-shard-pool.js');

test('splitCapacity preserves the aggregate cap and balances remainders', () => {
  assert.deepEqual(splitCapacity(144, 4), [36, 36, 36, 36]);
  assert.deepEqual(splitCapacity(10, 3), [4, 3, 3]);
  assert.deepEqual(splitCapacity(3, 8), [1, 1, 1]);
  assert.deepEqual(splitCapacity(0, 0), [1]);
});

test('browser shard pool aggregates allocator telemetry and pins workers', async () => {
  let browserSeq = 0;
  const pool = await createBrowserShardPool({
    browserCount: 3,
    totalTabs: 10,
    launchBrowser: async () => ({
      id: ++browserSeq,
      close: async () => {},
      process: () => ({ exitCode: 0, signalCode: null, kill() {} }),
    }),
    createAllocator: (_browser, cap, index) => ({
      close() {},
      stats: () => ({ cap, inUse: index + 1, peak: index + 2, granted: 10 + index, queued: index, waiting: index === 2 ? 1 : 0, waitMsTotal: index * 100, openFailures: 0, closed: false }),
    }),
  });

  assert.equal(pool.shardFor(0).index, 0);
  assert.equal(pool.shardFor(3).index, 0);
  assert.equal(pool.shardFor(5).index, 2);
  assert.deepEqual(pool.shards.map((s) => s.cap), [4, 3, 3]);

  const stats = pool.stats();
  assert.equal(stats.browsers, 3);
  assert.equal(stats.cap, 10);
  assert.equal(stats.inUse, 6);
  assert.equal(stats.peak, 6);
  assert.equal(stats.shardPeakSum, 9);
  assert.equal(stats.granted, 33);
  assert.equal(stats.queued, 3);
  assert.equal(stats.waiting, 1);
  assert.equal(stats.waitMsTotal, 300);
  assert.equal(stats.shards.length, 3);

  await pool.close();
});

test('healing is single-flight and replaces only the failed shard', async () => {
  let browserSeq = 0;
  const closedBrowsers = [];
  const closedAllocators = [];
  const pool = await createBrowserShardPool({
    browserCount: 2,
    totalTabs: 8,
    launchBrowser: async (index) => {
      const proc = { exitCode: null, signalCode: null, kill() { this.signalCode = 'SIGKILL'; } };
      return {
        id: ++browserSeq,
        index,
        close: async function close() { closedBrowsers.push(this.id); proc.exitCode = 0; },
        process: () => proc,
      };
    },
    createAllocator: (browser, cap, index) => ({
      close() { closedAllocators.push(browser.id); },
      stats: () => ({ cap, inUse: 0, peak: 0, granted: 0, queued: 0, waiting: 0, waitMsTotal: 0, openFailures: 0, closed: false, index }),
    }),
  });

  const failed = pool.shards[0];
  const healthyBrowser = pool.shards[1].browser;
  await Promise.all([pool.heal(failed, 0), pool.heal(failed, 0), pool.heal(0, 0)]);

  assert.equal(browserSeq, 3, 'two initial launches plus one replacement');
  assert.equal(failed.gen, 1);
  assert.equal(failed.heals, 1);
  assert.equal(pool.shards[1].browser, healthyBrowser);
  assert.deepEqual(closedBrowsers, [1]);
  assert.deepEqual(closedAllocators, [1]);

  await pool.close();
  await pool.close();
  assert.deepEqual(closedBrowsers.sort((a, b) => a - b), [1, 2, 3]);
  assert.deepEqual(closedAllocators.sort((a, b) => a - b), [1, 2, 3]);
});
