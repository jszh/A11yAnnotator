#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const DIR = path.join(ROOT, 'results', 'flash-positive-spotcheck-20260821');
const COMBINED = path.join(ROOT, 'results', 'combined-act458-supplementary585-ours-gem35lite-vs-gem37-by-sc.json');
const PARTS = ['a', 'b', 'c'].map((part) => ({
  part: part.toUpperCase(),
  json: JSON.parse(fs.readFileSync(path.join(DIR, `part-${part}.json`), 'utf8')),
  markdown: `part-${part}.md`
}));

const INCLUDED_SCS = [
  '1.1.1', '1.3.1', '1.3.3', '1.3.5', '1.4.1', '1.4.3', '1.4.4', '1.4.5',
  '1.4.12', '1.4.13', '2.1.1', '2.1.2', '2.2.1', '2.2.2', '2.4.1', '2.4.2',
  '2.4.3', '2.4.4', '2.4.6', '2.4.7', '2.5.3', '3.3.1', '4.1.2', '4.1.3'
];

function verdictOf(row) {
  return row.verdict || row.judgment || row.reviewVerdict;
}

const cases = PARTS.flatMap(({ part, json }) => json.cases.map((row) => ({
  ...row,
  auditPart: part,
  auditVerdict: verdictOf(row)
})));
if (cases.length !== 58) throw new Error(`expected 58 primary cases, got ${cases.length}`);
if (new Set(cases.map((row) => `${row.sc}::${row.key}`)).size !== cases.length) throw new Error('duplicate SC/case in primary sample');
for (const row of cases) {
  if (!['AGREE', 'DISAGREE', 'UNCERTAIN'].includes(row.auditVerdict)) throw new Error(`bad verdict for ${row.key}: ${row.auditVerdict}`);
}

const comparison = JSON.parse(fs.readFileSync(COMBINED, 'utf8'));
const available = Object.fromEntries(comparison.bySc.map((row) => [row.sc, row.flash.tp + row.flash.fp]));
const bySc = INCLUDED_SCS.map((sc) => {
  const rows = cases.filter((row) => row.sc === sc);
  return {
    sc,
    availableFlashPositives: available[sc] || 0,
    reviewed: rows.length,
    agree: rows.filter((row) => row.auditVerdict === 'AGREE').length,
    disagree: rows.filter((row) => row.auditVerdict === 'DISAGREE').length,
    uncertain: rows.filter((row) => row.auditVerdict === 'UNCERTAIN').length
  };
});

for (const row of bySc) {
  const expectedReviewed = Math.min(4, row.availableFlashPositives);
  if (row.reviewed !== expectedReviewed) throw new Error(`${row.sc}: expected ${expectedReviewed} reviews, got ${row.reviewed}`);
}

const count = (verdict) => cases.filter((row) => row.auditVerdict === verdict).length;
const labelConflicts = cases.filter((row) => row.expected !== 'failed');
const directScDisagreements = cases.filter((row) => row.auditVerdict === 'DISAGREE');
const deterministicDisagreements = new Set([
  'act:afw4f7:dc170fd015758b62d8e0141e086893a116ee724e',
  '2.1.2::documented-exit-reachability-and-accuracy-beyond-ctrlm::case-07'
]);

