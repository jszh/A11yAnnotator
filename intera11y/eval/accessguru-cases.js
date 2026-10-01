#!/usr/bin/env node
'use strict';
// Case lists for AccessGuru (eval/accessguru/runner.py --case-list) on InterA11y's evaluation sets, so the
// baseline sees the same pages as InterA11y:
//   test   — the validated test split (ACT + the 585 human-annotated cases), as label-free copies; a case about
//            several SCs is flagged on any of them (anySc)
//   expert — the expert-study pages over the annotator server; AccessGuru's violations are located to elements
//            (locate) so they can be matched to the study's cases
//
//   node intera11y/eval/accessguru-cases.js test|expert <out.json>
const fs = require('fs');
const path = require('path');
const { fileURLToPath } = require('url');
const { CONFIG } = require('../src/core/config.js');
const { validated, CORPORA } = require('./corpora.js');

const [set, out] = process.argv.slice(2);
if (!['test', 'expert'].includes(set) || !out) { console.error('usage: accessguru-cases.js test|expert <out.json>'); process.exit(1); }
const rel = (abs) => path.relative(CONFIG.root, abs);
let rows;
if (set === 'test') {
  rows = validated('test').map((c) => ({
    id: c.id, testcaseId: c.id, file: rel(fileURLToPath(c.url)), url: c.url,
    sc: c.scs[0], all_scs: c.scs, anySc: true, expected: c.expected,
  }));
} else {
  const list = JSON.parse(fs.readFileSync(path.join(CONFIG.root, 'eval/56-page-baselines/page-list-56.json'), 'utf8')).pages;
  const relOf = new Map(list.map((p) => [String(p.file).normalize('NFC'), p]));
  rows = CORPORA['expert-annotated']().map((c) => {
    const p = relOf.get(String(c.meta.file).normalize('NFC'));
    return { id: c.id, testcaseId: c.id, file: p.relPath, url: c.url, sc: c.scs[0], all_scs: c.scs, anySc: true,
      expected: 'unknown', locate: true, domain: String(c.meta.file).replace(/\.html?$/i, ''), pageFile: c.meta.file };
  });
}
fs.writeFileSync(out, JSON.stringify(rows, null, 1));
console.log(`${set}: ${rows.length} cases → ${out}`);
