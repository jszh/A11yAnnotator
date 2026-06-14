#!/usr/bin/env node
// MANDATORY result output path (R2.1-B / R2-C1). The agent writes ONLY per-element
// verdicts + pageSkills to an input file; this derives all aggregates and HARD-GATES
// the output through the strict validator. Nothing else may write results.json.
//
//   node scripts/tools/build-results.js <input.json> <out/results.json>
//
// input.json: { file, slug, noscript, elements:[{xpath,axRole,axName,notFound?,
//   skills:{<10 skills>:{verdict,sc,level,evidence,bucket?}}}], pageSkills:{...} }
// Exits non-zero (writing nothing) if the built result fails validation.
'use strict';
const fs = require('fs');
const { buildResults, validateResults } = require('../lib/result-builder.js');

const [inPath, outPath] = process.argv.slice(2);
if (!inPath || !outPath) { console.error('usage: build-results.js <input.json> <out/results.json>'); process.exit(2); }

let input;
try { input = JSON.parse(fs.readFileSync(inPath, 'utf8')); }
catch (e) { console.error('cannot read/parse input:', e.message); process.exit(2); }

const built = buildResults(input);
const v = validateResults(built);
if (!v.ok) {
  console.error(`REFUSED to write ${outPath} — ${v.errors.length} contract violation(s):`);
  for (const m of v.errors.slice(0, 40)) console.error('  ' + m);
  process.exit(1);
}
fs.writeFileSync(outPath, JSON.stringify(built, null, 1));
console.log(`wrote ${outPath} — ${built.summary.elements} elements, ${built.summary.normativeFailures} normative failures, ${built.summary.issues.length} deduped issues (validated).`);