const summary = {
  schema: 'flash-positive-spotcheck-summary/1',
  generatedAt: new Date().toISOString(),
  scope: {
    modelRun: 'Gemini 3.7 Flash harness outcomes',
    corpus: 'combined ACT 458 + supplementary 585',
    includedScs: INCLUDED_SCS,
    populatedScsWithFlashPositives: bySc.filter((row) => row.availableFlashPositives > 0).map((row) => row.sc),
    primaryReviewed: cases.length,
    rule: 'Up to four final outcome=caught cases per SC; SC 2.1.1 had only two.'
  },
  method: {
    sampling: 'Deterministic adversarial-diversity spot check. Benchmark-label conflicts were prioritized while preserving corpus, rule/aspect, rubric, and mechanism diversity. This is not a random precision estimate.',
    judgment: 'AGREE means at least one substantive barrier exists for the target WCAG SC on the exact page used by the run. ACT rule outcome, expected label, and model rationale were treated as evidence rather than ground truth.',
    evidence: 'Exact HTML, run result/rubric/trace, local and official guidance, ACT protocols, screenshots, Chrome accessibility tree, and relevant pointer/keyboard/live-region interactions.',
    sourceIntegrity: 'All 30 sampled supplementary sources were hash-checked against their exact server-run paths: 27 matched current local files and 3 had material source drift, so the runtime files were audited.'
  },
  primary: {
    agree: count('AGREE'),
    disagree: count('DISAGREE'),
    uncertain: count('UNCERTAIN'),
    agreementRate: count('AGREE') / cases.length,
    labelConflictsReviewed: labelConflicts.length,
    labelConflictsSubstantivelyCorrect: labelConflicts.filter((row) => row.auditVerdict === 'AGREE').length,
    labelConflictsSubstantivelyWrong: labelConflicts.filter((row) => row.auditVerdict === 'DISAGREE').length,
    deterministicLaneDisagreements: directScDisagreements.filter((row) => deterministicDisagreements.has(row.key)).length,
    otherHarnessOrLlmDisagreements: directScDisagreements.filter((row) => !deterministicDisagreements.has(row.key)).length
  },
  sourceDrift: {
    sampledSupplementary: 30,
    byteIdenticalToCurrent: 27,
    drifted: 3,
    cases: [
      '1.4.13::persistent-auto-timeout-vs-valid-info-invalidation::case-06',
      '2.4.3::f85-focus-return-after-dismissal::case-03',
      '2.4.3::f85-focus-return-after-dismissal::case-06'
    ]
  },
  independentCrossChecks: {
    primaryCasesDoubleChecked: 5,
    primaryJudgmentsConfirmed: 5,
    extraCaseOutsidePrimaryQuota: {
      key: '1.4.13::hover-content-no-keyboard-focus-trigger-path::case-08',
      verdict: 'DISAGREE',
      confidence: 'high',
      note: 'All three SC 1.4.13 conditions passed; this was a deterministic v3Barrier false positive.'
    }
  },
  bySc,
  disagreements: directScDisagreements.map((row) => ({
    sc: row.sc,
    key: row.key,
    corpus: row.corpus,
    expected: row.expected,
    confidence: row.confidence,
    auditPart: row.auditPart,
    rationale: row.rationale
  })),
  cases,
  parts: PARTS.map(({ part, markdown }) => ({ part, json: `part-${part.toLowerCase()}.json`, markdown }))
};

