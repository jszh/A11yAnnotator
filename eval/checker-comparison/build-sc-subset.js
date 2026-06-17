#!/usr/bin/env node
'use strict';
// Build a LOCAL, offline W3C ACT testcase subset scoped to THIS project's selected SCs (categories.json),
// so the harness can be scored/iterated without hitting the network every run.
//
// SC derivation per testcase (richer than run-v3-act-suite.js, which only reads direct `wcag20:` keys):
//   • direct      — `wcag20:X.X.X` requirement with `forConformance` (the rule authoritatively tests it);
//   • viaTechnique — `wcag-technique:T` resolved to its SC(s) through wcag.json (sufficient + failure
//                    techniques only; advisory excluded). This recovers cases that map to our SCs ONLY
//                    through a technique — the coverage the direct-key filter silently drops.
// A testcase is in the subset iff (direct ∪ viaTechnique) ∩ SELECTED ≠ ∅, it is `approved`, and its
// expected ∈ {passed, failed, inapplicable}.
//
// Outputs (under act-subset/):
//   subset.json   — [{ ruleId, ruleName, testcaseId, expected, url, localPath, sc[], scDirect[], scViaTechnique[] }]
//   manifest.json — provenance + counts (by SC, by expected, direct-vs-technique)
//   pages/<ruleId>/<testcaseId>.html (+ referenced same-origin assets)
//
// Usage: node build-sc-subset.js [--no-download] [--concurrency=12]

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(__dirname, 'act-subset');
const PAGES = path.join(OUT, 'pages');
const arg = (n, d) => { const p = process.argv.find((x) => x === `--${n}` || x.startsWith(`--${n}=`)); return p == null ? d : (p === `--${n}` ? true : p.slice(n.length + 3)); };
const NO_DL = !!arg('no-download', false);
const INCLUDE_PROPOSED = !!arg('include-proposed', false); // also pull non-approved (DRAFT) ACT rules — extra coverage to polish the pipeline
const CONC = Number(arg('concurrency', 8));
const DELAY_MS = Number(arg('delay', 250));   // polite base delay before each request
const RETRIES = Number(arg('retries', 4));    // retries on transient failure (429/5xx/network)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const testcases = require(path.join(ROOT, 'testcases.json')).testcases;
const wcag = require(path.join(ROOT, 'wcag.json'));
const cats = require(path.join(ROOT, 'categories.json'));

// ---- selected SCs (this project's 9 categories) ----
const SELECTED = new Set();
for (const k of Object.keys(cats)) { if (k === '_meta') continue; for (const s of cats[k].wcag_sc || []) SELECTED.add(s.id); }

// ---- technique id -> set(SC num), from wcag.json. Collect every `.id` under each SC's
//      techniques.{sufficient,failure} (advisory excluded — too weak to assert relevance). ----
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
  // actually tests — use them ALONE. A technique sufficient for several SCs (e.g. G17/G18 serve both 1.4.3
  // AND 1.4.6) must NOT pull a rule whose primary target is a stricter sibling — e.g. 09o5cg "Text has
  // enhanced contrast" (forConformance 1.4.6/AAA) — into the 1.4.3 bucket, where its `failed` examples (which
  // PASS 1.4.3 but fail the 7:1 enhanced threshold) would score as spurious v3 false-clears. Technique-derived
  // SCs apply ONLY when the rule declares no direct forConformance SC at all (e.g. role-validity rules).
  return { direct: [...direct], viaTech: direct.size ? [] : [...viaTech] };
}

// ---- select ----
const subset = [];
for (const tc of testcases) {
  const approved = !!(tc.approved || tc.isApproved);
  if (!approved && !INCLUDE_PROPOSED) continue;           // proposed (draft) rules only with --include-proposed
  if (!['passed', 'failed', 'inapplicable'].includes(tc.expected)) continue;
  const { direct, viaTech } = scsOf(tc);
  const scDirect = direct.filter((s) => SELECTED.has(s));
  const scViaTechnique = viaTech.filter((s) => SELECTED.has(s) && !scDirect.includes(s));
  const sc = [...new Set([...scDirect, ...scViaTechnique])].sort();
  if (!sc.length) continue;
  const rel = tc.relativePath || `testcases/${tc.ruleId}/${tc.testcaseId}.html`;
  subset.push({
    ruleId: tc.ruleId, ruleName: tc.ruleName, testcaseId: tc.testcaseId,
    expected: tc.expected, approved, url: tc.url, relativePath: rel,
    localPath: path.join('pages', tc.ruleId, `${tc.testcaseId}.html`),
    sc, scDirect, scViaTechnique,
  });
}

