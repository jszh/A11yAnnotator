#!/usr/bin/env node
// MANDATORY result output path (R2.1-B / R2-C1). The agent writes ONLY per-element
// verdicts + pageSkills to an input file; this derives all aggregates and HARD-GATES
// the output through the strict validator. Nothing else may write results.json.
//
//   node scripts/tools/build-results.js <input.json> <out/results.json> <collect.json> <drive.json>
//
// input.json: { file, slug, noscript, elements:[{xpath,axRole,axName,notFound?,
//   skills:{<10 skills>:{verdict,sc,level,evidence,bucket?}}}], pageSkills:{...} }
// collect.json: the COLLECTOR output. R2.4-A: provenance is derived from it HERE (NOT
//   from the agent's input) so a fabricated element cannot validate.
// drive.json: the DRIVER output. R2.4-B: definite behavioral verdicts are bound to its
//   behavioralTrust/focusIndicator/forms evidence, NOT the agent's self-report.
// Exits non-zero (writing nothing) if the built result fails validation.
'use strict';
const fs = require('fs');
const { buildResults, validateResults, driverEvidenceFrom, crossArtifactErrors } = require('../lib/result-builder.js');

const [inPath, outPath, collectPath, drivePath] = process.argv.slice(2);
if (!inPath || !outPath) { console.error('usage: build-results.js <input.json> <out/results.json> <collect.json> <drive.json>'); process.exit(2); }

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

// R2.4-B: drive.json is MANDATORY — definite behavioral verdicts must be bound to it.
if (!drivePath) {
  console.error('REFUSED: drive.json is REQUIRED — definite behavioral verdicts must be bound to driver evidence (R2.4-B).');
  process.exit(2);
}
let drive;
try { drive = JSON.parse(fs.readFileSync(drivePath, 'utf8')); }
catch (e) { console.error('cannot read/parse drive.json:', e.message); process.exit(2); }

// R2.9-B (R2.8 self-audit #3): the cross-artifact gate — page identity (R2.5-C), run
// identity (R2.6-C), freshness/sequencing (R2.7-C/R2.8-D), page-content digest (R2.9-D),
// collector-xpath uniqueness (R2.6-C) and driver-inventory integrity (R2.8-B: unique +
// driver ⊆ collector) — is now ONE shared function in result-builder.js, so the read-only
// re-gate (regression-sweep.js) enforces IDENTICALLY (the sweep previously omitted the
// driver-inventory checks, a parity hole). Mandatory presence is enforced above.
const xErrs = crossArtifactErrors(input, collect, drive);
if (xErrs.length) {
  console.error(`REFUSED: ${xErrs.length} cross-artifact gate violation(s):`);
  for (const m of xErrs) console.error('  ' + m);
  process.exit(2);
}
const xpaths = (collect.elements || []).map(e => e.xpath).filter(Boolean);
input.provenance = { collect: { xpaths, count: xpaths.length, skipped: Array.isArray(input.skipped) ? input.skipped : [], collectedAt: collect.collectedAt || null, page: collect.file } };
// R2.5-B/R2.7-B/R2.8-C: the collector's OWN axe run is independent ground truth. Count any
// violation carrying a real WCAG SC tag (not impact-gated). `ran` must be EXPLICITLY true
// — a MISSING sentinel means "did not run" (fail-closed, R2.8-C #1; `!== false` treated a
// missing field as ran). The implicated SC set drives RECONCILIATION (R2.8-C #2): each must
// be reported as a finding or explicitly adjudicated.
const axeArr = Array.isArray(collect.axe) ? collect.axe : (collect.axe && Array.isArray(collect.axe.violations) ? collect.axe.violations : []);
const wcagTagToSc = t => { const m = /^wcag(\d)(\d)(\d+)$/.exec(t); return m ? `${m[1]}.${m[2]}.${m[3]}` : null; };
const axeScs = [...new Set(axeArr.flatMap(v => (v && Array.isArray(v.wcag) ? v.wcag : []).map(wcagTagToSc).filter(Boolean)))];
const collectorAxe = { ran: collect.axeRan === true, wcagViolations: axeArr.filter(v => v && Array.isArray(v.wcag) && v.wcag.length > 0).length, scs: axeScs };
if (Array.isArray(input.axeAdjudications)) input.axeAdjudications = input.axeAdjudications; // pass-through (validated)
const driverEvidence = driverEvidenceFrom(drive);

const built = buildResults(input);
const v = validateResults(built, { driverEvidence, collectorAxe });
if (!v.ok) {
  console.error(`REFUSED to write ${outPath} — ${v.errors.length} contract violation(s):`);
  for (const m of v.errors.slice(0, 40)) console.error('  ' + m);
  process.exit(1);
}
fs.writeFileSync(outPath, JSON.stringify(built, null, 1));
console.log(`wrote ${outPath} — ${built.summary.elements} elements, ${built.summary.normativeFailures} normative failures, ${built.summary.issues.length} deduped issues (validated).`);
