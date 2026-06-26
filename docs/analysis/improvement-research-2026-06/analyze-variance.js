'use strict';
// Variance + voting analysis over N identical runs. Decomposes error into stable-correct / stable-wrong / noisy,
// and simulates K=N majority voting vs single-run. Run after var-run-a/b/c complete.
const fs = require('fs');
const RUNS = process.argv.slice(2);
if (RUNS.length < 2) { console.error('usage: node analyze-variance.js <dir1> <dir2> ...'); process.exit(1); }

function load(dir) {
  const R = require('/Users/jason/Developer/A11yAnnotator/results/' + dir + '/results.json');
  const m = {};
  for (const x of R) m[x.testcaseId] = { exp: x.expected, caught: x.outcome === 'caught', sc: (x.sc || [])[0] };
  return m;
}
const runs = RUNS.map(load);
const ids = Object.keys(runs[0]);

// per-run metrics
function metrics(m) {
  let tp = 0, fn = 0, fp = 0, tn = 0;
  for (const id of ids) { const r = m[id]; if (!r) continue;
    if (r.exp === 'failed') { r.caught ? tp++ : fn++; } else { r.caught ? fp++ : tn++; } }
  const recall = tp / (tp + fn), prec = tp / (tp + fp || 1), f1 = 2 * prec * recall / (prec + recall || 1);
  return { tp, fn, fp, recall: +(recall).toFixed(4), precision: +(prec).toFixed(4), f1: +(f1).toFixed(4) };
}
console.log('=== Per-run metrics (identical config, HEAD) ===');
const perRun = runs.map((m, i) => ({ run: RUNS[i], ...metrics(m) }));
for (const p of perRun) console.log(' ', p.run, JSON.stringify({ tp: p.tp, fn: p.fn, fp: p.fp, recall: p.recall, precision: p.precision, f1: p.f1 }));
const spread = (k) => { const v = perRun.map((p) => p[k]); return { min: Math.min(...v), max: Math.max(...v), range: +(Math.max(...v) - Math.min(...v)).toFixed(4) }; };
console.log('\n=== NOISE FLOOR (spread across identical runs) ===');
for (const k of ['tp', 'fn', 'fp', 'f1']) console.log('  ' + k + ':', JSON.stringify(spread(k)));

// per-case stability decomposition
let stableCorrect = 0, stableWrong = 0, noisy = 0; const noisyCases = [];
for (const id of ids) {
  const votes = runs.map((m) => m[id]).filter(Boolean);
  if (votes.length < runs.length) continue;
  const exp = votes[0].exp, caughtCount = votes.filter((v) => v.caught).length;
  const correctIfCaught = exp === 'failed';
  const allSame = caughtCount === 0 || caughtCount === runs.length;
  if (!allSame) { noisy++; noisyCases.push({ id: id.slice(0, 8), exp, caughtCount, sc: votes[0].sc }); continue; }
  const caught = caughtCount === runs.length;
  if (caught === correctIfCaught) stableCorrect++; else stableWrong++;
}
console.log('\n=== ERROR DECOMPOSITION (per-case stability across all runs) ===');
console.log('  stable-correct:', stableCorrect, '| stable-WRONG (systematic):', stableWrong, '| NOISY (flips):', noisy);
console.log('  noisy cases:', JSON.stringify(noisyCases));

// K=N majority voting simulation
function voteMetrics() {
  let tp = 0, fn = 0, fp = 0;
  for (const id of ids) {
    const votes = runs.map((m) => m[id]).filter(Boolean);
    if (!votes.length) continue;
    const exp = votes[0].exp, caughtCount = votes.filter((v) => v.caught).length;
    const caught = caughtCount > votes.length / 2; // majority
    if (exp === 'failed') { caught ? tp++ : fn++; } else if (caught) fp++;
  }
  const recall = tp / (tp + fn), prec = tp / (tp + fp || 1), f1 = 2 * prec * recall / (prec + recall || 1);
  return { tp, fn, fp, recall: +(recall).toFixed(4), precision: +(prec).toFixed(4), f1: +(f1).toFixed(4) };
}
const avg = (k) => +(perRun.reduce((s, p) => s + p[k], 0) / perRun.length).toFixed(4);
console.log('\n=== K=' + runs.length + ' MAJORITY VOTING vs single-run average ===');
console.log('  single-run AVG: ', JSON.stringify({ tp: avg('tp'), fn: avg('fn'), fp: avg('fp'), f1: avg('f1') }));
console.log('  K-vote majority:', JSON.stringify(voteMetrics()));
