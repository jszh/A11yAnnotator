'use strict';
// Derives the cross-engine analysis artifacts from ./evidence (the raw per-fixture findings produced
// by run.js) plus the installed engines' rule catalogs. Pure aggregation — re-run any time to rebuild:
//   ./evidence/sc-matrix.json  — per-SC × per-engine tally (violations/review, #fixtures) + perFixture counts
//   ./evidence/catalogs.json   — each engine's rule count, SC coverage, license, version
// Prints the SC matrix to stdout. Requires the engines installed (npm install) for catalogs.json.
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, 'evidence');
const TOOLS = ['axe', 'ibm', 'alfa', 'qualweb', 'htmlcs'];

// ---------- sc-matrix from raw evidence ----------
const files = fs.readdirSync(DIR).filter((f) => /\.json$/.test(f) && !/combined|catalogs|sc-matrix/.test(f));
const scTally = {}, perFixture = {};
for (const f of files) {
  const r = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
  perFixture[r.fixture] = {};
  for (const t of TOOLS) {
    const items = (r.byTool[t] || []).filter((x) => !x._error);
    perFixture[r.fixture][t] = { n: items.length, err: r.errors[t] || null };
    for (const it of items) for (const sc of (it.sc && it.sc.length ? it.sc : ['(unmapped)'])) {
      scTally[sc] = scTally[sc] || {}; scTally[sc][t] = scTally[sc][t] || { v: 0, r: 0, fx: new Set() };
      if (it.outcome === 'violation') scTally[sc][t].v++; else scTally[sc][t].r++;
      scTally[sc][t].fx.add(r.fixture);
    }
  }
}
const rows = Object.keys(scTally).filter((s) => /^\d/.test(s)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
const matrix = {};
for (const sc of rows) { matrix[sc] = {}; for (const t of TOOLS) { const c = scTally[sc][t]; matrix[sc][t] = c ? { v: c.v, r: c.r, fx: c.fx.size } : null; } }
fs.writeFileSync(path.join(DIR, 'sc-matrix.json'), JSON.stringify({ matrix, perFixture }, null, 1));

// ---------- catalogs from installed engines (best-effort; needs node_modules) ----------
try {
  const pj = (p) => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'node_modules', p, 'package.json'), 'utf8')); } catch (e) { return {}; } };
  const cat = { licenses: {}, versions: {} };
  for (const [k, p] of [['axe', 'axe-core'], ['ibm', 'accessibility-checker'], ['alfa', '@siteimprove/alfa-rules'], ['qualweb', '@qualweb/core'], ['htmlcs', 'html_codesniffer']]) { const j = pj(p); cat.licenses[k] = j.license || '?'; cat.versions[k] = j.version || '?'; }
  const axe = require('axe-core'); const axeRules = axe.getRules(); const axeSC = new Set();
  for (const r of axeRules) for (const t of (r.tags || [])) { const m = /^wcag(\d)(\d)(\d+)$/.exec(t); if (m) axeSC.add(`${m[1]}.${m[2]}.${m[3]}`); }
  cat.axe = { rules: axeRules.length, scCovered: [...axeSC].sort() };
  const rules = require('@siteimprove/alfa-rules').default; const arr = Array.isArray(rules) ? rules : [...rules]; const alfaSC = new Set();
  for (const r of arr) for (const q of (r.requirements ? [...r.requirements] : [])) { const j = q.toJSON ? q.toJSON() : q; if (j.type === 'criterion' && /^\d\.\d+\.\d+$/.test(j.chapter || '')) alfaSC.add(j.chapter); }
  cat.alfa = { rules: arr.length, scCovered: [...alfaSC].sort() };
  fs.writeFileSync(path.join(DIR, 'catalogs.json'), JSON.stringify(cat, null, 1));
} catch (e) { console.error('catalogs skipped (engines not installed?):', e.message); }

// ---------- print ----------
console.log('SC      | axe   ibm   alfa  qweb  htmlcs   (v/r = violations/review)');
for (const sc of rows) { const cell = (t) => { const c = matrix[sc][t]; return c ? `${c.v}/${c.r}` : '-'; }; console.log(sc.padEnd(8) + '| ' + TOOLS.map((t) => cell(t).padEnd(6)).join('')); }
