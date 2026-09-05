#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const RESULTS = path.join(ROOT, 'results');
const CASES = path.join(__dirname, 'full-supplementary-585-cases.json');
const OUTPUT_JSON = path.join(RESULTS, 'combined-act458-supplementary585-ours-gem35lite-vs-gem37-by-sc.json');
const OUTPUT_MD = path.join(RESULTS, 'combined-act458-supplementary585-ours-gem35lite-vs-gem37-by-sc.md');

const INCLUDED_SCS = [
  '1.1.1', '1.3.1', '1.3.3', '1.3.5', '1.4.1', '1.4.3', '1.4.4', '1.4.5',
  '1.4.12', '1.4.13', '2.1.1', '2.1.2', '2.2.1', '2.2.2', '2.4.1', '2.4.2',
  '2.4.3', '2.4.4', '2.4.6', '2.4.7', '2.5.3', '3.3.1', '4.1.2', '4.1.3'
];

const RUNS = {
  flashLite: {
    label: 'Gemini 3.5 Flash Lite',
    act: 'fn-llm-gemini35-flash-lite-server',
    supplementary: 'supplementary585-gemini35-flash-lite-97d00f4'
  },
  flash: {
    label: 'Gemini 3.7 Flash',
    act: 'fn-llm-gemini37-flash-server',
    supplementaryHuman: [
      'annot-overlap6-gemini37-current-48fa8580',
      'annot-rest4-gemini37-current-48fa8580'
    ],
    // Later maps override earlier ones, matching build-full-supplementary-list.js's fixture priority.
    supplementaryGenerated: [
      'fp50-ours-gem37-current-v2',
      'fp50v2-ours-gem37-current-retry',
      'context26-v4-ours-gem37',
      'initial79-context-v3-ours-gem37'
    ]
  }
};

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const readRun = (name) => readJson(path.join(RESULTS, name, 'results.json'));
const keyOf = (row) => row.key || `${row.sc}::${row.aspect}::${row.id}`;

function confusion(rows) {
  const out = { tp: 0, fp: 0, tn: 0, fn: 0 };
  for (const row of rows) {
    const expectedPositive = (row.effectiveExpected || row.expected) === 'failed';
    const predictedPositive = row.outcome === 'caught';
    if (expectedPositive && predictedPositive) out.tp++;
    else if (expectedPositive) out.fn++;
    else if (predictedPositive) out.fp++;
    else out.tn++;
  }
  return out;
}

function metrics(c) {
  const divide = (n, d) => d ? n / d : null;
  return {
    ...c,
    positives: c.tp + c.fn,
    negatives: c.fp + c.tn,
    cases: c.tp + c.fp + c.tn + c.fn,
    precision: divide(c.tp, c.tp + c.fp),
    recall: divide(c.tp, c.tp + c.fn),
    fpr: divide(c.fp, c.fp + c.tn)
  };
}

function assertConfusion(label, actual, expected) {
  for (const key of ['tp', 'fp', 'tn', 'fn']) {
    if (actual[key] !== expected[key]) throw new Error(`${label} ${key}: expected ${expected[key]}, got ${actual[key]}`);
  }
}

function reconstructFlashSupplementary(corpus) {
  const human = new Map();
  for (const run of RUNS.flash.supplementaryHuman) {
    for (const row of readRun(run)) {
      if (human.has(row.key)) throw new Error(`duplicate human Gemini 3.7 result: ${row.key}`);
      human.set(row.key, row);
    }
  }
  const generated = new Map();
  for (const run of RUNS.flash.supplementaryGenerated) {
    for (const row of readRun(run)) generated.set(row.key, row);
  }
  const rows = corpus.map((item) => {
    const result = (item.source === 'human-annotated' ? human : generated).get(keyOf(item));
    if (!result) throw new Error(`missing Gemini 3.7 supplementary result: ${keyOf(item)}`);
    if (result.outcome === 'error') throw new Error(`Gemini 3.7 supplementary execution error: ${keyOf(item)}`);
    return { ...result, expected: item.expected, sc: [item.sc], key: keyOf(item) };
  });
  if (rows.length !== 585 || new Set(rows.map((row) => row.key)).size !== 585) throw new Error('Gemini 3.7 supplementary reconstruction is not 585 unique cases');
  return rows;
}

function rowsBySc(rows, sc) {
  return rows.filter((row) => (Array.isArray(row.sc) ? row.sc : [row.sc]).includes(sc));
}

function pct(value) {
  return value == null ? 'n/a' : `${(value * 100).toFixed(1)}%`;
}

