// PHASE 2 — page-level parallelism over a SHARED browser + allocator. Verifies the payoff: many pages run at
// once, the allocator's cap bounds total open tabs GLOBALLY (across pages, not per page), nothing leaks, and a
// page's dispositions are IDENTICAL whether it runs solo or in the shared pool (sharing changes throughput, not
// verdicts). Uses the real focus fixture so actual experiments open actual tabs. Chrome-gated; serial.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { runPagesParallel } = require('../lib/run-pages.js');
const { orchestrate } = require('../lib/orchestrator.js');
const { CHROME } = require('../lib/run-experiments.js');
const { assetFileUrl } = require('../../lib/asset-paths.js');

const chromeOK = fs.existsSync(CHROME);
const FIXTURE = assetFileUrl('fx-v3-focus.html');
const mkCollect = (tag) => ({ file: 'fx-v3-focus.html', runId: `R-${tag}`, pageDigest: 'sha256:fx', collectedAt: 1000, elements: [
  { xpath: '/html/body/button[1]', focusable: true, role: 'button', hasText: true },
  { xpath: '/html/body/button[2]', focusable: true, role: 'button', hasText: true },
] });
const specOf = (tag) => ({ collect: mkCollect(tag), drive: { elements: [] }, resolveUrl: () => FIXTURE, opts: { now: 2000 } });

test('runPagesParallel: 3 pages share ONE browser+allocator — cap holds GLOBALLY, no leak, real contention', { skip: !chromeOK, concurrency: false }, async () => {
  const specs = [specOf('a'), specOf('b'), specOf('c')];
  // maxTabs=2 with 3 pages each wanting up to experimentConcurrency tabs ⇒ the union MUST contend for 2 slots.
  const { results, allocStats } = await runPagesParallel(specs, { maxTabs: 2, pageConcurrency: 3, orchestrateOpts: { experimentConcurrency: 3 } });
  assert.equal(results.length, 3);
  for (const r of results) { assert.ok(r && !r.error, `page ran without error: ${r && r.error && r.error.message}`); assert.equal(r.out.built.ok, true); }
  assert.ok(allocStats.peak <= 2, `GLOBAL tab cap respected across all pages: peak ${allocStats.peak} ≤ 2`);
  assert.equal(allocStats.inUse, 0, 'every tab returned — no leak across pages');
  assert.ok(allocStats.queued > 0, 'the small global cap genuinely forced cross-page queueing (proves the global throttle)');
  assert.equal(allocStats.openFailures, 0, 'no tab open failed');
});

test('runPagesParallel: a page in the shared pool yields the SAME dispositions as running it solo', { skip: !chromeOK, concurrency: false }, async () => {
  const spec = specOf('solo');
  // SOLO: orchestrate owns its own browser+allocator (no injection).
  const soloOut = await orchestrate(spec.collect, spec.drive, { resolveUrl: spec.resolveUrl, now: 2000 });
  // SHARED: the same spec through the parallel driver (injected shared browser+allocator), alongside a sibling.
  const { results } = await runPagesParallel([spec, specOf('sib')], { maxTabs: 2, pageConcurrency: 2, orchestrateOpts: { experimentConcurrency: 3 } });
  const sharedOut = results[0].out;
  assert.deepEqual(sharedOut.built.results.summary, soloOut.built.results.summary, 'shared-pool dispositions match the solo run (sharing changes throughput, not verdicts)');
  assert.equal(sharedOut.experiments.results.length, soloOut.experiments.results.length, 'same number of produced results');
});
