#!/usr/bin/env node
'use strict';
// Every system on the same cases: InterA11y (V1, V2), GenA11y, AccessGuru and the off-the-shelf checkers (axe, IBM
// Equal Access, HTML_CodeSniffer, Alfa, QualWeb), on ACT, the 585 human-annotated cases and the expert study, over
// the six SCs GenA11y covers and over all 12. The case sets and their truth are score.js's (ACT with SC-level
// labels; the expert study's responses with its overrides and set-asides), so the numbers line up with its tables.
//
// A checker flags a case when it reports a violation (not a needs-review item; "+review" rows count those too)
// whose SC is one of the case's. On the expert pages the violation must be on the case's element or inside it,
// as for InterA11y; a page-scope case is flagged by any violation of its SC on the page. AccessGuru names SCs
// per page (axe 4.4.1 + its LLM detector); on the expert pages its axe elements and the elements its LLM quoted.
//
//   node intera11y/eval/score-baselines.js [--json=out.json]
//     --checkers=results/checkers   (test-*.jsonl, expert-*.jsonl from eval/checker-comparison/run-corpus-checkers.js)
//     --ag-test=accessguru-test12-gem37 --ag-expert=accessguru-expert-gem37
//     --v1=… --v2=… (InterA11y test/expert runs), --gena11y-act/-supp/-expert as in score.js
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { key, within } = require('../src/lib/xpath.js');

const ROOT = path.join(__dirname, '..', '..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const m = /^--([^=]+)(?:=(.*))?$/.exec(a); return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true]; }));
const SIX = new Set(['1.1.1', '1.4.1', '1.4.3', '2.4.4', '3.3.1', '4.1.2']);
const CHK = path.resolve(ROOT, args.checkers || 'results/checkers');
const TOOLS = ['axe', 'ibm', 'htmlcs', 'alfa', 'qualweb'];
const TOOL_NAME = { axe: 'axe', ibm: 'IBM Equal Access', htmlcs: 'HTML_CodeSniffer', alfa: 'Alfa', qualweb: 'QualWeb' };
const RUNS = {
  v1: { test: args['v1-test'] || 'intera11y-test12-v1', expert: args['v1-expert'] || 'intera11y-expert10-v1' },
  v2: { test: args['v2-test'] || 'intera11y-test12-v2', expert: args['v2-expert'] || 'intera11y-expert10-v2' },
};
const GEN = ['--gena11y-act=' + (args['gena11y-act'] || 'gena11y-act-gem37-neutral'), '--gena11y-supp=' + (args['gena11y-supp'] || 'supplementary585-gena11y-gem37'), '--gena11y-expert=' + (args['gena11y-expert'] || 'gena11y-56-gemini37-high-20260823-combined')];

function score(extra) {
  const t = path.join(os.tmpdir(), `sb-${process.pid}-${Math.random().toString(36).slice(2)}.json`);
  execFileSync('node', [path.join(__dirname, 'score.js'), ...extra, `--json=${t}`], { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] });
  const r = JSON.parse(fs.readFileSync(t, 'utf8')); fs.unlinkSync(t); return r;
}
const readJsonl = (prefix) => fs.readdirSync(CHK).filter((f) => f.startsWith(prefix) && f.endsWith('.jsonl'))
  .flatMap((f) => fs.readFileSync(path.join(CHK, f), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)));

// ---- systems' flags ----
const r1 = score([`--act=${RUNS.v1.test}`, `--supp=${RUNS.v1.test}`, `--expert=${RUNS.v1.expert}`, ...GEN]);
const r2 = score([`--act=${RUNS.v2.test}`, `--supp=${RUNS.v2.test}`, `--expert=${RUNS.v2.expert}`, ...GEN]);
const chkTest = new Map(readJsonl('test-').map((r) => [r.id, r]));
const chkExpert = new Map(readJsonl('expert-').map((r) => [String(r.file).normalize('NFC'), r]));
const rowsOf = (run) => { const f = path.join(ROOT, 'results', run, 'results.json'); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null; };
const agTest = new Map((rowsOf(args['ag-test'] || 'accessguru-test12-gem37') || []).map((r) => [r.testcaseId, r]));
const agExpert = new Map((rowsOf(args['ag-expert'] || 'accessguru-expert-gem37') || []).map((r) => [String(r.pageFile || '').normalize('NFC'), r]));

// study cases: scope (page / element) by case id
const SRC = path.join(ROOT, 'docs/chi-evidence/claim5-expert-study');
const studyCase = {};
for (const f of ['round1-manifest.json', 'round2-manifest.json']) for (const c of JSON.parse(fs.readFileSync(path.join(SRC, f), 'utf8')).cases) studyCase[c.caseId] = c;

