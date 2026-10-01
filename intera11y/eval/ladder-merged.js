// ablation ladder on ACT + 585 with axe-flagged cases removed (6 SCs: 297, 12 SCs: 439); step 4 = --rubric (v2)
const { execFileSync } = require('child_process'); const fs = require('fs'); const os = require('os'); const path = require('path');
const RUB = process.argv[2] || 'v2';
const SIX = new Set(['1.1.1', '1.4.1', '1.4.3', '2.4.4', '3.3.1', '4.1.2']);
const score = (a) => { const t = path.join(os.tmpdir(), `lm-${Math.random()}.json`); execFileSync('node', ['intera11y/eval/score.js', ...a, `--json=${t}`], { stdio: 'ignore' }); const r = JSON.parse(fs.readFileSync(t)); fs.unlinkSync(t); return r; };
const axe = new Map(JSON.parse(fs.readFileSync('results/axe-test12.json')).map((x) => [x.id, x]));
const axeHit = (k, scs) => axe.get(k).axe.some((x) => x.kind === 'violation' && x.scs.some((s) => scs.includes(s)));
const base = score(['--act=intera11y-test12-v1', '--supp=intera11y-test12-v1']);
// case set per scope: key -> {positive, scs}
const cases = {};
for (const scope of ['6', '12']) {
  const m = new Map();
  for (const c of (scope === '6' ? base.actFullSharedScopeSc : base.actFullSc).perCase) if (!axeHit(c.k, c.scs)) m.set(c.k, { positive: c.positive, scs: c.scs });
  for (const c of base.supplementary.perCase) { if (scope === '6' && !c.scs.some((s) => SIX.has(s))) continue; if (!axeHit(c.k, c.scs)) m.set(c.k, { positive: c.positive, scs: c.scs }); }
  cases[scope] = m;
}
// flags of a scored run: key -> bool, over ACT (both truth views carry the same flags) and 585
const flagsOf = (r, sys) => { const m = new Map(); for (const c of [...r.actFullSc.perCase, ...r.supplementary.perCase]) m.set(c.k, !!c.flags[sys]); return m; };
const gen = (act, supp) => flagsOf(score(['--act=intera11y-test12-v1', '--supp=intera11y-test12-v1', `--gena11y-act=${act}`, `--gena11y-supp=${supp}`]), 'GenA11y');
const ia = (run) => flagsOf(score([`--act=intera11y-${run}`, `--supp=intera11y-${run}`]), 'InterA11y');
const s3six = ia('ladder-gem-3b-test'), s3other = ia('ladder-gem-3b-other-test');
const STEPS = [
  ['0', 'GenA11y', gen('gena11y-act-gem37-neutral', 'supplementary585-gena11y-gem37')],
  ['1a', '(supp.) GenA11y without its bias instruction', gen('gena11y-act-gem37-unbiased', 'supplementary585-gena11y-gem37-unbiased')],
  ['1', '+ neutral prompt stance', gen('gena11y-act-gem37-stance', 'supplementary585-gena11y-gem37-stance')],
  ['2', '+ InterA11y rules', gen('gena11y-act-gem37-rules', 'supplementary585-gena11y-gem37-rules')],
  ['3', '+ tool use (probe evidence, agentic judge; V1 rubric)', null],
  ['4', `+ triage (full InterA11y ${RUB.toUpperCase()})`, ia(`test12-${RUB}`)],
];
// GenA11y steps test only the six SCs: a case outside them is unflagged. Step 3: each half-run flags the cases of its SCs
const flag = (step, k, c) => {
  if (step[0] === '3') return (c.scs.some((s) => SIX.has(s)) && !!s3six.get(k)) || (c.scs.some((s) => !SIX.has(s)) && !!s3other.get(k));
  if (['0', '1a', '1', '2'].includes(step[0]) && !c.scs.some((s) => SIX.has(s))) return false;
  return !!step[2].get(k);
};
function binomP(b, n) { if (!n) return 1; const lg = (k) => { let s = 0; for (let i = 2; i <= k; i++) s += Math.log(i); return s; }; const pmf = (k) => Math.exp(lg(n) - lg(k) - lg(n - k) - n * Math.LN2); const o = pmf(b); let p = 0; for (let k = 0; k <= n; k++) if (pmf(k) <= o * (1 + 1e-9)) p += pmf(k); return Math.min(1, p); }
const fp = (p) => (p < 0.001 ? '<0.001' : p.toFixed(3));
for (const scope of ['6', '12']) {
  const C = cases[scope]; const F = {};
  for (const st of STEPS) F[st[0]] = new Map([...C].map(([k, c]) => [k, flag(st, k, c)]));
  let pos = 0; for (const c of C.values()) if (c.positive) pos++;
  console.log(`\n### ${scope} SCs — ACT + 585 without axe-flagged cases: ${C.size} cases (${pos} violations / ${C.size - pos} non-violations)\n`);
  console.log('| Step | | Recall | FPR | Precision | F1 | Caught vs previous step (p) | FPs vs previous step (p) |');
  console.log('|---|---|---:|---:|---:|---:|---|---|');
  const prevOf = { '1a': '0', '1': '1a', '2': '1', '3': '2', '4': '3' };
  for (const st of STEPS) {
    const m = { TP: 0, FP: 0, FN: 0, TN: 0 };
    for (const [k, c] of C) m[c.positive ? (F[st[0]].get(k) ? 'TP' : 'FN') : (F[st[0]].get(k) ? 'FP' : 'TN')]++;
    const r = m.TP / (m.TP + m.FN), f = m.FP / (m.FP + m.TN), p = m.TP / (m.TP + m.FP);
    // consecutive steps on the main path 0→1→2→3→4; 1a compared with 0, and 1 with 0 (the main path)
    const prev = st[0] === '1a' ? '0' : st[0] === '1' ? '0' : prevOf[st[0]];
    let cmp = ['', ''];
    if (prev) { const d = { pb: 0, pc: 0, nb: 0, nc: 0 }; for (const [k, c] of C) { const a = F[prev].get(k), b = F[st[0]].get(k); if (a === b) continue; if (c.positive) b ? d.pb++ : d.pc++; else b ? d.nb++ : d.nc++; }
      cmp = [`+${d.pb} / −${d.pc} (${fp(binomP(d.pb, d.pb + d.pc))})`, `+${d.nb} / −${d.nc} (${fp(binomP(d.nb, d.nb + d.nc))})`]; }
    console.log(`| ${st[0]} | ${st[1]} | ${r.toFixed(3)} | ${f.toFixed(3)} | ${p.toFixed(3)} | ${(2 * p * r / (p + r)).toFixed(3)} | ${cmp[0]} | ${cmp[1]} |`);
  }
}
