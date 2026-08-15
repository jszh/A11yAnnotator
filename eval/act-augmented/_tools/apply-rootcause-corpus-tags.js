#!/usr/bin/env node
'use strict';
/**
 * Tag the corpus defects found by the 2026-08-15 FP/FN root-cause analysis so they are
 * EXCLUDED from every future scored run.
 *
 * Why a second tagging pass exists at all: the first pass (apply-adjudication.js) tagged what
 * HUMAN annotators flagged. This one tags what the HARNESS was right about — pages where the
 * harness's verdict was correct and the corpus label was wrong. Those are invisible to a human
 * flagging pass by construction: nobody complains about a page whose defect is that its LABEL
 * is wrong, and several were only settled by probing the rendered page (an 11px dead gap in a
 * tooltip's hover path; an Escape handler that re-opens what it closed).
 *
 * They are written as tag `needs-validation` — the stratum run-annotated-suite.js already drops
 * from its default `--include unflagged,clear,fixed`. That is the correct semantics ("ground
 * truth NOT settled"), and it means exclusion needs no code change. Provenance is carried in
 * `source`/`rootCause`/`why` so these never get confused with the human-adjudication tags.
 *
 * IMPORTANT: this does NOT flip any `expected` label. Deciding a disputed label is a human call;
 * all this does is stop the case being scored as though it were settled.
 *
 * Usage:
 *   node eval/act-augmented/_tools/apply-rootcause-corpus-tags.js --dry
 *   node eval/act-augmented/_tools/apply-rootcause-corpus-tags.js
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..', '..', '..');
const IRR_DIR = path.join(REPO_ROOT, 'eval', 'act-augmented', '_annotator', 'irr');
const TAG_FILE = path.join(IRR_DIR, 'case-reliability-tags.json');
const ROOTCAUSE = path.join(IRR_DIR, 'rootcause-2026-08-15.json');
const RUN_RESULTS = path.join(REPO_ROOT, 'results', 'aug-annot-tools-on', 'results.json');
const SOURCE = 'fp-fn-rootcause-2026-08-15';
const DRY = process.argv.includes('--dry');

const CORPUS_CAUSES = new Set(['corpus-label-wrong', 'corpus-page-broken']);

function main() {
  const tags = JSON.parse(fs.readFileSync(TAG_FILE, 'utf8'));
  const rc = JSON.parse(fs.readFileSync(ROOTCAUSE, 'utf8'));
  const run = JSON.parse(fs.readFileSync(RUN_RESULTS, 'utf8'));

  // testcaseId -> key, taken from the run's own records. Parsing `aug-<sc>-<aspect>-case-NN`
  // by hand is ambiguous: SCs contain dots and aspects contain hyphens and digits.
  const keyById = new Map(run.map((r) => [r.testcaseId, r.key]));
  const scById = new Map(run.map((r) => [r.testcaseId, (r.sc || [])[0]]));
  const expectedById = new Map(run.map((r) => [r.testcaseId, r.expected]));

  const defects = rc.cases.filter((c) => CORPUS_CAUSES.has(c.rootCause));
  const byKey = new Map(tags.cases.map((c) => [c.key, c]));

  const added = [], upgraded = [], unresolved = [];
  for (const d of defects) {
    const key = keyById.get(d.testcaseId);
    if (!key) { unresolved.push(d.testcaseId); continue; }
    const [sc, aspect, caseId] = key.split('::');
    const patch = {
      tag: 'needs-validation',
      source: SOURCE,
      rootCause: d.rootCause,
      rootCauseConfidence: d.confidence,
      groundTruthDisputed: true,
      why: d.why,
      evidence: d.evidence || null,
      corpusExpected: expectedById.get(d.testcaseId),
    };
    const existing = byKey.get(key);
    if (existing) {
      // Never silently overwrite a human adjudication — record that BOTH passes hit this case.
      const was = existing.tag;
      Object.assign(existing, patch, { priorTag: was, alsoFlaggedBy: 'human-adjudication' });
      upgraded.push({ key, was });
    } else {
      tags.cases.push({
        key, sc: sc || scById.get(d.testcaseId), aspect, caseId,
        file: `eval/act-augmented/${sc}/pages/${aspect}/${caseId}.html`,
        adjudicatorVerdict: 'CORPUS-DEFECT', annotationClarity: 'n/a',
        internallyContradictory: false, signals: ['ROOTCAUSE-ADJUDICATED'],
        ...patch,
      });
      added.push(key);
    }
  }

  tags.counts = tags.cases.reduce((a, c) => ((a[c.tag] = (a[c.tag] || 0) + 1), a), {});
  tags.generatedAt = new Date().toISOString();
  tags.note = 'tag=needs-validation means the case is NOT settled ground truth: exclude it, or '
    + 'resolve it, before using this corpus as a scored benchmark. Cases carrying '
    + `source="${SOURCE}" were adjudicated from the harness side (the harness was right and the `
    + 'corpus label was wrong); no `expected` label was flipped.';

  console.log(`corpus defects in root-cause export : ${defects.length}`);
  console.log(`  newly tagged needs-validation     : ${added.length}`);
  console.log(`  already tagged (re-tagged + noted): ${upgraded.length}`);
  if (upgraded.length) for (const u of upgraded) console.log(`      ${u.was} -> needs-validation  ${u.key}`);
  if (unresolved.length) { console.error(`  UNRESOLVED testcaseIds (not in run): ${unresolved.join(', ')}`); process.exitCode = 1; }
  console.log(`\nresulting counts: ${JSON.stringify(tags.counts)}`);

  if (DRY) { console.log('\n--dry: nothing written'); return; }
  fs.writeFileSync(TAG_FILE, JSON.stringify(tags, null, 1));
  console.log(`\nwrote ${path.relative(REPO_ROOT, TAG_FILE)}`);
}

if (require.main === module) main();
module.exports = { CORPUS_CAUSES };
