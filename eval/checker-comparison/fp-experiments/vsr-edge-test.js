#!/usr/bin/env node
'use strict';
// Edge-case test for the DOM-mutation-gated probe_screen_reader_after_action. Runs each trigger UNDER LOAD and checks
// the expected behaviour, plus an A/B (V3_VSR_LEGACY = spoken-log-only vs new = mutation-gated) on the sync-update
// case to see whether the gate changes anything. Cases:
//   sync   — updates a PRE-EXISTING role=status → should be CAUGHT + liveRegionMutated=true
//   noop   — updates a non-live node → emptyQueue/no-live + liveRegionMutated=false + returns ~floor (NOT 6000:
//            a 6000 here would mean the VSR self-mutates and the observer self-triggers — edge #4)
//   notify — element.ariaNotify (no DOM) → caught via the spoken-log signal (if the build supports ariaNotify)
//   newreg — CREATES a role=status with content → liveRegionMutated=true but may NOT voice (4.1.3 inconclusive)
//   off    — updates an aria-live=off region → liveRegionMutated=false (excluded), no live announcement
const path = require('path');
const REPO_ROOT = path.join(__dirname, '..', '..', '..');
require('../../../scripts/v3/lib/load-env.js').loadEnv(REPO_ROOT);
const { probeScreenReaderAfterAction, setStateAndCapture } = require('../../../scripts/v3/lib/cdp-tools.js');
const puppeteer = require('puppeteer');
function arg(n, d) { const p = process.argv.find((x) => x === `--${n}` || x.startsWith(`--${n}=`)); if (!p) return d; if (p === `--${n}`) return true; return p.slice(n.length + 3); }
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FX = 'file://' + path.join(__dirname, 'fixtures', 'vsr-edge.html');
const LOAD = Number(arg('load', 4));
const N = Number(arg('n', 4));
const XP = { sync: '/html/body/button[1]', noop: '/html/body/button[2]', notify: '/html/body/button[3]', newreg: '/html/body/button[4]', off: '/html/body/button[5]' };

async function main() {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const base = await browser.newPage(); await base.goto(FX, { waitUntil: 'load' });
  const ctx = { freshClone: async () => { const c = await browser.createBrowserContext(); const p = await c.newPage(); p.__c = c; await p.goto(FX, { waitUntil: 'load' }); return p; } };
  const stop = { v: false };
  const loaders = Array.from({ length: LOAD }, () => (async () => { while (!stop.v) { await setStateAndCapture(base, { targetXpath: XP.sync, state: 'focus' }, ctx).catch(() => {}); await new Promise((r) => setTimeout(r, 40)); } })());

  // run one probe N times, aggregate
  async function probe(xp) {
    const rs = [];
    for (let i = 0; i < N; i++) {
      const t0 = Date.now();
      const r = await probeScreenReaderAfterAction(base, { triggerXpath: xp }, ctx).catch((e) => ({ error: String(e) }));
      rs.push({ ms: Date.now() - t0, r });
    }
    const ok = rs.filter((x) => x.r && !x.r.error && !x.r.probeFailed);
    const liveCaught = ok.filter((x) => x.r.liveRegionAnnouncements && x.r.liveRegionAnnouncements.length > 0).length;
    const mutated = ok.filter((x) => x.r.liveRegionMutated).length;
    const empty = ok.filter((x) => x.r.emptyQueue).length;
    const maxMs = Math.max(...rs.map((x) => x.ms)); const minMs = Math.min(...rs.map((x) => x.ms));
    return { n: ok.length, liveCaught, mutated, empty, minMs, maxMs };
  }

  console.log(`VSR-EDGE: N=${N} per case | ${LOAD} load workers\n`);
  console.log('case     liveCaught  mutated  emptyQ   latency(ms)');
  for (const k of ['sync', 'noop', 'notify', 'newreg', 'off']) {
    const s = await probe(XP[k]);
    console.log(`  ${k.padEnd(7)} ${String(s.liveCaught + '/' + s.n).padStart(8)}  ${String(s.mutated + '/' + s.n).padStart(7)}  ${String(s.empty + '/' + s.n).padStart(6)}   ${s.minMs}-${s.maxMs}`);
  }

  // A/B on the sync case: does the mutation gate change anything vs legacy (spoken-log only)?
  console.log('\nA/B on sync update (live voice may land late under load):');
  for (const mode of ['legacy', 'new']) {
    if (mode === 'legacy') process.env.V3_VSR_LEGACY = '1'; else delete process.env.V3_VSR_LEGACY;
    const s = await probe(XP.sync);
    console.log(`  ${mode.padEnd(7)} (V3_VSR_LEGACY=${mode === 'legacy' ? 1 : 0}): liveCaught ${s.liveCaught}/${s.n} | latency ${s.minMs}-${s.maxMs}ms`);
  }

  stop.v = true; await Promise.allSettled(loaders);
  await browser.close().catch(() => {});
}
main().catch((e) => { console.error(e && e.stack || e); process.exit(1); });
