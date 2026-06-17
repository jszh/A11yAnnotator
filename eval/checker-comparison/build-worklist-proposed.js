#!/usr/bin/env node
'use strict';
// V2 builder worklist — scoped to the DRAFT (proposed-only) ACT cases from the --proposed run.
// Same two jobs as the v1 worklist, but over the 269 non-approved cases the draft set adds:
//   • BOTH-FAIL (union FN) — ACT-failed, neither v3 nor axe flagged ⇒ build capability to CATCH (FN→TP).
//   • V3-FP — ACT-not-failed, v3 flagged ⇒ ELIMINATE the false barrier (abstain).
// Highest-value rows are on the 4 DRAFT-ONLY SCs (2.4.6, 2.1.2, 2.4.10, 3.3.1) — the first ACT signal we
// have on them. Caveat: draft rules + their `expected` are UNSTABLE upstream; treat as pipeline-polish signal.
// Writes act-subset/worklist-proposed.json + docs/analysis/act-benchmark/V3-ACT-WORKLIST-V2.md. Reproducible from raw.json.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const raw = require('./upstream-evidence/v3-act-subset-proposed/raw.json');
const SUBSET = path.join(__dirname, 'act-subset');
// v3 deterministic catalog SCs (which SCs v3 even attempts)
const { CATALOG } = require(path.join(ROOT, 'scripts/v3/lib/catalog.js'));
const V3_SCS = new Set(Object.values(CATALOG.experiments).map((e) => e.sc));
// SCs reachable ONLY via draft rules (no approved ACT testcase) — the new ground the draft set opens.
const DRAFT_ONLY_SCS = new Set(['2.4.6', '2.1.2', '2.4.10', '3.3.1']);

// draft-only cases: the run tags each record approved===false for non-approved rules.
const dec = raw.filter((r) => !r.error && r.approved === false);

