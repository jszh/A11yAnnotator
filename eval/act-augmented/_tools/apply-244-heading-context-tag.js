#!/usr/bin/env node
'use strict';
// Tag 2.4.4 `preceding-heading-or-list-grouping-context-sufficiency/case-16` as needs-validation.
//
// The page is labelled `expected: passed` and its main <dl> IS correctly repaired -- every format-word link
// carries aria-labelledby folding the document title into its accessible name. But the page also carries an
// "additional links" section that the repair never touched, and that section is BYTE-IDENTICAL to the one in
// case-06, which the corpus labels `failed`: two format-only links, no programmatic association, resolving to
// unrelated destinations, under a heading that names no subject at all.
//
// It fails on every reading available:
//   - WCAG's definition of programmatically-determined link context (paragraph / list item / table cell /
//     table header cell) does not reach a preceding sibling heading;
//   - H80, the technique that DOES describe preceding-heading context, is `advisory` for 2.4.4 rather than
//     sufficient -- and this section fails H80's own test procedure anyway, since a heading naming no subject
//     combined with "HTML" describes no purpose;
//   - the harness flags it, and flagging it is CORRECT.
//
// So the two harness "false positives" in this aspect are not the same thing: case-16 is a TRUE positive
// scored against a page whose label its unrepaired section contradicts. Per corpus convention this is tagged
// `needs-validation` (which drops it from `--include unflagged,clear,fixed`); `expected` is NEVER flipped.
const fs = require('fs');
const path = require('path');

const TAG_FILE = path.join(__dirname, '..', '_annotator', 'irr', 'case-reliability-tags.json');
const KEY = '2.4.4::preceding-heading-or-list-grouping-context-sufficiency::case-16';

const raw = fs.readFileSync(TAG_FILE, 'utf8');
const doc = JSON.parse(raw);
// preserve the file's own indent rather than imposing one -- a mismatch rewrites every line as diff noise
const indent = (raw.match(/\n(\s+)"schema"/) || [null, '  '])[1].length;
const NON_ASCII = /[\u0080-\uffff]/g;
const serialize = (obj) => JSON.stringify(obj, null, indent)
  .replace(NON_ASCII, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));

if (doc.cases.some((c) => c.key === KEY)) {
  console.log('already tagged -- nothing to do:', KEY);
  process.exit(0);
}

doc.cases.push({
  key: KEY,
  sc: '2.4.4',
  aspect: 'preceding-heading-or-list-grouping-context-sufficiency',
  caseId: 'case-16',
  file: 'eval/act-augmented/2.4.4/pages/preceding-heading-or-list-grouping-context-sufficiency/case-16.html',
  adjudicatorVerdict: 'CORPUS-DEFECT',
  annotationClarity: 'n/a',
  internallyContradictory: true,
  signals: ['ROOTCAUSE-ADJUDICATED', 'IDENTICAL-SECTION-LABELLED-FAILED'],
  humanComplaints: [],
  tag: 'needs-validation',
  source: 'link-purpose-h80-examination-2026-08-20',
  rootCause: 'corpus-label-wrong',
  rootCauseConfidence: 0.9,
  groundTruthDisputed: true,
  why: 'Labelled `passed`, and the main <dl> IS repaired: each format-word link carries aria-labelledby folding the document title into its accessible name, so the name is no longer the bare format word. But the page also carries an "additional links" section the repair never touched, byte-identical to the one in case-06 which the corpus labels `failed` -- two format-only links (HTML, PDF) with no programmatic association, resolving to unrelated destinations (/docs/pharmacy-hours.html, /docs/2024-tariff.pdf), under a heading that names no subject. WCAG definition of programmatically-determined link context does not reach a preceding sibling heading, and H80 -- the technique that does describe preceding-heading context -- is ADVISORY for 2.4.4, not sufficient. The section fails H80 own test procedure regardless, since that heading combined with "HTML" describes no purpose. The harness barrier on those two links is a TRUE positive; the page cannot serve as a pass fixture while that section stands.',
  evidence: 'case-16.html <section class="also"> is byte-identical to case-06.html <section class="also"> (verified by string comparison), and case-06 is labelled expected=failed. Judge verdicts on case-16: LIKELY_OK for all six aria-labelledby links in the <dl>, LIKELY_BARRIER for exactly the two links in the untouched "also" section.',
  corpusExpected: 'passed',
});

fs.writeFileSync(TAG_FILE, serialize(doc) + '\n');
console.log('tagged needs-validation:', KEY);
