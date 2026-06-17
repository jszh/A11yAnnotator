#!/usr/bin/env node
'use strict';
// Builder worklist from the ACT-subset run: the cases the COMBINED harness (v3 ∪ axe) gets WRONG today.
//   • BOTH-FAIL (union FN) — ACT-failed, neither v3 nor axe flagged ⇒ build capability to CATCH (FN→TP).
//   • V3-FP — ACT-not-failed, v3 flagged ⇒ ELIMINATE the false barrier (abstain).
// Writes act-subset/worklist.json + docs/analysis/act-benchmark/V3-ACT-WORKLIST.md. Reproducible from raw.json.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const raw = require('./upstream-evidence/v3-act-subset/raw.json');
const SUBSET = path.join(__dirname, 'act-subset');
// v3 deterministic catalog SCs (which SCs v3 even attempts)
const { CATALOG } = require(path.join(ROOT, 'scripts/v3/lib/catalog.js'));
const V3_SCS = new Set(Object.values(CATALOG.experiments).map((e) => e.sc));

const dec = raw.filter((r) => !r.error);
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
  if (!r.sc.some((s) => V3_SCS.has(s))) return 'no deterministic runner for this SC (LLM/vision or scanner-import territory)';
  const obs = r.observations || [];
  if (obs.some((o) => o.outcome === 'NO_BARRIER_OBSERVED')) return 'v3 runner CLEARED it (false clear or wrong assertion)';
  if (r.autoPartial > 0 || !obs.length) return 'v3 runner ABSTAINED (auto-PARTIAL — out of its decidable sub-domain)';
  return 'v3 ran but did not flag';
}
const localOf = (r) => r.localPath || path.join("pages", r.ruleId, r.testcaseId + ".html");
// axe's posture on the case's SCs: 'violation' / 'review (abstained)' / 'silent (no rule)'.
const axeStatus = (r) => {
  const ax = r.axe || {};
  if ((ax.violations || []).some((f) => r.sc.includes(f.sc))) return 'violation';
  if ((ax.incomplete || []).some((f) => r.sc.includes(f.sc))) return 'review (abstained)';
  return 'silent (no rule)';
};
const rec = (r) => { const localPath = localOf(r); return {
  ruleId: r.ruleId, ruleName: r.ruleName, testcaseId: r.testcaseId, expected: r.expected, sc: r.sc,
  localPath, url: r.url, v3Flag: !!r.v3Flag, axeFlag: !!r.axeFlag,
  v3Status: whyV3(r), axeStatus: axeStatus(r),
  ...(r.sc.includes("1.4.3") ? { contrastKind: contrastKind(localPath) } : {}),
}; };

const bothFail = dec.filter((r) => r.expected === 'failed' && !r.v3Flag && !r.axeFlag).map(rec);
const v3FP = dec.filter((r) => r.expected !== 'failed' && r.v3Flag).map(rec);
const grp = (arr) => arr.reduce((m, r) => { for (const s of r.sc) m[s] = (m[s] || 0) + 1; return m; }, {});

const worklist = {
  source: 'eval/checker-comparison/upstream-evidence/v3-act-subset/raw.json',
  totals: { decided: dec.length, bothFail: bothFail.length, v3FP: v3FP.length },
  bothFailBySc: grp(bothFail), v3FpBySc: grp(v3FP),
  bothFail, v3FP,
};
fs.writeFileSync(path.join(SUBSET, 'worklist.json'), JSON.stringify(worklist, null, 2));