// classify a 1.4.3 page's backdrop so the builder knows which capability is needed
function contrastKind(localPath) {
  try {
    const html = fs.readFileSync(path.join(SUBSET, localPath), 'utf8');
    if (/text-shadow\s*:/i.test(html) && !/text-shadow\s*:\s*none/i.test(html)) return 'text-shadow';
    if (/(linear|radial|conic)-gradient/i.test(html)) return 'gradient';
    if (/background[^;{}"']*url\(|background-image\s*:[^;{}"']*url\(|<img/i.test(html)) return 'image-bg';
    if (/-webkit-text-stroke/i.test(html)) return 'text-stroke';
    if (/opacity\s*:|rgba\(|hsla\(/i.test(html)) return 'alpha/opacity';
    return 'flat/other';
  } catch (e) { return 'unknown'; }
}
function whyV3(r) {
  const obs = r.observations || [];
  // a flagged barrier comes FIRST — on a not-failed case this is the false positive to eliminate (a page can
  // carry BARRIER_OBSERVED on one element AND auto-PARTIAL on others, so check the barrier before abstain).
  if (obs.some((o) => o.outcome === 'BARRIER_OBSERVED')) return 'v3 runner FLAGGED a barrier (false one here — must abstain)';
  if (!r.sc.some((s) => V3_SCS.has(s))) return 'no deterministic runner for this SC (LLM/vision or scanner-import territory)';
  if (obs.some((o) => o.outcome === 'NO_BARRIER_OBSERVED')) return 'v3 runner CLEARED it (false clear or wrong assertion)';
  if (r.autoPartial > 0 || !obs.length) return 'v3 runner ABSTAINED (auto-PARTIAL — out of its decidable sub-domain)';
  return 'v3 ran but did not flag';
}
const localOf = (r) => r.localPath || path.join('pages', r.ruleId, r.testcaseId + '.html');
// axe's posture on the case's SCs: 'violation' / 'review (abstained)' / 'silent (no rule)'.
const axeStatus = (r) => {
  const ax = r.axe || {};
  if ((ax.violations || []).some((f) => r.sc.includes(f.sc))) return 'violation';
  if ((ax.incomplete || []).some((f) => r.sc.includes(f.sc))) return 'review (abstained)';
  return 'silent (no rule)';
};
// is this case on an SC reachable ONLY through draft rules? (the high-value, first-ACT-signal rows)
const draftOnly = (r) => r.sc.some((s) => DRAFT_ONLY_SCS.has(s));
const rec = (r) => { const localPath = localOf(r); return {
  ruleId: r.ruleId, ruleName: r.ruleName, testcaseId: r.testcaseId, expected: r.expected, sc: r.sc,
  draftOnlySc: draftOnly(r), localPath, url: r.url, v3Flag: !!r.v3Flag, axeFlag: !!r.axeFlag,
  v3Status: whyV3(r), axeStatus: axeStatus(r),
  ...(r.sc.includes('1.4.3') ? { contrastKind: contrastKind(localPath) } : {}),
}; };

const bothFail = dec.filter((r) => r.expected === 'failed' && !r.v3Flag && !r.axeFlag).map(rec);
const v3FP = dec.filter((r) => r.expected !== 'failed' && r.v3Flag).map(rec);
// draft-only-SC rows float to the top within each table (first ACT signal on new ground)
const byPriority = (a, b) => (Number(b.draftOnlySc) - Number(a.draftOnlySc)) || (a.sc[0] < b.sc[0] ? -1 : 1);
const grp = (arr) => arr.reduce((m, r) => { for (const s of r.sc) m[s] = (m[s] || 0) + 1; return m; }, {});

const worklist = {
  source: 'eval/checker-comparison/upstream-evidence/v3-act-subset-proposed/raw.json (draft-only cases)',
  scope: 'proposed/draft ACT rules only (approved===false)',
  draftOnlyScs: [...DRAFT_ONLY_SCS],
  totals: { draftDecided: dec.length, bothFail: bothFail.length, v3FP: v3FP.length },
  bothFailBySc: grp(bothFail), v3FpBySc: grp(v3FP),
  bothFail: bothFail.sort(byPriority), v3FP: v3FP.sort(byPriority),
};
fs.writeFileSync(path.join(SUBSET, 'worklist-proposed.json'), JSON.stringify(worklist, null, 2));

// ---- markdown ----
const tag = (r) => r.draftOnlySc ? ' 🆕' : '';
const md = [];
md.push('# Builder worklist v2 — DRAFT (proposed-only) ACT cases the harness gets wrong\n');
md.push(`Generated from \`${worklist.source}\` (${dec.length} decided draft cases). Companion to the approved-only`);
md.push('[V3-ACT-WORKLIST.md](./V3-ACT-WORKLIST.md). Two jobs: **(A)** make the BOTH-FAIL cases pass (v3 ∪ axe');
md.push('miss a real failure — FN→TP), and **(B)** eliminate v3\'s false barriers.\n');
md.push('> **🆕 = draft-only SC** (2.4.6, 2.1.2, 2.4.10, 3.3.1) — no approved ACT rule reaches these, so these');
md.push('> rows are the *first ACT signal* we have on them; they sort to the top of each table.\n');
md.push('> **Caveat:** draft rules and their `expected` outcomes are **unstable** (under review upstream) — treat');
md.push('> this list as *pipeline-polishing signal*, not an authoritative benchmark.\n');
md.push(`Each case is a local file: \`eval/checker-comparison/act-subset/<localPath>\`.\n`);

md.push(`## A. BOTH-FAIL — ${bothFail.length} draft ACT-failed cases neither v3 nor axe catches (build to CATCH)\n`);
md.push('By SC: ' + Object.entries(grp(bothFail)).sort((a, b) => b[1] - a[1]).map(([k, v]) => `**${k}**:${v}${DRAFT_ONLY_SCS.has(k) ? '🆕' : ''}`).join(' · ') + '\n');
md.push('| SC | rule | testcaseId | v3 status | axe status | backdrop | localPath |');
md.push('|---|---|---|---|---|---|---|');
for (const r of bothFail) {
  md.push(`| ${r.sc.join(',')}${tag(r)} | ${r.ruleId} | \`${r.testcaseId.slice(0, 10)}\` | ${r.v3Status} | ${r.axeStatus} | ${r.contrastKind || ''} | \`${r.localPath}\` |`);
}

md.push(`\n## B. V3 FALSE BARRIERS — ${v3FP.length} draft ACT-not-failed cases v3 wrongly flags (ELIMINATE)\n`);
md.push('| SC | rule | testcaseId | expected | v3 status | backdrop | localPath |');
md.push('|---|---|---|---|---|---|---|');
for (const r of v3FP) md.push(`| ${r.sc.join(',')}${tag(r)} | ${r.ruleId} | \`${r.testcaseId.slice(0, 10)}\` | ${r.expected} | ${r.v3Status} | ${r.contrastKind || ''} | \`${r.localPath}\` |`);

// ---- iterate-on-one-rule example (so the builder can tighten the inner loop) ----
const exRule = (bothFail.find((r) => r.draftOnlySc) || bothFail[0] || v3FP[0] || {}).ruleId || 'afw4f7';
md.push('\n## How to iterate on one draft rule\n');
md.push('Work a single draft rule offline (fast inner loop) with `--proposed --rule=<ruleId>` — it loads only');
md.push('that rule\'s mirrored cases, runs v3 + axe, and prints the lanes:\n');
md.push('```bash');
md.push(`# e.g. a draft-only-SC rule from the worklist above`);
md.push(`node eval/checker-comparison/run-v3-act-suite.js --subset --local --axe --proposed --rule=${exRule} --max-auto=10 --element-cap=60`);
md.push('```\n');
md.push(`Swap \`--rule=${exRule}\` for any \`rule\` id above. Add \`--sc=2.1.2\` to narrow by SC, or open a single`);
md.push('case in a browser via `file://$PWD/eval/checker-comparison/act-subset/<localPath>`.\n');
md.push('> Note: a scoped run overwrites `upstream-evidence/v3-act-subset-proposed/{raw,summary}.json` with just');
md.push('> that rule. Re-run the full draft suite (`--proposed --limit=0`, drop `--rule`) to restore complete');
md.push('> numbers, then `node eval/checker-comparison/build-worklist-proposed.js` to regenerate this list.');
fs.writeFileSync(path.join(ROOT, 'docs/analysis/act-benchmark/V3-ACT-WORKLIST-V2.md'), md.join('\n') + '\n');

console.log(`worklist v2 (draft-only): ${bothFail.length} BOTH-FAIL + ${v3FP.length} v3-FP over ${dec.length} draft cases`);
console.log('BOTH-FAIL by SC:', JSON.stringify(grp(bothFail)));
console.log('  draft-only-SC BOTH-FAIL:', JSON.stringify(grp(bothFail.filter((r) => r.draftOnlySc))));
console.log('V3-FP by SC:', JSON.stringify(grp(v3FP)));
console.log('wrote act-subset/worklist-proposed.json + docs/analysis/act-benchmark/V3-ACT-WORKLIST-V2.md');
