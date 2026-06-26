#!/usr/bin/env node
'use strict';
// STRESS the VSR integration (probe_screen_reader_after_action) under concurrency. The fix replaced a blind 1400ms
// wait with an in-page QUIESCENCE poll (floor 1400 / quiet 400 / ceiling 2800) on the Guidepup spoken-phrase log.
// Under CPU contention the live-region announcement can land LATER, so the test is: with many probes injecting their
// own VSR concurrently (+ background clone/screenshot load), does each still CATCH the announcement, or does the poll
// give up early (emptyQueue)? Uses the same fixture/trigger as cdp-tools.test.js: the "Apply" button voices
// "Coupon applied" via a live region. NO LLM — the tool function is called directly.
const path = require('path');
const REPO_ROOT = path.join(__dirname, '..', '..', '..');
require('../../../scripts/v3/lib/load-env.js').loadEnv(REPO_ROOT);
const { probeScreenReaderAfterAction, setStateAndCapture } = require('../../../scripts/v3/lib/cdp-tools.js');
const puppeteer = require('puppeteer');
function arg(n, d) { const p = process.argv.find((x) => x === `--${n}` || x.startsWith(`--${n}=`)); if (!p) return d; if (p === `--${n}`) return true; return p.slice(n.length + 3); }
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FX = 'file://' + path.join(REPO_ROOT, 'assets', 'fixtures', 'fx-v3-cdp-tools.html');
const REVEAL = '/html[1]/body[1]/button[1]'; // "Apply" → voices "Coupon applied" (matches cdp-tools.test.js XP.reveal)
const M = Number(arg('m', 16));        // total probe_sr invocations
const CONC = Number(arg('conc', 6));   // probe_sr running concurrently (concurrent VSR injections)
const LOAD = Number(arg('load', 4));   // background clone+screenshot workers (extra CPU contention)
const EXPECT = /Coupon applied/;

async function main() {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const base = await browser.newPage(); await base.goto(FX, { waitUntil: 'load' });
  // isolated clone per call (incognito context — matches the harness isolation)
  const ctx = { freshClone: async () => { const c = await browser.createBrowserContext(); const p = await c.newPage(); p.__c = c; await p.goto(FX, { waitUntil: 'load' }); return p; } };

  // background CPU load
  const stop = { v: false };
  const loadWorker = async () => { while (!stop.v) { await setStateAndCapture(base, { targetXpath: REVEAL, state: 'focus' }, ctx).catch(() => {}); await new Promise((r) => setTimeout(r, 50)); } };
  const loaders = Array.from({ length: LOAD }, () => loadWorker());

  console.log(`VSR-STRESS: ${M} probe_sr invocations | ${CONC} concurrent | ${LOAD} CPU-load workers\n`);
  const results = [];
  let cursor = 0;
  const worker = async () => {
    while (true) {
      const i = cursor++; if (i >= M) return;
      const t0 = Date.now();
      const r = await probeScreenReaderAfterAction(base, { triggerXpath: REVEAL }, ctx).catch((e) => ({ error: String((e && e.message) || e) }));
      const ms = Date.now() - t0;
      const anns = (r && r.announcements) || [];
      results.push({
        i, ms,
        error: r && r.error || null,
        probeFailed: !!(r && r.probeFailed),
        emptyQueue: !!(r && r.emptyQueue),
        caught: anns.some((a) => EXPECT.test(a)),
        count: anns.length,
      });
    }
  };
  await Promise.all(Array.from({ length: CONC }, () => worker()));
  stop.v = true; await Promise.allSettled(loaders);
  await browser.close().catch(() => {});

  // ---- verdict ----
  const ok = results.filter((r) => !r.error && !r.probeFailed);
  const caught = ok.filter((r) => r.caught).length;
  const empty = ok.filter((r) => r.emptyQueue).length;
  const errs = results.filter((r) => r.error || r.probeFailed).length;
  const maxMs = Math.max(...results.map((r) => r.ms));
  const minMs = Math.min(...results.map((r) => r.ms));
  console.log(`  invocations:        ${results.length}`);
  console.log(`  injection failures: ${errs}  (error or probeFailed — VSR could not run)`);
  console.log(`  CAUGHT "Coupon applied": ${caught} / ${ok.length}  ${caught === ok.length && ok.length > 0 ? '✓' : '✗'}`);
  console.log(`  emptyQueue (missed): ${empty} / ${ok.length}`);
  console.log(`  latency: ${minMs}–${maxMs}ms`);
  const misses = ok.filter((r) => !r.caught);
  if (misses.length) console.log(`  MISS detail: ${JSON.stringify(misses.slice(0, 6))}`);
  const sound = errs === 0 && empty === 0 && caught === ok.length && ok.length > 0;
  console.log(`\n=== VSR ${sound ? 'SOUND under concurrency — every probe caught the announcement' : 'NEEDS REVIEW'} ===`);
}
main().catch((e) => { console.error(e && e.stack || e); process.exit(1); });
