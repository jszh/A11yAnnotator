#!/usr/bin/env node
// PHASE 2 demo — run N pages through ONE shared browser + allocator and show that page count is decoupled from
// tab count: peak open tabs is bounded by maxTabs no matter how many pages are in flight. NOT a unit test (real
// Chrome, machine-dependent). Reports per-page wall, the allocator peak/queueing, and chrome-tree RSS.
//
//   node scripts/v3/tests/manual/page-parallel-demo.js [pages=10] [maxTabs=12] [pageConcurrency=pages]
'use strict';

const path = require('path');
const { execSync } = require('child_process');
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const { runPagesParallel } = require(path.join(ROOT, 'scripts/v3/lib/run-pages.js'));
const { assetFileUrl } = require(path.join(ROOT, 'scripts/lib/asset-paths.js'));

function rssMB() { try { return Math.round(+execSync("ps -axo rss=,comm= | grep -i -E 'Chrome|chromium' | awk '{s+=$1} END{print s}'", { encoding: 'utf8' }).trim() / 1024); } catch (e) { return null; } }
const FIXTURE = assetFileUrl('fx-v3-focus.html');
const mkSpec = (i) => ({
  collect: { file: 'fx-v3-focus.html', runId: `R-${i}`, pageDigest: 'sha256:fx', collectedAt: 1000, elements: [
    { xpath: '/html/body/button[1]', focusable: true, role: 'button', hasText: true },
    { xpath: '/html/body/button[2]', focusable: true, role: 'button', hasText: true },
    { xpath: '/html/body/button[3]', focusable: true, role: 'button', hasText: true },
  ] },
  drive: { elements: [] }, resolveUrl: () => FIXTURE, opts: { now: 2000 },
});

(async () => {
  const PAGES = Math.max(1, +(process.argv[2] || 10));
  const maxTabs = Math.max(1, +(process.argv[3] || 12));
  const pageConcurrency = Math.max(1, +(process.argv[4] || PAGES));
  const specs = Array.from({ length: PAGES }, (_, i) => mkSpec(i));
  console.log(`${PAGES} pages | maxTabs=${maxTabs} | pageConcurrency=${pageConcurrency} | fixture=${FIXTURE}\n`);
  const perPageMs = [];
  const t0 = Date.now();
  const { results, allocStats } = await runPagesParallel(specs, {
    maxTabs, pageConcurrency, orchestrateOpts: { experimentConcurrency: 5 },
    onPageDone: (r, i) => { perPageMs[i] = (r && r.out && r.out.bundle && r.out.bundle.timings && r.out.bundle.timings.stages.experiments) ? r.out.bundle.timings.stages.experiments.ms : null; },
  });
  const wall = Date.now() - t0;
  const ok = results.filter((r) => r && !r.error && r.out.built.ok).length;
  console.log(`pages OK: ${ok}/${PAGES} | total wall: ${wall} ms`);
  console.log(`allocator: peak open tabs = ${allocStats.peak} (cap ${allocStats.cap}), queued = ${allocStats.queued}, inUse-after = ${allocStats.inUse}, openFailures = ${allocStats.openFailures}`);
  console.log(`per-page experiments stage (ms): ${perPageMs.map((m) => (m == null ? '?' : m)).join(', ')}`);
  console.log(`chrome RSS (approx): ${rssMB()} MB`);
  if (allocStats.peak > maxTabs) console.error(`!! CAP BREACH: peak ${allocStats.peak} > maxTabs ${maxTabs}`);
  if (allocStats.inUse !== 0) console.error('!! LEAK: tabs still checked out');
  console.log(`\n→ ${PAGES} pages ran with peak ${allocStats.peak} ≤ ${maxTabs} tabs: page count is decoupled from tab/memory cost.`);
})().catch((e) => { console.error('DEMO ERR', e); process.exit(1); });
