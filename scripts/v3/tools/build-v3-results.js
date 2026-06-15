#!/usr/bin/env node
// Harness 3.0 — MANDATORY v3 publication gate (CLI). Loads a frozen run bundle, runs the
// deterministic builder, and writes v3-only results — or exits non-zero writing nothing.
//
//   node scripts/v3/tools/build-v3-results.js <run-dir> <out/v3-results.json>
'use strict';

const fs = require('fs');
const { loadBundle } = require('../lib/bundle-loader.js');
const { buildV3 } = require('../lib/build-v3.js');

const [dir, outPath] = process.argv.slice(2);
if (!dir || !outPath) { console.error('usage: build-v3-results.js <run-dir> <out/v3-results.json>'); process.exit(2); }

const { bundle, errors: loadErrors } = loadBundle(dir);
if (loadErrors.length) {
  console.error(`REFUSED: ${loadErrors.length} bundle-load error(s):`);
  for (const m of loadErrors) console.error('  ' + m);
  process.exit(2);
}

const { ok, errors, results } = buildV3(bundle);
if (!ok) {
  console.error(`REFUSED to write ${outPath} — ${errors.length} gate violation(s):`);
  for (const m of errors.slice(0, 40)) console.error('  ' + m);
  process.exit(1);
}

fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
console.log(`wrote ${outPath} — ${results.summary.authoritative} authoritative claim(s), ${results.summary.partial} partial(s).`);
