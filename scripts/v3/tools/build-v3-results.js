#!/usr/bin/env node
// Harness 3.0 — MANDATORY v3 publication gate (CLI). Loads a frozen run bundle, runs the
// deterministic builder, and writes v3-only results — or exits non-zero writing nothing.
//
//   node scripts/v3/tools/build-v3-results.js <run-dir> <out/v3-results.json> [--shadow-debug]
//
// PRODUCTION (default) requires the COMPLETE lineage (collect+drive+candidates+plan+experiments+
// proposals) AND enforces the same required stages in the cross-artifact gate (audit V3R3-M3). The
// trust anchor for authoritative publication — the attestation key and the on-disk provenance
// verifier — is supplied HERE (env V3_ATTEST_KEY + a sha256 verifier rooted at the repo), never the
// bundle (audit V3R3-C1). `--shadow-debug` accepts an incomplete bundle for inspection; such a run
// can only ever produce shadow/partial output (the builder demotes incomplete bundles).
'use strict';

const fs = require('fs');
const path = require('path');
const { loadBundle, PRODUCTION_REQUIRED, SHADOW_DEBUG_REQUIRED } = require('../lib/bundle-loader.js');
const { buildV3 } = require('../lib/build-v3.js');
const attest = require('../lib/attestation.js');

const argv = process.argv.slice(2);
const shadowDebug = argv.includes('--shadow-debug');
const [dir, outPath] = argv.filter((a) => !a.startsWith('--'));
if (!dir || !outPath) { console.error('usage: build-v3-results.js <run-dir> <out/v3-results.json> [--shadow-debug]'); process.exit(2); }

const required = shadowDebug ? SHADOW_DEBUG_REQUIRED : PRODUCTION_REQUIRED;
const { bundle, errors: loadErrors } = loadBundle(dir, { required });
if (loadErrors.length) {
  console.error(`REFUSED: ${loadErrors.length} bundle-load error(s)${shadowDebug ? '' : ' (production build requires the complete lineage; pass --shadow-debug for an incomplete inspection build)'}:`);
  for (const m of loadErrors) console.error('  ' + m);
  process.exit(2);
}

// Trust anchor from a PROTECTED location, never the bundle. The disk verifier resolves promotion
// provenance refs to files under the repo root and checks their sha256.
const repoRoot = path.resolve(__dirname, '..', '..', '..');
const opts = {
  requiredStages: required,
  requireManifest: !shadowDebug, // production requires an attested run-manifest (audit V3R4-H7)
  attestationKey: attest.loadKey({}), // env V3_ATTEST_KEY
  artifactVerifier: attest.makeDiskArtifactVerifier(repoRoot),
};

const { ok, errors, results } = buildV3(bundle, opts);
if (!ok) {
  console.error(`REFUSED to write ${outPath} — ${errors.length} gate violation(s):`);
  for (const m of errors.slice(0, 40)) console.error('  ' + m);
  process.exit(1);
}

fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
const mode = shadowDebug ? ' [SHADOW-DEBUG: incomplete bundle — authoritative publication impossible]' : '';
console.log(`wrote ${outPath} — ${results.summary.authoritative} authoritative claim(s), ${results.summary.partial} partial(s).${mode}`);
