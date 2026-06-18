#!/usr/bin/env node
// REAL-CHROME stress + memory probe for the central tab allocator. NOT part of the unit suite (slow, resource-
// heavy, machine-dependent) — run on demand to (a) measure marginal memory per concurrent tab and find the real
// maxTabs on THIS machine, and (b) confirm the allocator never exceeds the cap and leaks no tabs under a storm.
//
//   node scripts/v3/tests/manual/tab-allocator-stress.js [maxTabs=50] [fixture=fx-v3-focus.html]
//
// Memory is the Chrome PROCESS-TREE RSS (browser + every renderer), summed from `ps` — the number that actually
// drives the box. (CPU contention is best seen on HEAVY real pages; a tiny file:// fixture loads too fast to show
// it — so treat the wall(ms) column as a floor, not the corpus-scale cost.)
'use strict';

const path = require('path');
const { execSync } = require('child_process');
const puppeteer = require('puppeteer');
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const { createTabAllocator } = require(path.join(ROOT, 'scripts/v3/lib/tab-allocator.js'));
const { assetFileUrl } = require(path.join(ROOT, 'scripts/lib/asset-paths.js'));
const { CHROME } = require(path.join(ROOT, 'scripts/v3/lib/run-experiments.js'));

// Sum RSS (KB→MB) of a process and all its descendants — the full Chrome tree under the browser pid.
function treeRssMB(rootPid) {
  let out;
  try { out = execSync('ps -axo pid=,ppid=,rss=', { encoding: 'utf8' }); } catch (e) { return null; }
  const kids = new Map(), rss = new Map();
  for (const line of out.trim().split('\n')) {
    const m = line.trim().split(/\s+/);
    const pid = +m[0], ppid = +m[1], r = +m[2];
    if (!Number.isFinite(pid)) continue;
    rss.set(pid, r); (kids.get(ppid) || kids.set(ppid, []).get(ppid)).push(pid);
  }
  let total = 0; const stack = [rootPid];
  while (stack.length) { const p = stack.pop(); total += (rss.get(p) || 0); for (const c of (kids.get(p) || [])) stack.push(c); }
  return Math.round(total / 1024);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const MAX = Math.max(1, +(process.argv[2] || 50));
  const url = assetFileUrl(process.argv[3] || 'fx-v3-focus.html');
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const pid = browser.process().pid;
  await sleep(400);
  const base = treeRssMB(pid);
  const alloc = createTabAllocator({ browser, maxTabs: MAX });
  console.log(`fixture: ${url}`);
  console.log(`baseline chrome-tree RSS: ${base} MB (browser pid ${pid}), maxTabs=${MAX}\n`);
  console.log('  K | wall(ms) | treeRSS(MB) | Δbase | MB/tab | peakInUse');
  console.log('----+----------+-------------+-------+--------+----------');
  const levels = [1, 5, 10, 20, 30, 40, 50].filter((k) => k <= MAX);
  if (!levels.includes(MAX)) levels.push(MAX);
  for (const K of levels) {
    const t0 = Date.now();
    const leases = await Promise.all(Array.from({ length: K }, async () => {
      const lease = await alloc.acquire();
      await lease.page.goto(url, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
      return lease;
    }));
    const wall = Date.now() - t0;
    await sleep(600); // let renderers allocate before sampling
    const rss = treeRssMB(pid);
    const peak = alloc.stats().peak;
    const mbPerTab = Math.round((rss - base) / K);
    console.log(`${String(K).padStart(3)} | ${String(wall).padStart(8)} | ${String(rss).padStart(11)} | ${String(rss - base).padStart(5)} | ${String(mbPerTab).padStart(6)} | ${peak}`);
    for (const l of leases) await l.release();
    await sleep(400); // let closes settle so the next level starts clean
  }
  const s = alloc.stats();
  console.log(`\nINVARIANTS — inUse=${s.inUse} (expect 0), peak=${s.peak}, granted=${s.granted}, openFailures=${s.openFailures}, queued=${s.queued}`);
  if (s.inUse !== 0) console.error('!! LEAK: tabs still checked out after the ramp');
  if (s.peak > MAX) console.error(`!! CAP BREACH: peak ${s.peak} > maxTabs ${MAX}`);
  alloc.close();
  await browser.close();
  console.log(`node RSS: ${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`);
})().catch((e) => { console.error('STRESS ERR', e); process.exit(1); });
