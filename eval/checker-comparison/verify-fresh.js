#!/usr/bin/env node
// Fresh independent cross-check. Written from scratch.
'use strict';
const fs = require('fs');
const path = require('path');

const RAW = path.join(__dirname, 'upstream-evidence', 'act-pilot', 'raw.json');
const cases = JSON.parse(fs.readFileSync(RAW, 'utf8'));

const SC_RE = /^\d\.\d+\.\d+$/;
const ALL_TOOLS = ['axe', 'ibm', 'alfa', 'qualweb', 'htmlcs'];
const FOCUSED = ['axe', 'ibm', 'alfa', 'qualweb'];

function validSCs(arr) {
  return (Array.isArray(arr) ? arr : []).filter((s) => SC_RE.test(s));
}
function intersects(a, b) {
  const sb = new Set(b);
  return a.some((x) => sb.has(x));
}

// Build scored cases
const scored = [];
let skipped = 0;
for (const c of cases) {
  const caseSC = validSCs(c.sc);
  if (caseSC.length === 0) { skipped++; continue; }
  const isFailed = c.expected === 'failed';
  const isNeg = c.expected === 'passed' || c.expected === 'inapplicable';
  if (!isFailed && !isNeg) { skipped++; continue; } // safety; shouldn't happen
  // per-tool decided/uncertain + the matching SCs (for uniqueness/per-sc later)
  const decided = {};
  const uncertain = {};
  for (const T of ALL_TOOLS) {
    const findings = Array.isArray(c.byTool && c.byTool[T]) ? c.byTool[T] : [];
    let dec = false, unc = false;
    for (const f of findings) {
      const fSC = validSCs(f.sc);
      if (fSC.length === 0) continue;
      if (!intersects(fSC, caseSC)) continue;
      if (f.outcome === 'violation') dec = true;
      else unc = true;
    }
    decided[T] = dec;
    uncertain[T] = unc;
  }
  scored.push({ ref: c, caseSC, isFailed, isNeg, decided, uncertain });
}

const failedCases = scored.filter((s) => s.isFailed);
const negCases = scored.filter((s) => s.isNeg);

function decidedPred(s, T) { return s.decided[T]; }
function uncertainPred(s, T) { return s.uncertain[T]; }
function anyDecided(s) { return ALL_TOOLS.some((T) => s.decided[T]); }
function uncUnion(s) { return ALL_TOOLS.some((T) => s.uncertain[T]); }
function uncUnionFocused(s) { return FOCUSED.some((T) => s.uncertain[T]); }

const out = [];
const p = (x) => out.push(x);

// ---- 1. Counts ----
p('=== 1. COUNTS ===');
p(`total scored cases        : ${scored.length}`);
p(`#failed                   : ${failedCases.length}`);
p(`#(passed+inapplicable)    : ${negCases.length}`);
p(`#skipped (no valid SC)    : ${skipped}`);
// expected-value breakdown sanity
const expCounts = {};
for (const c of cases) expCounts[c.expected] = (expCounts[c.expected] || 0) + 1;
p(`(raw expected breakdown)  : ${JSON.stringify(expCounts)}`);

// ---- 2. A1 raw discrimination over ALL scored cases ----
p('');
p('=== 2. A1 RAW DISCRIMINATION (all scored cases) ===');
p(`#failed=${failedCases.length}  #neg=${negCases.length}`);
function discRow(label, predFn) {
  let fh = 0, nh = 0;
  for (const s of failedCases) if (predFn(s)) fh++;
  for (const s of negCases) if (predFn(s)) nh++;
  const recall = failedCases.length ? (fh / failedCases.length) : 0;
  const noise = negCases.length ? (nh / negCases.length) : 0;
  p(`${label.padEnd(18)} failHit=${String(fh).padStart(3)}  negHit=${String(nh).padStart(3)}  recall=${recall.toFixed(4)}  noise=${noise.toFixed(4)}`);
}
p('-- decided(T) --');
for (const T of ALL_TOOLS) discRow(`decided(${T})`, (s) => decidedPred(s, T));
p('-- uncertain(T) --');
for (const T of ALL_TOOLS) discRow(`uncertain(${T})`, (s) => uncertainPred(s, T));
p('-- unions --');
discRow('uncUnion', uncUnion);
discRow('uncUnionFocused', uncUnionFocused);

// ---- 3. A2 baseline = axeDecided ----
p('');
p('=== 3. A2 ON BASELINE axeDecided ===');
const ndFailed = failedCases.filter((s) => !s.decided['axe']);
const ndNeg = negCases.filter((s) => !s.decided['axe']);
p(`|ndFailed| (failed & !axeDecided) : ${ndFailed.length}`);
p(`|ndNeg|    (neg & !axeDecided)    : ${ndNeg.length}`);
p('-- per tool: recovers among ndFailed / noise among ndNeg (uncertain-flag) --');
function a2Row(label, predFn) {
  let rec = 0, noi = 0;
  for (const s of ndFailed) if (predFn(s)) rec++;
  for (const s of ndNeg) if (predFn(s)) noi++;
  p(`${label.padEnd(18)} recovers=${String(rec).padStart(3)}/${ndFailed.length}  noise=${String(noi).padStart(3)}/${ndNeg.length}`);
}
for (const T of ALL_TOOLS) a2Row(`uncertain(${T})`, (s) => uncertainPred(s, T));
a2Row('uncUnion', uncUnion);
a2Row('uncUnionFocused', uncUnionFocused);

