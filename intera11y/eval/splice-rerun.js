#!/usr/bin/env node
'use strict';
// Splice a rerun of some cases into a run.
//
//   node intera11y/eval/splice-rerun.js <run> <rerun>            each rerun case replaces the run's page report and row
//   node intera11y/eval/splice-rerun.js <run> <rerun> --criteria each rerun page's criteria replace those criteria in
//                                                                the run's page report (the rest of the report is
//                                                                kept); the case's row is recomputed as the runner
//                                                                computes it (src/core/rows.js)
//
// For a fix that affects a few cases (or a few criteria of a few cases) of a finished run: rerun them with
// --ids-file (and --sc) under the same settings, then splice. The run's results.json is kept as
// results.before-splice.json the first time, its manifest records each splice, and spliced rows carry "splicedFrom".
const fs = require('fs');
const path = require('path');
const { rowOf } = require('../src/core/rows.js');

const ROOT = path.join(__dirname, '..', '..');
const [run, rerun] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const byCriteria = process.argv.includes('--criteria');
if (!run || !rerun) { console.error('usage: splice-rerun.js <run> <rerun> [--criteria]'); process.exit(1); }
const A = path.join(ROOT, 'results', run), B = path.join(ROOT, 'results', rerun);
const rows = JSON.parse(fs.readFileSync(path.join(A, 'results.json'), 'utf8'));
const byId = new Map(rows.map((r, i) => [r.id, i]));
if (!fs.existsSync(path.join(A, 'results.before-splice.json'))) fs.copyFileSync(path.join(A, 'results.json'), path.join(A, 'results.before-splice.json'));

let n = 0;
const replaced = [];
for (const f of fs.readdirSync(path.join(B, 'pages'))) {
  const fresh = JSON.parse(fs.readFileSync(path.join(B, 'pages', f), 'utf8'));
  const id = fresh.case && fresh.case.id;
  if (!byId.has(id)) { console.error(`rerun case not in ${run}: ${id}`); process.exit(1); }
  if (fresh.error) { console.error(`rerun of ${id} errored (${String(fresh.error).slice(0, 120)}); not spliced`); process.exit(1); }
  let report = fresh;
  if (byCriteria) {
    const orig = JSON.parse(fs.readFileSync(path.join(A, 'pages', f), 'utf8'));
    for (const [sc, c] of Object.entries(fresh.criteria || {})) { orig.criteria[sc] = { ...c, splicedFrom: rerun }; replaced.push(`${id} ${sc}`); }
    report = orig;
  }
  fs.writeFileSync(path.join(A, 'pages', f), JSON.stringify(report));
  rows[byId.get(id)] = { ...rowOf(report.case, report), splicedFrom: rerun };
  n++;
}
fs.writeFileSync(path.join(A, 'results.json'), JSON.stringify(rows, null, 1));
const man = JSON.parse(fs.readFileSync(path.join(A, 'manifest.json'), 'utf8'));
const bm = JSON.parse(fs.readFileSync(path.join(B, 'manifest.json'), 'utf8'));
(man.splices = man.splices || []).push({ from: rerun, cases: n, criteria: byCriteria ? replaced : undefined, codeHash: bm.codeHash, at: new Date().toISOString() });
fs.writeFileSync(path.join(A, 'manifest.json'), JSON.stringify(man, null, 1));
console.log(`${run}: ${n} cases spliced from ${rerun}${byCriteria ? ` (${replaced.length} criteria)` : ''}`);