fs.writeFileSync(path.join(DIR, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);

const pct = (value) => `${(value * 100).toFixed(1)}%`;
const lines = [
  '# Gemini 3.7 Flash positive-verdict spot check',
  '',
  '## Outcome',
  '',
  `The primary sample reviewed **${cases.length}** final \`caught\` outcomes: up to four for every included SC that had a Flash positive. Independent review agreed that **${summary.primary.agree}** contained a substantive target-SC barrier and disagreed on **${summary.primary.disagree}**; none remained uncertain. The resulting ${pct(summary.primary.agreementRate)} agreement is deliberately adversarial and is **not** a random precision estimate.`,
  '',
  `Among **${summary.primary.labelConflictsReviewed}** sampled positives that conflicted with a passed/inapplicable benchmark label, Flash/the harness was substantively right on **${summary.primary.labelConflictsSubstantivelyCorrect}** and wrong on **${summary.primary.labelConflictsSubstantivelyWrong}**. This confirms that benchmark FPs and substantive WCAG FPs are not interchangeable.`,
  '',
  '| SC | Available Flash positives | Reviewed | Agree | Disagree | Uncertain |',
  '| --- | ---: | ---: | ---: | ---: | ---: |'
];
for (const row of bySc.filter((item) => item.availableFlashPositives > 0)) {
  lines.push(`| ${row.sc} | ${row.availableFlashPositives} | ${row.reviewed} | ${row.agree} | ${row.disagree} | ${row.uncertain} |`);
}
lines.push(
  `| **Total** | **${bySc.reduce((sum, row) => sum + row.availableFlashPositives, 0)}** | **${cases.length}** | **${summary.primary.agree}** | **${summary.primary.disagree}** | **${summary.primary.uncertain}** |`,
  '',
  'No Flash positives existed for 1.3.3, 1.3.5, 1.4.4, 1.4.12, 2.2.1, 2.2.2, 2.4.1, 2.4.7, or 2.5.3 in these two benchmark inputs.',
  '',
  '## What the disagreements show',
  '',
  `Of the ${summary.primary.disagree} primary disagreements, **${summary.primary.deterministicLaneDisagreements} came from deterministic final-positive routing**, not Gemini reasoning. The remaining ${summary.primary.otherHarnessOrLlmDisagreements} came from LLM/rubric/probe behavior.`,
  '',
  '- Visual/context evidence was dropped: text shadows were ignored for 1.4.3, complete text redundancy for 1.4.1, and a functional thumbnail’s actual purpose for 1.1.1.',
  '- Accessibility-tree evidence was dropped: valid split-date names, explicit link `aria-labelledby`, and complete image/SVG status names were called missing.',
  '- Equivalence or applicability was overgeneralized: different URLs were treated as different purposes, and valid fields without demonstrated errors were still routed as 3.3.1 barriers.',
  '- One interaction probe changed the scenario by manufacturing an unrelated email error; one deterministic trap detector ignored an accurate, visible Ctrl+M exit.',
  '- One ACT image-of-text fixture is benchmark-failed but meets the current direct SC explanation because the same information is also presented as real text. That is an ACT-oracle versus current Understanding-document mismatch, not a simple model miss.',
  '',
  '## Benchmark labels that were not substantively reliable',
  '',
  'Ten sampled passed/inapplicable-label conflicts still contained a real target-SC barrier. The recurring causes were narrow ACT applicability boundaries, stale ACT data, invalid generated negative fixtures, or defects present only in the exact historical page that was run.',
  '',
  `All ${summary.sourceDrift.sampledSupplementary} sampled supplementary pages were checked against their recorded server paths. **${summary.sourceDrift.drifted} had material source drift**: the exact runtime pages failed, while their current local versions contain later repairs.`,
  '',
  '## Independent cross-checks',
  '',
  'A second reviewer independently re-ran five contentious primary cases and confirmed all five judgments. One extra 1.4.13 positive outside the four-case quota (`hover-content...case-08`) was also checked and found to be a deterministic false positive: pointer travel, focus, Escape dismissal, and persistence all passed.',
  '',
  '## Detailed evidence',
  '',
  '- [Part A — 1.1.1 through 1.4.5](part-a.md)',
  '- [Part B — 1.4.13 through 2.4.3](part-b.md)',
  '- [Part C — 2.4.4 through 4.1.3](part-c.md)',
  '- [Machine-readable consolidated audit](summary.json)',
  '',
  'Each part records exact case keys, expected labels, model basis, source facts, guideline/protocol basis, browser/screenshot/AX evidence, source hashes, confidence, and rationale.'
);
fs.writeFileSync(path.join(DIR, 'report.md'), `${lines.join('\n')}\n`);

console.log(JSON.stringify({
  report: path.relative(ROOT, path.join(DIR, 'report.md')),
  summary: path.relative(ROOT, path.join(DIR, 'summary.json')),
  primary: summary.primary,
  sourceDrift: summary.sourceDrift,
  bySc
}, null, 2));