// a test case (ACT/585) is flagged when a violation names one of its SCs
const chkFlagTest = (tool, review) => (c, scs) => {
  const r = chkTest.get(c.k);
  if (!r || r.error || !r.tools[tool]) return false;
  return r.tools[tool].some((f) => (f.outcome === 'violation' || review) && f.sc.some((s) => scs.includes(s)));
};
const chkFlagExpert = (tool, review) => (c) => {
  const r = chkExpert.get(String(c.page).normalize('NFC'));
  if (!r || r.error || !r.tools[tool]) return false;
  const fs2 = r.tools[tool].filter((f) => (f.outcome === 'violation' || review) && f.sc.includes(c.sc));
  if (studyCase[c.cid].scope === 'page') return fs2.length > 0;
  const k = key(c.xpath);
  return fs2.some((f) => f.xpath && within(key(f.xpath), k));
};
const agFlagTest = (c, scs) => { const r = agTest.get(c.k); const d = r && r.detection; return !!d && [...d.axe_scs, ...d.sem_scs].some((s) => scs.includes(s)); };
const agFlagExpert = (c) => {
  const r = agExpert.get(String(c.page).normalize('NFC')); const d = r && r.detection;
  if (!d) return false;
  const items = [...(d.axe_nodes || []), ...(d.sem_items || [])].filter((x) => (x.scs || []).includes(c.sc));
  if (studyCase[c.cid].scope === 'page') return items.length > 0;
  const k = key(c.xpath);
  return items.some((x) => x.xpath && within(key(x.xpath), k));
};

// ---- case sets: Map k → { positive, scs, flags{system} } ----
const SYSTEMS = ['InterA11y V1', 'InterA11y V2', 'GenA11y', 'AccessGuru', ...TOOLS.map((t) => TOOL_NAME[t]), ...TOOLS.map((t) => `${TOOL_NAME[t]} +review`)];
function testSet(view6, view12, scope) {
  const view = scope === '6' ? view6 : view12;
  const v2 = new Map((scope === '6' ? r2[view6] : r2[view12]).perCase.map((c) => [c.k, c]));
  return (scope === '6' ? r1[view6] : r1[view12]).perCase.map((c) => {
    const scs = scope === '6' ? c.scs.filter((s) => SIX.has(s)) : c.scs;
    const f = { 'InterA11y V1': !!c.flags.InterA11y, 'InterA11y V2': !!v2.get(c.k).flags.InterA11y, GenA11y: !!c.flags.GenA11y && scs.some((s) => SIX.has(s)), AccessGuru: agFlagTest(c, scs) };
    for (const t of TOOLS) { f[TOOL_NAME[t]] = chkFlagTest(t, false)(c, scs); f[`${TOOL_NAME[t]} +review`] = chkFlagTest(t, true)(c, scs); }
    return { k: c.k, positive: c.positive, flags: f };
  });
}
function suppSet(scope) {
  const v2 = new Map(r2.supplementary.perCase.map((c) => [c.k, c]));
  return r1.supplementary.perCase.filter((c) => scope === '12' || c.scs.some((s) => SIX.has(s))).map((c) => {
    const scs = scope === '6' ? c.scs.filter((s) => SIX.has(s)) : c.scs;
    const f = { 'InterA11y V1': !!c.flags.InterA11y, 'InterA11y V2': !!v2.get(c.k).flags.InterA11y, GenA11y: !!c.flags.GenA11y, AccessGuru: agFlagTest(c, scs) };
    for (const t of TOOLS) { f[TOOL_NAME[t]] = chkFlagTest(t, false)(c, scs); f[`${TOOL_NAME[t]} +review`] = chkFlagTest(t, true)(c, scs); }
    return { k: c.k, positive: c.positive, flags: f };
  });
}
function expertSet(scope) {
  const p2 = r2.expert.perCase;
  return Object.entries(r1.expert.perCase).filter(([, c]) => scope === '12' || SIX.has(c.sc)).map(([k, c]) => {
    const f = { 'InterA11y V1': !!c.flags.InterA11y, 'InterA11y V2': !!p2[k].flags.InterA11y, GenA11y: !!c.flags.GenA11y, AccessGuru: agFlagExpert(c) };
    for (const t of TOOLS) { f[TOOL_NAME[t]] = chkFlagExpert(t, false)(c); f[`${TOOL_NAME[t]} +review`] = chkFlagExpert(t, true)(c); }
    return { k, positive: c.truth, flags: f };
  });
}

