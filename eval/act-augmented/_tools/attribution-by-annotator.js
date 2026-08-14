#!/usr/bin/env node
/**
 * Who raised what, and how it turned out.
 *
 * Cross-tabs each annotator's raised cases against the adjudication outcome
 * (clear / needs-validation / fixed). A case can be raised by two coders, so
 * rows count per (annotator, case) pair and will sum above the case total.
 *
 * "Raised" has two distinct routes, reported separately because they carry very
 * different evidential weight:
 *   complaint      — a comment disposition or free-text note reporting a defect
 *   contradiction  — the coder's yes/no simply disagrees with the corpus label,
 *                    with nothing written down
 *
 * Usage: node eval/act-augmented/_tools/attribution-by-annotator.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');
const IRR = path.join(ROOT, 'eval/act-augmented/_annotator/irr');

function main() {
  const tags = JSON.parse(fs.readFileSync(path.join(IRR, 'case-reliability-tags.json'), 'utf8'));
  const flagged = JSON.parse(fs.readFileSync(path.join(IRR, 'unreliable-cases.json'), 'utf8'));
  const infoOf = new Map(flagged.cases.map((c) => [c.key, c]));
  const tagOf = new Map(tags.cases.map((c) => [c.key, c]));

  const OUT = ['clear', 'needs-validation', 'fixed'];
  const blank = () => ({
    complaint: { clear: 0, 'needs-validation': 0, fixed: 0 },
    contradiction: { clear: 0, 'needs-validation': 0, fixed: 0 },
    raised: { clear: 0, 'needs-validation': 0, fixed: 0 },
    withText: 0, textCases: [],
  });
  const per = {};
  const soleCredit = {};   // cases where this coder was the ONLY one who raised it

  for (const [key, t] of tagOf) {
    const info = infoOf.get(key);
    if (!info) continue;
    const corpus = info.corpusLabel;
    const raisers = [];
    for (const c of info.coders) {
      const hasText = !!(c.commentText || '').trim();
      const isComplaint = (c.disposition === 'comment' || hasText)
        && (c.issueExists !== corpus || hasText || ['other-error', 'page-issue', 'other'].includes(c.commentReason));
      const isContradiction = c.issueExists !== corpus;
      if (!isComplaint && !isContradiction) continue;
      per[c.annotator] ||= blank();
      if (isComplaint) {
        per[c.annotator].complaint[t.tag]++;
        if (hasText) {
          per[c.annotator].withText++;
          if (t.tag !== 'clear') per[c.annotator].textCases.push(`${key} [${t.tag}]`);
        }
      } else {
        per[c.annotator].contradiction[t.tag]++;
      }
      per[c.annotator].raised[t.tag]++;
      raisers.push(c.annotator);
    }
    if (raisers.length === 1) {
      soleCredit[raisers[0]] ||= { clear: 0, 'needs-validation': 0, fixed: 0 };
      soleCredit[raisers[0]][t.tag]++;
    }
  }

  const names = Object.keys(per).sort();
  const row = (label, o) => {
    const tot = OUT.reduce((a, k) => a + o[k], 0);
    const real = o['needs-validation'] + o.fixed;
    const hit = tot ? ((real / tot) * 100).toFixed(0) + '%' : '—';
    return `${label.padEnd(26)} ${String(o.clear).padStart(5)} ${String(o['needs-validation']).padStart(17)} ${String(o.fixed).padStart(5)} ${String(tot).padStart(6)}   ${hit.padStart(5)}`;
  };

  console.log('\nRaised cases by annotator x adjudication outcome');
  console.log('(a case raised by two coders counts once per coder, so columns sum above the 100 adjudicated)\n');
  console.log(`${''.padEnd(26)} ${'clear'.padStart(5)} ${'needs-validation'.padStart(17)} ${'fixed'.padStart(5)} ${'total'.padStart(6)}   ${'hit'.padStart(5)}`);
  console.log('-'.repeat(72));
  for (const n of names) {
    console.log(row(n + ' — complaint', per[n].complaint));
    console.log(row(n + ' — contradiction only', per[n].contradiction));
    console.log(row(n + ' — ALL', per[n].raised));
    console.log('');
  }

  console.log('Sole raiser (nobody else flagged that case):');
  console.log(`${''.padEnd(26)} ${'clear'.padStart(5)} ${'needs-validation'.padStart(17)} ${'fixed'.padStart(5)}`);
  for (const n of names) {
    const s = soleCredit[n] || { clear: 0, 'needs-validation': 0, fixed: 0 };
    console.log(`${n.padEnd(26)} ${String(s.clear).padStart(5)} ${String(s['needs-validation']).padStart(17)} ${String(s.fixed).padStart(5)}`);
  }

  console.log('\nComplaints that carried free-text and led somewhere:');
  for (const n of names) {
    console.log(`  ${n}: ${per[n].withText} with text, ${per[n].textCases.length} of them not-clear`);
    for (const c of per[n].textCases) console.log(`      ${c}`);
  }

  fs.writeFileSync(path.join(IRR, 'attribution-by-annotator.json'), JSON.stringify({
    schema: 'act-augmented-attribution/1', generatedAt: new Date().toISOString(),
    note: 'Counts are per (annotator, case) pair; a jointly-raised case appears under both coders.',
    perAnnotator: per, soleRaiser: soleCredit,
  }, null, 2));
  console.log(`\nwrote ${path.relative(ROOT, path.join(IRR, 'attribution-by-annotator.json'))}`);
}

main();
