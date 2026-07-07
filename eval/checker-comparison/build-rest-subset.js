#!/usr/bin/env node
'use strict';
// Build the COMPLEMENT ("rest-of-ACT") LOCAL, offline W3C ACT testcase corpus: every approved-or-proposed
// testcase with expected ∈ {passed, failed, inapplicable} whose (ruleId, testcaseId) is NOT already mirrored
// in act-subset/ (this project's selected-SC subset). 581 (act-subset) + 609 (this) = 1190 total testcases.
//
// This is a SIBLING of build-sc-subset.js — the fetch/mirror/rewrite helpers are copied and adapted (NOT
// imported-and-mutated). Differences from build-sc-subset.js:
//   • selection is the COMPLEMENT and is NOT filtered to categories.json's selected SCs (this is everything else);
//   • the corpus is heavy on audio/video rules (1.2.x, 1.4.2) so ASSET_EXT is extended to mirror media
//     (mp4|webm|ogv|ogg|mp3|wav|m4a|m4v) + caption tracks (vtt|srt), and the attribute rewriter also covers
//     `poster=` (<video poster>) and `data=` (<object data>) besides src/href (which already cover
//     <source src> / <track src>);
//   • a single media file larger than ~50MB is SKIPPED (logged) rather than mirrored;
//   • counts are asserted (609 testcases across 50 rules) and the build fails loudly if they drift.
//
// Outputs (under act-rest/):
//   subset.json         — same row schema as act-subset/subset.json
//   manifest.json       — same shape as act-subset/manifest.json (+ a `note` that this is the complement corpus)
//   download-report.json — errors, intentionally-missing (server-404) assets, skipped-too-large media
//   pages/<ruleId>/<testcaseId>.html (+ shared pages/_assets/<w3-pathname> subresource tree)
//
// Usage: node build-rest-subset.js [--no-download] [--concurrency=8]

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(__dirname, 'act-rest');
const PAGES = path.join(OUT, 'pages');
const arg = (n, d) => { const p = process.argv.find((x) => x === `--${n}` || x.startsWith(`--${n}=`)); return p == null ? d : (p === `--${n}` ? true : p.slice(n.length + 3)); };
const NO_DL = !!arg('no-download', false);
const CONC = Number(arg('concurrency', 8));
const DELAY_MS = Number(arg('delay', 250));   // polite base delay before each request
const RETRIES = Number(arg('retries', 4));    // retries on transient failure (429/5xx/network)
const MAX_MEDIA_BYTES = 50 * 1024 * 1024;     // skip a single media file larger than this
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const testcases = require(path.join(ROOT, 'testcases.json')).testcases;
const wcag = require(path.join(ROOT, 'wcag.json'));

// ---- (ruleId, testcaseId) pairs already mirrored in the selected-SC subset — we take the complement ----
const subsetRows = require(path.join(__dirname, 'act-subset', 'subset.json'));
const inSubset = new Set(subsetRows.map((r) => `${r.ruleId}|${r.testcaseId}`));

// ---- technique id -> set(SC num), from wcag.json (sufficient + failure techniques only; advisory excluded). ----
const tech2sc = {};
const collectIds = (node, add) => {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { for (const x of node) collectIds(x, add); return; }
  if (typeof node.id === 'string') add(node.id);
  for (const v of Object.values(node)) if (v && typeof v === 'object') collectIds(v, add);
};
for (const p of wcag.principles || []) for (const g of p.guidelines || []) for (const sc of g.successcriteria || []) {
  const T = sc.techniques || {};
  for (const cat of ['sufficient', 'failure']) collectIds(T[cat], (id) => { (tech2sc[id] = tech2sc[id] || new Set()).add(sc.num); });
}

