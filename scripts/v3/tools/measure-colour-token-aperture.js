#!/usr/bin/env node
'use strict';
// HELD-OUT APERTURE MEASUREMENT for the text-less colour-token lane (collect-colour-peers.js, residual RCA
// s10 Tier 3). The lane ships DISABLED behind V3_COLOUR_TOKEN_LANE=1; per the RCA it may not affect any run
// until THIS measurement has been reviewed: cross-parent class-token widenings are exactly the shape that has
// over-fired before, so the question is "on how many pages that are NOT status-dot matrices does it mint?".
//
// WHAT IT DOES. Statically loads every corpus page (file://) in headless Chrome, runs the REAL
// collectColourPeers with { tokenLane: true }, and reports every page on which the lane emits a group
// (`tokenLane: true` — the lane is additive by construction, pinned by colour-token-lane.test.js, so the
// token groups ARE the delta vs. today's collector). No harness, no obligations, no LLM — collector only.
//
// HOW TO RUN (lead, post-run — do NOT run while a measurement run is in flight; it reads the same corpus
// pages the run reads live):
//   node scripts/v3/tools/measure-colour-token-aperture.js
//   node scripts/v3/tools/measure-colour-token-aperture.js --roots eval/act-augmented --limit 100
//   node scripts/v3/tools/measure-colour-token-aperture.js --out /tmp/colour-token-aperture.json --concurrency 6
//
// READING THE RESULT. The main colour-peer lane's accepted regime over the 926-page corpus is: 84% of pages
// zero groups, mean 0.23/page, p90 = 1. The token lane must sit WELL inside that: the ACT complement pages
// are overwhelmingly not colour-token pages, so more than ~1-2% of them firing — or any page minting several
// token groups — means the conjuncts are too loose and the lane must not be enabled. Review every firing
// page's legendText/members by hand before flipping V3_COLOUR_TOKEN_LANE=1 anywhere.

const fs = require('node:fs');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..', '..', '..');
const { collectColourPeers } = require(path.join(REPO, 'scripts', 'v3', 'lib', 'collect-colour-peers.js'));
const { BROWSER_ARGS } = require(path.join(REPO, 'scripts', 'v3', 'lib', 'browser-args.js'));

const DEFAULT_ROOTS = [
  'eval/act-augmented',                       // the augmented suite (family pages)
  'eval/checker-comparison/act-subset/pages', // official ACT subset
  'eval/checker-comparison/act-rest/pages',   // ACT complement
];

// ── args ────────────────────────────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = argv.indexOf('--' + name);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : dflt;
};
const roots = String(flag('roots', DEFAULT_ROOTS.join(','))).split(',').map((r) => r.trim()).filter(Boolean);
const limit = parseInt(flag('limit', '0'), 10) || 0;               // 0 = all
const concurrency = Math.max(1, parseInt(flag('concurrency', '4'), 10) || 4);
const outFile = flag('out', null);
const verbose = argv.includes('--verbose');

// ── page enumeration ────────────────────────────────────────────────────────────────────────────────
function htmlFilesUnder(root) {
  const abs = path.isAbsolute(root) ? root : path.join(REPO, root);
  const out = [];
  const walk = (dir) => {
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
    for (const e of entries) {
      if (e.name.startsWith('_') || e.name === 'node_modules' || e.name.startsWith('.')) continue; // tooling/annotator dirs
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile() && e.name.endsWith('.html')) out.push(p);
    }
  };
  walk(abs);
  return out;
}

