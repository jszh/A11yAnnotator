#!/usr/bin/env node
/**
 * Rank annotated test cases by how much the human annotations call the case
 * itself into question, and emit the adjudication worklist.
 *
 * The signals, strongest first:
 *   CONTRADICTED  every coder who saw the page disagrees with the corpus's own
 *                 `expected` label. Nothing about this is annotator noise — the
 *                 label and the humans point opposite ways.
 *   SPLIT         two coders saw the page and disagreed with each other. The
 *                 page does not elicit a stable judgment.
 *   FLAGGED       a coder used the "comment" disposition (no-error /
 *                 other-error / page-issue / other), i.e. explicitly reported a
 *                 defect in the case rather than judging the page.
 *   SINGLE-DIFF   one coder saw it and disagreed with the corpus label.
 *
 * Cases carrying CONTRADICTED or FLAGGED go to adjudication; SPLIT-only and
 * SINGLE-DIFF are reported but are as likely to be rater variance as case defects.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');
const ANN_DIR = path.join(ROOT, 'annotations');
const MANIFEST = path.join(ROOT, 'eval/act-augmented/_annotator/manifest.json');

function loadPages() {
  const m = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const pages = new Map();
  for (const sc of m.scs) {
    for (const asp of sc.aspects) {
      for (const p of asp.pages) {
        pages.set(`${sc.sc}::${asp.slug}::${p.id}`, {
          sc: sc.sc, scTitle: sc.title, aspect: asp.slug, aspectTitle: asp.title,
          aspectDescription: asp.description, caseId: p.id, url: p.url,
          expected: p.expected, scenario: p.scenario, mechanism: p.mechanism,
          whyAutomatedToolsMiss: p.whyAutomatedToolsMiss, primarySelector: p.primarySelector,
          file: path.join('eval/act-augmented', sc.sc, 'pages', asp.slug, `${p.id}.html`),
        });
      }
    }
  }
  return pages;
}

function main() {
  const pages = loadPages();
  const byKey = new Map();
  for (const f of fs.readdirSync(ANN_DIR).filter((f) => f.endsWith('.json')).sort()) {
    const doc = JSON.parse(fs.readFileSync(path.join(ANN_DIR, f), 'utf8'));
    const who = doc.meta?.annotatorName || f;
    for (const [k, a] of Object.entries(doc.annotations)) {
      if (!byKey.has(k)) byKey.set(k, []);
      byKey.get(k).push({ annotator: who, ...a });
    }
  }

  const rows = [];
  for (const [key, anns] of byKey) {
    const p = pages.get(key);
    if (!p) continue;
    const corpus = p.expected === 'failed' ? 'yes' : 'no';
    const votes = anns.map((a) => a.issueExists);
    const flags = anns.filter((a) => a.disposition === 'comment' || (a.commentText || '').trim());

    // A "comment" disposition is not automatically a complaint. When the coder's
    // own yes/no matches the corpus label and they left no text, the comment is
    // concordant bookkeeping — counting it as a defect report inflates the
    // worklist, which is exactly what the adjudicators reported back.
    const complaints = flags.filter((a) => a.issueExists !== corpus
      || (a.commentText || '').trim()
      || ['other-error', 'page-issue', 'other'].includes(a.commentReason));
    const concordantComments = flags.length - complaints.length;

    const signals = [];
    if (votes.length && votes.every((v) => v !== corpus)) signals.push('CONTRADICTED');
    if (new Set(votes).size > 1) signals.push('SPLIT');
    if (complaints.length) signals.push('FLAGGED');
    if (concordantComments && !complaints.length) signals.push('CONCORDANT-COMMENT');
    if (votes.length === 1 && votes[0] !== corpus && !signals.includes('CONTRADICTED')) signals.push('SINGLE-DIFF');
    if (!signals.length) continue;

    const severity = signals.includes('CONTRADICTED') ? (signals.includes('FLAGGED') ? 5 : 4)
      : signals.includes('SPLIT') && signals.includes('FLAGGED') ? 3
      : signals.includes('FLAGGED') ? 2 : 1;

    rows.push({
      key, severity, signals,
      sc: p.sc, aspect: p.aspect, caseId: p.caseId, file: p.file,
      corpusExpected: p.expected, corpusLabel: corpus,
      coders: anns.map((a) => ({
        annotator: a.annotator, issueExists: a.issueExists, disposition: a.disposition,
        commentReason: a.commentReason, commentText: (a.commentText || '').trim(),
      })),
      aspectTitle: p.aspectTitle, scenario: p.scenario, mechanism: p.mechanism,
      primarySelector: p.primarySelector,
      // an annotation only goes to adjudication if it actually reports a defect
      needsAdjudication: signals.includes('CONTRADICTED') || signals.includes('FLAGGED'),
    });
  }

  rows.sort((a, b) => b.severity - a.severity || (a.key < b.key ? -1 : 1));

  const outDir = path.join(ROOT, 'eval/act-augmented/_annotator/irr');
  fs.mkdirSync(outDir, { recursive: true });
  const counts = {};
  for (const r of rows) for (const s of r.signals) counts[s] = (counts[s] || 0) + 1;
  const doc = {
    schema: 'act-augmented-unreliable-cases/1',
    generatedAt: new Date().toISOString(),
    annotatedCases: byKey.size,
    flaggedCases: rows.length,
    forAdjudication: rows.filter((r) => r.needsAdjudication).length,
    signalCounts: counts,
    cases: rows,
  };
  fs.writeFileSync(path.join(outDir, 'unreliable-cases.json'), JSON.stringify(doc, null, 2));

  console.log(`annotated cases: ${byKey.size}`);
  console.log(`cases carrying at least one reliability signal: ${rows.length}`);
  console.log(`signal counts: ${JSON.stringify(counts)}`);
  console.log(`going to adjudication (CONTRADICTED or FLAGGED): ${doc.forAdjudication}`);
  const bySev = {};
  for (const r of rows) bySev[r.severity] = (bySev[r.severity] || 0) + 1;
  console.log(`by severity (5 highest): ${JSON.stringify(bySev)}`);
  const bySC = {};
  for (const r of rows) bySC[r.sc] = (bySC[r.sc] || 0) + 1;
  console.log(`by SC: ${JSON.stringify(bySC)}`);
  console.log(`\nwrote ${path.relative(ROOT, path.join(outDir, 'unreliable-cases.json'))}`);
}

main();