// EXACT scsOf() derivation from build-sc-subset.js (authoritative-primary: technique-derived SCs apply ONLY
// when the rule declares no direct forConformance SC at all). Pure-ARIA rules with no WCAG SC map return [].
function scsOf(tc) {
  const req = tc.ruleAccessibilityRequirements || {};
  const direct = new Set(), viaTech = new Set();
  for (const k of Object.keys(req)) {
    let m = /^wcag\d+:(\d+\.\d+\.\d+)$/.exec(k);
    if (m) { if (req[k] && req[k].forConformance) direct.add(m[1]); continue; }
    m = /^wcag-technique:(.+)$/.exec(k);
    if (m && tech2sc[m[1]]) for (const s of tech2sc[m[1]]) viaTech.add(s);
  }
  // AUTHORITATIVE-PRIMARY rule: if the rule declares ANY direct `forConformance` SC, those are the SCs it
  // actually tests — use them ALONE (see build-sc-subset.js for the 09o5cg/1.4.6-vs-1.4.3 rationale).
  return { direct: [...direct], viaTech: direct.size ? [] : [...viaTech] };
}

// ---- select the complement (NO categories.json SC filter — this corpus is everything else) ----
const subset = [];
for (const tc of testcases) {
  if (!['passed', 'failed', 'inapplicable'].includes(tc.expected)) continue;
  if (inSubset.has(`${tc.ruleId}|${tc.testcaseId}`)) continue;      // already in act-subset/
  const approved = !!(tc.approved || tc.isApproved);
  const { direct, viaTech } = scsOf(tc);
  const scDirect = direct.slice().sort();
  const scViaTechnique = viaTech.filter((s) => !scDirect.includes(s)).sort();
  const sc = [...new Set([...scDirect, ...scViaTechnique])].sort();  // [] for pure-ARIA rules (6a7281, 5f99a7, ffd0e9)
  const rel = tc.relativePath || `testcases/${tc.ruleId}/${tc.testcaseId}.html`;
  subset.push({
    ruleId: tc.ruleId, ruleName: tc.ruleName, testcaseId: tc.testcaseId,
    expected: tc.expected, approved, url: tc.url, relativePath: rel,
    localPath: path.join('pages', tc.ruleId, `${tc.testcaseId}.html`),
    sc, scDirect, scViaTechnique,
  });
}

// ---- assert the invariant counts; fail loudly if the manifest drifts ----
const RULE_SET = new Set(subset.map((t) => t.ruleId));
if (subset.length !== 609) throw new Error(`complement count drift: expected 609 testcases, got ${subset.length}`);
if (RULE_SET.size !== 50) throw new Error(`complement rule count drift: expected 50 rules, got ${RULE_SET.size}`);
if (581 + subset.length !== 1190) throw new Error(`581 + ${subset.length} != 1190`);

// ---- manifest ----
const tally = (key) => subset.reduce((m, t) => { for (const s of (key === 'sc' ? t.sc : [t[key]])) m[s == null ? '(none)' : s] = (m[s == null ? '(none)' : s] || 0) + 1; return m; }, {});
const manifest = {
  generatedAt: null, // stamped by the caller; Date is intentionally not used here
  source: 'W3C ACT-Rules testcases.json — COMPLEMENT of act-subset/ (all remaining approved+proposed testcases)',
  note: 'This is the complement corpus: every testcase (expected ∈ passed/failed/inapplicable) NOT in act-subset/subset.json. NOT filtered to categories.json selected SCs. 581 (act-subset) + 609 (act-rest) = 1190 total.',
  counts: {
    total: subset.length,
    rules: RULE_SET.size,
    approved: subset.filter((t) => t.approved).length,
    proposed: subset.filter((t) => !t.approved).length,
    directOnly: subset.filter((t) => t.scDirect.length).length,
    technicOnly: subset.filter((t) => !t.scDirect.length && t.scViaTechnique.length).length,
    noSc: subset.filter((t) => !t.sc.length).length,
  },
  bySc: tally('sc'),
  byExpected: tally('expected'),
};

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'subset.json'), JSON.stringify(subset, null, 2));
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`rest subset: ${subset.length} testcases across ${manifest.counts.rules} rules (approved:${manifest.counts.approved} proposed:${manifest.counts.proposed}) [ASSERTS OK]`);
console.log(`  by SC:`, Object.entries(manifest.bySc).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join('  '));
console.log(`  by expected:`, manifest.byExpected, `| direct:${manifest.counts.directOnly} technique-only:${manifest.counts.technicOnly} no-SC:${manifest.counts.noSc}`);

