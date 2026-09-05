#!/usr/bin/env node
'use strict';

// Merge targeted retry runs back into a base GenA11y run, producing a combined run directory.
// A retry only ever REPLACES a case the base run recorded as an error — never a case that already
// produced a verdict — so a merged run cannot quietly swap a real verdict for a re-rolled one.
//
//   node eval/56-page-baselines/merge-gena11y-retries.js --base=<run> --retries=<run>,<run> --out=<run>

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');

function arg(name, def = null) {
  const exact = `--${name}`;
  const p = process.argv.find((x) => x === exact || x.startsWith(exact + '='));
  if (!p) return def;
  if (p.startsWith(exact + '=')) return p.slice(exact.length + 1);
  const next = process.argv[process.argv.indexOf(p) + 1];
  return next && !next.startsWith('--') ? next : true;
}

const BASE = path.resolve(ROOT, 'results', String(arg('base')));
const RETRIES = String(arg('retries', '')).split(',').filter(Boolean).map((r) => path.resolve(ROOT, 'results', r.trim()));
const OUT = path.resolve(ROOT, 'results', String(arg('out')));

const base = JSON.parse(fs.readFileSync(path.join(BASE, 'results.json'), 'utf8'));
const baseSummary = JSON.parse(fs.readFileSync(path.join(BASE, 'summary.json'), 'utf8'));
const byId = new Map(base.map((r) => [r.testcaseId, r]));

const applied = [];
const rejected = [];
for (const dir of RETRIES) {
  for (const r of JSON.parse(fs.readFileSync(path.join(dir, 'results.json'), 'utf8'))) {
    const cur = byId.get(r.testcaseId);
    if (!cur) { rejected.push({ testcaseId: r.testcaseId, why: 'not in base run' }); continue; }
    if (cur.outcome !== 'error') { rejected.push({ testcaseId: r.testcaseId, why: `base outcome is ${cur.outcome}, not error` }); continue; }
    if (r.outcome === 'error') { rejected.push({ testcaseId: r.testcaseId, why: 'retry also errored' }); continue; }
    byId.set(r.testcaseId, { ...r, recoveredFrom: path.basename(dir) });
    applied.push({ testcaseId: r.testcaseId, outcome: r.outcome, from: path.basename(dir) });
  }
}

const merged = base.map((r) => byId.get(r.testcaseId));
const tally = {};
for (const r of merged) tally[r.outcome] = (tally[r.outcome] || 0) + 1;
const flagged = merged.filter((r) => r.outcome === 'caught');
const summary = {
  ...baseSummary,
  runName: path.basename(OUT),
  merged: { base: path.basename(BASE), retries: RETRIES.map((r) => path.basename(r)), applied, rejected },
  tally,
  unlabeled: {
    ...baseSummary.unlabeled,
    covered: merged.filter((r) => r.outcome !== 'uncovered').length,
    uncovered: merged.filter((r) => r.outcome === 'uncovered').length,
    flagged: flagged.length,
    notFlagged: merged.filter((r) => r.outcome === 'missedAgree').length,
    noVerdict: merged.filter((r) => r.outcome === 'noVerdict').length,
    error: merged.filter((r) => r.outcome === 'error').length,
    violationElements: flagged.reduce((n, r) => n + ((r.gena11y || {}).violations || []).length, 0),
  },
};
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(merged, null, 2));
fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2));
console.log(`applied ${applied.length} recovery/recoveries:`);
for (const a of applied) console.log(`  ${a.testcaseId} -> ${a.outcome} (${a.from})`);
if (rejected.length) { console.log('rejected:'); for (const r of rejected) console.log(`  ${r.testcaseId}: ${r.why}`); }
console.log(`\nmerged tally:`, tally);
console.log(`wrote ${path.relative(ROOT, OUT)}/`);
