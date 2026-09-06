#!/usr/bin/env node
'use strict';
// Combined ACT + supplementary-585 comparison for N systems (our harness, GenA11y, AccessGuru), by SC.
// Generalises build-combined-act-supp-model-comparison.js (which hard-codes two Gemini runs).
//
// Usage:
//   node build-combined-act-supp-by-sc.js --out=<name> --act-view=458|581 \
//     --system="Label|act=<run>|supp=<run>" [--system=...]
//
// ACT rows: joined to upstream-evidence/v3-act-subset-proposed/raw.json by testcaseId; every system gets
// raw.json's SC mapping (dual-mapped cases contribute to both SC rows) and expected label.
//   --act-view=458  the reaches-LLM set (raw rows with no error/axeFlag/v3Flag). A system row absent for a
//                   case (GenA11y's unsupported SCs) is a NEGATIVE prediction (uncovered=Negative, Table 1f/1g).
//   --act-view=581  the full corpus. For a harness run (458 live rows) the 123 pre-settled cases are composed
//                   from raw.json as POSITIVE predictions (axe/v3 flagged), so the harness view is
//                   live LLM lane + deterministic pre-settle; baselines use their native rows (+absent→negative).
// Supplementary rows: joined to full-supplementary-585-cases.json by testcaseId. Positive prediction = outcome
// 'caught' everywhere; every other outcome (missedAgree/uncertain/noVerdict/noObligation/uncovered/error) is negative.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const RESULTS = path.join(ROOT, 'results');
const RAW = path.join(ROOT, 'eval/checker-comparison/upstream-evidence/v3-act-subset-proposed/raw.json');
const CASES = JSON.parse(fs.readFileSync(path.join(__dirname, 'full-supplementary-585-cases.json'), 'utf8'));
const INCLUDED_SCS = ['1.1.1', '1.3.1', '1.3.3', '1.3.5', '1.4.1', '1.4.3', '1.4.4', '1.4.5', '1.4.12', '1.4.13', '2.1.1', '2.1.2',
  '2.2.1', '2.2.2', '2.4.1', '2.4.2', '2.4.3', '2.4.4', '2.4.6', '2.4.7', '2.5.3', '3.3.1', '4.1.2', '4.1.3'];

