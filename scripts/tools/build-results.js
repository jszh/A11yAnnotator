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
const { buildResults, validateResults, driverEvidenceFrom } = require('../lib/result-builder.js');

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

// R2.5-C (R24-H1): IDENTITY BINDING — records, collector, and driver must describe the
// SAME page, so a drive/collect from another page cannot authorize this result.
if (!input.file || input.file !== collect.file || input.file !== drive.file) {
  console.error(`REFUSED: page-identity mismatch — records.file=${JSON.stringify(input.file)}, collect.file=${JSON.stringify(collect.file)}, drive.file=${JSON.stringify(drive.file)} must be identical (R2.5-C).`);
  process.exit(2);
}
// R2.6-C: RUN identity — collector and driver must be from the SAME run (shared --run-id),
// so a STALE drive.json from an earlier run of the same page cannot authorize a now-wrong
// behavioral verdict. (file identity alone can't distinguish runs of the same page.)
if (!collect.runId || !drive.runId || collect.runId !== drive.runId) {
  console.error(`REFUSED: run-identity mismatch — collect.runId=${JSON.stringify(collect.runId)} != drive.runId=${JSON.stringify(drive.runId)}. Pass the SAME --run-id to eval-page and drive-page in one run (stale drive rejected, R2.6-C).`);
  process.exit(2);
}
// R2.7-C (#5): the run-id proves COORDINATION; this proves FRESHNESS. The driver must have
// run AFTER this collect — a stale drive reused with the same --run-id carries an OLD
// drivenAt < the fresh collect's collectedAt and is rejected. (Both timestamps required.)
if (typeof collect.collectedAt === 'number' && typeof drive.drivenAt === 'number') {
  if (drive.drivenAt < collect.collectedAt) {
    console.error(`REFUSED: stale drive — drive.drivenAt (${drive.drivenAt}) is BEFORE collect.collectedAt (${collect.collectedAt}); the driver did not run after this collect (R2.7-C).`);
    process.exit(2);
  }
}
// R2.5-C/R2.6-C/R2.7-C: raw collector xpaths must be UNIQUE before normalization — reject
// (don't silently dedup) so a duplicate-laden inventory can't mask a fabricated count.
// Strip ALL whitespace for the comparison key so predicate-spacing variants
// (`[@id="x"]` vs `[@id = "x"]`, which Chrome resolves to the SAME node) can't slip past.
const norm = x => String(x).replace(/\s+/g, '');
const rawXpaths = (collect.elements || []).map(e => e.xpath).filter(Boolean);
const dupX = new Set(); { const seen = new Set(); for (const x of rawXpaths) { const n = norm(x); if (seen.has(n)) dupX.add(n); seen.add(n); } }
if (dupX.size) {
  console.error(`REFUSED: collector inventory has ${dupX.size} duplicate xpath(s) (e.g. ${String([...dupX][0]).slice(-40)}) — must be unique (R2.6-C, normalized).`);
  process.exit(2);
}
const xpaths = rawXpaths;
input.provenance = { collect: { xpaths, count: xpaths.length, skipped: Array.isArray(input.skipped) ? input.skipped : [], collectedAt: collect.collectedAt || null, page: collect.file } };
// R2.5-B/R2.7-B: the collector's OWN axe run is independent ground truth for the skip
// floor. Count any violation carrying a real WCAG SC tag (not impact-gated — moderate-
// impact rules can still be Level A failures; best-practice rules have an empty wcag[]).
// `ran` distinguishes "axe ran clean" from "axe never ran" so the floor can FAIL CLOSED.
const axeArr = Array.isArray(collect.axe) ? collect.axe : (collect.axe && Array.isArray(collect.axe.violations) ? collect.axe.violations : []);
const collectorAxe = { ran: collect.axeRan !== false, wcagViolations: axeArr.filter(v => v && Array.isArray(v.wcag) && v.wcag.length > 0).length };
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
