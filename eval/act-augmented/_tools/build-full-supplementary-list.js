#!/usr/bin/env node
'use strict';

/**
 * Build the complete supplementary benchmark case list:
 *   1. reliable human-annotated cases (needs-validation excluded), plus
 *   2. every active generated-negative run list, deduplicated by case key.
 *
 * The generated lists intentionally overlap after later revisions reused a
 * stronger fixture. Running the same HTML twice would overweight it, so this
 * builder records all source lists but emits each case key exactly once.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const AUG = path.join(ROOT, 'eval', 'act-augmented');
const OUT = path.join(__dirname, 'full-supplementary-585-cases.json');
const GENERATED_LISTS = [
  'gena11y-fp-50-run-cases.json',
  'gena11y-fp-50-v2-run-cases.json',
  // Load the revised 105 last so its current type/pair metadata wins where a
  // case was reused from an earlier generated-negative list.
  'initial-105-cases.json',
];

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const keyOf = (row) => row.key || `${row.sc}::${row.aspect}::${row.id}`;

function reliabilityTags() {
  const p = path.join(AUG, '_annotator', 'irr', 'case-reliability-tags.json');
  const out = new Map();
  if (!fs.existsSync(p)) return out;
  for (const row of readJson(p).cases || []) out.set(row.key, row.tag);
  return out;
}

function humanAnnotations() {
  const out = new Map();
  const dir = path.join(ROOT, 'annotations');
  for (const name of fs.readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
    const doc = readJson(path.join(dir, name));
    const who = doc.meta?.annotatorName || name;
    for (const [key, annotation] of Object.entries(doc.annotations || {})) {
      if (!out.has(key)) out.set(key, []);
      out.get(key).push({ annotator: who, issueExists: annotation.issueExists });
    }
  }
  return out;
}

function loadHumanCases() {
  const tags = reliabilityTags();
  const annotations = humanAnnotations();
  const rows = [];

  for (const sc of fs.readdirSync(AUG).sort()) {
    const resultPath = path.join(AUG, sc, 'result.json');
    if (!fs.existsSync(resultPath)) continue;
    const result = readJson(resultPath);
    for (const aspectResult of result.aspectResults || []) {
      const built = aspectResult.built || {};
      const aspect = built.aspectSlug || aspectResult.aspect || 'aspect';
      for (const page of built.pages || []) {
        const key = `${sc}::${aspect}::${page.id}`;
        if (!annotations.has(key)) continue;
        const stratum = tags.get(key) || 'unflagged';
        if (stratum === 'needs-validation') continue;
        rows.push({
          key,
          sc,
          aspect,
          id: page.id,
          file: page.file,
          docFile: page.docFile || null,
          expected: page.expected,
          source: 'human-annotated',
          stratum,
          humanVotes: annotations.get(key),
        });
      }
    }
  }
  return rows;
}

function loadGeneratedCases() {
  const byKey = new Map();
  for (const name of GENERATED_LISTS) {
    const rows = readJson(path.join(__dirname, name));
    if (!Array.isArray(rows)) throw new Error(`${name} must contain an array`);
    for (const row of rows) {
      const key = keyOf(row);
      const prior = byKey.get(key);
      byKey.set(key, {
        ...row,
        key,
        source: 'generated-negative',
        stratum: 'generated-negative',
        generatedSources: [...new Set([...(prior?.generatedSources || []), name])],
      });
    }
  }
  return [...byKey.values()];
}

function tally(rows, field) {
  return Object.fromEntries(Object.entries(rows.reduce((out, row) => {
    const key = row[field] || 'unknown';
    out[key] = (out[key] || 0) + 1;
    return out;
  }, {})).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true })));
}

const human = loadHumanCases();
const generated = loadGeneratedCases();
const humanKeys = new Set(human.map(keyOf));
const overlap = generated.filter((row) => humanKeys.has(keyOf(row)));
if (overlap.length) throw new Error(`human/generated overlap: ${overlap.map(keyOf).join(', ')}`);

const cases = [...human, ...generated].sort((a, b) =>
  a.sc.localeCompare(b.sc, undefined, { numeric: true })
  || a.aspect.localeCompare(b.aspect)
  || a.id.localeCompare(b.id, undefined, { numeric: true })
  || a.source.localeCompare(b.source));

const unique = new Set(cases.map(keyOf));
for (const row of cases) {
  if (!fs.existsSync(path.join(ROOT, row.file))) throw new Error(`missing fixture: ${row.file}`);
}

const expected = { human: 389, generated: 196, total: 585 };
if (human.length !== expected.human || generated.length !== expected.generated
    || cases.length !== expected.total || unique.size !== expected.total) {
  throw new Error(`unexpected counts: ${JSON.stringify({ human: human.length, generated: generated.length, total: cases.length, unique: unique.size })}`);
}

fs.writeFileSync(OUT, JSON.stringify(cases, null, 2) + '\n');
console.log(JSON.stringify({
  output: path.relative(ROOT, OUT),
  human: human.length,
  generatedEntriesBeforeDedupe: GENERATED_LISTS.reduce((n, name) => n + readJson(path.join(__dirname, name)).length, 0),
  generated: generated.length,
  generatedDuplicatesRemoved: 7,
  total: cases.length,
  unique: unique.size,
  expected: tally(cases, 'expected'),
  bySource: tally(cases, 'source'),
  bySc: tally(cases, 'sc'),
}, null, 2));
