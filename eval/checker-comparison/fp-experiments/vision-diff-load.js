#!/usr/bin/env node
'use strict';
// Q2 — find WHAT pixels drift in a vision crop under contention. Captures the TARGET case's element-crops K times
// while W-1 background workers hammer filler captures (real CPU contention, = pages=W). Dedupes each (xpath,frame)
// by byte-sha and WRITES the distinct PNG variants to disk so they can be eyeballed/diffed. Settle is controlled by
// V3_SETTLE_WAIT (run with and without to see if the residual survives the settle).
//
// Usage: V3_SETTLE_WAIT=1 node vision-diff-load.js --id=8e6c190e --k=8 --workers=16 --out=fp-vdiff-8e6c
const fs = require('fs'); const path = require('path'); const crypto = require('crypto');
const REPO_ROOT = path.join(__dirname, '..', '..', '..');
require('../../../scripts/v3/lib/load-env.js').loadEnv(REPO_ROOT);
const vc = require('../../../scripts/v3/lib/vision-capture.js');
const { createTabAllocator } = require('../../../scripts/v3/lib/tab-allocator.js');
const LIMITS = require('../../../scripts/v3/lib/limits.js');
const puppeteer = require('puppeteer');
function arg(n, d) { const p = process.argv.find((x) => x === `--${n}` || x.startsWith(`--${n}=`)); if (!p) return d; if (p === `--${n}`) return true; return p.slice(n.length + 3); }
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PACKS = path.join(REPO_ROOT, 'results/fp-experiments/packs');
const SUBSET = path.join(__dirname, '..', 'act-subset');
const ID = arg('id', '8e6c190e'); const K = Number(arg('k', 8)); const WORKERS = Number(arg('workers', 16));
const OUT = path.join(REPO_ROOT, 'results/fp-experiments/runs', arg('out', 'fp-vdiff'));
const sha = (s) => crypto.createHash('sha256').update(String(s || '')).digest('hex').slice(0, 10);

function packFor(id) { const f = fs.readdirSync(PACKS).find((x) => x.startsWith(id)); return JSON.parse(fs.readFileSync(path.join(PACKS, f), 'utf8')); }
function allPacks() { return fs.readdirSync(PACKS).filter((x) => x.endsWith('.json')).map((x) => x.slice(0, 8)); }

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const pack = packFor(ID);
  const subs = [...(pack.rubricSubjects || []), ...(pack.agentSubjects || [])];
  const xps = [...new Set(subs.map((s) => s.xpath))];
  const statePlan = vc.buildStatePlan(subs);
  const url = 'file://' + path.join(SUBSET, pack.tc.localPath);
  const fillers = allPacks().filter((x) => x !== ID).slice(0, WORKERS);
  console.log(`vision-diff-load: target ${ID} (${pack.tc.sc}) | ${xps.length} xpaths | K=${K} target-captures | ${WORKERS} workers | settle=${process.env.V3_SETTLE_WAIT === '1' ? 'ON' : 'off'}`);

  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const alloc = createTabAllocator({ browser, maxTabs: LIMITS.concurrency.maxTabs });
  const targetCaps = [];
  let stop = false;
  // background load: continuously capture fillers
  const loadWorker = async (fid) => {
    const fp = packFor(fid); const furl = 'file://' + path.join(SUBSET, fp.tc.localPath);
    const fxps = [...new Set([...(fp.rubricSubjects || []), ...(fp.agentSubjects || [])].map((s) => s.xpath))];
    const fplan = vc.buildStatePlan([...(fp.rubricSubjects || []), ...(fp.agentSubjects || [])]);
    while (!stop) { await vc.captureVisionForUrl(furl, fxps, { executablePath: CHROME, browser, tabAllocator: alloc, statePlan: fplan }).catch(() => null); }
  };
  const loaders = fillers.map((fid) => loadWorker(fid));
  // target: K sequential captures UNDER the load
  for (let i = 0; i < K; i++) {
    const vbx = await vc.captureVisionForUrl(url, xps, { executablePath: CHROME, browser, tabAllocator: alloc, statePlan }).catch((e) => ({ __err: String(e) }));
    targetCaps.push(vbx);
  }
  stop = true; await Promise.allSettled(loaders);
  alloc.close(); await browser.close().catch(() => {});

  // per (xpath, frame): distinct variants → write each distinct PNG once
  for (const xp of xps) {
    const frames = [...new Set(targetCaps.flatMap((v) => Object.keys((v && v[xp]) || {})))];
    for (const fr of frames) {
      const variants = new Map(); // sha -> base64
      targetCaps.forEach((v) => { const b = v && v[xp] && v[xp][fr]; if (b) variants.set(sha(b), b); });
      const tag = (xp.replace(/[^a-z0-9]/gi, '_').slice(-28)) + '__' + fr;
      const distinct = [...variants.entries()];
      console.log(`  ${fr.padEnd(18)} ${xp}  → ${distinct.length === 1 ? 'STABLE' : distinct.length + ' DISTINCT'}`);
      if (distinct.length > 1) distinct.forEach(([h, b], idx) => fs.writeFileSync(path.join(OUT, `${tag}__v${idx}_${h}.png`), Buffer.from(b, 'base64')));
    }
  }
  console.log(`\ndistinct variants (if any) written under ${OUT}`);
})();
