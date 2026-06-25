#!/usr/bin/env node
'use strict';
// Validate the tool fixes by DIRECTLY invoking the tool functions (no LLM):
//  (1) observe_state_after_activation on a 600ms-DELAYED reveal, under contention, LEGACY (blind 350ms) vs NEW
//      (DOM-quiescence) — the blind delay fires before the reveal lands ⇒ newVisibleTextCount drifts/misses; the
//      quiescence wait catches it every time. Plus a SYNC-reveal control (new must not regress the fast case).
//  (2) resolve_destination CACHE — same link resolved twice in one process: 2nd returns cached:true + identical fp.
const path = require('path');
const REPO_ROOT = path.join(__dirname, '..', '..', '..');
require('../../../scripts/v3/lib/load-env.js').loadEnv(REPO_ROOT);
const tools = require('../../../scripts/v3/lib/cdp-tools.js');
const puppeteer = require('puppeteer');
function arg(n, d) { const p = process.argv.find((x) => x === `--${n}` || x.startsWith(`--${n}=`)); if (!p) return d; if (p === `--${n}`) return true; return p.slice(n.length + 3); }
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FIX = path.join(__dirname, 'fixtures');
const N = Number(arg('n', 10));
const fileUrl = (f) => 'file://' + path.join(FIX, f);
const TARGET_XPATH = '/html/body/button[1]';

async function runObserve(browser, url, n) {
  const ctx = { freshClone: async () => { const p = await browser.newPage(); await p.goto(url, { waitUntil: 'load' }); return p; } };
  const counts = [];
  for (let i = 0; i < n; i++) {
    const r = await tools.observeStateAfterActivation(browser.__base, { targetXpath: TARGET_XPATH }, ctx).catch((e) => ({ error: String(e) }));
    counts.push(r && typeof r.newVisibleTextCount === 'number' ? r.newVisibleTextCount : (r && r.error ? 'ERR' : '?'));
  }
  return counts;
}

async function loadWorker(browser, stop) {
  // background contention: repeatedly clone + activate the sync fixture (THROTTLED so the page churn can't explode)
  const ctx = { freshClone: async () => { const p = await browser.newPage(); await p.goto(fileUrl('reveal-sync.html'), { waitUntil: 'load' }); return p; } };
  while (!stop.v) { await tools.observeStateAfterActivation(browser.__base, { targetXpath: TARGET_XPATH }, ctx).catch(() => {}); await new Promise((r) => setTimeout(r, 80)); }
}

async function main() {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  browser.__base = await browser.newPage();
  const stop = { v: false };
  const LOAD = Number(arg('load', 3));
  const loaders = Array.from({ length: LOAD }, () => loadWorker(browser, stop)); // throttled contention

  console.log(`TOOL-STABILITY: observe_state_after_activation | N=${N} | ${LOAD} throttled load workers (contention)\n`);
  const summarize = (label, counts) => { const set = [...new Set(counts.map(String))].sort(); console.log(`  ${label.padEnd(34)} counts=${JSON.stringify(counts)}  distinct=${set.length} ${set.length === 1 ? 'STABLE' : 'DRIFTS'}`); return set; };

  // (1a) DELAYED reveal — LEGACY blind 350ms
  process.env.V3_TOOL_LEGACY_DELAY = '1';
  const dLegacy = await runObserve(browser, fileUrl('reveal-delayed.html'), N);
  // (1b) DELAYED reveal — NEW quiescence
  delete process.env.V3_TOOL_LEGACY_DELAY;
  const dNew = await runObserve(browser, fileUrl('reveal-delayed.html'), N);
  // (1c) SYNC reveal — NEW (regression control)
  const sNew = await runObserve(browser, fileUrl('reveal-sync.html'), N);

  console.log('DELAYED reveal (600ms after click) — expect reveal count = 1:');
  summarize('LEGACY (blind 350ms)', dLegacy);
  summarize('NEW (DOM-quiescence)', dNew);
  console.log('\nSYNC reveal control (new must stay stable at 1):');
  summarize('NEW (DOM-quiescence)', sNew);

  // (2) resolve_destination cache
  console.log('\nRESOLVE_DESTINATION cache (same link twice in one process):');
  const base = await browser.newPage();
  await base.goto(fileUrl('link-index.html'), { waitUntil: 'load' });
  const r1 = await tools.resolveDestination(base, { linkXpath: '/html/body/a[1]' }).catch((e) => ({ error: String(e) }));
  const r2 = await tools.resolveDestination(base, { linkXpath: '/html/body/a[1]' }).catch((e) => ({ error: String(e) }));
  const fp = (r) => JSON.stringify({ title: r.title, h1: r.h1, finalUrl: (r.finalUrl || '').split('/').pop(), httpStatus: r.httpStatus });
  console.log(`  call1: cached=${!!r1.cached} fp=${fp(r1)}`);
  console.log(`  call2: cached=${!!r2.cached} fp=${fp(r2)}`);
  console.log(`  → cache hit on 2nd: ${r2.cached === true ? 'YES ✓' : 'NO ✗'} | fingerprints identical: ${fp(r1) === fp(r2) ? 'YES ✓' : 'NO ✗'}`);

  stop.v = true; await Promise.allSettled(loaders);
  await browser.close().catch(() => {});

  // verdict
  console.log('\n=== VERDICT ===');
  const legacyDrifts = new Set(dLegacy.map(String)).size > 1 || dLegacy.some((c) => c === 0);
  const newStable = new Set(dNew.map(String)).size === 1 && dNew[0] === 1;
  const syncOk = new Set(sNew.map(String)).size === 1 && sNew[0] === 1;
  console.log(`  observe_state: legacy misses/drifts the delayed reveal = ${legacyDrifts}; NEW catches it stably (count=1) = ${newStable}; sync control stable = ${syncOk}`);
  console.log(`  resolve_destination: 2nd call cached + identical = ${r2.cached === true && fp(r1) === fp(r2)}`);
}
main().catch((e) => { console.error(e && e.stack || e); process.exit(1); });
