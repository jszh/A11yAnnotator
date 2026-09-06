#!/usr/bin/env node
'use strict';
// Score any run (our harness, GenA11y, AccessGuru) against the supplementary-585 list.
// Join = testcaseId. Positive prediction = outcome === 'caught'; every other outcome
// (missedAgree, uncertain, noVerdict, noObligation, uncovered, error) is a negative
// prediction — the same convention as the suite summaries and the three-tool tables.
//
// Usage: node eval/act-augmented/_tools/score-supplementary-585.js <run> [<run> ...] [--json]
//   <run> is a results/<run>/ directory, or "<label>=<run>".
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const RESULTS = path.join(ROOT, 'results');
const CASES_PATH = path.join(__dirname, 'full-supplementary-585-cases.json');
const CASES_RAW = fs.readFileSync(CASES_PATH, 'utf8');
const CASES = JSON.parse(CASES_RAW);
// Corpus integrity guard. A resampled/edited case list does NOT raise an error on its own: every run
// would simply join N/N and report a smaller, plausible-looking denominator. So pin the size and print
// the digest, making every scoring attributable to a specific corpus version.
const CORPUS_SHA = require('crypto').createHash('sha256').update(CASES_RAW).digest('hex');
const EXPECTED_N = 585;
const EXPECTED_SHA = '65d80ffd530874a0440023366070941419c8c77903b7ca1d123bce71a07a1140'; // @ 5add266e
{
  const ids = new Set(CASES.map((c) => c.testcaseId || `aug-${c.sc}-${c.aspect}-${c.id}`));
  if (CASES.length !== EXPECTED_N || ids.size !== EXPECTED_N) {
    console.error(`FATAL: corpus is ${CASES.length} entries / ${ids.size} unique ids, expected ${EXPECTED_N}. `
      + 'The case list changed — every run would score against a different denominator. '
      + 'Re-derive the runs or update EXPECTED_N/EXPECTED_SHA deliberately.');
    process.exit(1);
  }
  if (CORPUS_SHA !== EXPECTED_SHA) {
    console.error(`WARN: corpus digest ${CORPUS_SHA.slice(0, 16)} != pinned ${EXPECTED_SHA.slice(0, 16)} `
      + '— same 585 ids, but content changed. Scores across runs are only comparable on one corpus version.');
  }
}
const asJson = process.argv.includes('--json');
const runs = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!runs.length) { console.error('usage: score-supplementary-585.js <run> [<run> ...] [--json]'); process.exit(2); }

const idOf = (c) => c.testcaseId || `aug-${c.sc}-${c.aspect}-${c.id}`;
const divide = (n, d) => (d ? n / d : null);
const pct = (v) => (v == null ? 'n/a' : `${(v * 100).toFixed(1)}%`);

function confusion(rows) {
  const c = { tp: 0, fp: 0, tn: 0, fn: 0 };
  for (const r of rows) {
    const pos = r.expected === 'failed';
    const pred = r.outcome === 'caught';
    if (pos && pred) c.tp++; else if (pos) c.fn++; else if (pred) c.fp++; else c.tn++;
  }
  return { ...c, precision: divide(c.tp, c.tp + c.fp), recall: divide(c.tp, c.tp + c.fn),
    f1: divide(2 * c.tp, 2 * c.tp + c.fp + c.fn), fpr: divide(c.fp, c.fp + c.tn), n: rows.length };
}

function scoreRun(spec) {
  const [label, run] = spec.includes('=') ? spec.split('=') : [spec, spec];
  const file = path.join(RESULTS, run, 'results.json');
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const rows = Array.isArray(raw) ? raw : (raw.results || raw.cases);
  const byId = new Map();
  for (const r of rows) {
    const id = r.testcaseId || (r.key ? `aug-${r.key.replace(/::/g, '-')}` : null);
    if (!id) continue;
    if (byId.has(id)) throw new Error(`${run}: duplicate testcaseId ${id}`);
    byId.set(id, r);
  }
  const joined = []; const missing = []; const outcomes = {};
  for (const c of CASES) {
    const r = byId.get(idOf(c));
    if (!r) { missing.push(idOf(c)); continue; }
    outcomes[r.outcome] = (outcomes[r.outcome] || 0) + 1;
    joined.push({ testcaseId: idOf(c), sc: c.sc, source: c.source, expected: c.expected, outcome: r.outcome });
  }
  const bySc = {};
  for (const sc of [...new Set(joined.map((r) => r.sc))].sort()) bySc[sc] = confusion(joined.filter((r) => r.sc === sc));
  return {
    label, run, rowsInFile: rows.length, joined: joined.length, missing, outcomes,
    overall: confusion(joined),
    human: confusion(joined.filter((r) => r.source === 'human-annotated')),
    generated: confusion(joined.filter((r) => r.source === 'generated-negative')),
    bySc,
  };
}

const scored = runs.map(scoreRun);
if (asJson) { console.log(JSON.stringify(scored, null, 2)); process.exit(0); }

const lines = ['| Run | joined | TP | FP | TN | FN | Precision | Recall | F1 | FPR | outcomes |', '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |'];
for (const s of scored) {
  const o = s.overall;
  lines.push(`| ${s.label} | ${s.joined}/585${s.missing.length ? ` (missing ${s.missing.length})` : ''} | ${o.tp} | ${o.fp} | ${o.tn} | ${o.fn} | ${pct(o.precision)} | ${pct(o.recall)} | ${pct(o.f1)} | ${pct(o.fpr)} | ${JSON.stringify(s.outcomes)} |`);
}
lines.push('', '| Run | slice | n | TP | FP | TN | FN | Precision | Recall | F1 | FPR |', '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
for (const s of scored) for (const [slice, c] of [['human-annotated (389)', s.human], ['generated-negative (196)', s.generated]]) {
  lines.push(`| ${s.label} | ${slice} | ${c.n} | ${c.tp} | ${c.fp} | ${c.tn} | ${c.fn} | ${pct(c.precision)} | ${pct(c.recall)} | ${pct(c.f1)} | ${pct(c.fpr)} |`);
}
console.log(lines.join('\n'));
console.log(`\ncorpus: ${CASES.length} cases, sha256 ${CORPUS_SHA.slice(0, 16)}…`);
for (const s of scored) if (s.missing.length) console.error(`WARN ${s.run}: ${s.missing.length} corpus cases absent from results.json (counted as absent, not negative): ${s.missing.slice(0, 5).join(', ')}${s.missing.length > 5 ? ' …' : ''}`);
