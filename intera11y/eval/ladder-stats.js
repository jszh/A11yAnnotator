#!/usr/bin/env node
'use strict';
// Paired significance tests between consecutive ablation-ladder steps (DESIGN §6), on the six SCs GenA11y covers.
// Every step is scored on the same cases, so each comparison is an exact McNemar test on the cases whose flag
// changed: among violating cases (recall; b = newly caught, c = newly missed) and, separately, among non-violating
// cases (false positives; b = new FPs, c = FPs removed). p = two-sided exact binomial on b of b+c at 0.5.
// Reported per corpus (ACT, 585, expert responses) and pooled over the three (cases are distinct), with Holm's
// correction over the pooled tests of each model.
//
//   node intera11y/eval/ladder-stats.js [--json=out.json]
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const SIX = new Set(['1.1.1', '1.4.1', '1.4.3', '2.4.4', '3.3.1', '4.1.2']);
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const m = /^--([^=]+)(?:=(.*))?$/.exec(a); return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true]; }));

// the same runs as ladder.js
const MODELS = {
  'Gemini 3.7 Flash': {
    0: { gena11y: { act: 'gena11y-act-gem37-neutral', supp: 'supplementary585-gena11y-gem37', expert: 'gena11y-56-gemini37-high-20260823-combined' } },
    '1a': { gena11y: { act: 'gena11y-act-gem37-unbiased', supp: 'supplementary585-gena11y-gem37-unbiased', expert: 'gena11y-56-gem37-unbiased' } },
    1: { gena11y: { act: 'gena11y-act-gem37-stance', supp: 'supplementary585-gena11y-gem37-stance', expert: 'gena11y-56-gem37-stance' } },
    2: { gena11y: { act: 'gena11y-act-gem37-rules', supp: 'supplementary585-gena11y-gem37-rules', expert: 'gena11y-56-gem37-rules' } },
    3: { test: 'ladder-gem-3b-test', expert: 'ladder-gem-3b-expert' },
    4: { test: 'test12-v1', expert: 'expert10-v1' },
  },
  'GLM 5.3 Flash': {
    0: { gena11y: { act: 'gena11y-act-glm53-neutral', supp: 'supplementary585-gena11y-glm53', expert: 'gena11y-56-glm53' } },
    '1a': { gena11y: { act: 'gena11y-act-glm53-unbiased', supp: 'supplementary585-gena11y-glm53-unbiased', expert: 'gena11y-56-glm53-unbiased' } },
    1: { gena11y: { act: 'gena11y-act-glm53-stance', supp: 'supplementary585-gena11y-glm53-stance', expert: 'gena11y-56-glm53-stance' } },
    2: { gena11y: { act: 'gena11y-act-glm53-rules', supp: 'supplementary585-gena11y-glm53-rules', expert: 'gena11y-56-glm53-rules' } },
    3: { test: 'ladder-glm-3b-test', expert: 'ladder-glm-3b-expert' },
    4: { test: 'ladder-glm-4-test', expert: 'ladder-glm-4-expert' },
  },
};
const STEPS = ['0', '1', '2', '3', '4'];
// supplementary step 1a (GenA11y's prompt without its bias instruction), compared with 0 and 1 outside the Holm family
const SUPP_PAIRS = [['0', '1a'], ['1a', '1']];
const BASE = { test: 'intera11y-test12-v1', expert: 'intera11y-expert10-v1' };   // the case set GenA11y's flags are read against

// ACT truth: SC-level by default (act-sc-overrides.json: pages that pass their ACT rule but fail the SC elsewhere,
// for every system alike); --raw-act scores the ACT labels as they are;
// --gena11y-no-partial scores GenA11y's PARTIAL verdicts as not flagged (score.js)
const ACT = (r) => (args['raw-act'] ? r.actFullSharedScope : r.actFullSharedScopeSc);
// a run counts once it has finished: a partial run's missing pages would read as unflagged cases
const exists = (run) => {
  const dir = path.join(ROOT, 'results', run);
  if (!fs.existsSync(path.join(dir, 'results.json'))) return false;
  const st = path.join(dir, 'status.json');
  if (!fs.existsSync(st)) return true;
  const s = JSON.parse(fs.readFileSync(st, 'utf8'));
  return !(typeof s.done === 'number' && typeof s.total === 'number' && s.done < s.total);
};
function score(extra) {
  const tmp = path.join(os.tmpdir(), `ladder-stats-${process.pid}-${Math.random().toString(36).slice(2)}.json`);
  execFileSync('node', [path.join(__dirname, 'score.js'), ...extra, ...(args['gena11y-no-partial'] ? ['--gena11y-no-partial'] : []), `--json=${tmp}`], { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] });
  const r = JSON.parse(fs.readFileSync(tmp, 'utf8'));
  fs.unlinkSync(tmp);
  return r;
}

