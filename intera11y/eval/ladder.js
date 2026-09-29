#!/usr/bin/env node
'use strict';
// The ablation ladder's table (DESIGN §6): each step's totals over the six SCs GenA11y covers, on the held-out
// ACT cases, the human-annotated 585 cases and the expert study, scored by score.js. Step 0 is GenA11y's own runs
// (its expert flags recomputed from the run, matched like InterA11y's); steps 1–4 are InterA11y runs. ACT and 585
// runs load the label-free page copies (eval/neutral-corpus.js); earlier runs (test9, gena11y-act-gem37/-glm53)
// could read the answer from the page and are not used.
//
//   node intera11y/eval/ladder.js [--json=out.json]
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const SIX = new Set(['1.1.1', '1.4.1', '1.4.3', '2.4.4', '3.3.1', '4.1.2']);
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const m = /^--([^=]+)(?:=(.*))?$/.exec(a); return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true]; }));

const MODELS = {
  'Gemini 3.7 Flash': {
    gena11y: { act: 'gena11y-act-gem37-neutral', supp: 'supplementary585-gena11y-gem37', expert: 'gena11y-56-gemini37-high-20260823-combined' },
    steps: { 1: 'ladder-gem-1', 2: 'ladder-gem-2', '3a': 'ladder-gem-3a', '3b': 'ladder-gem-3b', 4: { test: 'test10-v1', expert: 'expert8-v1' } },
  },
  'GLM 5.3 Flash': {
    gena11y: { act: 'gena11y-act-glm53-neutral', supp: 'supplementary585-gena11y-glm53', expert: 'gena11y-56-glm53' },
    steps: { 1: 'ladder-glm-1', 2: 'ladder-glm-2', '3a': 'ladder-glm-3a', '3b': 'ladder-glm-3b', 4: 'ladder-glm-4' },
  },
};
const STEP_NAMES = { 0: 'GenA11y', 1: '+ neutral prompt', 2: '+ evidence', '3a': '+ InterA11y rules', '3b': '+ agentic judge (V1)', 4: '+ triage (full InterA11y V1)' };

const exists = (run) => fs.existsSync(path.join(ROOT, 'results', run, 'results.json'));
function score(extra) {
  const tmp = path.join(require('os').tmpdir(), `ladder-${process.pid}-${Math.random().toString(36).slice(2)}.json`);
  execFileSync('node', [path.join(__dirname, 'score.js'), ...extra, `--json=${tmp}`], { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] });
  const r = JSON.parse(fs.readFileSync(tmp, 'utf8'));
  fs.unlinkSync(tmp);
  return r;
}
const sum = (bySc, sys) => {
  const o = { TP: 0, FP: 0, FN: 0, TN: 0 };
  for (const [sc, x] of Object.entries(bySc || {})) if (SIX.has(sc) && x[sys]) for (const k of Object.keys(o)) o[k] += x[sys][k];
  return o;
};
const stats = (x) => {
  const r = x.TP / (x.TP + x.FN), p = x.TP / (x.TP + x.FP), f = x.FP / (x.FP + x.TN);
  return { ...x, recall: +r.toFixed(3), precision: +p.toFixed(3), fpr: +f.toFixed(3), f1: +(2 * p * r / (p + r)).toFixed(3) };
};

const out = {};
for (const [model, m] of Object.entries(MODELS)) {
  out[model] = [];   // a list: object keys like '4' would sort ahead of '3a'
  for (const step of ['0', '1', '2', '3a', '3b', '4']) {
    const row = {};
    if (step === '0') {
      const g = m.gena11y;
      if (exists(g.act) && exists('intera11y-test10-v1')) { const r = score([`--act=intera11y-test10-v1`, `--gena11y-act=${g.act}`]); row.act = stats(r.actFullSharedScope.all.GenA11y); }
      if (exists(g.supp) && exists('intera11y-test10-v1')) { const r = score([`--supp=intera11y-test10-v1`, `--gena11y-supp=${g.supp}`]); row.supp = stats(sum(r.supplementary.bySc, 'GenA11y')); }
      if (exists(g.expert) && exists('intera11y-expert8-v1')) { const r = score([`--expert=intera11y-expert8-v1`, `--gena11y-expert=${g.expert}`]); row.expert = stats(sum(r.expert.bySc, 'GenA11y')); }
    } else {
      const s = m.steps[step];
      const test = typeof s === 'string' ? `intera11y-${s}-test` : `intera11y-${s.test}`;
      const expert = typeof s === 'string' ? `intera11y-${s}-expert` : `intera11y-${s.expert}`;
      if (exists(test)) { const r = score([`--act=${test}`, `--supp=${test}`]); row.act = stats(r.actFullSharedScope.all.InterA11y); row.supp = stats(sum(r.supplementary.bySc, 'InterA11y')); }
      if (exists(expert)) { const r = score([`--expert=${expert}`]); row.expert = stats(sum(r.expert.bySc, 'InterA11y')); }
    }
    out[model].push({ step, ...row });
  }
}

for (const [model, steps] of Object.entries(out)) {
  console.log(`\n## ${model} — the six SCs GenA11y covers\n`);
  console.log('| Step | | ACT recall | ACT FPR | ACT F1 | 585 recall | 585 FPR | 585 F1 | Expert recall | Expert FPR | Expert F1 |');
  console.log('|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
  for (const r of steps) {
    const step = r.step;
    const c = (x, k) => (x ? x[k] : '—');
    console.log(`| ${step} | ${STEP_NAMES[step]} | ${c(r.act, 'recall')} | ${c(r.act, 'fpr')} | ${c(r.act, 'f1')} | ${c(r.supp, 'recall')} | ${c(r.supp, 'fpr')} | ${c(r.supp, 'f1')} | ${c(r.expert, 'recall')} | ${c(r.expert, 'fpr')} | ${c(r.expert, 'f1')} |`);
  }
}
if (args.json) fs.writeFileSync(path.resolve(ROOT, args.json), JSON.stringify(out, null, 1));