// ---- manifest ----
const tally = (key) => subset.reduce((m, t) => { for (const s of (key === 'sc' ? t.sc : [t[key]])) m[s] = (m[s] || 0) + 1; return m; }, {});
const manifest = {
  generatedAt: null, // stamped by the caller; Date is intentionally not used here
  source: 'W3C ACT-Rules testcases.json (approved)',
  selectedScs: [...SELECTED].sort(),
  includeProposed: INCLUDE_PROPOSED,
  counts: {
    total: subset.length,
    approved: subset.filter((t) => t.approved).length,
    proposed: subset.filter((t) => !t.approved).length,
    directOnly: subset.filter((t) => t.scDirect.length).length,
    technicOnly: subset.filter((t) => !t.scDirect.length && t.scViaTechnique.length).length,
    rules: new Set(subset.map((t) => t.ruleId)).size,
  },
  bySc: tally('sc'),
  byExpected: tally('expected'),
};

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'subset.json'), JSON.stringify(subset, null, 2));
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`subset: ${subset.length} testcases across ${manifest.counts.rules} rules (approved:${manifest.counts.approved} proposed:${manifest.counts.proposed})`);
console.log(`  by SC:`, Object.entries(manifest.bySc).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join('  '));
console.log(`  by expected:`, manifest.byExpected, `| direct:${manifest.counts.directOnly} technique-only:${manifest.counts.technicOnly}`);

