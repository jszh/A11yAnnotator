'use strict';
// Per-WCAG-SC UNCERTAINTY-MERGE analysis over the ACT pilot (upstream-evidence/act-pilot/raw.json).
//
// The decided-violation analysis (analyze-combinations.js) discards every "review"/"potential"/"cantTell"/
// "incomplete" flag. This script does the inverse: it treats a checker's UNCERTAIN flag (outcome !== 'violation')
// as a candidate for SURFACING A POTENTIAL OBLIGATION into the review/LLM lane, and asks the question:
//
//     does MERGING (union) the uncertain flags across checkers surface MORE genuine potential issues
//     than any single checker — specifically issues the DECIDED lane misses — and at what review-noise cost?
//
// Unit of analysis = one ACT test case (n=432). For a case with SC set S and expected outcome:
//   decided(T)   = tool T emits a `violation` whose sc ∩ S ≠ ∅
//   uncertain(T) = tool T emits a non-violation ('review') flag whose sc ∩ S ≠ ∅
//   anyDecided   = OR_T decided(T)         axeDecided = decided('axe')
//   uncertainUnion = OR_T uncertain(T)
//
// Ground truth (ACT expected): failed = a real issue that SHOULD surface; passed/inapplicable = SHOULD NOT
// (an uncertain flag here is review NOISE — a human must clear a non-issue).
//
// The value of uncertainty is what it adds BEYOND the decided lane, so the core scoring is on the
// NOT-DECIDED universe (cases the decided lane lets through → today these become auto-PARTIAL with no reason):
//   recovery   = a not-decided FAILED case that an uncertain flag surfaces for review  (the win)
//   noise      = a not-decided passed/inapplicable case an uncertain flag surfaces       (the cost)
// We report this for two "already decided" baselines:
//   B_axe = axe-decided only      (axe is our integrated static engine; the actionable baseline)
//   B_any = any-tool-decided      (conservative: already caught by SOME checker → isolates uncertainty's unique add)
//
// Output: ./evidence/sc-uncertainty.json + a printed report.
const fs = require('fs');
const path = require('path');
const TOOLS = ['axe', 'ibm', 'alfa', 'qualweb', 'htmlcs'];

const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'upstream-evidence', 'act-pilot', 'raw.json'), 'utf8'));
const cases = Array.isArray(raw) ? raw : (raw.cases || raw.results || Object.values(raw).find(Array.isArray));

const isSc = (s) => /^\d\.\d+\.\d+$/.test(s);
function caseSc(c) { return new Set((c.sc || []).filter(isSc)); }
function emits(c, tool, kind, scSet) {
  const fnd = (c.byTool && c.byTool[tool]) || [];
  return fnd.some((x) => x && (kind === 'violation' ? x.outcome === 'violation' : x.outcome !== 'violation')
    && (x.sc || []).some((s) => scSet.has(s)));
}
function round(x) { return x == null ? null : Math.round(x * 1000) / 1000; }

// ---- build a per-case decision record over cases that have a usable SC + expected label ----
const scored = [];
let skippedNoSc = 0, skippedExpected = 0;
for (const c of cases) {
  const S = caseSc(c);
  if (!S.size) { skippedNoSc++; continue; }
  if (!['failed', 'passed', 'inapplicable'].includes(c.expected)) { skippedExpected++; continue; }
  const dec = {}, unc = {};
  for (const t of TOOLS) { dec[t] = emits(c, t, 'violation', S); unc[t] = emits(c, t, 'review', S); }
  scored.push({
    sc: [...S], expected: c.expected, ruleId: c.ruleId, testcaseId: c.testcaseId,
    dec, unc,
    axeDecided: dec.axe,
    anyDecided: TOOLS.some((t) => dec[t]),
    uncTools: TOOLS.filter((t) => unc[t]),
    uncUnion: TOOLS.some((t) => unc[t]),
  });
}
const failed = scored.filter((c) => c.expected === 'failed');
const negative = scored.filter((c) => c.expected !== 'failed'); // passed | inapplicable
const passedOnly = scored.filter((c) => c.expected === 'passed');
const inapplicable = scored.filter((c) => c.expected === 'inapplicable');
const baseRate = round(failed.length / scored.length); // prior P(failed) ~0.33

