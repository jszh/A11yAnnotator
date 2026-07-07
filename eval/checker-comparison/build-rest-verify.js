#!/usr/bin/env node
'use strict';
// Task C verification for the act-rest/ corpus (non-render checks 1,2,3,5; idempotency check 6). The offline
// puppeteer render spot-check (check 4) is a separate script (build-rest-render-check.js).
//
// Usage: node build-rest-verify.js

const fs = require('fs');
const path = require('path');

const HERE = __dirname;
const OUT = path.join(HERE, 'act-rest');
const PAGES = path.join(OUT, 'pages');
const ASSETS = path.join(PAGES, '_assets');
const subset = require(path.join(OUT, 'subset.json'));
const report = fs.existsSync(path.join(OUT, 'download-report.json')) ? require(path.join(OUT, 'download-report.json')) : { intentionallyMissingAssets: [], skippedLargeMedia: [] };
const subsetMain = require(path.join(HERE, 'act-subset', 'subset.json'));

const ASSET_EXT = /\.(css|js|png|jpe?g|gif|svg|webp|woff2?|ico|x?html?|mp4|webm|ogv|ogg|mp3|wav|m4a|m4v|vtt|srt)(?:[?#]|$)/i;
const bad = [];  // { kind, page, ref } problems
let ok = true;
const fail = (msg) => { ok = false; console.log(`  ✗ ${msg}`); };
const pass = (msg) => console.log(`  ✓ ${msg}`);

// intentionally-absent local targets (server-404 + skipped-too-large), keyed by _assets pathname
const absentPaths = new Set();
for (const u of report.intentionallyMissingAssets || []) { try { absentPaths.add(new URL(u).pathname.replace(/^\/+/, '')); } catch (e) { } }
for (const s of report.skippedLargeMedia || []) { try { absentPaths.add(new URL(s.url).pathname.replace(/^\/+/, '')); } catch (e) { } }

// ---------- Check 1: every localPath exists, non-empty, looks like HTML ----------
// ACT fixtures can be legitimately tiny/minimal markup fragments (e.g. `<math aria-hidden="false"></math>`,
// `<html lang="FR"></html>`, SVG-only text-spacing cases). fetchTo only writes on res.ok, so a saved file is
// always a real testcase body — validity = non-empty AND starts with a markup token (`<` / doctype / BOM).
console.log('\n[Check 1] localPath exists + non-empty markup fragment (SVG/MathML/HTML fixtures all allowed)');
let missing1 = 0, empty1 = 0, nonmarkup1 = 0;
for (const r of subset) {
  const p = path.join(OUT, r.localPath);
  if (!fs.existsSync(p)) { missing1++; bad.push({ kind: 'missing-page', page: r.localPath }); continue; }
  const buf = fs.readFileSync(p);
  if (buf.length === 0) { empty1++; bad.push({ kind: 'empty-page', page: r.localPath }); continue; }
  const head = buf.toString('utf8', 0, 400).replace(/^﻿/, '').trimStart();
  if (head[0] !== '<') { nonmarkup1++; bad.push({ kind: 'non-markup', page: r.localPath, head: head.slice(0, 40) }); }
}
if (missing1 || empty1 || nonmarkup1) fail(`missing:${missing1} empty:${empty1} non-markup:${nonmarkup1} of ${subset.length}`);
else pass(`all ${subset.length} pages present, non-empty, markup fragments`);

// ---------- Checks 2 & 3: ref scan ----------
console.log('\n[Check 2] no unrewritten root-relative /WAI/... or absolute w3.org asset refs (nav HTML + intentionally-missing allowed)');
console.log('[Check 3] every rewritten LOCAL asset ref resolves to a file under _assets (or is intentionally-absent)');
const attrRe = /\b(?:src|href|poster|data)\s*=\s*["']([^"']+)["']/gi;
const cssUrlRe = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;
const isNavHtml = (p) => /\.x?html?(?:[?#]|$)/i.test(p) && !/\/test-assets\//i.test(p);
let rootRel = 0, absW3 = 0, localMissing = 0, localOk = 0;
const allPages = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (p !== ASSETS || true) walk(p); } else if (/\.x?html?$/i.test(e.name)) allPages.push(p); } })(PAGES);
const missingSamples = [];
for (const pg of allPages) {
  const html = fs.readFileSync(pg, 'utf8');
  const refs = new Set(); let m;
  attrRe.lastIndex = 0; while ((m = attrRe.exec(html))) refs.add(m[1]);
  cssUrlRe.lastIndex = 0; while ((m = cssUrlRe.exec(html))) refs.add(m[2]);
  for (const ref of refs) {
    const clean = ref.split(/[?#]/)[0];
    if (/^data:/i.test(ref) || ref.startsWith('#') || ref.startsWith('mailto:')) continue;
    // Check 2a: root-relative asset ref that should have been rewritten
    if (ref.startsWith('/') && !ref.startsWith('//') && ASSET_EXT.test(clean) && /^\/(WAI|test-assets)\//i.test(ref)) {
      rootRel++; bad.push({ kind: 'root-relative', page: path.relative(OUT, pg), ref }); continue;
    }
    // Check 2b: absolute w3.org asset ref remaining
    let u = null; try { u = /^https?:/i.test(ref) ? new URL(ref) : null; } catch (e) { }
    if (u && /(^|\.)w3\.org$/i.test(u.hostname) && ASSET_EXT.test(clean) && !isNavHtml(u.pathname)) {
      const pn = u.pathname.replace(/^\/+/, '');
      if (!absentPaths.has(pn)) { absW3++; bad.push({ kind: 'absolute-w3', page: path.relative(OUT, pg), ref }); }
      continue;
    }
    // Check 3: local (relative) asset ref -> RESOLVE against the page dir and confirm it lands on a real file
    // under _assets. Resolve rather than string-match: a rewritten ref like `../../../../../test-assets/x.html`
    // lands INSIDE _assets/ without containing the literal "_assets/" substring.
    if (!/^[a-z]+:/i.test(ref) && !ref.startsWith('/') && !ref.startsWith('#') && ASSET_EXT.test(clean)) {
      const abs = path.resolve(path.dirname(pg), clean);
      if (!(abs === ASSETS || abs.startsWith(ASSETS + path.sep))) continue; // not a mirrored-asset target (e.g. sibling nav)
      if (fs.existsSync(abs)) { localOk++; continue; }
      const pn = path.relative(ASSETS, abs).split(path.sep).join('/');
      if (absentPaths.has(pn)) continue; // intentionally absent (server-404 or skipped-large)
      localMissing++; if (missingSamples.length < 20) missingSamples.push(`${path.relative(OUT, pg)} -> ${ref}  (w3: https://www.w3.org/${pn})`);
      bad.push({ kind: 'local-missing', page: path.relative(OUT, pg), ref, w3url: `https://www.w3.org/${pn}` });
    }
  }
}
if (rootRel) fail(`${rootRel} unrewritten root-relative asset ref(s)`); else pass('no unrewritten root-relative /WAI/ or /test-assets/ asset refs');
if (absW3) fail(`${absW3} unrewritten absolute w3.org asset ref(s)`); else pass('no unrewritten absolute w3.org asset refs (beyond nav HTML + intentionally-absent)');
if (localMissing) { fail(`${localMissing} local asset ref(s) point to a missing file (not on intentionally-absent list)`); for (const s of missingSamples) console.log(`      ${s}`); }
else pass(`all ${localOk} rewritten local asset refs resolve (intentionally-absent: ${absentPaths.size})`);

// ---------- Check 5: counts reconcile + no overlap ----------
console.log('\n[Check 5] counts reconcile (609/50), per-rule + per-SC totals, no overlap with act-subset');
const inMain = new Set(subsetMain.map((r) => `${r.ruleId}|${r.testcaseId}`));
const overlap = subset.filter((r) => inMain.has(`${r.ruleId}|${r.testcaseId}`));
const ruleSet = new Set(subset.map((r) => r.ruleId));
if (subset.length !== 609) fail(`testcase count ${subset.length} != 609`); else pass('609 testcases');
if (ruleSet.size !== 50) fail(`rule count ${ruleSet.size} != 50`); else pass('50 rules');
if (overlap.length) fail(`${overlap.length} row(s) overlap act-subset`); else pass('zero overlap with act-subset/subset.json');

const byRule = {};
for (const r of subset) { const g = byRule[r.ruleId] = byRule[r.ruleId] || { name: r.ruleName, n: 0, exp: {}, sc: new Set() }; g.n++; g.exp[r.expected] = (g.exp[r.expected] || 0) + 1; for (const s of r.sc) g.sc.add(s); }
console.log('\n  ruleId    n   passed/failed/inapp   SCs                         name');
for (const id of Object.keys(byRule).sort()) {
  const g = byRule[id];
  const e = `${g.exp.passed || 0}/${g.exp.failed || 0}/${g.exp.inapplicable || 0}`;
  console.log(`  ${id}  ${String(g.n).padStart(3)}   ${e.padEnd(18)}  ${([...g.sc].sort().join(',') || '(none)').padEnd(26)}  ${g.name}`);
}
const bySc = {}; for (const r of subset) for (const s of (r.sc.length ? r.sc : ['(no-SC)'])) bySc[s] = (bySc[s] || 0) + 1;
console.log('\n  per-SC totals:', Object.entries(bySc).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join('  '));

console.log(`\n${ok ? 'PASS' : 'FAIL'} — non-render checks. total problems: ${bad.length}`);
if (report.intentionallyMissingAssets && report.intentionallyMissingAssets.length) console.log(`intentionally-missing (server-404) assets: ${report.intentionallyMissingAssets.length}`);
if (report.skippedLargeMedia && report.skippedLargeMedia.length) console.log(`skipped >50MB media: ${report.skippedLargeMedia.length}`);
process.exit(ok ? 0 : 1);
