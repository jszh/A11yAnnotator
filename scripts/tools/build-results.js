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

// R2.4-A: collect.json is MANDATORY and provenance is derived ONLY from it (never from
// the agent's records — that would not be independent). Completeness is enforced by the
// validator (default-closed); the agent declares any un-evaluated collected element via
// `input.skipped: [{xpath, reason}]`. There is no agent-supplied-provenance fallback.
if (!collectPath) {
  console.error('REFUSED: collect.json is REQUIRED — provenance must be derived from the independent collector inventory (R2.4-A).');
  process.exit(2);
}
let collect;
try { collect = JSON.parse(fs.readFileSync(collectPath, 'utf8')); }
catch (e) { console.error('cannot read/parse collect.json:', e.message); process.exit(2); }
const xpaths = [...new Set((collect.elements || []).map(e => e.xpath).filter(Boolean))];
input.provenance = { collect: { xpaths, count: xpaths.length, skipped: Array.isArray(input.skipped) ? input.skipped : [], collectedAt: collect.collectedAt || null } };

const built = buildResults(input);
const v = validateResults(built);
if (!v.ok) {
  console.error(`REFUSED to write ${outPath} — ${v.errors.length} contract violation(s):`);
  for (const m of v.errors.slice(0, 40)) console.error('  ' + m);
  process.exit(1);
}
fs.writeFileSync(outPath, JSON.stringify(built, null, 1));
console.log(`wrote ${outPath} — ${built.summary.elements} elements, ${built.summary.normativeFailures} normative failures, ${built.summary.issues.length} deduped issues (validated).`);
