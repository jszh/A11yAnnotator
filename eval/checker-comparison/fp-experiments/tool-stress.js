#!/usr/bin/env node
'use strict';
// STRESS the in-process CDP tools under heavy page-concurrency to confirm the determinism/robustness fixes hold up:
//   - robustScreenshot retry-on-null (set_state_and_capture / render_with_overrides / request_hires_crop /
//     resolve_part_color): a transient null must be RECOVERED, never surfaced as a failed measurement.
//   - settle / quiescence waits (observe_state_after_activation observer-before-click; set_state awaitSettle;
//     measure_geometry awaitSettle): a delayed reveal must be caught; geometry stable.
//   - resolve_destination cache: deterministic re-resolve.
// Each tool is invoked N times WHILE W background workers hammer clone+screenshot work (the contention that produced
// the original transient nulls). We report, per tool: invocations, ERRORS (null/{error}), distinct result signatures
// (stability), and max latency. NO LLM — the tool functions are called directly.
const path = require('path');
const REPO_ROOT = path.join(__dirname, '..', '..', '..');
require('../../../scripts/v3/lib/load-env.js').loadEnv(REPO_ROOT);
const tools = require('../../../scripts/v3/lib/cdp-tools.js');
const puppeteer = require('puppeteer');
function arg(n, d) { const p = process.argv.find((x) => x === `--${n}` || x.startsWith(`--${n}=`)); if (!p) return d; if (p === `--${n}`) return true; return p.slice(n.length + 3); }
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FIX = 'file://' + path.join(__dirname, 'fixtures', 'tool-stress.html');
const N = Number(arg('n', 10));
const LOAD = Number(arg('load', 6));

const XP = { button: '/html/body/button[1]', link: '/html/body/a[1]', text: '/html/body/p[1]', chart: '/html/body/div[2]' };

// short, stable signature of a tool result so we can detect (in)stability + null/error without dumping base64.
function sig(r) {
  if (r == null) return 'NULL';
  if (r.error) return 'ERR:' + String(r.error).slice(0, 40);
  if (r.refused) return 'REFUSED:' + r.refused;
  if (r.probeFailed) return 'PROBEFAIL';
  const o = {};
  for (const k of Object.keys(r)) {
    if (k === 'cached') continue; // resolve_destination cache flag toggles false→true by DESIGN; not instability
    const v = r[k];
    if (typeof v === 'string' && v.length > 80) o[k] = 'b64[' + v.length + ']';      // screenshot present (length bucketed)
    else if (v && typeof v === 'object') o[k] = Array.isArray(v) ? 'arr' + v.length : 'obj';
    else o[k] = v;
  }
  return JSON.stringify(o);
}
// a screenshot can be nested (set_state returns {screenshots:{before,after}}) — search recursively.
const hasShot = (r) => { if (!r || typeof r !== 'object') return false; for (const v of Object.values(r)) { if (typeof v === 'string' && v.length > 500) return true; if (v && typeof v === 'object' && hasShot(v)) return true; } return false; };

async function main() {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const base = await browser.newPage();
  await base.goto(FIX, { waitUntil: 'load' });
  // fresh ISOLATED clone (incognito context) at the fixture — matches the harness's per-lease isolation.
  const ctx = { freshClone: async () => { const c = await browser.createBrowserContext(); const p = await c.newPage(); p.__c = c; await p.goto(FIX, { waitUntil: 'load' }); return p; } };
  // chart centre pixel for resolve_part_color
  const cc = await base.evaluate((xp) => { const el = document.evaluate(xp, document, null, 9, null).singleNodeValue; const r = el.getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }; }, XP.chart);

  // ---- the tool battery: [name, fn, args, needsCtx, expectStable] ----
  const battery = [
    ['query_ax_node',                  tools.queryAxNode,                 { targetXpath: XP.button }, false, true],
    ['compute_contrast_ratio',         tools.computeContrastRatio,        { nodeAXpath: XP.text, nodeBXpath: '/html/body', threshold: 4.5 }, false, true],
    ['measure_geometry_live',          tools.measureGeometryLive,         { targetXpath: XP.button }, false, true],
    ['resolve_part_color',             tools.resolvePartColor,            { x: cc.x, y: cc.y }, false, true],
    ['request_hires_crop',             tools.requestHiResCrop,            { targetXpath: XP.chart }, true, false],
    ['set_state_and_capture:focus',    tools.setStateAndCapture,          { targetXpath: XP.button, state: 'focus' }, true, false],
    ['set_state_and_capture:hover',    tools.setStateAndCapture,          { targetXpath: XP.button, state: 'hover' }, true, false],
    ['render_with_overrides:grayscale',tools.renderWithOverrides,         { targetXpath: XP.chart, transform: 'grayscale' }, true, false],
    ['observe_state_after_activation', tools.observeStateAfterActivation, { targetXpath: XP.button }, true, true],
    ['resolve_destination',            tools.resolveDestination,          { linkXpath: XP.link }, false, true],
  ];

  // ---- background load: hammer clone+screenshot (the CPU contention) ----
  const stop = { v: false };
  const loadWorker = async () => { while (!stop.v) { await tools.setStateAndCapture(base, { targetXpath: XP.button, state: 'focus' }, ctx).catch(() => {}); await new Promise((r) => setTimeout(r, 40)); } };
  const loaders = Array.from({ length: LOAD }, () => loadWorker());

  console.log(`TOOL-STRESS: ${battery.length} tools × N=${N} | ${LOAD} load workers | isolation default\n`);
  const report = [];
  for (const [name, fn, args, needsCtx, expectStable] of battery) {
    const sigs = []; let errors = 0, nullShots = 0, maxMs = 0;
    for (let i = 0; i < N; i++) {
      const t0 = Date.now();
      const r = await fn(base, args, needsCtx ? ctx : undefined).catch((e) => ({ error: String((e && e.message) || e) }));
      const ms = Date.now() - t0; if (ms > maxMs) maxMs = ms;
      const s = sig(r); sigs.push(s);
      if (s === 'NULL' || s.startsWith('ERR:')) errors++;
      // for screenshot tools, a non-error result MUST carry pixels (robustShot worked)
      if (/set_state|render_with|hires/.test(name) && !r.error && !r.refused && !hasShot(r)) nullShots++;
    }
    const distinct = [...new Set(sigs)];
    report.push({ name, errors, nullShots, distinct: distinct.length, expectStable, maxMs, sample: distinct.slice(0, 2) });
  }
  stop.v = true; await Promise.allSettled(loaders);
  await browser.close().catch(() => {});

  // ---- verdict ----
  console.log('tool                                 err  noShot  distinct  maxMs   verdict');
  let allOk = true;
  for (const r of report) {
    const stableOk = !r.expectStable || r.distinct <= 1;
    const ok = r.errors === 0 && r.nullShots === 0 && stableOk;
    if (!ok) allOk = false;
    console.log(`  ${r.name.padEnd(34)} ${String(r.errors).padStart(3)}  ${String(r.nullShots).padStart(5)}   ${String(r.distinct).padStart(6)}  ${String(r.maxMs).padStart(5)}   ${ok ? 'OK' : 'CHECK'}${r.expectStable && r.distinct > 1 ? ' (expected stable!)' : ''}`);
  }
  for (const r of report) if (r.distinct > 1) console.log(`    ${r.name} variants: ${JSON.stringify(r.sample)}`);
  console.log(`\n=== ${allOk ? 'ALL TOOLS SOUND under stress' : 'SOME TOOLS NEED REVIEW'} ===`);
}
main().catch((e) => { console.error(e && e.stack || e); process.exit(1); });