// ---- markdown ----
const md = [];
md.push('# Builder worklist — ACT-subset cases the harness gets wrong\n');
md.push(`Generated from \`${worklist.source}\` (${dec.length} decided cases). Two jobs: **(A)** make the BOTH-FAIL cases`);
md.push(`pass (v3 ∪ axe currently miss a real failure — FN→TP), and **(B)** eliminate v3's false barriers.\n`);
md.push(`Each case is a local file: \`eval/checker-comparison/act-subset/<localPath>\`.\n`);
md.push(`## A. BOTH-FAIL — ${bothFail.length} ACT-failed cases neither v3 nor axe catches (build to CATCH)\n`);
md.push('By SC: ' + Object.entries(grp(bothFail)).sort((a, b) => b[1] - a[1]).map(([k, v]) => `**${k}**:${v}`).join(' · ') + '\n');
md.push('| SC | rule | testcaseId | v3 status | axe status | backdrop | localPath |');
md.push('|---|---|---|---|---|---|---|');
for (const r of bothFail.sort((a, b) => a.sc[0] < b.sc[0] ? -1 : 1)) {
  md.push(`| ${r.sc.join(',')} | ${r.ruleId} | \`${r.testcaseId.slice(0, 10)}\` | ${r.v3Status} | ${r.axeStatus} | ${r.contrastKind || ''} | \`${r.localPath}\` |`);
}
md.push(`\n## B. V3 FALSE BARRIERS — ${v3FP.length} ACT-not-failed cases v3 wrongly flags (ELIMINATE)\n`);
md.push('All are 1.4.3 `text-contrast-pixel` BARRIER on a not-failed case → audit §B5 (abstain on glyph effects / composited backdrops).\n');
md.push('| SC | rule | testcaseId | expected | backdrop | localPath |');
md.push('|---|---|---|---|---|---|');
for (const r of v3FP) md.push(`| ${r.sc.join(',')} | ${r.ruleId} | \`${r.testcaseId.slice(0, 10)}\` | ${r.expected} | ${r.contrastKind || ''} | \`${r.localPath}\` |`);

// ---- iterate-on-one-rule example (so the builder can tighten the inner loop) ----
const exRule = (bothFail.find((r) => r.sc.includes('1.4.3')) || bothFail[0] || v3FP[0] || {}).ruleId || 'afw4f7';
md.push('\n## How to iterate on one rule\n');
md.push('To work a single rule (offline, fast inner loop) instead of the whole subset, pass `--rule=<ruleId>`');
md.push('— it loads only that rule\'s mirrored cases, runs v3 + axe, and prints the lanes:\n');
md.push('```bash');
md.push(`# e.g. the composited-contrast rule from the worklist above`);
md.push(`node eval/checker-comparison/run-v3-act-suite.js --subset --local --axe --rule=${exRule} --max-auto=10 --element-cap=60`);
md.push('```\n');
md.push(`Swap \`--rule=${exRule}\` for any \`rule\` id in the tables above. Add \`--sc=1.4.3\` to further narrow by SC,`);
md.push('or open a single case directly in a browser via its `localPath`:');
md.push('`file://$PWD/eval/checker-comparison/act-subset/<localPath>`.\n');
md.push('> Note: a scoped run overwrites `upstream-evidence/v3-act-subset/{raw,summary}.json` with just that');
md.push('> rule. Re-run the full suite (`--limit=0`, drop `--rule`) to restore the complete numbers, then');
md.push('> `node eval/checker-comparison/build-worklist.js` to regenerate this list.');
fs.writeFileSync(path.join(ROOT, 'docs/analysis/act-benchmark/V3-ACT-WORKLIST.md'), md.join('\n') + '\n');
console.log(`worklist: ${bothFail.length} BOTH-FAIL + ${v3FP.length} v3-FP`);
console.log('BOTH-FAIL by SC:', JSON.stringify(grp(bothFail)));
console.log('  1.4.3 both-fail by backdrop:', JSON.stringify(bothFail.filter(r=>r.sc.includes('1.4.3')).reduce((m,r)=>{m[r.contrastKind]=(m[r.contrastKind]||0)+1;return m;},{})));
console.log('wrote act-subset/worklist.json + docs/analysis/act-benchmark/V3-ACT-WORKLIST.md');
