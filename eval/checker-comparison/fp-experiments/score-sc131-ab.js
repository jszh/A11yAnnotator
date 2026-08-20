#!/usr/bin/env node
'use strict';
// Score the tools-ON 1.3.1 A/B: `field-programmatic-association-v0`'s composite-input-group clause.
//
// WHY THIS EXISTS. The clause was written against five FPs in one aspect
// (`form-label-and-group-relationships-by-context`) and then could not be tested: in the fixed-evidence
// judge replay that family does not reproduce at all — every one of the five comes back `missedAgree` in
// both arms. The 585 run those FPs came from had TOOLS ON and the replay is single-shot tools-OFF, so the
// judge is not being handed the same evidence. The rubric edit was therefore REVERTED as unmeasured rather
// than kept on a plausible story. This runs the real pipeline, tools ON, over the whole 1.3.1 slice.
//
// Two questions, in order, and the second only matters if the first says yes:
//   1. REPRODUCTION — do the five target FPs come back at all? If they do not, the arms cannot be compared
//      on them and the answer is again "untested", not "no effect".
//   2. EFFECT — across three reps per arm, does the edit move FPs or recall further than rep-to-rep spread?
//      Live runs re-collect evidence every time, so the floor here is the full-pipeline one (about +-3),
//      not the fixed-evidence sd of ~1.06. Per-rep ranges are printed for exactly that reason: a mean shift
//      smaller than the overlap between arms is not a result.
const fs = require('fs');
const path = require('path');

const ROOT = process.argv[2];
if (!ROOT) { console.error('usage: score-sc131-ab.js <dir-holding-sc131-*-r*/>'); process.exit(1); }
const TARGET_ASPECT = 'form-label-and-group-relationships-by-context';
const TARGET_FPS = ['case-06', 'case-09', 'case-17', 'case-18', 'case-20'];

function load(arm, rep) {
  const p = path.join(ROOT, `sc131-${arm}-r${rep}`, 'results.json');
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
}
const isFail = (c) => c.expected === 'failed';
const flagged = (c) => c.outcome === 'caught';

function tally(rows) {
  let tp = 0, fn = 0, fp = 0, tn = 0;
  for (const c of rows) {
    if (isFail(c)) (flagged(c) ? tp++ : fn++);
    else (flagged(c) ? fp++ : tn++);
  }
  return { tp, fn, fp, tn, n: rows.length };
}

const arms = {};
for (const arm of ['head', 'new', 'new2']) {
  arms[arm] = [];
  for (const rep of [1, 2, 3]) {
    const rows = load(arm, rep);
    if (rows) arms[arm].push({ rep, rows, t: tally(rows) });
  }
}

const fmt = (xs) => `${(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1)} (${xs.join(', ')})`;
console.log('\n=== 1.3.1 slice, tools ON, gemini-3.5-flash-lite ===');
console.log('arm   reps  FP mean (per rep)      TP mean (per rep)      n');
for (const arm of ['head', 'new', 'new2']) {
  const a = arms[arm]; if (!a.length) { console.log(`${arm}: no runs`); continue; }
  console.log(`${arm.padEnd(5)} ${String(a.length).padEnd(5)} ${fmt(a.map((x) => x.t.fp)).padEnd(22)} ${fmt(a.map((x) => x.t.tp)).padEnd(22)} ${a[0].t.n}`);
}

// ---- Q1: does the target family reproduce? -------------------------------------------------------
console.log(`\n=== reproduction of the ${TARGET_ASPECT} FPs ===`);
console.log('(the 585 run flagged all five; the fixed-evidence replay flagged none)');
console.log('case      585   ' + ['head', 'new', 'new2'].flatMap((a) => arms[a].map((x) => `${a[0]}${x.rep}`)).join('    '));
for (const id of TARGET_FPS) {
  const cells = [];
  for (const arm of ['head', 'new', 'new2']) {
    for (const x of arms[arm]) {
      const row = x.rows.find((c) => c.testcaseId.includes(TARGET_ASPECT) && c.testcaseId.endsWith(id));
      cells.push(!row ? ' ?  ' : row.outcome === 'caught' ? ' FP ' : ' ok ');
    }
  }
  console.log(`${id}   FP    ${cells.join('  ')}`);
}

// how many of the family's 15 pass-cases are flagged, per run — the population the clause targets
console.log('\nfamily-wide FP count per run (15 expected-pass cases in the aspect):');
for (const arm of ['head', 'new', 'new2']) {
  const per = arms[arm].map((x) => x.rows.filter((c) => c.testcaseId.includes(TARGET_ASPECT) && !isFail(c) && flagged(c)).length);
  const rec = arms[arm].map((x) => x.rows.filter((c) => c.testcaseId.includes(TARGET_ASPECT) && isFail(c) && flagged(c)).length);
  console.log(`  ${arm.padEnd(5)} FP ${fmt(per)}   TP ${fmt(rec)}`);
}

// ---- Q2: case-level churn, so a wash is not read as a fix ------------------------------------------
if (arms.head.length && arms.new.length) {
  const rate = (arm, pred) => {
    const m = new Map();
    for (const x of arms[arm]) for (const c of x.rows) {
      if (!pred(c)) continue;
      m.set(c.testcaseId, (m.get(c.testcaseId) || 0) + (flagged(c) ? 1 : 0));
    }
    return m;
  };
  const hFP = rate('head', (c) => !isFail(c)), nFP = rate('new', (c) => !isFail(c));
  const hTP = rate('head', isFail), nTP = rate('new', isFail);
  const moved = (h, n, label) => {
    const rows = [];
    for (const [id, hv] of h) { const nv = n.get(id); if (nv !== undefined && nv !== hv) rows.push([id, hv, nv]); }
    rows.sort((a, b) => (b[1] - b[2]) - (a[1] - a[2]));
    console.log(`\n${label} — cases whose flag-rate differs (head/${arms.head.length} -> new/${arms.new.length}):`);
    if (!rows.length) console.log('  none');
    for (const [id, hv, nv] of rows) console.log(`  ${hv} -> ${nv}   ${id.replace(/^aug-1\.3\.1-/, '')}`);
  };
  moved(hFP, nFP, 'FALSE POSITIVES (expected-pass cases; lower is better)');
  moved(hTP, nTP, 'RECALL (expected-fail cases; higher is better)');
}