// { act, supp, expert }: Map case key → { positive, flag }, restricted to the six SCs
function flagsOf(step) {
  const out = {};
  const put = (name, entries) => { out[name] = new Map(entries); };
  if (step.gena11y) {
    const g = step.gena11y;
    if (exists(g.act) && exists(BASE.test)) put('act', ACT(score([`--act=${BASE.test}`, `--gena11y-act=${g.act}`])).perCase.map((c) => [c.k, { positive: c.positive, flag: c.flags.GenA11y }]));
    if (exists(g.supp) && exists(BASE.test)) put('supp', score([`--supp=${BASE.test}`, `--gena11y-supp=${g.supp}`]).supplementary.perCase.filter((c) => c.scs.some((s) => SIX.has(s))).map((c) => [c.k, { positive: c.positive, flag: c.flags.GenA11y }]));
    if (exists(g.expert) && exists(BASE.expert)) put('expert', Object.entries(score([`--expert=${BASE.expert}`, `--gena11y-expert=${g.expert}`]).expert.perCase).filter(([, c]) => SIX.has(c.sc)).map(([k, c]) => [k, { positive: c.truth, flag: c.GenA11y }]));
  } else {
    const test = `intera11y-${step.test}`, expert = `intera11y-${step.expert}`;
    if (exists(test)) {
      const r = score([`--act=${test}`, `--supp=${test}`]);
      put('act', ACT(r).perCase.map((c) => [c.k, { positive: c.positive, flag: c.flags.InterA11y }]));
      put('supp', r.supplementary.perCase.filter((c) => c.scs.some((s) => SIX.has(s))).map((c) => [c.k, { positive: c.positive, flag: c.flags.InterA11y }]));
    }
    if (exists(expert)) put('expert', Object.entries(score([`--expert=${expert}`]).expert.perCase).filter(([, c]) => SIX.has(c.sc)).map(([k, c]) => [k, { positive: c.truth, flag: c.InterA11y }]));
  }
  return out;
}

// exact two-sided binomial p for b successes of n at 0.5
function binomP(b, n) {
  if (n === 0) return 1;
  const lg = (k) => { let s = 0; for (let i = 2; i <= k; i++) s += Math.log(i); return s; };
  const pmf = (k) => Math.exp(lg(n) - lg(k) - lg(n - k) - n * Math.LN2);
  const obs = pmf(b);
  let p = 0;
  for (let k = 0; k <= n; k++) if (pmf(k) <= obs * (1 + 1e-9)) p += pmf(k);
  return Math.min(1, p);
}

// b: cases flagged in `to` but not `from`; c: the reverse — among positives, then among negatives
function discord(from, to) {
  const d = { pos: { b: 0, c: 0, n: 0 }, neg: { b: 0, c: 0, n: 0 } };
  for (const [k, x] of from) {
    const y = to.get(k);
    if (!y || y.positive !== x.positive) continue;
    const s = x.positive ? d.pos : d.neg;
    s.n++;
    if (y.flag && !x.flag) s.b++;
    if (x.flag && !y.flag) s.c++;
  }
  return d;
}

const results = {};
for (const [model, steps] of Object.entries(MODELS)) {
  const flags = Object.fromEntries([...STEPS, '1a'].map((s) => [s, flagsOf(steps[s])]));
  const rows = [];
  const pairs = [...STEPS.slice(1).map((b, i) => [STEPS[i], b]), ...SUPP_PAIRS];
  for (const [a, b] of pairs) {
    const row = { from: a, to: b, corpora: {}, pooled: { pos: { b: 0, c: 0, n: 0 }, neg: { b: 0, c: 0, n: 0 } }, missing: [] };
    for (const corpus of ['act', 'supp', 'expert']) {
      if (!flags[a][corpus] || !flags[b][corpus]) { row.missing.push(corpus); continue; }
      const d = discord(flags[a][corpus], flags[b][corpus]);
      row.corpora[corpus] = d;
      for (const s of ['pos', 'neg']) for (const f of ['b', 'c', 'n']) row.pooled[s][f] += d[s][f];
    }
    for (const d of [row.pooled, ...Object.values(row.corpora)]) for (const s of ['pos', 'neg']) d[s].p = binomP(d[s].b, d[s].b + d[s].c);
    rows.push(row);
  }
  // Holm over the model's pooled tests (recall and FP, each transition)
  for (const r of rows) r.supplementary = SUPP_PAIRS.some(([a, b]) => r.from === a && r.to === b);
  const tests = rows.filter((r) => !r.supplementary).flatMap((r) => ['pos', 'neg'].map((s) => r.pooled[s]));
  const order = tests.map((t, i) => [t.p, i]).sort((x, y) => x[0] - y[0]);
  let running = 0;
  order.forEach(([p, i], rank) => { running = Math.max(running, Math.min(1, p * (tests.length - rank))); tests[i].pHolm = running; });
  results[model] = rows;
}

const fmtP = (p) => (p < 0.001 ? '<0.001' : p.toFixed(3));
const cell = (d) => (d ? `+${d.b} / −${d.c} (p ${fmtP(d.p)})` : '—');
for (const [model, rows] of Object.entries(results)) {
  console.log(`\n## ${model} — consecutive steps, six shared SCs (exact McNemar)\n`);
  console.log('| Step | Violations caught: +gained / −lost, pooled | p (Holm) | False positives: +added / −removed, pooled | p (Holm) | Recall: ACT · 585 · expert | FP: ACT · 585 · expert |');
  console.log('|---|---|---:|---|---:|---|---|');
  for (const r of rows) {
    const pc = (s) => ['act', 'supp', 'expert'].map((c) => cell(r.corpora[c] && r.corpora[c][s])).join(' · ');
    console.log(`| ${r.from}→${r.to} | +${r.pooled.pos.b} / −${r.pooled.pos.c} of ${r.pooled.pos.n} | ${fmtP(r.pooled.pos.p)} (${r.supplementary ? 'n/a' : fmtP(r.pooled.pos.pHolm)}) | +${r.pooled.neg.b} / −${r.pooled.neg.c} of ${r.pooled.neg.n} | ${fmtP(r.pooled.neg.p)} (${r.supplementary ? 'n/a' : fmtP(r.pooled.neg.pHolm)}) | ${pc('pos')} | ${pc('neg')} |${r.missing.length ? ` (missing: ${r.missing.join(', ')})` : ''}`);
  }
}
if (args.json) fs.writeFileSync(path.resolve(ROOT, args.json), JSON.stringify(results, null, 1));
