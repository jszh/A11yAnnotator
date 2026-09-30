'use strict';
// A case's result row, from its page report — shared by the runner (bin/intera11y.js) and splice-rerun.js, so a
// spliced row is computed exactly as the runner computes one.

// `field` = 'verdict' (with the screening sweep) or 'verdictWithoutScreen' (rule-based candidates only)
function outcomeOf(report, scs, field = 'verdict') {
  if (!report || report.error) return 'error';
  const vs = scs.map((sc) => report.criteria[sc] && report.criteria[sc][field]);
  if (vs.includes('FAIL')) return 'caught';
  if (vs.includes('INCOMPLETE') || vs.includes(undefined)) return 'uncertain';
  return 'missedAgree';
}

function rowOf(c, report) {
  const outcome = outcomeOf(report, c.scs);
  const polarity = c.expected === 'failed' ? 'recall' : c.expected ? 'specificity' : null;
  return {
    id: c.id, ...c.meta, scs: c.scs, expected: c.expected || null, outcome, polarity,
    falsePositive: polarity === 'specificity' && outcome === 'caught',
    verdicts: report && report.criteria ? Object.fromEntries(c.scs.map((sc) => [sc, report.criteria[sc] ? report.criteria[sc].verdict : null])) : null,
    outcomeWithoutScreen: outcomeOf(report, c.scs, 'verdictWithoutScreen'),
    verdictsWithoutScreen: report && report.criteria ? Object.fromEntries(c.scs.map((sc) => [sc, report.criteria[sc] ? report.criteria[sc].verdictWithoutScreen || null : null])) : null,
    findings: report && report.criteria ? Object.fromEntries(c.scs.map((sc) => [sc, (report.criteria[sc] && report.criteria[sc].findings) || []])) : null,
    costUsd: report && report.criteria ? Object.values(report.criteria).reduce((s, x) => s + (x.costUsd || 0), 0) : 0,
    ms: report ? report.ms : null,
    error: report && report.error ? report.error : null,
  };
}

// a case id → its page report's file name
const fileId = (id) => id.replace(/[^a-z0-9_.-]+/gi, '_').slice(0, 180);

module.exports = { outcomeOf, rowOf, fileId };
