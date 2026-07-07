#!/usr/bin/env node
'use strict';
// Task C, check 4: offline render spot-check of the act-rest/ mirror with puppeteer. Auto-selects >=6 diverse
// cases (external-CSS, image, iframe/frame, video-with-track, ?query-carrying asset ref, and a 1.4.12
// text-spacing case), loads each via file://, and asserts no missing-LOCAL-resource request failures for refs
// we rewrote (page.on('requestfailed') filtered to file:// _assets targets, minus the intentionally-absent
// list). Screenshots a few to the scratchpad for manual read.
//
// Usage: CHROME_PATH=... node build-rest-render-check.js [--shots=3]

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const HERE = __dirname;
const OUT = path.join(HERE, 'act-rest');
const PAGES = path.join(OUT, 'pages');
const ASSETS = path.join(PAGES, '_assets');
const SHOT_DIR = '/private/tmp/claude-501/-Users-jason-Developer-A11yAnnotator/3fca4a66-a344-4a3e-9756-da31e33ce842/scratchpad';
const subset = require(path.join(OUT, 'subset.json'));
const report = fs.existsSync(path.join(OUT, 'download-report.json')) ? require(path.join(OUT, 'download-report.json')) : { intentionallyMissingAssets: [], skippedLargeMedia: [] };
const arg = (n, d) => { const p = process.argv.find((x) => x === `--${n}` || x.startsWith(`--${n}=`)); return p == null ? d : (p === `--${n}` ? true : p.slice(n.length + 3)); };
const SHOTS = Number(arg('shots', 3));

const absentAbs = new Set(); // absolute file paths of intentionally-absent local targets
for (const u of [...(report.intentionallyMissingAssets || []), ...(report.skippedLargeMedia || []).map((s) => s.url)]) {
  try { absentAbs.add(path.join(ASSETS, new URL(u).pathname.replace(/^\/+/, ''))); } catch (e) { }
}

// prefer puppeteer's bundled Chrome-for-Testing (no user-profile side effects); fall back to CHROME_PATH / system Chrome
let CHROME = process.env.CHROME_PATH;
if (!CHROME) { try { CHROME = puppeteer.executablePath(); } catch (e) { CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'; } }

// classify each page by feature so we can pick a diverse set
function classify(html) {
  const c = new Set();
  if (/<link\b[^>]*rel=["']?stylesheet/i.test(html) && /_assets\//.test(html)) c.add('external-css');
  if (/<img\b[^>]*src=["'][^"']*_assets\//i.test(html) || /background(-image)?\s*:\s*url\([^)]*_assets\//i.test(html)) c.add('image');
  if (/<(iframe|frame)\b[^>]*src=["'][^"']*_assets\//i.test(html)) c.add('iframe');
  if (/<track\b[^>]*src=/i.test(html) && /<video\b/i.test(html)) c.add('video-track');
  if (/(?:src|href|poster|data)=["'][^"']*_assets\/[^"']*\?[^"']*["']/i.test(html)) c.add('query-ref');
  return c;
}

(async () => {
  const wanted = ['external-css', 'image', 'iframe', 'video-track', 'query-ref', 'text-spacing'];
  const picks = {}; // feature -> {row, file}
  const spacingRules = new Set(['24afc2', '9e45ec', '78fd32']);
  for (const r of subset) {
    const f = path.join(OUT, r.localPath);
    if (!fs.existsSync(f)) continue;
    const html = fs.readFileSync(f, 'utf8');
    const cls = classify(html);
    if (spacingRules.has(r.ruleId)) cls.add('text-spacing');
    for (const feat of cls) if (!picks[feat]) picks[feat] = { row: r, file: f };
    if (wanted.every((w) => picks[w])) break;
  }
  const selected = [];
  for (const feat of wanted) if (picks[feat]) selected.push({ feat, ...picks[feat] });
  console.log(`selected ${selected.length} case(s):`);
  for (const s of selected) console.log(`  [${s.feat}] ${s.row.ruleId}/${s.row.testcaseId} (${s.row.expected})`);
  const unfound = wanted.filter((w) => !picks[w]);
  if (unfound.length) console.log(`  (not present in act-rest corpus: ${unfound.join(', ')} — e.g. no testcase carries a ?query on an _assets ref; that path lives in act-subset's fd3a94)`);

  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  let anyFail = false; let shotN = 0;
  for (const s of selected) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 800 });
    const failures = [];
    page.on('requestfailed', (req) => {
      const u = req.url();
      if (!u.startsWith('file://')) return;                       // ignore offline external fetches
      let p; try { p = decodeURIComponent(new URL(u).pathname); } catch (e) { p = u; }
      if (!/\/_assets\//.test(p)) return;                          // only count rewritten local-asset refs
      if (absentAbs.has(p)) return;                                // intentionally-absent (server-404 / >50MB)
      if (fs.existsSync(p)) return;                                // file IS present — a browser abort (e.g. a
      // file:// <video> range-request ERR_ABORTED) is not a missing-resource failure; only count absent files.
      failures.push(`${req.failure() && req.failure().errorText} ${p}`);
    });
    const fileUrl = 'file://' + s.file;
    try {
      await page.goto(fileUrl, { waitUntil: 'networkidle2', timeout: 20000 });
    } catch (e) { console.log(`  ! ${s.feat} goto: ${e.message}`); }
    await new Promise((r) => setTimeout(r, 600));
    if (failures.length) { anyFail = true; console.log(`  ✗ [${s.feat}] ${s.row.ruleId}/${s.row.testcaseId}: ${failures.length} missing local resource(s):`); for (const f of failures.slice(0, 8)) console.log(`      ${f}`); }
    else console.log(`  ✓ [${s.feat}] ${s.row.ruleId}/${s.row.testcaseId}: no missing local-resource failures`);
    if (shotN < SHOTS && ['image', 'text-spacing', 'video-track', 'external-css'].includes(s.feat)) {
      const shot = path.join(SHOT_DIR, `rest-render-${s.feat}-${s.row.ruleId}.png`);
      try { await page.screenshot({ path: shot, fullPage: false }); console.log(`      screenshot: ${shot}`); shotN++; } catch (e) { }
    }
    await page.close();
  }
  await browser.close();
  console.log(`\n${anyFail ? 'FAIL' : 'PASS'} — offline render check`);
  process.exit(anyFail ? 1 : 0);
})();
