'use strict';
// Per-WCAG-SC ENSEMBLE analysis over the ACT pilot (upstream-evidence/act-pilot/raw.json).
// For each SC, evaluates every non-empty tool SUBSET (union of decided violations) against the W3C
// expected outcomes, and reports the combination with the best balanced performance. A tool "flags" a
// test case iff it emits a DECIDED violation whose SC matches the case's SC (review/potential ≠ flag).
//   expected=failed       → should flag  (flag ⇒ TP, miss ⇒ FN)
//   expected=passed/inapplicable → should NOT flag (flag ⇒ FP, no-flag ⇒ TN)
// Metric: Youden's J = recall + specificity − 1 (balanced, threshold-free); ties broken by higher
// recall then fewer tools. Output: ./evidence/sc-combinations.json + a printed table.
const fs = require('fs');
const path = require('path');
const TOOLS = ['axe', 'ibm', 'alfa', 'qualweb', 'htmlcs'];

const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'upstream-evidence', 'act-pilot', 'raw.json'), 'utf8'));
const cases = Array.isArray(raw) ? raw : (raw.cases || raw.results || Object.values(raw).find(Array.isArray));

// did `tool` emit a DECIDED violation matching one of the case's SCs?
function flags(c, tool, scSet) {
  const fnd = (c.byTool && c.byTool[tool]) || [];
  return fnd.some((x) => x && x.outcome === 'violation' && (x.sc || []).some((s) => scSet.has(s)));
}
const subsets = (arr) => { const out = []; for (let m = 1; m < (1 << arr.length); m++) { const s = []; for (let i = 0; i < arr.length; i++) if (m & (1 << i)) s.push(arr[i]); out.push(s); } return out; };

// group cases by SC
const bySc = {};
for (const c of cases) for (const sc of (c.sc || [])) { if (!/^\d\.\d+\.\d+$/.test(sc)) continue; (bySc[sc] = bySc[sc] || []).push(c); }

function scoreCombo(scCases, combo, scSet) {
  let tp = 0, fn = 0, fp = 0, tn = 0;
  for (const c of scCases) {
    const flagged = combo.some((t) => flags(c, t, scSet));
    if (c.expected === 'failed') (flagged ? tp++ : fn++);
    else if (c.expected === 'passed' || c.expected === 'inapplicable') (flagged ? fp++ : tn++);
  }
  const recall = (tp + fn) ? tp / (tp + fn) : null;
  const spec = (tn + fp) ? tn / (tn + fp) : null;
  const prec = (tp + fp) ? tp / (tp + fp) : null;
  const J = (recall != null && spec != null) ? recall + spec - 1 : null;
  const f1 = (prec != null && recall != null && (prec + recall)) ? 2 * prec * recall / (prec + recall) : null;
  return { tp, fn, fp, tn, recall, spec, prec, J, f1 };
}

const report = {};
for (const [sc, scCases] of Object.entries(bySc)) {
  const failed = scCases.filter((c) => c.expected === 'failed').length;
  if (!failed) continue; // no positives to score recall on
  // candidate tools = those with any decided flag on this SC (others add nothing to a union)
  const scSet = new Set([sc]);
  const candidates = TOOLS.filter((t) => scCases.some((c) => flags(c, t, scSet)));
  if (!candidates.length) { report[sc] = { nFailed: failed, nCases: scCases.length, note: 'no tool decides this SC' }; continue; }
  const combos = subsets(candidates).map((combo) => ({ combo, ...scoreCombo(scCases, combo, scSet) }));
  const rank = (a, b) => (b.J - a.J) || (b.recall - a.recall) || (a.combo.length - b.combo.length) || (b.prec - a.prec);
  combos.sort(rank);
  const best = combos[0];
  const singles = combos.filter((c) => c.combo.length === 1).sort(rank);
  const all = combos.find((c) => c.combo.length === candidates.length);
  report[sc] = {
    nCases: scCases.length, nFailed: failed,
    bestCombo: best.combo, bestJ: round(best.J), bestRecall: round(best.recall), bestSpec: round(best.spec), bestPrec: round(best.prec),
    bestSingle: singles[0].combo[0], singleJ: round(singles[0].J), singleRecall: round(singles[0].recall),
    allTools: { tools: all.combo, J: round(all.J), recall: round(all.recall), spec: round(all.spec) },
    candidates,
  };
}
function round(x) { return x == null ? null : Math.round(x * 100) / 100; }

fs.writeFileSync(path.join(__dirname, 'evidence', 'sc-combinations.json'), JSON.stringify(report, null, 1));

// print, sorted by SC
const rows = Object.keys(report).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
console.log('SC      nF | BEST COMBINATION (Youden J)            J    rec  spec | best single   | all-tools J/rec');
for (const sc of rows) {
  const r = report[sc];
  if (r.note) { console.log(sc.padEnd(8) + String(r.nFailed).padEnd(3) + '| ' + r.note); continue; }
  const combo = r.bestCombo.join('+');
  console.log(
    sc.padEnd(8) + String(r.nFailed).padEnd(3) + '| ' +
    combo.padEnd(38) + String(r.bestJ).padEnd(5) + String(r.bestRecall).padEnd(5) + String(r.bestSpec).padEnd(6) + '| ' +
    (r.bestSingle + ' (J' + r.singleJ + ')').padEnd(15) + '| ' + r.allTools.J + '/' + r.allTools.recall
  );
}
