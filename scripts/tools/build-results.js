#!/usr/bin/env node
// MANDATORY result output path (R2.1-B / R2-C1). The agent writes ONLY per-element
// verdicts + pageSkills to an input file; this derives all aggregates and HARD-GATES
// the output through the strict validator. Nothing else may write results.json.
//
//   node scripts/tools/build-results.js <input.json> <out/results.json> <collect.json>
//
// input.json: { file, slug, noscript, elements:[{xpath,axRole,axName,notFound?,
//   skills:{<10 skills>:{verdict,sc,level,evidence,bucket?}}}], pageSkills:{...} }
// collect.json: the COLLECTOR output. R2.3-C: provenance is derived from it HERE (NOT
//   from the agent's input) so a fabricated element cannot validate.
// Exits non-zero (writing nothing) if the built result fails validation.
'use strict';
const fs = require('fs');
const { buildResults, validateResults } = require('../lib/result-builder.js');

const [inPath, outPath, collectPath] = process.argv.slice(2);
if (!inPath || !outPath) { console.error('usage: build-results.js <input.json> <out/results.json> <collect.json>'); process.exit(2); }

let input;
try { input = JSON.parse(fs.readFileSync(inPath, 'utf8')); }
catch (e) { console.error('cannot read/parse input:', e.message); process.exit(2); }

// R2.3-C: derive provenance from the INDEPENDENT collector inventory, not the agent.
if (collectPath) {
  let collect;
  try { collect = JSON.parse(fs.readFileSync(collectPath, 'utf8')); }
  catch (e) { console.error('cannot read/parse collect.json:', e.message); process.exit(2); }
  const xpaths = (collect.elements || []).map(e => e.xpath).filter(Boolean);
  const evaluated = new Set((input.elements || []).map(e => e.xpath));
  const complete = xpaths.every(x => evaluated.has(x));
  input.provenance = { collect: { xpaths, count: xpaths.length, complete, collectedAt: collect.collectedAt || null } };
} else if (!input.provenance) {
  console.error('REFUSED: no collect.json given and input carries no provenance — results must be linked to the collector inventory (R2.3-C).');
  process.exit(2);
}

const built = buildResults(input);
const v = validateResults(built);
if (!v.ok) {
  console.error(`REFUSED to write ${outPath} — ${v.errors.length} contract violation(s):`);
  for (const m of v.errors.slice(0, 40)) console.error('  ' + m);
  process.exit(1);
}
fs.writeFileSync(outPath, JSON.stringify(built, null, 1));
console.log(`wrote ${outPath} — ${built.summary.elements} elements, ${built.summary.normativeFailures} normative failures, ${built.summary.issues.length} deduped issues (validated).`);
