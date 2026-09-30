#!/usr/bin/env node
'use strict';
// Splice a rerun of some cases into a run: each case the rerun holds replaces the run's page report and result row.
//
//   node intera11y/eval/splice-rerun.js <run> <rerun>
//
// For a fix that affects a few cases of a finished run (rerun them with --ids-file under the same settings). The
// run's results.json is kept as results.before-splice.json the first time, its manifest records the splice, and
// each spliced row carries "splicedFrom": <rerun>.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const [run, rerun] = process.argv.slice(2);
if (!run || !rerun) { console.error('usage: splice-rerun.js <run> <rerun>'); process.exit(1); }
const A = path.join(ROOT, 'results', run), B = path.join(ROOT, 'results', rerun);
const rows = JSON.parse(fs.readFileSync(path.join(A, 'results.json'), 'utf8'));
const fresh = new Map(JSON.parse(fs.readFileSync(path.join(B, 'results.json'), 'utf8')).map((r) => [r.id, r]));
if (!fs.existsSync(path.join(A, 'results.before-splice.json'))) fs.copyFileSync(path.join(A, 'results.json'), path.join(A, 'results.before-splice.json'));
let n = 0;
const out = rows.map((r) => { const f = fresh.get(r.id); if (!f) return r; n++; return { ...f, splicedFrom: rerun }; });
const missing = [...fresh.keys()].filter((id) => !rows.some((r) => r.id === id));
if (missing.length) { console.error(`rerun cases not in ${run}: ${missing.slice(0, 5).join(' | ')}`); process.exit(1); }
// page reports: the rerun's file for each spliced case replaces the run's
for (const f of fs.readdirSync(path.join(B, 'pages'))) fs.copyFileSync(path.join(B, 'pages', f), path.join(A, 'pages', f));
fs.writeFileSync(path.join(A, 'results.json'), JSON.stringify(out, null, 1));
const man = JSON.parse(fs.readFileSync(path.join(A, 'manifest.json'), 'utf8'));
const bm = JSON.parse(fs.readFileSync(path.join(B, 'manifest.json'), 'utf8'));
(man.splices = man.splices || []).push({ from: rerun, cases: n, codeHash: bm.codeHash, at: new Date().toISOString() });
fs.writeFileSync(path.join(A, 'manifest.json'), JSON.stringify(man, null, 1));
console.log(`${run}: ${n} cases spliced from ${rerun}`);
