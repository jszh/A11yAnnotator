#!/usr/bin/env node
'use strict';
/**
 * Tag the corpus defects found by the 2026-08-19 false-positive root-cause analysis of
 * `results/supplementary585-gemini35-flash-lite-97d00f4` (see
 * docs/analysis/reports-2026-06/FP-RCA-SUPPLEMENTARY585-GEM35-FLASH-LITE.md §5).
 *
 * Both are 2.4.2 PAIRED-PASS fixtures whose repair does not actually repair the page: the generator
 * rewrote the <title> to something specific-but-wrong, or to a site-wide section label, and then labelled
 * the result `passed`. Two independent judges (Gemini 3.5 Flash Lite and 3.7 Flash) called both of them
 * barriers, and on reading the pages the judges are right — which is precisely the shape a human flagging
 * pass cannot surface, because nobody complains about a page whose defect is that its LABEL is wrong.
 *
 * Same contract as apply-rootcause-corpus-tags.js, deliberately:
 *   - tag `needs-validation`, the stratum run-annotated-suite.js already drops from its default
 *     `--include unflagged,clear,fixed`, so exclusion needs no code change;
 *   - provenance in `source`/`rootCause`/`why`/`evidence` so these never blur into the human adjudication;
 *   - and it does NOT flip any `expected` label. Deciding a disputed label is a human call. All this does
 *     is stop the case being scored as though its ground truth were settled.
 *
 * Usage:
 *   node eval/act-augmented/_tools/apply-fp585-corpus-tags.js --dry
 *   node eval/act-augmented/_tools/apply-fp585-corpus-tags.js
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..', '..', '..');
const TAG_FILE = path.join(REPO_ROOT, 'eval', 'act-augmented', '_annotator', 'irr', 'case-reliability-tags.json');
const SOURCE = 'fp-rca-supplementary585-2026-08-19';
const DRY = process.argv.includes('--dry');

const DEFECTS = [
  {
    key: '2.4.2::title-loses-meaning-out-of-context::case-10',
    rootCause: 'corpus-label-wrong',
    confidence: 0.9,
    why: 'The paired-pass repair set <title>Chapter 3: Safe Scaffolding Assembly</title> on a page whose <h1> '
       + 'is "Newton’s Laws of Motion" and whose sections are inertia, F = ma, and action/reaction. The '
       + 'repair made the title MORE specific and about the WRONG subject, so the page still fails 2.4.2 '
       + '("Web pages have titles that describe topic or purpose") and cannot be a pass fixture as written.',
    evidence: 'case-10.html:7 <title>Chapter 3: Safe Scaffolding Assembly</title> vs :48 <h1>Newton’s Laws '
       + 'of Motion</h1>, :58/:66/:86 <h2> The First Law: Inertia / The Second Law: F = ma / The Third Law: '
       + 'Action and Reaction. Flagged a barrier by BOTH Gemini 3.5 Flash Lite and Gemini 3.7 Flash.',
  },
  {
    key: '2.4.2::title-describes-secondary-not-primary-topic::case-11',
    rootCause: 'corpus-label-wrong',
    confidence: 0.9,
    why: 'The paired-pass repair replaced a promotional title with <title>Cedar Falls Tribune — Local '
       + 'News</title> on a news article whose <h1> is a specific council-budget story. A site-wide section '
       + 'label is the canonical 2.4.2 failure, and the aspect is literally "title describes secondary not '
       + 'primary topic" — the repair swapped one non-descriptive title for another.',
    evidence: 'case-11.html:7 <title>Cedar Falls Tribune — Local News</title> vs :60 <h1 id="hl">Council '
       + 'approves $214M Cedar Falls budget after marathon vote on police and parks funding</h1>. Flagged a '
       + 'barrier by BOTH Gemini 3.5 Flash Lite and Gemini 3.7 Flash.',
  },
];

// The registry stores non-ASCII as \\uXXXX escapes. A plain JSON.stringify writes the literal characters
// instead, which rewrites every em dash, curly quote and middot in the file — ~160 lines of pure encoding
// churn around a two-case edit. Re-escape so the diff shows only what actually changed.
function serialize(obj, indent) {
  return JSON.stringify(obj, null, indent)
    .replace(/[\u007f-\uffff]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
}

function main() {
  const rawTagFile = fs.readFileSync(TAG_FILE, 'utf8');
  // Preserve the file's OWN indentation. Writing a fixed width reformats all ~3.3k lines and buries a
  // two-case change in a whole-file diff, which makes the tag registry unreviewable at exactly the moment
  // someone needs to review it.
  const indent = (rawTagFile.match(/\n(\s+)"schema"/) || [null, '  '])[1].length;
  const tags = JSON.parse(rawTagFile);
  const byKey = new Map(tags.cases.map((c) => [c.key, c]));
  const added = [], upgraded = [], missing = [];

  for (const d of DEFECTS) {
    const [sc, aspect, caseId] = d.key.split('::');
    const file = `eval/act-augmented/${sc}/pages/${aspect}/${caseId}.html`;
    if (!fs.existsSync(path.join(REPO_ROOT, file))) { missing.push(d.key); continue; }
    const patch = {
      tag: 'needs-validation',
      source: SOURCE,
      rootCause: d.rootCause,
      rootCauseConfidence: d.confidence,
      groundTruthDisputed: true,
      why: d.why,
      evidence: d.evidence,
      corpusExpected: 'passed',
    };
    const existing = byKey.get(d.key);
    if (existing) {
      const was = existing.tag;
      Object.assign(existing, patch, { priorTag: was, alsoFlaggedBy: existing.source || 'human-adjudication' });
      upgraded.push({ key: d.key, was });
    } else {
      tags.cases.push({
        key: d.key, sc, aspect, caseId, file,
        adjudicatorVerdict: 'CORPUS-DEFECT', annotationClarity: 'n/a',
        internallyContradictory: false, signals: ['ROOTCAUSE-ADJUDICATED', 'CROSS-MODEL-AGREEMENT'],
        humanComplaints: [],
        ...patch,
      });
      added.push(d.key);
    }
  }

  tags.counts = tags.cases.reduce((a, c) => ((a[c.tag] = (a[c.tag] || 0) + 1), a), {});
  tags.generatedAt = new Date().toISOString();

  console.log(`corpus defects in this pass       : ${DEFECTS.length}`);
  console.log(`  newly tagged needs-validation   : ${added.length}`);
  for (const k of added) console.log(`      + ${k}`);
  console.log(`  already tagged (re-tagged)      : ${upgraded.length}`);
  for (const u of upgraded) console.log(`      ${u.was} -> needs-validation  ${u.key}`);
  if (missing.length) { console.error(`  MISSING page files: ${missing.join(', ')}`); process.exitCode = 1; }
  console.log(`\nresulting counts: ${JSON.stringify(tags.counts)}`);

  if (DRY) { console.log('\n--dry: nothing written'); return; }
  fs.writeFileSync(TAG_FILE, serialize(tags, indent) + (rawTagFile.endsWith('\n') ? '\n' : ''));
  console.log(`\nwrote ${path.relative(REPO_ROOT, TAG_FILE)}`);
}

if (require.main === module) main();
