#!/usr/bin/env node
'use strict';
// Pinpoint WHICH vision frame drifts run-to-run for an unstable case, to separate LOAD-settle (static frames:
// surrounding-region / viewport / reflow viewport-320 captured before layout settles) from a stable element-crop.
// Captures via the SAME harness path (captureVisionForUrl) N times at pages=1 (no contention) and diffs each
// (xpath, frame) by byte-sha. If a frame varies even at pages=1, the cause is load/settle TIMING, not contention.
const fs = require('fs'); const path = require('path'); const crypto = require('crypto');
const REPO_ROOT = path.join(__dirname, '..', '..', '..');
require('../../../scripts/v3/lib/load-env.js').loadEnv(REPO_ROOT);
const vc = require('../../../scripts/v3/lib/vision-capture.js');
const { createTabAllocator } = require('../../../scripts/v3/lib/tab-allocator.js');
const puppeteer = require('puppeteer');
function arg(n, d) { const p = process.argv.find((x) => x === `--${n}` || x.startsWith(`--${n}=`)); if (!p) return d; if (p === `--${n}`) return true; return p.slice(n.length + 3); }
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PACKS = path.join(REPO_ROOT, 'results/fp-experiments/packs');
const SUBSET = path.join(__dirname, '..', 'act-subset');
const ID = arg('id', 'e0d32d95'); const N = Number(arg('n', 5));
const sha = (s) => crypto.createHash('sha256').update(String(s || '')).digest('hex').slice(0, 10);

(async () => {
  const f = fs.readdirSync(PACKS).find((x) => x.startsWith(ID));
  const pack = JSON.parse(fs.readFileSync(path.join(PACKS, f), 'utf8'));
  const subs = [...(pack.rubricSubjects || []), ...(pack.agentSubjects || [])];
  const xps = [...new Set(subs.map((s) => s.xpath))];
  const statePlan = vc.buildStatePlan(subs);
  const url = 'file://' + path.join(SUBSET, pack.tc.localPath);
  console.log(`per-frame vision probe: ${pack.tc.testcaseId.slice(0, 12)} (${pack.tc.sc}) | ${xps.length} xpaths | ${N} captures (pages=1)`);
  const extra = (process.env.CHROME_EXTRA_FLAGS || '').split(/\s+/).filter(Boolean);
  if (extra.length) console.log(`  +extra chrome flags: ${extra.join(' ')}`);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage', ...extra] });
  const alloc = createTabAllocator({ browser, maxTabs: 4 });
  const caps = [];
  for (let i = 0; i < N; i++) {
    const vbx = await vc.captureVisionForUrl(url, xps, { executablePath: CHROME, browser, tabAllocator: alloc, statePlan }).catch((e) => ({ __err: String(e) }));
    caps.push(vbx);
  }
  alloc.close(); await browser.close().catch(() => {});
  // per (xpath, frame): distinct byte-shas across the N captures; SAVE distinct PNG variants for eyeballing
  const OUT = path.join(REPO_ROOT, 'results/fp-experiments/runs', arg('out', 'fp-perframe-' + ID));
  fs.mkdirSync(OUT, { recursive: true });
  for (const xp of xps) {
    const frames = [...new Set(caps.flatMap((v) => Object.keys((v && v[xp]) || {})))];
    console.log(`\n  xpath ${xp}`);
    for (const fr of frames) {
      const shas = caps.map((v) => sha((v && v[xp] && v[xp][fr]) || 'MISSING'));
      const uniq = [...new Set(shas)];
      console.log(`    ${fr.padEnd(18)} ${uniq.length === 1 ? 'STABLE' : uniq.length + ' DISTINCT — DRIFTS'}  ${shas.join(' ')}`);
      if (uniq.length > 1) {
        const seen = new Set(); const tag = xp.replace(/[^a-z0-9]/gi, '_').slice(-22) + '__' + fr;
        caps.forEach((v, capIdx) => { const b = v && v[xp] && v[xp][fr]; if (!b) return; const h = sha(b); if (seen.has(h)) return; seen.add(h); fs.writeFileSync(path.join(OUT, `${tag}__cap${capIdx}_${h}.png`), Buffer.from(b, 'base64')); });
      }
    }
  }
  console.log(`\ndistinct variants (if any) under ${OUT}`);
})();