// The starred (`*`) cross-rule GT override from run-fn-llm.js (Table 1d): the 2 aria-hidden W3C wordmarks
// ACT's e88epe rule fails are relabelled `failed`; the other 5 examined cases keep their original label.
// Applied to EVERY system's ACT rows so denominators match across harness and baselines. --gt=raw disables it.
const GT_OVERRIDE = {
  '25e5364c0a1320a08e2742fa59a0f8627591bc61': 'failed', // 23a2a8 e88epe-fail: aria-hidden W3C wordmark (image-of-text)
  'e15b9aca4aaa53cb3a96ae48e78e1af064b9a01d': 'failed', // 23a2a8 e88epe-fail: aria-hidden W3C wordmark
};
const argv = process.argv.slice(2);
const opt = (k, d) => { const a = argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const systems = argv.filter((x) => x.startsWith('--system=')).map((x) => {
  const parts = x.slice(9).split('|'); const s = { label: parts[0] };
  for (const p of parts.slice(1)) { const [k, v] = p.split('='); s[k] = v; }
  // supp is OPTIONAL: the two slices are computed independently, so an ACT-only system is
  // well-defined and lets ACT runs be scored before their 585 counterpart exists. When it is
  // absent the supplementary/combined slices are OMITTED, never reported as zeros.
  if (!s.act) throw new Error(`--system needs at least label|act=<run>: ${x}`);
  return s;
});
const OUT = opt('out', null); const ACT_VIEW = opt('act-view', '458'); const GT = opt('gt', 'starred');
const expectedOf = (c) => (GT === 'starred' && GT_OVERRIDE[c.testcaseId]) || c.expected;
if (!systems.length || !OUT) { console.error('usage: --out=<name> --act-view=458|581 --system="Label|act=<run>|supp=<run>" ...'); process.exit(2); }

const readRun = (name) => { const r = JSON.parse(fs.readFileSync(path.join(RESULTS, name, 'results.json'), 'utf8')); return Array.isArray(r) ? r : (r.results || r.cases); };
// NOTE: RAW is gitignored (eval/checker-comparison/.gitignore: upstream-evidence/*/raw.json), so the ACT
// denominator is a LOCAL artifact that cannot be reconstructed from the repo. Record its digest with every
// output so a table is attributable to the exact evidence file that produced it, and so a silent
// regeneration (which would change the 458/581 sets without any error) is detectable after the fact.
const RAW_TEXT = fs.readFileSync(RAW, 'utf8');
const RAW_SHA = require('crypto').createHash('sha256').update(RAW_TEXT).digest('hex');
const raw = JSON.parse(RAW_TEXT);
const preSettled = (r) => !!(r.error || r.axeFlag || r.v3Flag);
const actUniverse = raw.filter((r) => ACT_VIEW === '581' || !preSettled(r));
const suppId = (c) => c.testcaseId || `aug-${c.sc}-${c.aspect}-${c.id}`;

function actRows(run) {
  const rows = readRun(run); const byKey = new Map(); const byId = new Map();
  // A few ACT testcaseIds recur under two rules; join on rule+testcase first, then testcase alone.
  for (const r of rows) if (r.testcaseId) { if (r.ruleId) byKey.set(`${r.ruleId}:${r.testcaseId}`, r); if (!byId.has(r.testcaseId)) byId.set(r.testcaseId, r); }
  const live = rows.length; let absent = 0, composed = 0, errors = 0;
  const out = actUniverse.map((c) => {
    const r = byKey.get(`${c.ruleId}:${c.testcaseId}`) || (byKey.size ? null : byId.get(c.testcaseId));
    let outcome;
    if (r) { outcome = r.outcome; if (outcome === 'error') errors++; }
    else if (ACT_VIEW === '581' && preSettled(c) && live <= 458) { outcome = c.error ? 'error' : 'caught'; composed++; }
    else { outcome = 'absent'; absent++; }
    return { id: `act:${c.ruleId}:${c.testcaseId}`, sc: Array.isArray(c.sc) ? c.sc : [c.sc], expected: expectedOf(c), outcome, corpus: 'act' };
  });
  return { rows: out, meta: { run, rowsInFile: live, universe: actUniverse.length, absentAsNegative: absent, composedPreSettled: composed, errorsAsNegative: errors } };
}
function suppRows(run) {
  const rows = readRun(run); const byId = new Map();
  for (const r of rows) { const id = r.testcaseId || (r.key ? `aug-${r.key.replace(/::/g, '-')}` : null); if (id) byId.set(id, r); }
  let absent = 0, errors = 0;
  const out = CASES.map((c) => { const r = byId.get(suppId(c)); if (!r) absent++; else if (r.outcome === 'error') errors++;
    return { id: `supp:${suppId(c)}`, sc: [c.sc], expected: c.expected, outcome: r ? r.outcome : 'absent', corpus: 'supp', source: c.source }; });
  return { rows: out, meta: { run, rowsInFile: rows.length, universe: CASES.length, absentAsNegative: absent, errorsAsNegative: errors } };
}
const divide = (n, d) => (d ? n / d : null);
function confusion(rows) {
  const c = { tp: 0, fp: 0, tn: 0, fn: 0 };
  for (const r of rows) { const pos = r.expected === 'failed', pred = r.outcome === 'caught'; if (pos && pred) c.tp++; else if (pos) c.fn++; else if (pred) c.fp++; else c.tn++; }
  return { ...c, n: rows.length, positives: c.tp + c.fn, negatives: c.fp + c.tn, precision: divide(c.tp, c.tp + c.fp), recall: divide(c.tp, c.tp + c.fn), f1: divide(2 * c.tp, 2 * c.tp + c.fp + c.fn), fpr: divide(c.fp, c.fp + c.tn) };
}
const pct = (v) => (v == null ? 'n/a' : `${(v * 100).toFixed(1)}%`);

const data = systems.map((s) => { const a = actRows(s.act), b = s.supp ? suppRows(s.supp) : { rows: [], meta: null }; return { ...s, hasSupp: !!s.supp, act: a, supp: b, all: a.rows.concat(b.rows) }; });
const overall = data.map((d) => ({ label: d.label, hasSupp: d.hasSupp, act: confusion(d.act.rows), supp: d.hasSupp ? confusion(d.supp.rows) : null, suppHuman: d.hasSupp ? confusion(d.supp.rows.filter((r) => r.source === 'human-annotated')) : null, suppGenerated: d.hasSupp ? confusion(d.supp.rows.filter((r) => r.source === 'generated-negative')) : null, combined: d.hasSupp ? confusion(d.all) : null, meta: { act: d.act.meta, supp: d.supp.meta } }));
const bySc = INCLUDED_SCS.map((sc) => {
  const per = data.map((d) => confusion(d.all.filter((r) => r.sc.includes(sc))));
  for (const p of per) if (p.n !== per[0].n || p.positives !== per[0].positives) throw new Error(`${sc}: denominators differ across systems`);
  return { sc, cases: per[0].n, positives: per[0].positives, negatives: per[0].negatives, systems: Object.fromEntries(data.map((d, i) => [d.label, per[i]])) };
});
const output = { schema: 'combined-act-supplementary-by-sc/2', generatedAt: new Date().toISOString(), actView: ACT_VIEW, gtLabels: GT, actEvidenceSha256: RAW_SHA, scope: { actCases: actUniverse.length, supplementaryCases: CASES.length, includedScs: INCLUDED_SCS, note: 'ACT cases mapped to two SCs contribute to both SC rows; absent rows are negative predictions; positive prediction = outcome caught.' }, systems: overall, bySc };
fs.writeFileSync(path.join(RESULTS, `${OUT}.json`), `${JSON.stringify(output, null, 2)}\n`);

const L = [`# Combined ACT ${actUniverse.length} + supplementary 585 — ${data.map((d) => d.label).join(' vs ')}`, '', `GT labels: ${GT === 'starred' ? 'starred (2-case 1.1.1 cross-rule override applied to every system)' : 'raw ACT'}. ACT view: ${ACT_VIEW === '581' ? 'full 581 (harness = 458 live + 123 pre-settled composed as positive; baselines native, absent→negative)' : 'reaches-LLM 458 (absent→negative, i.e. uncovered=Negative)'}. Positive prediction = outcome \`caught\`; every other outcome is negative.`, '', `ACT evidence file (gitignored, local-only): \`${path.relative(ROOT, RAW)}\` sha256 \`${RAW_SHA.slice(0, 16)}…\` — the 458/581 denominators are not reproducible from the repo alone.`, '',
  '| System | slice | n | TP | FP | TN | FN | Precision | Recall | F1 | FPR | notes |', '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |'];
for (const o of overall) for (const [slice, c, m] of [[`ACT ${ACT_VIEW}`, o.act, o.meta.act], ['supplementary 585', o.supp, o.meta.supp], ['  · human-annotated 389', o.suppHuman, null], ['  · generated-negative 196', o.suppGenerated, null], ['combined', o.combined, null]]) {
  if (!c) continue;   // ACT-only system: omit the slices it has no data for
  const notes = m ? `${m.rowsInFile} rows; absent→neg ${m.absentAsNegative}${m.composedPreSettled ? `; composed pre-settled ${m.composedPreSettled}` : ''}${m.errorsAsNegative ? `; errors→neg ${m.errorsAsNegative}` : ''}` : '';
  L.push(`| ${o.label} | ${slice} | ${c.n} | ${c.tp} | ${c.fp} | ${c.tn} | ${c.fn} | ${pct(c.precision)} | ${pct(c.recall)} | ${pct(c.f1)} | ${pct(c.fpr)} | ${notes} |`);
}
L.push('', `| SC | Cases | P/N | ${data.map((d) => `${d.label} TP/FP/FN/TN | Prec | Rec | FPR`).join(' | ')} |`, `| --- | ---: | ---: | ${data.map(() => '---: | ---: | ---: | ---:').join(' | ')} |`);
for (const row of bySc) L.push(`| ${row.sc} | ${row.cases} | ${row.positives}/${row.negatives} | ${data.map((d) => { const c = row.systems[d.label]; return `${c.tp}/${c.fp}/${c.fn}/${c.tn} | ${pct(c.precision)} | ${pct(c.recall)} | ${pct(c.fpr)}`; }).join(' | ')} |`);
fs.writeFileSync(path.join(RESULTS, `${OUT}.md`), `${L.join('\n')}\n`);
console.log(L.slice(0, 5 + overall.length * 5).join('\n'));
