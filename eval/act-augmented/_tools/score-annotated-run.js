#!/usr/bin/env node
'use strict';
/**
 * Slice a finished run of run-annotated-suite.js by reliability stratum.
 *
 * The point of the split: "all annotated cases" mixes pages nobody questioned
 * with pages a human flagged and an adjudicator then cleared. The cleared slice
 * is the interesting one — a human looked at those pages and thought something
 * was wrong, and a checking pass disagreed. If the harness scores markedly worse
 * there than on the unflagged pages, the humans were seeing something real that
 * adjudication dismissed, and the "clear" verdicts need re-examination.
 *
 * Every metric here is a filter over the SAME run — nothing is re-executed.
 *
 * Usage:
 *   node eval/act-augmented/_tools/score-annotated-run.js <runName> [--by-sc] [--json out.json]
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..', '..', '..');
const runName = process.argv.slice(2).find((a) => !a.startsWith('--'));
if (!runName) { console.error('usage: score-annotated-run.js <runName> [--by-sc]'); process.exit(1); }
const DIR = path.join(REPO_ROOT, 'results', runName);
const BY_SC = process.argv.includes('--by-sc');

const results = JSON.parse(fs.readFileSync(path.join(DIR, 'results.json'), 'utf8'));
let manifest = null;
try { manifest = JSON.parse(fs.readFileSync(path.join(DIR, 'manifest.json'), 'utf8')); } catch { /* optional */ }

function metrics(rows) {
  const rec = rows.filter((r) => r.polarity === 'recall');
  const spec = rows.filter((r) => r.polarity === 'specificity');
  const tp = rec.filter((r) => r.outcome === 'caught').length;
  const fn = rec.length - tp;
  const fp = spec.filter((r) => r.falsePositive).length;
  const tn = spec.length - fp;
  const recall = rec.length ? tp / rec.length : null;
  const precision = (tp + fp) ? tp / (tp + fp) : null;
  const f1 = (recall && precision) ? (2 * recall * precision) / (recall + precision) : null;
  return {
    n: rows.length, gtFail: rec.length, gtPass: spec.length,
    tp, fn, fp, tn,
    recall, precision, f1,
    fpRate: spec.length ? fp / spec.length : null,
    errors: rows.filter((r) => r.outcome === 'error').length,
    outcomes: rows.reduce((a, r) => ((a[r.outcome] = (a[r.outcome] || 0) + 1), a), {}),
  };
}

/** Where the harness and the humans disagree — only meaningful on double-coded rows. */
function vsHumans(rows) {
  let n = 0, agree = 0;
  for (const r of rows) {
    const votes = (r.humanVotes || []).map((v) => v.issueExists);
    if (!votes.length) continue;
    const humanSaysIssue = votes.filter((v) => v === 'yes').length > votes.length / 2;
    const harnessFlagged = r.outcome === 'caught' || r.falsePositive === true;
    n++;
    if (humanSaysIssue === harnessFlagged) agree++;
  }
  return { n, agree, rate: n ? agree / n : null };
}

const pct = (x) => (x == null ? '   —  ' : (x * 100).toFixed(1).padStart(5) + '%');
const f3 = (x) => (x == null ? '  —  ' : x.toFixed(3));

const strata = [...new Set(results.map((r) => r.stratum || 'unflagged'))];
const ORDER = ['unflagged', 'clear', 'fixed', 'needs-validation'];
strata.sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));

const slices = {};
slices.ALL = metrics(results);
for (const s of strata) slices[s] = metrics(results.filter((r) => (r.stratum || 'unflagged') === s));
// the headline comparison: everything nobody questioned, vs everything a human questioned
slices['ALL-flagged (clear+fixed)'] = metrics(results.filter((r) => ['clear', 'fixed'].includes(r.stratum)));

