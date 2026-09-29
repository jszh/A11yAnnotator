#!/usr/bin/env node
'use strict';
// Per-criterion comparison of InterA11y with GenA11y and the v3 harness, on the same cases.
//
//   node intera11y/eval/score.js --act=<intera11y run> --supp=<intera11y run> --expert=<intera11y saved-pages run> [--json=out.json]
//
// ACT (validated labels): positive = expected "failed"; a system flags a case when its outcome is "caught".
//   Headline slice = the 458 "reaches-LLM" cases (neither axe nor the v3 deterministic lane settles them), where
//   all three systems have results. GenA11y rows are absent for SCs its adapter does not cover — counted as not
//   flagged (the adapter produces no finding for them).
// Supplementary 585 (human-annotated + generated): same rule, joined by testcaseId.
// Expert study (P2–P5, 56 real pages): truth per response exactly as build-candidate-index.py / rescore-run.js;
//   GenA11y and v3-harness flags are the ones recorded in the study manifests; InterA11y flags a case when it has
//   a finding for the case's SC on the case's element (XPath join, same normalisation); for page-scope cases, any
//   finding for the SC on the page.
const fs = require('fs');
const path = require('path');
const { SCS } = require('../src/criteria/index.js');
const { key, within } = require('../src/lib/xpath.js');

