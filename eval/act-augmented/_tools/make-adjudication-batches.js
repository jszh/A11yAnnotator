#!/usr/bin/env node
/**
 * Split the adjudication worklist from flag-unreliable-cases.js into per-agent
 * batches, each self-contained: the annotator's complaint, the corpus's own
 * claim about the page, the pipeline's self-review verdict, and every file an
 * adjudicator needs to check the claim against.
 *
 * Usage: node eval/act-augmented/_tools/make-adjudication-batches.js [--batches 10]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');
const IRR = path.join(ROOT, 'eval/act-augmented/_annotator/irr');
const OUT = path.join(IRR, 'adjudication');

function latestBackup() {
  const dir = path.join(ROOT, 'eval/act-augmented/_archive/comment-strip-backups');
  const kids = fs.readdirSync(dir).filter((d) => fs.statSync(path.join(dir, d)).isDirectory()).sort();
  return path.relative(ROOT, path.join(dir, kids[kids.length - 1]));
}

function main() {
  const bIdx = process.argv.indexOf('--batches');
  const nBatches = bIdx > -1 ? Number(process.argv[bIdx + 1]) : 10;

  const flagged = JSON.parse(fs.readFileSync(path.join(IRR, 'unreliable-cases.json'), 'utf8'));
  const work = flagged.cases.filter((c) => c.needsAdjudication);
  const backup = latestBackup();

  // index result.json page records + pipeline self-review verdicts
  const meta = new Map();
  for (const sc of new Set(work.map((c) => c.sc))) {
    const rj = path.join(ROOT, 'eval/act-augmented', sc, 'result.json');
    if (!fs.existsSync(rj)) continue;
    const doc = JSON.parse(fs.readFileSync(rj, 'utf8'));
    for (const ar of doc.aspectResults || []) {
      const slug = ar.built?.aspectSlug || ar.aspect;
      for (const p of ar.built?.pages || []) {
        const v = (ar.verdicts || []).find((x) => x.pageId === p.id) || null;
        meta.set(`${sc}::${slug}::${p.id}`, {
          record: p,
          pipelineSelfReview: v && {
            errorIsReal: v.errorIsReal, expectedOutcomeCorrect: v.expectedOutcomeCorrect,
            requiresHumanJudgment: v.requiresHumanJudgment, browserConfirmed: v.browserConfirmed,
            severity: v.severity, recommendation: v.recommendation, problems: v.problems,
          },
        });
      }
    }
  }

  const cases = work.map((c) => {
    const m = meta.get(c.key) || {};
    const r = m.record || {};
    return {
      key: c.key, sc: c.sc, aspect: c.aspect, caseId: c.caseId,
      severity: c.severity, signals: c.signals,
      files: {
        page: c.file,
        pageWithOriginalAuthorComments: path.join(backup, 'files', c.file),
        caseDoc: r.docFile || c.file.replace(/\.html$/, '.md'),
        sourceOfTruth: `eval/act-augmented/${c.sc}/result.json`,
      },
      corpusClaim: {
        expected: c.corpusExpected,
        expectedMeansIssueExists: c.corpusLabel,
        aspectTitle: c.aspectTitle,
        scenario: r.scenario ?? c.scenario,
        mechanism: r.mechanism ?? c.mechanism,
        whyAutomatedToolsMiss: r.whyAutomatedToolsMiss ?? null,
        primarySelector: r.primarySelector ?? c.primarySelector,
      },
      pipelineSelfReview: m.pipelineSelfReview || null,
      humanAnnotations: c.coders,
    };
  });

  // interleave so each batch gets a mix of SCs and severities
  cases.sort((a, b) => b.severity - a.severity || (a.key < b.key ? -1 : 1));
  const batches = Array.from({ length: nBatches }, () => []);
  cases.forEach((c, i) => batches[i % nBatches].push(c));

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  batches.forEach((b, i) => {
    const id = String(i + 1).padStart(2, '0');
    fs.writeFileSync(path.join(OUT, `batch-${id}.json`), JSON.stringify({
      batch: id, n: b.length, backupDir: backup, cases: b,
    }, null, 2));
  });
  console.log(`wrote ${nBatches} batches (${cases.length} cases) to ${path.relative(ROOT, OUT)}`);
  batches.forEach((b, i) => console.log(`  batch-${String(i + 1).padStart(2, '0')}: ${b.length} cases  [${[...new Set(b.map((c) => c.sc))].join(' ')}]`));
}

main();
