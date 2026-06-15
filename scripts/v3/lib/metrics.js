// Harness 3.0 — metrics & gold-benchmark scoring (plan 3.0-G, Gold Benchmark Requirements).
// All metrics are DERIVED from artifacts (never agent-authored). Scoring is per-DIRECTION with
// uncertainty: a small sample bounds regressions, not a low false-negative rate, so we report the
// statistical-power facts the plan demands (rule-of-three / required-n / Clopper-Pearson UB).
'use strict';

// ---- derived run metrics ----
function computeMetrics(results, plan) {
  const claims = results.claims || [];
  const ledger = results.obligationLedger || [];
  const bySc = {};
  for (const r of ledger) {
    const m = bySc[r.sc] = bySc[r.sc] || { obligations: 0, cleared: 0, barrier: 0, partial: 0, autoPartial: 0 };
    m.obligations++;
    if (r.disposition === 'PARTIAL') { m.partial++; if (r.autoPartial) m.autoPartial++; }
    else if (r.cleared) m.cleared++; else m.barrier++;
  }
  const bySource = {};
  for (const req of (plan && plan.requests) || []) bySource[req.selectionSource] = (bySource[req.selectionSource] || 0) + 1;
  return {
    obligations: ledger.length,
    authoritative: claims.length,
    cleared: claims.filter((c) => c.observationOutcome === 'NO_BARRIER_OBSERVED' || c.wcagApplicability === 'INAPPLICABLE').length,
    barriersObserved: claims.filter((c) => c.observationOutcome === 'BARRIER_OBSERVED').length,
    partial: ledger.filter((r) => r.disposition === 'PARTIAL').length,
    autoPartial: ledger.filter((r) => r.autoPartial).length,
    bySc,
    requestsBySelectionSource: bySource,
    pctResolvedWithoutAgent: requestsPctNoAgent(plan),
  };
}

function requestsPctNoAgent(plan) {
  const reqs = (plan && plan.requests) || [];
  if (!reqs.length) return null;
  const auto = reqs.filter((r) => r.selectionSource !== 'agent-selected').length;
  return +(100 * auto / reqs.length).toFixed(1);
}

// ---- statistical power (Gold Benchmark Requirements) ----
// 95% upper bound on a true rate given ZERO observed events in n trials (Clopper-Pearson, x=0).
function zeroEventUpperBound(n, conf = 0.95) { return n > 0 ? 1 - Math.pow(1 - conf, 1 / n) : 1; }
// Rule-of-three approximation (1-conf=0.05 ⇒ ~3/n).
function ruleOfThree(n) { return n > 0 ? 3 / n : 1; }
// Minimum independently-labelled TRUE cases needed to bound a rate below `target` at `conf`,
// with zero observed events. (e.g. target 0.02 ⇒ 149.) Bonferroni: divide (1-conf) by k tests.
function requiredZeroEventN(target, conf = 0.95, k = 1) {
  const alpha = (1 - conf) / k;
  return Math.ceil(Math.log(alpha) / Math.log(1 - target));
}

// ---- gold scoring (per direction) ----
// gold: [{ xpath, sc, goldOutcome: 'BARRIER_OBSERVED'|'NO_BARRIER_OBSERVED'|'INAPPLICABLE' }]
// Scores CLEARS (whether published authoritative or recorded as SHADOW would-be clears — shadow
// mode is precisely when we measure a mechanism against gold before promotion). Returns false-
// clearance facts: clears that gold says are real barriers, plus the CI on the rate.
function scoreClears(results, gold, { conf = 0.95, includeShadow = true } = {}) {
  const goldBy = {}; for (const g of gold) goldBy[`${g.xpath}::${g.sc}`] = g.goldOutcome;
  const isClear = (o, app) => o === 'NO_BARRIER_OBSERVED' || app === 'INAPPLICABLE';
  const clears = [];
  for (const c of results.claims || []) if (isClear(c.observationOutcome, c.wcagApplicability)) clears.push({ scope: c.observationScope, sc: c.sc, source: 'authoritative' });
  if (includeShadow) for (const s of results.shadowObservations || []) {
    const wb = s.wouldBe || {}; if (isClear(wb.observationOutcome, wb.wcagApplicability)) clears.push({ scope: s.observationScope, sc: s.sc, source: 'shadow' });
  }
  let labelledClears = 0, falseClears = 0, shadowClears = 0;
  for (const c of clears) {
    if (c.source === 'shadow') shadowClears++;
    const key = `${c.scope && c.scope.actionTargetRef}::${c.sc}`;
    const g = goldBy[key]; if (!g) continue;
    labelledClears++;
    if (g === 'BARRIER_OBSERVED') falseClears++;
  }
  const rate = labelledClears ? falseClears / labelledClears : null;
  const upperBound = falseClears === 0 ? zeroEventUpperBound(labelledClears, conf) : null;
  return { labelledClears, falseClears, shadowClears, falseClearanceRate: rate, upperBound95: upperBound, note: 'a small sample bounds regressions, not a low FN rate (Gold Benchmark Requirements)' };
}

module.exports = { computeMetrics, zeroEventUpperBound, ruleOfThree, requiredZeroEventN, scoreClears };