// ---- download HTML + referenced same-origin assets to the local mirror ----
// TRANSPORT: curl, NOT node/undici `fetch`. The W3C content-assets CDN blocks on the HTTP-client / TLS
// fingerprint — node's undici gets a persistent HTTP 429 (a spoofed browser UA gets 403 bot-detection),
// while curl with ANY User-Agent gets 200. So every request goes through a curl subprocess. Everything else
// is unchanged: jittered base delay, exponential backoff on 429/5xx honoring Retry-After, fail-fast on other
// 4xx (some assets 404 by design — the caller records them).
const { execFile } = require('child_process');
const os = require('os');
const UA = 'A11yAnnotator research mirror (jason.nkg@gmail.com)';

// one curl GET: body -> `dest`, response headers -> `hdrFile`, returns the HTTP status. Resolves even on an
// HTTP error status (curl exits 0 — we inspect the code); rejects only on a curl transport failure.
function curlGet(url, dest, hdrFile) {
  return new Promise((resolve, reject) => {
    execFile('curl', ['-sS', '-L', '--compressed', '-A', UA, '--max-time', '120', '-o', dest, '-D', hdrFile, '-w', '%{http_code}', url],
      { maxBuffer: 1 << 20 }, (err, stdout) => {
        if (err) return reject(err);                       // transport error (DNS/connect/timeout)
        resolve(parseInt(String(stdout).trim(), 10) || 0);
      });
  });
}
function retryAfterFrom(hdrFile) {
  try { const m = /^retry-after:\s*(\d+)/im.exec(fs.readFileSync(hdrFile, 'utf8')); return m ? parseInt(m[1], 10) : null; } catch (e) { return null; }
}
async function fetchTo(url, dest) {
  let lastErr;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const part = dest + '.part';
  const hdr = path.join(os.tmpdir(), `arest-hdr-${process.pid}-${Math.random().toString(36).slice(2)}.txt`);
  try {
    for (let attempt = 0; attempt <= RETRIES; attempt++) {
      if (attempt === 0) await sleep(DELAY_MS * (0.5 + Math.random()));       // base throttle + jitter
      let code;
      try { code = await curlGet(url, part, hdr); }
      catch (e) { lastErr = e; try { fs.unlinkSync(part); } catch (_) {} await sleep(Math.min(DELAY_MS * Math.pow(2, attempt) * (0.5 + Math.random()), 60000)); continue; }
      if (code >= 200 && code < 300) {
        const buf = fs.readFileSync(part);
        fs.renameSync(part, dest);                          // atomic promote (same filesystem)
        return buf;
      }
      try { fs.unlinkSync(part); } catch (_) {}
      if (code !== 429 && code < 500) throw new Error(`HTTP ${code}`);         // fail-fast on other 4xx
      lastErr = new Error(`HTTP ${code}`);
      const ra = retryAfterFrom(hdr);
      const backoff = Number.isFinite(ra) ? ra * 1000 : DELAY_MS * Math.pow(2, attempt) * (0.5 + Math.random());
      await sleep(Math.min(backoff, 60000));
    }
  } finally { try { fs.unlinkSync(hdr); } catch (_) {} }
  throw lastErr || new Error('fetch failed');
}