const corpus = readJson(CASES);
const datasets = {
  flashLite: {
    act: readRun(RUNS.flashLite.act),
    supplementary: readRun(RUNS.flashLite.supplementary)
  },
  flash: {
    act: readRun(RUNS.flash.act),
    supplementary: reconstructFlashSupplementary(corpus)
  }
};

if (datasets.flashLite.act.length !== 458 || datasets.flash.act.length !== 458) throw new Error('ACT inputs must each contain 458 cases');
if (datasets.flashLite.supplementary.length !== 585) throw new Error('Flash Lite supplementary input must contain 585 cases');

assertConfusion('Flash Lite ACT', confusion(datasets.flashLite.act), { tp: 58, fp: 30, tn: 360, fn: 10 });
assertConfusion('Flash ACT', confusion(datasets.flash.act), { tp: 64, fp: 7, tn: 383, fn: 4 });
assertConfusion('Flash Lite supplementary', confusion(datasets.flashLite.supplementary), { tp: 242, fp: 49, tn: 226, fn: 68 });
assertConfusion('Flash supplementary', confusion(datasets.flash.supplementary), { tp: 291, fp: 21, tn: 254, fn: 19 });

const bySc = INCLUDED_SCS.map((sc) => {
  const liteRows = [...rowsBySc(datasets.flashLite.act, sc), ...rowsBySc(datasets.flashLite.supplementary, sc)];
  const flashRows = [...rowsBySc(datasets.flash.act, sc), ...rowsBySc(datasets.flash.supplementary, sc)];
  if (liteRows.length !== flashRows.length) throw new Error(`${sc}: model case counts differ (${liteRows.length} vs ${flashRows.length})`);
  const liteKeys = new Set(liteRows.map((row) => row.key || `act:${row.ruleId}:${row.testcaseId}`));
  const flashKeys = new Set(flashRows.map((row) => row.key || `act:${row.ruleId}:${row.testcaseId}`));
  if (liteKeys.size !== flashKeys.size || [...liteKeys].some((key) => !flashKeys.has(key))) throw new Error(`${sc}: model case identities differ`);
  const flashLite = metrics(confusion(liteRows));
  const flash = metrics(confusion(flashRows));
  if (flashLite.positives !== flash.positives || flashLite.negatives !== flash.negatives) throw new Error(`${sc}: ground-truth denominators differ`);
  return { sc, cases: flashLite.cases, positives: flashLite.positives, negatives: flashLite.negatives, flashLite, flash };
});

const output = {
  schema: 'combined-act-supplementary-model-by-sc/1',
  generatedAt: new Date().toISOString(),
  scope: {
    uniqueCases: 1043,
    actCases: 458,
    supplementaryCases: 585,
    includedScs: INCLUDED_SCS,
    excludedScs: ['2.2.4', '3.2.5'],
    note: 'ACT cases mapped to two SCs contribute to both SC rows; per-SC counts therefore do not sum to 1,043.'
  },
  runs: RUNS,
  validation: {
    flashLiteAct: confusion(datasets.flashLite.act),
    flashAct: confusion(datasets.flash.act),
    flashLiteSupplementary: confusion(datasets.flashLite.supplementary),
    flashSupplementary: confusion(datasets.flash.supplementary)
  },
  bySc
};
fs.writeFileSync(OUTPUT_JSON, `${JSON.stringify(output, null, 2)}\n`);

const lines = [
  '# Current harness — combined ACT 458 + supplementary 585, by SC',
  '',
  'Each SC row combines the ACT and supplementary cases mapped to that SC. `P/N` are expected-positive/expected-negative denominators. ACT cases mapped to two SCs contribute to both rows.',
  '',
  '| SC | Cases | P/N | Flash Lite TP/FP/FN/TN | Precision | Recall | FPR | Flash TP/FP/FN/TN | Precision | Recall | FPR |',
  '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |'
];
for (const row of bySc) {
  const a = row.flashLite, b = row.flash;
  lines.push(`| ${row.sc} | ${row.cases} | ${row.positives}/${row.negatives} | ${a.tp}/${a.fp}/${a.fn}/${a.tn} | ${pct(a.precision)} | ${pct(a.recall)} | ${pct(a.fpr)} | ${b.tp}/${b.fp}/${b.fn}/${b.tn} | ${pct(b.precision)} | ${pct(b.recall)} | ${pct(b.fpr)} |`);
}
lines.push('', 'Generated from exact case-level artifacts; non-`caught` outcomes are negative predictions, matching the suite summaries.');
fs.writeFileSync(OUTPUT_MD, `${lines.join('\n')}\n`);

console.log(JSON.stringify({ json: path.relative(ROOT, OUTPUT_JSON), markdown: path.relative(ROOT, OUTPUT_MD), rows: bySc.length, validation: output.validation }, null, 2));
