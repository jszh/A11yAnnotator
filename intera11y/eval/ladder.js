#!/usr/bin/env node
'use strict';
// The ablation ladder's table (DESIGN §6): each step's totals over the six SCs GenA11y covers, on the held-out
// ACT cases, the human-annotated 585 cases and the expert study, scored by score.js. Step 0 is GenA11y's own runs
// (its expert flags recomputed from the run, matched like InterA11y's), step 1 GenA11y's with the neutral stance, step 2
// GenA11y's with the neutral stance and InterA11y's rules; supplementary step 1a GenA11y's own prompt with only its bias
// instruction ("only flag clear violations") removed; steps 3–4 are InterA11y runs. ACT and 585 runs load the label-free page copies (eval/neutral-corpus.js); earlier
// runs (test9, gena11y-act-gem37/-glm53) could read the answer from the page and are not used.
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
    unbiased: { act: 'gena11y-act-gem37-unbiased', supp: 'supplementary585-gena11y-gem37-unbiased', expert: 'gena11y-56-gem37-unbiased' },
    stance: { act: 'gena11y-act-gem37-stance', supp: 'supplementary585-gena11y-gem37-stance', expert: 'gena11y-56-gem37-stance' },
    rules: { act: 'gena11y-act-gem37-rules', supp: 'supplementary585-gena11y-gem37-rules', expert: 'gena11y-56-gem37-rules' },
    steps: { 3: 'ladder-gem-3b', 4: { test: 'test12-v1', expert: 'expert10-v1' } },
  },
  'GLM 5.3 Flash': {
    gena11y: { act: 'gena11y-act-glm53-neutral', supp: 'supplementary585-gena11y-glm53', expert: 'gena11y-56-glm53' },
    unbiased: { act: 'gena11y-act-glm53-unbiased', supp: 'supplementary585-gena11y-glm53-unbiased', expert: 'gena11y-56-glm53-unbiased' },
    stance: { act: 'gena11y-act-glm53-stance', supp: 'supplementary585-gena11y-glm53-stance', expert: 'gena11y-56-glm53-stance' },
    rules: { act: 'gena11y-act-glm53-rules', supp: 'supplementary585-gena11y-glm53-rules', expert: 'gena11y-56-glm53-rules' },
    steps: { 3: 'ladder-glm-3b', 4: 'ladder-glm-4' },
  },
};
// 0–2 run in GenA11y's pipeline; 3 moves into InterA11y's, where the probes' evidence and the judge's tools (both tool
// use) come in together; 4 adds triage
const STEP_NAMES = { 0: 'GenA11y', '1a': '(supplementary) GenA11y without its bias instruction', 1: '+ neutral prompt stance', 2: '+ InterA11y rules', 3: '+ tool use (probe evidence, agentic judge)', 4: '+ triage (full InterA11y V1)' };

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
  const tmp = path.join(require('os').tmpdir(), `ladder-${process.pid}-${Math.random().toString(36).slice(2)}.json`);
  execFileSync('node', [path.join(__dirname, 'score.js'), ...extra, ...(args['gena11y-no-partial'] ? ['--gena11y-no-partial'] : []), `--json=${tmp}`], { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] });
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
  for (const step of ['0', '1a', '1', '2', '3', '4']) {
    const row = {};
    if (['0', '1a', '1', '2'].includes(step)) {   // GenA11y's pipeline: as is, − bias instruction, + neutral stance, + InterA11y rules
      const g = { 0: m.gena11y, '1a': m.unbiased, 1: m.stance, 2: m.rules }[step];
      if (exists(g.act) && exists('intera11y-test12-v1')) { const r = score([`--act=intera11y-test12-v1`, `--gena11y-act=${g.act}`]); row.act = stats(ACT(r).all.GenA11y); }
      if (exists(g.supp) && exists('intera11y-test12-v1')) { const r = score([`--supp=intera11y-test12-v1`, `--gena11y-supp=${g.supp}`]); row.supp = stats(sum(r.supplementary.bySc, 'GenA11y')); }
      if (exists(g.expert) && exists('intera11y-expert10-v1')) { const r = score([`--expert=intera11y-expert10-v1`, `--gena11y-expert=${g.expert}`]); row.expert = stats(sum(r.expert.bySc, 'GenA11y')); }
    } else {
      const s = m.steps[step];
      const test = typeof s === 'string' ? `intera11y-${s}-test` : `intera11y-${s.test}`;
      const expert = typeof s === 'string' ? `intera11y-${s}-expert` : `intera11y-${s.expert}`;
      if (exists(test)) { const r = score([`--act=${test}`, `--supp=${test}`]); row.act = stats(ACT(r).all.InterA11y); row.supp = stats(sum(r.supplementary.bySc, 'InterA11y')); }
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