p('-- unique ndFailed surfaced by EXACTLY one tool (uncertain) --');
function uniqueCounts(toolset) {
  const cnt = {};
  for (const T of toolset) cnt[T] = 0;
  for (const s of ndFailed) {
    const flaggers = toolset.filter((T) => s.uncertain[T]);
    if (flaggers.length === 1) cnt[flaggers[0]]++;
  }
  return cnt;
}
const uniqAll = uniqueCounts(ALL_TOOLS);
const uniqFoc = uniqueCounts(FOCUSED);
p(`among ALL 5 tools : ${ALL_TOOLS.map((T) => `${T}=${uniqAll[T]}`).join('  ')}`);
p(`among FOCUSED     : ${FOCUSED.map((T) => `${T}=${uniqFoc[T]}`).join('  ')}`);

// ---- 4. Per-SC on baseline axeDecided ----
p('');
p('=== 4. PER-SC (baseline axeDecided), SCs with >=1 failed case ===');
// A case can have multiple SCs; assign the failed case to each of its valid SCs.
const scMap = new Map(); // sc -> {failed:[], }
for (const s of failedCases) {
  for (const sc of s.caseSC) {
    if (!scMap.has(sc)) scMap.set(sc, []);
    scMap.get(sc).push(s);
  }
}
const scKeys = [...scMap.keys()].sort();
p('SC        nFailed  axeDec  notDec  recByUnc  contributingTools');
for (const sc of scKeys) {
  const list = scMap.get(sc);
  const nFailed = list.length;
  const axeDec = list.filter((s) => s.decided['axe']).length;
  const notDec = list.filter((s) => !s.decided['axe']);
  const recBy = notDec.filter((s) => uncUnion(s));
  // which tools contribute to the recovery (uncertain-flag on a not-decided failed case for this SC)
  const contrib = new Set();
  for (const s of notDec) {
    for (const T of ALL_TOOLS) if (s.uncertain[T]) contrib.add(T);
  }
  p(`${sc.padEnd(9)} ${String(nFailed).padStart(5)}   ${String(axeDec).padStart(5)}   ${String(notDec.length).padStart(5)}    ${String(recBy.length).padStart(5)}     ${[...contrib].sort().join(',') || '-'}`);
}

// ---- 5. Confirm specific SCs have failed cases ----
p('');
p('=== 5. SPECIFIC SCs HAVE FAILED CASES? ===');
for (const sc of ['1.4.1', '1.3.3', '2.4.6']) {
  const n = scMap.has(sc) ? scMap.get(sc).length : 0;
  p(`${sc}: ${n > 0 ? 'yes' : 'no'} (count=${n})`);
}

// ---- 6. htmlcs spray ----
p('');
p('=== 6. HTMLCS SPRAY (distinct valid SCs review-tagged per case, cases w/ >=1 review) ===');
const sprayCounts = [];
for (const c of cases) {
  const findings = Array.isArray(c.byTool && c.byTool.htmlcs) ? c.byTool.htmlcs : [];
  const reviewSCs = new Set();
  let hasReview = false;
  for (const f of findings) {
    if (f.outcome !== 'violation') { // review (non-violation)
      hasReview = true;
      for (const sc of validSCs(f.sc)) reviewSCs.add(sc);
    }
  }
  if (hasReview) sprayCounts.push(reviewSCs.size);
}
function median(arr) {
  if (arr.length === 0) return NaN;
  const a = [...arr].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}
p(`cases w/ >=1 htmlcs review : ${sprayCounts.length}`);
p(`median distinct valid SCs  : ${sprayCounts.length ? median(sprayCounts) : 'n/a'}`);
p(`max distinct valid SCs     : ${sprayCounts.length ? Math.max(...sprayCounts) : 'n/a'}`);
// Also: htmlcs review presence might be zero given the error in case 0; report total htmlcs findings.
let htmlcsTotal = 0, htmlcsReviewFindings = 0;
for (const c of cases) {
  const f = Array.isArray(c.byTool && c.byTool.htmlcs) ? c.byTool.htmlcs : [];
  htmlcsTotal += f.length;
  htmlcsReviewFindings += f.filter((x) => x.outcome !== 'violation').length;
}
p(`(htmlcs total findings=${htmlcsTotal}, review findings=${htmlcsReviewFindings})`);

console.log(out.join('\n'));