console.log(`\n=== ${runName} — ${manifest?.model || '?'} — tools ${manifest?.tools ? 'ON' : 'OFF'} — n=${results.length}`);
if (manifest?.commit) console.log(`    commit ${manifest.commit.slice(0, 12)}   started ${manifest.startedAt}`);

// An errored case has no polarity, so it silently leaves BOTH denominators —
// the eval shrinks instead of failing. Say so before any metric is read.
const errAll = results.filter((r) => r.outcome === 'error');
if (errAll.length) {
  const p = (errAll.length / results.length) * 100;
  console.log(`\n    ${p > 2 ? '*** ' : ''}${errAll.length}/${results.length} cases ERRORED (${p.toFixed(1)}%) and are excluded from every denominator below${p > 2 ? ' — these are NOT corpus-level results ***' : ''}`);
  const kinds = errAll.reduce((a, r) => ((a[String(r.error).slice(0, 60)] = (a[String(r.error).slice(0, 60)] || 0) + 1), a), {});
  for (const [k, v] of Object.entries(kinds).sort((a, b) => b[1] - a[1]).slice(0, 3)) console.log(`      ${v}× ${k}`);
}
console.log(`\n${'slice'.padEnd(26)} ${'n'.padStart(4)} ${'GTfail'.padStart(6)} ${'recall'.padStart(15)} ${'FP'.padStart(15)} ${'prec'.padStart(6)} ${'F1'.padStart(6)} ${'err'.padStart(4)}`);
console.log('-'.repeat(94));
for (const [name, m] of Object.entries(slices)) {
  console.log(`${name.padEnd(26)} ${String(m.n).padStart(4)} ${String(m.gtFail).padStart(6)} `
    + `${`${m.tp}/${m.gtFail}`.padStart(8)}${pct(m.recall)} ${`${m.fp}/${m.gtPass}`.padStart(8)}${pct(m.fpRate)} `
    + `${pct(m.precision).trim().padStart(6)} ${f3(m.f1).padStart(6)} ${String(m.errors).padStart(4)}`);
}

console.log(`\nharness vs the humans' own majority judgment (does an issue exist?):`);
for (const s of ['ALL', ...strata]) {
  const rows = s === 'ALL' ? results : results.filter((r) => (r.stratum || 'unflagged') === s);
  const v = vsHumans(rows);
  console.log(`  ${s.padEnd(24)} ${v.agree}/${v.n} = ${pct(v.rate)}`);
}

if (BY_SC) {
  console.log(`\nby SC (all strata in run):`);
  const bySc = {};
  for (const r of results) for (const sc of (r.sc || [])) (bySc[sc] ||= []).push(r);
  console.log(`  ${'sc'.padEnd(8)} ${'n'.padStart(4)} ${'recall'.padStart(15)} ${'FP'.padStart(15)} ${'F1'.padStart(6)}`);
  for (const [sc, rows] of Object.entries(bySc).sort()) {
    const m = metrics(rows);
    console.log(`  ${sc.padEnd(8)} ${String(m.n).padStart(4)} ${`${m.tp}/${m.gtFail}`.padStart(8)}${pct(m.recall)} ${`${m.fp}/${m.gtPass}`.padStart(8)}${pct(m.fpRate)} ${f3(m.f1).padStart(6)}`);
  }
}

const jIdx = process.argv.indexOf('--json');
const dest = jIdx > -1 ? path.resolve(process.argv[jIdx + 1]) : path.join(DIR, 'sliced-metrics.json');
fs.writeFileSync(dest, JSON.stringify({
  schema: 'act-augmented-annotated-slices/1', runName, model: manifest?.model, commit: manifest?.commit,
  generatedAt: new Date().toISOString(), slices,
  vsHumans: Object.fromEntries(['ALL', ...strata].map((s) => [s, vsHumans(s === 'ALL' ? results : results.filter((r) => (r.stratum || 'unflagged') === s))])),
}, null, 2));
console.log(`\nwrote ${path.relative(REPO_ROOT, dest)}`);