// ── measurement ─────────────────────────────────────────────────────────────────────────────────────
async function main() {
  let files = [];
  for (const r of roots) files = files.concat(htmlFilesUnder(r));
  files.sort();
  if (limit > 0) files = files.slice(0, limit);
  if (!files.length) { console.error('no .html files under: ' + roots.join(', ')); process.exit(2); }
  console.log(`# colour-token aperture: ${files.length} pages, concurrency ${concurrency}`);

  const puppeteer = require('puppeteer');
  const CHROME = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH
    || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const browser = await puppeteer.launch({ headless: 'new', executablePath: CHROME, args: BROWSER_ARGS, timeout: 60000 });

  const results = [];       // { file, tokenGroups: [...] } for firing pages
  const errors = [];        // { file, error }
  let scanned = 0, firing = 0, totalGroups = 0;
  const perPageCounts = [];

  const queue = files.slice();
  const worker = async () => {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 }).catch(() => {});
    for (;;) {
      const file = queue.shift();
      if (!file) break;
      const rel = path.relative(REPO, file);
      try {
        await page.goto('file://' + file, { waitUntil: 'load', timeout: 20000 });
        const groups = await Promise.race([
          page.evaluate(collectColourPeers, { tokenLane: true }),
          new Promise((_, rej) => setTimeout(() => rej(new Error('evaluate timeout')), 15000)),
        ]);
        const tks = (groups || []).filter((g) => g && g.tokenLane === true);
        scanned++; perPageCounts.push(tks.length);
        if (tks.length) {
          firing++; totalGroups += tks.length;
          results.push({
            file: rel,
            tokenGroups: tks.map((g) => ({
              key: g.key,
              distinctColours: g.distinctColours,
              memberCount: (g.members || []).length,
              legendText: String(g.legendText || '').slice(0, 120),
              anchor: g.members && g.members[0] ? g.members[0].xpath : null,
            })),
          });
          console.log(`FIRES  ${rel}  (${tks.length} group${tks.length > 1 ? 's' : ''}: ${tks.map((g) => g.key).join(', ')})`);
        } else if (verbose) {
          console.log(`clean  ${rel}`);
        }
      } catch (e) {
        errors.push({ file: rel, error: String((e && e.message) || e).slice(0, 200) });
      }
    }
    await page.close().catch(() => {});
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  await browser.close().catch(() => {});

  perPageCounts.sort((a, b) => a - b);
  const p = (q) => perPageCounts.length ? perPageCounts[Math.min(perPageCounts.length - 1, Math.floor(q * perPageCounts.length))] : 0;
  const summary = {
    roots,
    pagesScanned: scanned,
    pagesErrored: errors.length,
    pagesFiring: firing,
    firingRate: scanned ? +(firing / scanned).toFixed(4) : 0,
    totalTokenGroups: totalGroups,
    meanGroupsPerPage: scanned ? +(totalGroups / scanned).toFixed(3) : 0,
    p90GroupsPerPage: p(0.90),
    maxGroupsPerPage: perPageCounts.length ? perPageCounts[perPageCounts.length - 1] : 0,
    // acceptance guidance (see header): must sit WELL inside the main lane's regime (84% zero / mean 0.23 / p90 1)
    firingPages: results,
    errors,
  };
  console.log('\n# ── SUMMARY ─────────────────────────────────────────────');
  console.log(`# pages scanned:      ${summary.pagesScanned}  (errored: ${summary.pagesErrored})`);
  console.log(`# pages firing:       ${summary.pagesFiring}  (${(summary.firingRate * 100).toFixed(2)}%)`);
  console.log(`# token groups total: ${summary.totalTokenGroups}  mean/page ${summary.meanGroupsPerPage}  p90 ${summary.p90GroupsPerPage}  max ${summary.maxGroupsPerPage}`);
  if (outFile) {
    fs.writeFileSync(outFile, JSON.stringify(summary, null, 2));
    console.log(`# full JSON written to ${outFile}`);
  }
  // exit code communicates the gate: 0 = quiet enough to review by hand; 1 = clearly too loose
  if (scanned && firing / scanned > 0.05) { console.log('# VERDICT: firing on >5% of pages — the conjuncts are too loose; do NOT enable.'); process.exit(1); }
  console.log('# VERDICT: inside the review band — hand-review every firing page above before enabling V3_COLOUR_TOKEN_LANE=1.');
}

main().catch((e) => { console.error(e); process.exit(2); });