// ---- ANALYSIS 0: per-tool SPRAY — a blanket flagger tags many distinct SCs per case, so a same-SC
// "match" is near-guaranteed and its uncertainty carries no discrimination. Disqualify such tools from
// the meaningful merge. spray = distinct SCs a tool review-tags on a case; reported as median over the
// cases where it emits any review, plus its review footprint (cases-with-any-review / all cases). ----
function median(arr) { if (!arr.length) return 0; const s = [...arr].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
const spray = {};
for (const t of TOOLS) {
  const perCase = [];
  for (const c of cases) {
    const scs = new Set();
    for (const x of ((c.byTool && c.byTool[t]) || [])) if (x.outcome !== 'violation') for (const s of (x.sc || [])) if (isSc(s)) scs.add(s);
    if (scs.size) perCase.push(scs.size);
  }
  spray[t] = {
    casesWithReview: perCase.length, reviewFootprint: round(perCase.length / cases.length),
    medianDistinctScPerCase: median(perCase), maxDistinctScPerCase: perCase.length ? Math.max(...perCase) : 0,
  };
}
// blanket = review on most cases AND tagging many SCs per case (non-discriminating by construction)
const BLANKET = TOOLS.filter((t) => spray[t].reviewFootprint > 0.8 && spray[t].medianDistinctScPerCase >= 5);
const FOCUSED = TOOLS.filter((t) => !BLANKET.includes(t)); // discriminating tools only

// ---- ANALYSIS 1: raw uncertain discrimination per tool + union (all scored cases) ----
function discrim(pred) {
  const recallN = failed.filter(pred).length, noiseN = negative.filter(pred).length;
  return { surfacedFailed: recallN, recall: round(recallN / failed.length),
    surfacedNeg: noiseN, noiseRate: round(noiseN / negative.length) };
}
const analysis1 = {
  perTool: {},
  unionAll: discrim((c) => c.uncUnion),
  unionFocused: discrim((c) => FOCUSED.some((t) => c.unc[t])),
};
for (const t of TOOLS) analysis1.perTool[t] = discrim((c) => c.unc[t]);

// ---- ANALYSIS 2: surfacing value on the NOT-DECIDED universe, per baseline ----
function baselineAnalysis(decidedKey) {
  const ndFailed = failed.filter((c) => !c[decidedKey]);           // real issues the decided lane misses
  const ndNeg = negative.filter((c) => !c[decidedKey]);           // correctly-not-decided non-issues
  const recovery = (pred) => ndFailed.filter(pred).length;
  const noise = (pred) => ndNeg.filter(pred).length;
  const perTool = {};
  for (const t of TOOLS) perTool[t] = {
    recovers: recovery((c) => c.unc[t]),
    noise: noise((c) => c.unc[t]),
  };
  const unionRecovers = recovery((c) => c.uncUnion);
  const unionNoise = noise((c) => c.uncUnion);
  const focusedRecovers = recovery((c) => FOCUSED.some((t) => c.unc[t]));
  const focusedNoise = noise((c) => FOCUSED.some((t) => c.unc[t]));
  const bestSingleTool = [...TOOLS].sort((a, b) => perTool[b].recovers - perTool[a].recovers)[0];
  const bestSingleRecovers = perTool[bestSingleTool].recovers;
  const bestFocusedTool = [...FOCUSED].sort((a, b) => perTool[b].recovers - perTool[a].recovers)[0];
  // unique recoveries: a not-decided failed case surfaced by exactly one tool
  const uniqueByTool = {}; for (const t of TOOLS) uniqueByTool[t] = 0;
  let coveredByN = {};
  for (const c of ndFailed) {
    const ts = c.uncTools;
    coveredByN[ts.length] = (coveredByN[ts.length] || 0) + 1;
    if (ts.length === 1) uniqueByTool[ts[0]]++;
  }
  // drop-one marginal: recoveries lost if tool t removed from the union
  const dropOne = {};
  for (const t of TOOLS) {
    const others = TOOLS.filter((x) => x !== t);
    const withoutT = ndFailed.filter((c) => others.some((x) => c.unc[x])).length;
    dropOne[t] = unionRecovers - withoutT; // recoveries ONLY t provides
  }
  // focused (blanket-excluded) unique recoveries + drop-one
  const uniqueByToolFocused = {}; for (const t of FOCUSED) uniqueByToolFocused[t] = 0;
  for (const c of ndFailed) { const ts = c.uncTools.filter((t) => FOCUSED.includes(t)); if (ts.length === 1) uniqueByToolFocused[ts[0]]++; }
  const dropOneFocused = {};
  for (const t of FOCUSED) { const others = FOCUSED.filter((x) => x !== t); dropOneFocused[t] = focusedRecovers - ndFailed.filter((c) => others.some((x) => c.unc[x])).length; }
  return {
    ndFailedN: ndFailed.length, ndNegN: ndNeg.length,
    perTool,
    bestSingleTool, bestSingleRecovers,
    unionRecovers, unionNoise,
    mergeGainVsBestSingle: unionRecovers - bestSingleRecovers,
    unionRecoveryRateOfNdFailed: round(unionRecovers / (ndFailed.length || 1)),
    focused: {
      tools: FOCUSED, recovers: focusedRecovers, noise: focusedNoise,
      bestSingleTool: bestFocusedTool, bestSingleRecovers: perTool[bestFocusedTool].recovers,
      mergeGainVsBestSingle: focusedRecovers - perTool[bestFocusedTool].recovers,
      uniqueByTool: uniqueByToolFocused, dropOne: dropOneFocused,
    },
    uniqueByTool, coveredByN, dropOne,
    ndFailedCases: ndFailed.map((c) => ({ sc: c.sc, ruleId: c.ruleId, by: c.uncTools })),
  };
}
const analysis2 = { B_axe: baselineAnalysis('axeDecided'), B_any: baselineAnalysis('anyDecided') };

// ---- ANALYSIS 4: the HONEST framing — precision of the surfaced pile + lift over base rate, and the
// operational yield of layering the merge on top of the axe-decided lane. recall & noise-rate are two
// marginals of a 2x2; quoting them side-by-side invites a bogus "recall - noise ~ 0 => random" read. The
// right question for a surface-for-review lane is: of what it hands the reviewer, how much is a real issue? ----
function precisionLift(pred) {
  const tp = failed.filter(pred).length;
  const fpAll = negative.filter(pred).length;             // passed + inapplicable
  const fpPassed = passedOnly.filter(pred).length;        // inapplicable arguably not "noise" for a review prompt
  const precAll = tp + fpAll ? round(tp / (tp + fpAll)) : null;
  const precExclInapp = tp + fpPassed ? round(tp / (tp + fpPassed)) : null;
  return { tp, fpAll, fpPassed, precisionAllNeg: precAll, precisionExclInapplicable: precExclInapp,
    liftAllNeg: precAll == null ? null : round(precAll / baseRate), liftExclInapp: precExclInapp == null ? null : round(precExclInapp / baseRate) };
}
// operational yield = TP / (TP+FP) among items the merge ADDS on top of axe-decided (the not-decided universe)
function yieldOnTopOfAxe(pred) {
  const ndF = failed.filter((c) => !c.axeDecided), ndN = negative.filter((c) => !c.axeDecided);
  const tp = ndF.filter(pred).length, fp = ndN.filter(pred).length;
  return { surfaced: tp + fp, recoveries: tp, falseSurfaced: fp, yield: tp + fp ? round(tp / (tp + fp)) : null };
}
const analysis4 = {
  baseRate, nPassed: passedOnly.length, nInapplicable: inapplicable.length,
  precisionLift: {
    unionAll: precisionLift((c) => c.uncUnion),
    unionFocused: precisionLift((c) => FOCUSED.some((t) => c.unc[t])),
  },
  operationalYieldOnTopOfAxe: {
    unionAll: yieldOnTopOfAxe((c) => c.uncUnion),
    unionFocused: yieldOnTopOfAxe((c) => FOCUSED.some((t) => c.unc[t])),
  },
};

// ---- ANALYSIS 3: per-SC, on the B_axe (actionable) baseline ----
const bySc = {};
for (const c of scored) for (const s of c.sc) (bySc[s] = bySc[s] || []).push(c);
const perSc = {};
for (const [sc, cs] of Object.entries(bySc)) {
  const f = cs.filter((c) => c.expected === 'failed');
  if (!f.length) continue;
  const ndF = f.filter((c) => !c.axeDecided);
  const toolUnc = {}; for (const t of TOOLS) toolUnc[t] = ndF.filter((c) => c.unc[t]).length;
  const unionRec = ndF.filter((c) => c.uncUnion).length;
  perSc[sc] = {
    nFailed: f.length,
    axeDecidedFailed: f.filter((c) => c.axeDecided).length,
    notDecidedFailed: ndF.length,
    uncertainUnionRecovers: unionRec,
    byTool: toolUnc,
    contributors: TOOLS.filter((t) => toolUnc[t] > 0),
  };
}

const report = {
  meta: {
    totalCases: cases.length, scoredCases: scored.length,
    skippedNoSc, skippedNonTerminalExpected: skippedExpected,
    failed: failed.length, negative: negative.length,
    blanketFlaggers: BLANKET, focusedTools: FOCUSED,
    scsWithFailedCases: [...new Set(failed.flatMap((c) => c.sc))].sort(),
    scsUntestableHere_noFailedCase: ['1.4.1', '1.3.3', '2.4.6'].filter((s) => !failed.some((c) => c.sc.includes(s))),
    note: 'unit=ACT test case; uncertain = outcome!==violation (review/potential/cantTell/incomplete/notice) matching the case SC',
  },
  analysis0_spray: spray,
  analysis1_rawDiscrimination: analysis1,
  analysis4_precisionLiftYield: analysis4,
  analysis2_notDecidedSurfacing: analysis2,
  analysis3_perSc: perSc,
};
fs.writeFileSync(path.join(__dirname, 'evidence', 'sc-uncertainty.json'), JSON.stringify(report, null, 1));

// ---------------- printed report ----------------
const pad = (s, n) => String(s).padEnd(n);
console.log('\n=== scored ' + scored.length + '/' + cases.length + ' cases  (failed=' + failed.length +
  ', passed+inapplicable=' + negative.length + '; skipped no-SC=' + skippedNoSc + ') ===');
console.log('SCs with NO failed case here (untestable): ' + report.meta.scsUntestableHere_noFailedCase.join(', ') +
  '  <-- IBM triage-prior SCs cannot be evaluated on this suite');

console.log('\n--- A0. Per-tool SPRAY (why a naive merge is dominated by blanket flaggers) ---');
console.log(pad('tool', 9) + pad('review-footprint', 18) + pad('median SCs/case', 17) + 'max');
for (const t of TOOLS) { const s = spray[t];
  console.log(pad(t, 9) + pad(s.reviewFootprint + ' (' + s.casesWithReview + '/432)', 18) + pad(s.medianDistinctScPerCase, 17) + s.maxDistinctScPerCase); }
console.log('  => BLANKET (disqualified, non-discriminating): [' + BLANKET.join(', ') + ']   FOCUSED: [' + FOCUSED.join(', ') + ']');

console.log('\n--- A1. Raw uncertain discrimination (all scored cases) ---');
console.log(pad('lane', 14) + pad('surfaces failed', 18) + pad('recall', 9) + pad('surfaces neg', 15) + 'noise-rate');
for (const t of TOOLS) { const d = analysis1.perTool[t];
  console.log(pad(t, 14) + pad(d.surfacedFailed + '/' + failed.length, 18) + pad(d.recall, 9) + pad(d.surfacedNeg + '/' + negative.length, 15) + d.noiseRate); }
const u = analysis1.unionAll, uf = analysis1.unionFocused;
console.log(pad('UNION(all)', 14) + pad(u.surfacedFailed + '/' + failed.length, 18) + pad(u.recall, 9) + pad(u.surfacedNeg + '/' + negative.length, 15) + u.noiseRate);
console.log(pad('UNION(focused)', 14) + pad(uf.surfacedFailed + '/' + failed.length, 18) + pad(uf.recall, 9) + pad(uf.surfacedNeg + '/' + negative.length, 15) + uf.noiseRate);

for (const [bk, A] of Object.entries(analysis2)) {
  console.log('\n--- A2. Surfacing potential obligations the DECIDED lane misses  [baseline=' + bk + '] ---');
  console.log('  not-decided FAILED (recovery target): ' + A.ndFailedN + '   not-decided neg (noise pool): ' + A.ndNegN);
  console.log('  ' + pad('tool', 9) + pad('recovers', 10) + 'review-noise');
  for (const t of TOOLS) console.log('  ' + pad(t, 9) + pad(A.perTool[t].recovers, 10) + A.perTool[t].noise);
  console.log('  ' + pad('UNION', 9) + pad(A.unionRecovers, 10) + A.unionNoise);
  console.log('  ALL-tools:     best single = ' + A.bestSingleTool + ' (' + A.bestSingleRecovers + ')   UNION = ' + A.unionRecovers +
    ' (noise ' + A.unionNoise + ')   => MERGE GAIN = +' + A.mergeGainVsBestSingle + '   (recovers ' + A.unionRecoveryRateOfNdFailed + ' of nd-failures)');
  console.log('  FOCUSED [' + A.focused.tools.join(',') + ']: best single = ' + A.focused.bestSingleTool + ' (' + A.focused.bestSingleRecovers +
    ')   UNION = ' + A.focused.recovers + ' (noise ' + A.focused.noise + ')   => MERGE GAIN = +' + A.focused.mergeGainVsBestSingle);
  console.log('  unique-to-one-tool  all: ' + JSON.stringify(A.uniqueByTool) + '   focused: ' + JSON.stringify(A.focused.uniqueByTool));
  console.log('  drop-one (recoveries ONLY this tool adds)  focused: ' + JSON.stringify(A.focused.dropOne));
  console.log('  not-decided failures covered by N tools (all): ' + JSON.stringify(A.coveredByN));
}

console.log('\n--- A4. HONEST framing: precision/lift of the surfaced pile + operational yield (base rate failed=' + analysis4.baseRate + ') ---');
for (const [k, p] of Object.entries(analysis4.precisionLift)) {
  console.log('  ' + pad(k, 13) + 'precision(all-neg)=' + p.precisionAllNeg + ' (lift ' + p.liftAllNeg + ')   precision(excl-inapplicable)=' + p.precisionExclInapplicable + ' (lift ' + p.liftExclInapp + ')');
}
console.log('  operational yield layered ON TOP of axe-decided (review items the merge ADDS):');
for (const [k, y] of Object.entries(analysis4.operationalYieldOnTopOfAxe)) {
  console.log('    ' + pad(k, 13) + y.recoveries + ' real / ' + y.surfaced + ' surfaced = ' + y.yield + ' yield  (' + y.falseSurfaced + ' false review items)');
}

console.log('\n--- A3. Per-SC: not-decided failures recovered by merged uncertainty [baseline=axe-decided] ---');
console.log(pad('SC', 9) + pad('nFail', 7) + pad('axeDec', 8) + pad('ndFail', 8) + pad('uncUnion', 10) + 'contributors');
for (const sc of Object.keys(perSc).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))) {
  const r = perSc[sc];
  if (!r.notDecidedFailed) continue; // axe already decides all failures here
  console.log(pad(sc, 9) + pad(r.nFailed, 7) + pad(r.axeDecidedFailed, 8) + pad(r.notDecidedFailed, 8) +
    pad(r.uncertainUnionRecovers + '/' + r.notDecidedFailed, 10) + r.contributors.join('+'));
}
console.log('\nwrote evidence/sc-uncertainty.json');