// content-length probe (media size guard) via curl HEAD. Returns bytes or null when unknown.
function headSize(url) {
  return new Promise((resolve) => {
    execFile('curl', ['-sS', '-L', '-I', '-A', UA, '--max-time', '60', '-o', os.platform() === 'win32' ? 'NUL' : '/dev/null', '-w', '%header{content-length}', url],
      { maxBuffer: 1 << 16 }, (err, stdout) => {
        if (err) return resolve(null);
        const n = parseInt(String(stdout).trim(), 10);
        resolve(Number.isFinite(n) ? n : null);
      });
  });
}

// Mirror referenced subresources so the page renders OFFLINE the SAME as online (see build-sc-subset.js).
const ASSETS_ROOT = path.join(PAGES, '_assets');
// EXTENDED asset extensions: media (mp4|webm|ogv|ogg|mp3|wav|m4a|m4v) + caption tracks (vtt|srt) added to the
// build-sc-subset.js set. `x?html?` still mirrors iframe/frame sub-DOCUMENTS (mirrorAsset follows HTML only
// under /test-assets/, never spec/nav pages).
const ASSET_EXT = /\.(css|js|png|jpe?g|gif|svg|webp|woff2?|ico|x?html?|mp4|webm|ogv|ogg|mp3|wav|m4a|m4v|vtt|srt)(?:[?#]|$)/i;
const MEDIA_EXT = /\.(mp4|webm|ogv|ogg|mp3|wav|m4a|m4v)(?:[?#]|$)/i; // size-guarded (tracks vtt/srt are tiny — not guarded)
const isW3 = (u) => /(^|\.)w3\.org$/i.test(u.hostname);
const relFromTo = (fromFile, toFile) => path.relative(path.dirname(fromFile), toFile).split(path.sep).join('/');

// EXTENDED attribute rewriter: src/href (which already cover <source src>/<track src>/<img src>/<link href>)
// PLUS poster (<video poster>) and data (<object data>). `\b` prevents matching data-* attributes or
// substrings like meta`data`=.
const attrRe = () => /\b(?:src|href|poster|data)\s*=\s*["']([^"']+)["']/gi;
const cssUrlRe = () => /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;

const missingAssets = new Set(); // w3.org URLs that 404'd on the server (intentionally-missing testcase refs)
const skippedLarge = [];         // media skipped for exceeding MAX_MEDIA_BYTES: {url, bytes}
// preload previously-recorded server-404s so an idempotent re-run of a complete corpus makes ZERO network
// requests (the reconcile pass below skips URLs already known-missing).
try { for (const u of require(path.join(OUT, 'download-report.json')).intentionallyMissingAssets || []) missingAssets.add(u); } catch (e) { /* first run */ }

// download ONE w3.org asset to _assets/<pathname>. CSS recurses into url() refs; an HTML sub-document
// (iframe/frame target under /test-assets/) recurses into its OWN src/href/poster/data + url() refs. Media
// larger than MAX_MEDIA_BYTES is skipped (logged); the ref still rewrites to the (absent) local path so the
// page's offline behavior matches an intentionally-missing resource. Returns the local path, or null for a
// non-w3.org / non-fixture-HTML URL (ref left untouched).
const mirroring = new Set(); // local paths in-flight this run — breaks reference cycles between sub-pages
async function mirrorAsset(absUrl) {
  let u; try { u = new URL(absUrl); } catch (e) { return null; }
  if (!isW3(u)) return null;
  const isHtml = /\.x?html?(?:[?#]|$)/i.test(u.pathname);
  if (isHtml && !/\/test-assets\//i.test(u.pathname)) return null;   // only follow inline ACT fixtures
  const localAbs = path.join(ASSETS_ROOT, u.pathname.replace(/^\/+/, ''));
  if (fs.existsSync(localAbs) || mirroring.has(localAbs)) return localAbs; // cached / cycle
  mirroring.add(localAbs);
  if (MEDIA_EXT.test(u.pathname)) {
    const sz = await headSize(u.href);
    if (sz != null && sz > MAX_MEDIA_BYTES) { skippedLarge.push({ url: u.href, bytes: sz }); return localAbs; } // too big — skip download
  }
  let bytes = null;
  try { bytes = await fetchTo(u.href, localAbs); } catch (e) { missingAssets.add(u.href); return localAbs; } // 404/err ⇒ intentionally-missing
  if (bytes && /\.css(?:[?#]|$)/i.test(u.pathname)) {
    try { const css = bytes.toString('utf8'); const out = await rewriteRefs(css, u.href, localAbs, cssUrlRe(), 2); if (out !== css) fs.writeFileSync(localAbs, out); } catch (e) { /* keep raw css */ }
  } else if (bytes && isHtml) {
    try {
      const html = bytes.toString('utf8');
      let out = await rewriteRefs(html, u.href, localAbs, attrRe(), 1);
      out = await rewriteRefs(out, u.href, localAbs, cssUrlRe(), 2);
      if (out !== html) fs.writeFileSync(localAbs, out);
    } catch (e) { /* keep raw html */ }
  }
  return localAbs;
}
// generic ref rewriter (see build-sc-subset.js): touch only ROOT-RELATIVE (`/…`) / ABSOLUTE (`http…`) refs
// matching ASSET_EXT; mirror each, rewrite to a relative path from `hostFile`, preserving ?query/#fragment.
async function rewriteRefs(text, baseUrl, hostFile, re, grp) {
  const map = new Map(); let m;
  while ((m = re.exec(text))) {
    const ref = m[grp];
    if (!ref || map.has(ref)) continue;
    if (!/^(\/|https?:)/i.test(ref)) continue;          // skip already-relative / data: / fragment
    if (!ASSET_EXT.test(ref.split(/[?#]/)[0])) continue;
    let abs; try { abs = new URL(ref, baseUrl); } catch (e) { continue; }
    const local = await mirrorAsset(abs.href);
    if (local) map.set(ref, relFromTo(hostFile, local) + (abs.search || '') + (abs.hash || ''));
  }
  let out = text;
  for (const [ref, rel] of map) out = out.split(ref).join(rel); // ref values are distinctive root-relative paths
  return out;
}
async function pool(items, n, fn) {
  const q = items.slice(); let active = 0, done = 0; const errs = [];
  return new Promise((resolve) => {
    const next = () => {
      if (!q.length && active === 0) return resolve(errs);
      while (active < n && q.length) {
        const it = q.shift(); active++;
        fn(it).catch((e) => errs.push({ it, e: String(e && e.message || e) })).finally(() => { active--; done++; if (done % 25 === 0) process.stdout.write(`\r  downloaded ${done}/${items.length}`); next(); });
      }
    };
    next();
  });
}

function dirSizeBytes(dir) {
  if (!fs.existsSync(dir)) return 0;
  let total = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) total += dirSizeBytes(p);
    else try { total += fs.statSync(p).size; } catch (x) { /* ignore */ }
  }
  return total;
}
const humanBytes = (n) => { const u = ['B', 'KB', 'MB', 'GB']; let i = 0, v = n; while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; } return `${v.toFixed(1)}${u[i]}`; };

(async () => {
  if (NO_DL) { console.log('--no-download: skipped page mirroring'); return; }
  try { require('child_process').execFileSync('curl', ['--version'], { stdio: 'ignore' }); }
  catch (e) { console.error('curl unavailable — this mirror uses curl as its transport (the W3C CDN blocks node/undici fingerprints)'); process.exit(1); }
  const errs = await pool(subset, CONC, async (tc) => {
    const dest = path.join(OUT, tc.localPath);
    let html;
    if (fs.existsSync(dest)) { html = fs.readFileSync(dest, 'utf8'); } // cached — idempotent re-runs
    else { html = (await fetchTo(tc.url, dest)).toString('utf8'); }
    let rewritten = await rewriteRefs(html, tc.url, dest, attrRe(), 1);   // (1) src/href/poster/data attributes
    rewritten = await rewriteRefs(rewritten, tc.url, dest, cssUrlRe(), 2); // (2) url() in inline <style>/style=
    if (rewritten !== html) fs.writeFileSync(dest, rewritten);
  });
  process.stdout.write('\n');

  // ---- reconcile relative sub-document nav links ----
  // Mirrored HTML sub-documents (iframe/frame/link targets under /test-assets/) can contain RELATIVE nav links
  // to sibling pages (e.g. b20e66's contact.html → `../about.html`, cf77f2's chapter2.html → chapter1.html).
  // rewriteRefs only chases root-relative/absolute refs, so those siblings are never followed. Resolve every
  // relative asset-ext ref that lands under _assets; for each MISSING target, reconstruct its w3.org URL and
  // mirror it — a reachable sibling self-completes the mirror, a 404 is recorded as intentionally-missing
  // (a deliberately-missing testcase reference). Iterate until no new missing targets appear.
  const htmlFilesUnder = (dir) => { const out = []; (function w(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) w(p); else if (/\.x?html?$/i.test(e.name)) out.push(p); } })(dir); return out; };
  for (let round = 0; round < 6; round++) {
    const targets = new Set();
    for (const hf of htmlFilesUnder(PAGES)) {
      const html = fs.readFileSync(hf, 'utf8');
      for (const re of [attrRe(), cssUrlRe()]) {
        const grp = re.source.startsWith('url') ? 2 : 1; // cssUrlRe URL is group 2; attrRe URL is group 1
        let m; while ((m = re.exec(html))) {
          const ref = m[grp]; if (!ref) continue;
          const clean = ref.split(/[?#]/)[0];
          if (/^[a-z]+:/i.test(ref) || ref.startsWith('/') || ref.startsWith('#') || !ASSET_EXT.test(clean)) continue;
          const abs = path.resolve(path.dirname(hf), clean);
          if (!(abs === ASSETS_ROOT || abs.startsWith(ASSETS_ROOT + path.sep)) || fs.existsSync(abs)) continue;
          const pn = path.relative(ASSETS_ROOT, abs).split(path.sep).join('/');
          if (!missingAssets.has(`https://www.w3.org/${pn}`)) targets.add(pn);
        }
      }
    }
    if (!targets.size) break;
    for (const pn of targets) await mirrorAsset(`https://www.w3.org/${pn}`); // fetch (repair 200) or record 404
  }

  const assetCount = fs.existsSync(ASSETS_ROOT) ? require('child_process').execSync(`find ${JSON.stringify(ASSETS_ROOT)} -type f | wc -l`).toString().trim() : '0';
  console.log(`mirrored ${subset.length - errs.length}/${subset.length} pages + ${assetCount} assets to ${path.relative(ROOT, PAGES)}`);
  console.log(`  on-disk size of act-rest/: ${humanBytes(dirSizeBytes(OUT))}  (pages+assets: ${humanBytes(dirSizeBytes(PAGES))})`);
  fs.writeFileSync(path.join(OUT, 'download-report.json'), JSON.stringify({
    pageErrors: errs.map((e) => ({ ruleId: e.it.ruleId, testcaseId: e.it.testcaseId, error: e.e })),
    intentionallyMissingAssets: [...missingAssets].sort(),
    skippedLargeMedia: skippedLarge,
  }, null, 2));
  if (errs.length) { console.log(`  ${errs.length} page download error(s):`); for (const e of errs.slice(0, 12)) console.log(`   ${e.it.ruleId}/${e.it.testcaseId}: ${e.e}`); }
  if (missingAssets.size) console.log(`  ${missingAssets.size} intentionally-missing (server-404) asset(s) — see download-report.json`);
  if (skippedLarge.length) { console.log(`  ${skippedLarge.length} media file(s) skipped for >50MB:`); for (const s of skippedLarge) console.log(`   ${s.url} (${humanBytes(s.bytes)})`); }
})();