function binomP(b, n) {
  if (!n) return 1;
  const lg = (k) => { let s = 0; for (let i = 2; i <= k; i++) s += Math.log(i); return s; };
  const pmf = (k) => Math.exp(lg(n) - lg(k) - lg(n - k) - n * Math.LN2);
  const o = pmf(b); let p = 0;
  for (let k = 0; k <= n; k++) if (pmf(k) <= o * (1 + 1e-9)) p += pmf(k);
  return Math.min(1, p);
}
function metrics(rows, sys) {
  const m = { TP: 0, FP: 0, FN: 0, TN: 0 };
  for (const r of rows) m[r.positive ? (r.flags[sys] ? 'TP' : 'FN') : (r.flags[sys] ? 'FP' : 'TN')]++;
  const rec = m.TP / (m.TP + m.FN), fpr = m.FP / (m.FP + m.TN), prec = m.TP + m.FP ? m.TP / (m.TP + m.FP) : null;
  return { ...m, recall: rec, fpr, precision: prec, f1: prec && rec ? 2 * prec * rec / (prec + rec) : 0 };
}
// paired against InterA11y V2: b = only V2, c = only the other
function paired(rows, sys) {
  const d = { pos: [0, 0], neg: [0, 0] };
  for (const r of rows) { const a = r.flags['InterA11y V2'], b = r.flags[sys]; if (a === b) continue; d[r.positive ? 'pos' : 'neg'][a ? 0 : 1]++; }
  return { caught: { onlyV2: d.pos[0], onlyOther: d.pos[1], p: binomP(d.pos[0], d.pos[0] + d.pos[1]) }, fp: { onlyV2: d.neg[0], onlyOther: d.neg[1], p: binomP(d.neg[0], d.neg[0] + d.neg[1]) } };
}

const SETS = {};
for (const scope of ['6', '12']) {
  const act = testSet('actFullSharedScopeSc', 'actFullSc', scope);
  const supp = suppSet(scope);
  SETS[`ACT|${scope}`] = act;
  SETS[`585|${scope}`] = supp;
  SETS[`ACT + 585|${scope}`] = [...act, ...supp];
  SETS[`Expert (responses)|${scope}`] = expertSet(scope);
}
const out = {};
const fmt = (x) => (x == null || Number.isNaN(x) ? '—' : x.toFixed(3));
const fp = (p) => (p < 0.001 ? '<0.001' : p.toFixed(3));
for (const [name, rows] of Object.entries(SETS)) {
  const [set, scope] = name.split('|');
  const pos = rows.filter((r) => r.positive).length;
  out[name] = {};
  console.log(`\n### ${set}, ${scope} SCs: ${rows.length} (${pos} violations / ${rows.length - pos} non-violations)\n`);
  console.log('| System | Recall | FPR | Precision | F1 | Caught: only V2 / only this (p) | FPs: only V2 / only this (p) |');
  console.log('|---|---:|---:|---:|---:|---|---|');
  for (const sys of SYSTEMS) {
    const m = metrics(rows, sys); const p = sys === 'InterA11y V2' ? null : paired(rows, sys);
    out[name][sys] = { ...m, paired: p };
    console.log(`| ${sys} | ${fmt(m.recall)} | ${fmt(m.fpr)} | ${fmt(m.precision)} | ${fmt(m.f1)} | ${p ? `${p.caught.onlyV2} / ${p.caught.onlyOther} (${fp(p.caught.p)})` : ''} | ${p ? `${p.fp.onlyV2} / ${p.fp.onlyOther} (${fp(p.fp.p)})` : ''} |`);
  }
}
// coverage of the inputs
const chkErr = (m) => Object.fromEntries(TOOLS.map((t) => [t, [...m.values()].filter((r) => r.error || r.errors[t]).length]));
const agErr = (m) => [...m.values()].filter((r) => r.error || !r.detection).length;
const agLoc = [...agExpert.values()].flatMap((r) => (r.detection && r.detection.sem_items) || []);
console.log(`\nInputs: checkers test ${chkTest.size} cases (errors by tool ${JSON.stringify(chkErr(chkTest))}), expert ${chkExpert.size} pages (${JSON.stringify(chkErr(chkExpert))}); AccessGuru test ${agTest.size} (errors ${agErr(agTest)}), expert ${agExpert.size} pages (errors ${agErr(agExpert)}; LLM snippets located ${agLoc.filter((x) => x.xpath).length}/${agLoc.length})`);
if (args.json) fs.writeFileSync(path.resolve(ROOT, args.json), JSON.stringify(out, null, 1));