// ---- download HTML + referenced same-origin assets to the local mirror ----
// polite, retrying fetch: a jittered base delay before each request, exponential backoff on a transient
// failure (429 / 5xx / network), honoring `Retry-After` when present. 4xx (≠429) fails fast (no point retrying).
async function fetchTo(url, dest) {
  let lastErr;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    if (attempt === 0) await sleep(DELAY_MS * (0.5 + Math.random()));        // base throttle + jitter
    try {
      const res = await fetch(url, { redirect: 'follow' });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, buf);
        return buf;
      }
      if (res.status !== 429 && res.status < 500) throw new Error(`HTTP ${res.status}`); // hard failure
      lastErr = new Error(`HTTP ${res.status}`);
      const ra = parseInt(res.headers.get('retry-after') || '', 10);
      const backoff = Number.isFinite(ra) ? ra * 1000 : DELAY_MS * Math.pow(2, attempt) * (0.5 + Math.random());
      await sleep(Math.min(backoff, 30000));
    } catch (e) {
      lastErr = e;
      if (/HTTP 4\d\d/.test(String(e.message)) && !/HTTP 429/.test(String(e.message))) throw e; // don't retry 4xx
      await sleep(Math.min(DELAY_MS * Math.pow(2, attempt) * (0.5 + Math.random()), 30000));     // network backoff
    }
  }
  throw lastErr || new Error('fetch failed');
}
// Mirror referenced subresources so the page renders OFFLINE the SAME as online. The testcases reference
// assets ROOT-RELATIVE (`/WAI/content-assets/.../test-assets/...`) — under file:// those resolve to the
// filesystem root and 404, so the barrier-creating CSS/PNG/JPG (contrast backgrounds, images-of-text, focus
// styles) silently vanish and the page renders benign (the corpus bug this fixes). We mirror every
// w3.org-hosted asset into a shared `_assets/<pathname>` tree and rewrite the refs to PORTABLE relative paths.
const ASSETS_ROOT = path.join(PAGES, '_assets');
// asset extensions we mirror. `x?html?` is included so iframe/frame sub-DOCUMENTS (whole HTML pages that
// render inline, e.g. the iframe-name rules) get mirrored too — but mirrorAsset only follows HTML under
// `/test-assets/` (the ACT fixtures), never spec/nav pages (/TR, …/Understanding/).
const ASSET_EXT = /\.(css|js|png|jpe?g|gif|svg|webp|woff2?|ico|x?html?)(?:[?#]|$)/i;
const isW3 = (u) => /(^|\.)w3\.org$/i.test(u.hostname);
const relFromTo = (fromFile, toFile) => path.relative(path.dirname(fromFile), toFile).split(path.sep).join('/');

// download ONE w3.org asset to _assets/<pathname>. CSS recurses into its url() refs; an HTML sub-document
// (iframe/frame target) recurses into its OWN src/href + url() refs so it renders offline too. Returns the
// local path (even on 404 — so the ref still rewrites to a missing-local file that 404s as the testcase
// intends), or null for a non-w3.org / unparseable URL, or a non-fixture HTML page (leave the ref untouched).
const mirroring = new Set(); // local paths in-flight this run — breaks reference cycles between sub-pages
async function mirrorAsset(absUrl) {
  let u; try { u = new URL(absUrl); } catch (e) { return null; }
  if (!isW3(u)) return null;
  const isHtml = /\.x?html?(?:[?#]|$)/i.test(u.pathname);
  // only follow HTML that is an ACT test fixture (renders inline via iframe/frame). Spec / Understanding /
  // TR pages are navigation — they never render inside the page under test, so leave those refs untouched.
  if (isHtml && !/\/test-assets\//i.test(u.pathname)) return null;
  const localAbs = path.join(ASSETS_ROOT, u.pathname.replace(/^\/+/, ''));
  if (fs.existsSync(localAbs) || mirroring.has(localAbs)) return localAbs; // cached / cycle
  mirroring.add(localAbs);
  let bytes = null;
  try { bytes = await fetchTo(u.href, localAbs); } catch (e) { return localAbs; } // 404/err ⇒ intentionally-missing
  if (bytes && /\.css(?:[?#]|$)/i.test(u.pathname)) {
    try { const css = bytes.toString('utf8'); const out = await rewriteRefs(css, u.href, localAbs, /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, 2); if (out !== css) fs.writeFileSync(localAbs, out); } catch (e) { /* keep raw css */ }
  } else if (bytes && isHtml) {
    try {
      const html = bytes.toString('utf8');
      let out = await rewriteRefs(html, u.href, localAbs, /(?:src|href)\s*=\s*["']([^"']+)["']/gi, 1);
      out = await rewriteRefs(out, u.href, localAbs, /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, 2);
      if (out !== html) fs.writeFileSync(localAbs, out);
    } catch (e) { /* keep raw html */ }
  }
  return localAbs;
}
// generic ref rewriter: find refs via `re` (capture group `grp` is the URL), mirror each w3.org asset, and
// replace the ref with a relative path from `hostFile`. Only ROOT-RELATIVE (`/…`) or ABSOLUTE (`http…`) refs
// are touched, so re-runs (refs already rewritten to `../_assets/…`) are idempotent.
async function rewriteRefs(text, baseUrl, hostFile, re, grp) {
  const map = new Map(); let m;
  while ((m = re.exec(text))) {
    const ref = m[grp];
    if (!ref || map.has(ref)) continue;
    if (!/^(\/|https?:)/i.test(ref)) continue;          // skip already-relative / data: / fragment
    if (!ASSET_EXT.test(ref.split(/[?#]/)[0])) continue;
    let abs; try { abs = new URL(ref, baseUrl); } catch (e) { continue; }
    const local = await mirrorAsset(abs.href);
    if (local) map.set(ref, relFromTo(hostFile, local));
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

(async () => {
  if (NO_DL) { console.log('--no-download: skipped page mirroring'); return; }
  if (typeof fetch !== 'function') { console.error('global fetch unavailable (need Node >=18) — rerun with --no-download or a newer Node'); process.exit(1); }
  const errs = await pool(subset, CONC, async (tc) => {
    const dest = path.join(OUT, tc.localPath);
    let html;
    if (fs.existsSync(dest)) { html = fs.readFileSync(dest, 'utf8'); } // cached — idempotent re-runs
    else { html = (await fetchTo(tc.url, dest)).toString('utf8'); }
    // mirror + rewrite the page's asset refs so the barrier-creating CSS/PNG render offline. Two passes:
    // (1) src/href attributes (img/script/link/iframe), (2) url() in inline <style>/style= (contrast
    // backgrounds, images-of-text are frequently set this way — pass 1 alone misses them).
    let rewritten = await rewriteRefs(html, tc.url, dest, /(?:src|href)\s*=\s*["']([^"']+)["']/gi, 1);
    rewritten = await rewriteRefs(rewritten, tc.url, dest, /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, 2);
    if (rewritten !== html) fs.writeFileSync(dest, rewritten);
  });
  process.stdout.write('\n');
  const assetCount = fs.existsSync(ASSETS_ROOT) ? require('child_process').execSync(`find ${JSON.stringify(ASSETS_ROOT)} -type f | wc -l`).toString().trim() : '0';
  console.log(`mirrored ${subset.length - errs.length}/${subset.length} pages + ${assetCount} assets to ${path.relative(ROOT, PAGES)}`);
  if (errs.length) { console.log(`  ${errs.length} download error(s):`); for (const e of errs.slice(0, 8)) console.log(`   ${e.it.ruleId}/${e.it.testcaseId}: ${e.e}`); }
})();