const ROOT = path.resolve(__dirname, '..', '..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const m = /^--([^=]+)(?:=(.*))?$/.exec(a); return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true]; }));
const OURS = new Set(SCS);
// SCs the GenA11y adapter covers (consts.COVERED_SCS) among ours — for a comparison restricted to shared scope
const GENA11Y_COVERED = new Set(['1.1.1', '1.4.1', '1.4.3', '2.4.4', '3.3.1', '4.1.2']);
// The 7 ACT 1.1.1 cases the v3 scorer re-labelled after manual criterion-level examination (run-fn-llm.js
// GT_OVERRIDE) — applied only in the starred ACT variant, never to raw-label metrics.
const GT_OVERRIDE = {
  '25e5364c0a1320a08e2742fa59a0f8627591bc61': 'failed', 'e15b9aca4aaa53cb3a96ae48e78e1af064b9a01d': 'failed',
  'e8f40f5af06646ef15283302903f6c78f7d7a505': 'passed', 'b3c602b7aa172611a22304666dd8d81d6ce8d214': 'inapplicable',
  '0ab8d652533229aae98191a6a43c2168e1959963': 'inapplicable', '4d04a4946e1f06834c89b91f0a765367f9d0d492': 'inapplicable',
  'ce2c30787caebdf1d6adcd6aedfac8fa8842a9c4': 'inapplicable',
};
const readJson = (p) => JSON.parse(fs.readFileSync(path.resolve(ROOT, p), 'utf8'));
const rowsOf = (p) => { const j = readJson(p); return Array.isArray(j) ? j : j.results || j.rows || j.cases; };

const blank = () => ({ TP: 0, FP: 0, FN: 0, TN: 0 });
const add = (m, flagged, positive) => { m[positive ? (flagged ? 'TP' : 'FN') : (flagged ? 'FP' : 'TN')]++; };
function stats(m) {
  const P = m.TP + m.FN, N = m.FP + m.TN;
  const prec = m.TP + m.FP ? m.TP / (m.TP + m.FP) : null, rec = P ? m.TP / P : null;
  return { ...m, recall: rec === null ? null : +rec.toFixed(3), precision: prec === null ? null : +prec.toFixed(3), fpr: N ? +(m.FP / N).toFixed(3) : null, f1: prec && rec ? +(2 * prec * rec / (prec + rec)).toFixed(3) : (P ? 0 : null) };
}

function scoreLabelled(cases, systems) {
  const out = {};
  for (const c of cases) for (const sc of c.scs) {
    out[sc] = out[sc] || Object.fromEntries(Object.keys(systems).map((s) => [s, blank()]));
    for (const [s, flag] of Object.entries(systems)) add(out[sc][s], flag(c), c.positive);
  }
  const all = Object.fromEntries(Object.keys(systems).map((s) => [s, blank()]));
  for (const c of cases) for (const [s, flag] of Object.entries(systems)) add(all[s], flag(c), c.positive);
  const fmt = (o) => Object.fromEntries(Object.entries(o).map(([s, m]) => [s, stats(m)]));
  return { bySc: Object.fromEntries(Object.entries(out).sort().map(([sc, o]) => [sc, fmt(o)])), all: fmt(all), n: cases.length };
}

const report = {};

// InterA11y's systems from one run: with the screening sweep, and — when the run recorded it — the same run's
// verdicts over the rule-based candidates alone (the sweep's contribution, measured without a second run)
function withoutSweep(ia) {
  const out = { InterA11y: (c) => { const r = ia.get(c.k); return !!r && r.outcome === 'caught'; } };
  if ([...ia.values()].some((r) => r.outcomeWithoutScreen)) out['InterA11y without sweep'] = (c) => { const r = ia.get(c.k); return !!r && r.outcomeWithoutScreen === 'caught'; };
  return out;
}

// ---------- ACT ----------
if (args.act) {
  const raw = rowsOf('eval/checker-comparison/upstream-evidence/v3-act-subset-proposed/raw.json');
  const ia = new Map(rowsOf(`results/${args.act}/results.json`).map((r) => [`${r.ruleId}/${r.testcaseId}`, r]));
  const ge = new Map(rowsOf('results/gena11y-act-gem37/results.json').map((r) => [`${r.ruleId}/${r.testcaseId}`, r]));
  const ha = new Map(rowsOf('results/fn-llm-gemini37-flash-server/results.json').map((r) => [`${r.ruleId}/${r.testcaseId}`, r]));
  const cases = [];
  for (const r of raw) {
    if (r.error) continue;
    const scs = (r.sc || []).filter((s) => OURS.has(s));
    const k = `${r.ruleId}/${r.testcaseId}`;
    if (!scs.length || !ia.has(k)) continue;
    const starred = GT_OVERRIDE[r.testcaseId] || r.expected;
    cases.push({ k, scs, positive: r.expected === 'failed', positiveStarred: starred === 'failed', reachesLlm: !r.axeFlag && !r.v3Flag, settledBy: r.v3Flag ? 'v3' : r.axeFlag ? 'axe' : null });
  }
  const caught = (m) => (c) => { const r = m.get(c.k); return !!r && r.outcome === 'caught'; };
  const ours = withoutSweep(ia);
  const systems458 = { ...ours, GenA11y: caught(ge), 'v3 harness': caught(ha) };
  const systemsFull = { ...ours, GenA11y: caught(ge), 'v3 harness (settled cases counted as caught)': (c) => (c.settledBy ? true : caught(ha)(c)) };
  report.act458 = scoreLabelled(cases.filter((c) => c.reachesLlm), systems458);
  report.actFull = scoreLabelled(cases, systemsFull);
  report.actFullStarred = scoreLabelled(cases.map((c) => ({ ...c, positive: c.positiveStarred })), systemsFull);
  report.actFullSharedScope = scoreLabelled(cases.map((c) => ({ ...c, scs: c.scs.filter((sc) => GENA11Y_COVERED.has(sc)) })).filter((c) => c.scs.length), systemsFull);
}

// ---------- Supplementary 585 ----------
if (args.supp) {
  const all = readJson('eval/act-augmented/_tools/full-supplementary-585-cases.json');
  const safe = (s) => String(s).replace(/[^a-z0-9_]+/gi, '-').slice(0, 80);
  const idOf = (c) => `aug-${c.sc}-${safe(c.aspect)}-${safe(c.id)}`;
  const ia = new Map(rowsOf(`results/${args.supp}/results.json`).map((r) => [r.id || r.testcaseId, r]));
  const ge = new Map(rowsOf('results/supplementary585-gena11y-gem37/results.json').map((r) => [r.testcaseId, r]));
  const ha = new Map(rowsOf('results/supplementary585-ours-gem37/results.json').map((r) => [r.testcaseId, r]));
  const cases = all.filter((c) => OURS.has(c.sc) && ia.has(idOf(c))).map((c) => ({ k: idOf(c), scs: [c.sc], positive: c.expected === 'failed', source: c.source }));
  const caught = (m) => (c) => { const r = m.get(c.k); return !!r && r.outcome === 'caught'; };
  report.supplementary = scoreLabelled(cases, { ...withoutSweep(ia), GenA11y: caught(ge), 'v3 harness': caught(ha) });
}

// ---------- Expert study ----------
if (args.expert) {
  const SRC = path.join(ROOT, 'docs/chi-evidence/claim5-expert-study');
  const state = JSON.parse(fs.readFileSync(path.join(SRC, 'study-state-2026-09-09T0917Z.json'), 'utf8'));
  const cases = {};
  for (const f of ['round1-manifest.json', 'round2-manifest.json']) for (const c of JSON.parse(fs.readFileSync(path.join(SRC, f), 'utf8')).cases) cases[c.caseId] = c;
  const pages = new Map();
  const dir = path.resolve(ROOT, 'results', args.expert, 'pages');
  for (const f of fs.readdirSync(dir)) {
    const r = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    if (r.case && r.case.meta) pages.set(String(r.case.meta.file).normalize('NFC'), r);
  }
  // noSweep: only findings on rule-based candidates (and the judge's page findings). exact: a finding must be on
  // the case's element itself; otherwise a finding on the element or inside it counts (the study marks a button
  // or card; InterA11y reports the text or link inside it)
  const iaFlag = (c, noSweep = false, exact = false) => {
    const r = pages.get(String(c.page.file).normalize('NFC'));
    if (!r || !r.criteria || !r.criteria[c.sc]) return null;
    const fs2 = (r.criteria[c.sc].findings || []).filter((f) => !noSweep || f.origin !== 'screen');
    if (c.scope === 'page') return fs2.length > 0;
    const k = key(c.xpath);
    return fs2.some((f) => f.xpath && (exact ? key(f.xpath) === k : within(key(f.xpath), k)));
  };
  // Expert "passes" set aside: the element has a role that must be named and the browser exposes it with an empty
  // name (expert-ax-names.json, read from Chrome's accessibility tree) — the expert judged what a person sees; the
  // criterion (4.1.2, 2.4.4 and 1.1.1's name rules) is about what assistive technology receives. Applies to every
  // system alike.
  const NAMED = /^(link|button|image|img|graphics-document|graphics-symbol|textbox|searchbox|combobox|listbox|checkbox|radio|switch|slider|spinbutton|menuitem|menuitemcheckbox|menuitemradio|tab|treeitem|option|Iframe|iframe)$/;
  const axNames = fs.existsSync(path.join(__dirname, 'expert-ax-names.json')) ? JSON.parse(fs.readFileSync(path.join(__dirname, 'expert-ax-names.json'), 'utf8')) : {};
  const namelessAx = (a) => !!(a && !a.ignored && !a.name && NAMED.test(a.role || ''));
  // the element itself, or the one control inside a component host (what assistive technology lands on)
  const nameless = (cid) => { const a = axNames[cid]; return !!(a && a.found && (namelessAx(a) || namelessAx(a.innerControl))); };
  let setAside = 0, overridden = 0;
  // manually verified cases whose truth is overridden (expert-overrides.json), for every system alike
  const overrides = fs.existsSync(path.join(__dirname, 'expert-overrides.json')) ? JSON.parse(fs.readFileSync(path.join(__dirname, 'expert-overrides.json'), 'utf8')) : {};
  const recorded = [...pages.values()].some((r) => Object.values(r.criteria || {}).some((x) => x.verdictWithoutScreen));
  const SYS = ['InterA11y', 'InterA11y (exact element only)', ...(recorded ? ['InterA11y without sweep'] : []), 'GenA11y', 'v3 harness', 'axe'];
  const m = Object.fromEntries(SYS.map((s) => [s, blank()]));
  const bySc = {};
  let missing = 0;
  const perCase = {};
  for (const p of state.participants) {
    if (!['P2', 'P3', 'P4', 'P5'].includes(p.name)) continue;
    for (const [cid, resp] of Object.entries(p.responses)) {
      const c = cases[cid];
      if (!c || c.arm === 'actionability' || !OURS.has(c.sc)) continue;
      const flags = Object.fromEntries(Object.entries(c.tools).map(([t, v]) => [t, v.flagged]));
      let truth = (resp.choices || []).includes('disagree') ? !Object.values(flags)[0] : flags[resp.tools[0]];
      if (overrides[cid] && overrides[cid].truth) { const t = overrides[cid].truth === 'fail'; if (t !== truth) overridden++; truth = t; }
      if (!truth && nameless(cid)) { setAside++; continue; }
      const ia = iaFlag(c);
      if (ia === null) { missing++; continue; }
      const sys = { InterA11y: ia, 'InterA11y (exact element only)': iaFlag(c, false, true), ...(recorded ? { 'InterA11y without sweep': iaFlag(c, true) } : {}), GenA11y: !!flags.gena11y, 'v3 harness': !!flags.harness, axe: !!flags.axe };
      bySc[c.sc] = bySc[c.sc] || Object.fromEntries(SYS.map((s) => [s, blank()]));
      for (const [s, f] of Object.entries(sys)) { add(m[s], f, truth); add(bySc[c.sc][s], f, truth); }
      perCase[cid] = { sc: c.sc, xpath: c.xpath, page: c.page.file, truth, InterA11y: ia, GenA11y: sys.GenA11y, harness: sys['v3 harness'] };
    }
  }
  const fmt = (o) => Object.fromEntries(Object.entries(o).map(([s, x]) => [s, stats(x)]));
  report.expert = { setAsideNamelessPasses: setAside, overriddenResponses: overridden, all: fmt(m), bySc: Object.fromEntries(Object.entries(bySc).sort().map(([sc, o]) => [sc, fmt(o)])), responsesMissingARun: missing, perCase };
}

function table(title, r) {
  const lines = [`\n## ${title}${r.n ? ` (n=${r.n} cases)` : ''}`, '| SC | System | TP | FP | FN | TN | Recall | Precision | FPR | F1 |', '|---|---|---:|---:|---:|---:|---:|---:|---:|---:|'];
  const row = (sc, s, x) => lines.push(`| ${sc} | ${s} | ${x.TP} | ${x.FP} | ${x.FN} | ${x.TN} | ${x.recall ?? '—'} | ${x.precision ?? '—'} | ${x.fpr ?? '—'} | ${x.f1 ?? '—'} |`);
  for (const [sc, o] of Object.entries(r.bySc)) for (const [s, x] of Object.entries(o)) row(sc, s, x);
  for (const [s, x] of Object.entries(r.all)) row('**all**', s, x);
  return lines.join('\n');
}
if (report.act458) console.log(table('ACT, reaches-LLM 458 slice', report.act458));
if (report.actFull) console.log(table('ACT, all cases for these SCs (raw ACT labels)', report.actFull));
if (report.actFullStarred) console.log(table('ACT, all cases (*: the 7 manually re-examined 1.1.1 labels applied)', report.actFullStarred));
if (report.actFullSharedScope) console.log(table('ACT, SCs GenA11y covers only', report.actFullSharedScope));
if (report.supplementary) console.log(table('Supplementary 585, human-annotated cases', report.supplementary));
if (report.supplementarySharedScope) console.log(table('Supplementary 585, human-annotated, SCs GenA11y covers only', report.supplementarySharedScope));
if (report.expert) console.log(table('Expert study (P2–P5 responses)', report.expert) + `\n(responses whose page has no InterA11y run: ${report.expert.responsesMissingARun}; expert passes set aside on elements the browser exposes with no name: ${report.expert.setAsideNamelessPasses}; responses overridden after manual verification: ${report.expert.overriddenResponses})`);
if (args.json) fs.writeFileSync(path.resolve(ROOT, args.json), JSON.stringify(report, null, 1));
