'use strict';
// H7 critic analysis: compare critic run vs the 3 baselines (majority). Measures FP reduction, TP cost, and the
// refutation ASYMMETRY (the critic should downgrade FPs >> TPs).
const CRITIC = process.argv[2] || 'exp27-critic';
const BASE = ['var-run-a', 'var-run-b', 'var-run-c'];
const load = (d) => { const m = {}; for (const x of require('/Users/jason/Developer/A11yAnnotator/results/' + d + '/results.json')) m[x.testcaseId] = { exp: x.expected, caught: x.outcome === 'caught', sc: (x.sc || [])[0] }; return m; };
const crit = load(CRITIC); const base = BASE.map(load);
const ids = Object.keys(crit);
function metrics(get) { let tp = 0, fn = 0, fp = 0; for (const id of ids) { const r = crit[id]; if (!r) continue; const caught = get(id); if (r.exp === 'failed') caught ? tp++ : fn++; else if (caught) fp++; } const recall = tp / (tp + fn), prec = tp / (tp + fp || 1); return { tp, fn, fp, f1: +(2 * prec * recall / (prec + recall || 1)).toFixed(4) }; }
const baseMaj = (id) => base.filter((m) => m[id] && m[id].caught).length > base.length / 2;
console.log('=== H7 critic vs baseline-majority ===');
console.log('  baseline (K=3 maj):', JSON.stringify(metrics(baseMaj)));
console.log('  critic ON         :', JSON.stringify(metrics((id) => crit[id].caught)));
console.log('  baselines (per-run FP): a/b/c =', BASE.map((_, i) => base[i] ? Object.keys(base[i]).filter((id) => base[i][id].exp !== 'failed' && base[i][id].caught).length : '?').join('/'));
// asymmetry: cases baseline-caught that the critic CLEARED
const fpFixed = [], tpLost = [], newFp = [];
for (const id of ids) {
  const bm = baseMaj(id), cc = crit[id].caught, exp = crit[id].exp, sc = crit[id].sc;
  if (bm && !cc) { (exp === 'failed' ? tpLost : fpFixed).push(id.slice(0, 8) + '(' + sc + ')'); }
  if (!bm && cc && exp !== 'failed') newFp.push(id.slice(0, 8) + '(' + sc + ')');
}
console.log('\n=== Asymmetry (baseline-caught → critic-cleared) ===');
console.log('  FP FIXED (GT-pass, critic downgraded):', fpFixed.length, JSON.stringify(fpFixed));
console.log('  TP LOST  (GT-fail, critic wrongly downgraded):', tpLost.length, JSON.stringify(tpLost));
console.log('  NEW FP   (critic flagged what baseline cleared — noise):', newFp.length, JSON.stringify(newFp));
console.log('\n  asymmetry = FP-fixed/TP-lost =', tpLost.length ? (fpFixed.length / tpLost.length).toFixed(2) : '∞');
