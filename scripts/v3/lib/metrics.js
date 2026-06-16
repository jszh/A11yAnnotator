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

// ---- gold scoring (per direction, PER MECHANISM) ----
// gold: [{ xpath, sc, goldOutcome: 'BARRIER_OBSERVED'|'NO_BARRIER_OBSERVED'|'INAPPLICABLE' }]
// Harness 3.1 §4: the deterministic runners and the LLM lane share results.shadowObservations, so
// scoring MUST group by the producing MECHANISM — an LLM shadow clear must never be lumped with a
// deterministic one. The two DIRECTIONS get ASYMMETRIC treatment: a false CLEAR is a safety failure
// (zero tolerated), a false BARRIER is review-noise (a small rate tolerated). And precision on the
// DECIDED subset is gameable by abstaining, so we also report decision COVERAGE and gate on it (H2).

// Which mechanism produced a clear/barrier? Shadow obs carry `mechanism` directly; an authoritative
// claim names its runner in supportRefs (`experiment:<id>`); fall back to the source tag.
function mechanismOfRecord(rec) {
  if (rec.mechanism) return rec.mechanism;
  const ref = (rec.supportRefs || []).find((r) => typeof r === 'string' && r.startsWith('experiment:'));
  return ref ? ref.slice('experiment:'.length) : (rec.source || 'deterministic');
}
const goldIndex = (gold) => { const m = {}; for (const g of gold || []) m[`${g.xpath}::${g.sc}`] = g.goldOutcome; return m; };
const recKey = (r) => `${r.scope && r.scope.actionTargetRef}::${r.sc}`;

function collectDirection(results, includeShadow, predicate) {
  const out = [];
  for (const c of results.claims || []) if (predicate(c.observationOutcome, c.wcagApplicability)) out.push({ scope: c.observationScope, sc: c.sc, source: 'authoritative', mechanism: mechanismOfRecord(c) });
  if (includeShadow) for (const s of results.shadowObservations || []) { const wb = s.wouldBe || {}; if (predicate(wb.observationOutcome, wb.wcagApplicability)) out.push({ scope: s.observationScope, sc: s.sc, source: 'shadow', mechanism: s.mechanism || mechanismOfRecord(s) }); }
  return out;
}

function tallyClears(clears, goldBy, conf) {
  let labelledClears = 0, falseClears = 0, shadowClears = 0, unlabelledClears = 0;
  for (const c of clears) {
    if (c.source === 'shadow') shadowClears++;
    const g = goldBy[recKey(c)];
    if (!g) { unlabelledClears++; continue; } // a clear with NO gold label — must NOT be silently dropped (audit R2-M1)
    labelledClears++;
    if (g === 'BARRIER_OBSERVED') falseClears++;
  }
  const rate = labelledClears ? falseClears / labelledClears : null;
  const upperBound = (falseClears === 0 && unlabelledClears === 0) ? zeroEventUpperBound(labelledClears, conf) : null;
  return {
    labelledClears, falseClears, shadowClears, unlabelledClears,
    falseClearanceRate: rate, upperBound95: upperBound,
    promotionEligible: unlabelledClears === 0 && labelledClears > 0 && falseClears === 0,
    note: unlabelledClears > 0
      ? `${unlabelledClears} emitted clear(s) have NO gold label — cannot bound the false-clear rate (audit R2-M1)`
      : 'a small sample bounds regressions, not a low FN rate (Gold Benchmark Requirements)',
  };
}

// Score CLEARS (authoritative + shadow would-be clears). `mechanism` filters to one producer; the
// returned `byMechanism` always breaks the UNFILTERED set down per producer.
function scoreClears(results, gold, { conf = 0.95, includeShadow = true, mechanism = null } = {}) {
  const goldBy = goldIndex(gold);
  const all = collectDirection(results, includeShadow, (o, app) => o === 'NO_BARRIER_OBSERVED' || app === 'INAPPLICABLE');
  const t = tallyClears(mechanism ? all.filter((c) => c.mechanism === mechanism) : all, goldBy, conf);
  t.byMechanism = {};
  for (const mech of new Set(all.map((c) => c.mechanism))) t.byMechanism[mech] = tallyClears(all.filter((c) => c.mechanism === mech), goldBy, conf);
  return t;
}

function tallyBarriers(barriers, goldBy) {
  let labelledBarriers = 0, falseBarriers = 0, shadowBarriers = 0, unlabelledBarriers = 0;
  for (const b of barriers) {
    if (b.source === 'shadow') shadowBarriers++;
    const g = goldBy[recKey(b)];
    if (!g) { unlabelledBarriers++; continue; }
    labelledBarriers++;
    // a barrier gold says is NOT a barrier (a clear / out of scope) is a FALSE BARRIER — review-noise.
    if (g === 'NO_BARRIER_OBSERVED' || g === 'INAPPLICABLE') falseBarriers++;
  }
  const rate = labelledBarriers ? falseBarriers / labelledBarriers : null;
  return { labelledBarriers, falseBarriers, shadowBarriers, unlabelledBarriers, falseBarrierRate: rate };
}

// Score BARRIERS with an ASYMMETRIC threshold (a false barrier is review-noise, not a safety failure)
// and a decision-COVERAGE floor (precision-on-decided is gameable by abstaining — H2). Default
// barrierThreshold 10%, coverageFloor 50%.
function scoreBarriers(results, gold, { includeShadow = true, mechanism = null, barrierThreshold = 0.10, coverageFloor = 0.5 } = {}) {
  const goldBy = goldIndex(gold);
  // a BARRIER is mutually exclusive with a clear: an INAPPLICABLE record is a clear (out of scope), so
  // exclude it here — a (contradictory) BARRIER_OBSERVED+INAPPLICABLE record must not count in BOTH lanes.
  const all = collectDirection(results, includeShadow, (o, app) => o === 'BARRIER_OBSERVED' && app !== 'INAPPLICABLE');
  const t = tallyBarriers(mechanism ? all.filter((b) => b.mechanism === mechanism) : all, goldBy);
  const cov = decisionCoverage(results, mechanism, { includeShadow });
  t.coverage = cov.coverage; t.barrierThreshold = barrierThreshold; t.coverageFloor = coverageFloor;
  t.promotionEligible = t.labelledBarriers > 0 && t.falseBarrierRate != null && t.falseBarrierRate <= barrierThreshold
    && cov.coverage != null && cov.coverage >= coverageFloor;
  t.byMechanism = {};
  for (const mech of new Set(all.map((b) => b.mechanism))) t.byMechanism[mech] = tallyBarriers(all.filter((b) => b.mechanism === mech), goldBy);
  return t;
}

// Decision coverage for a mechanism (3.1 §4/H2): the fraction it actually DECIDED (BARRIER/NO_BARRIER)
// vs ABSTAINED (INCONCLUSIVE). A mechanism that abstains on every hard case can show perfect precision
// on the few it answered — coverage exposes that, so promotion gates on it.
function decisionCoverage(results, mechanism = null, { includeShadow = true } = {}) {
  let decided = 0, abstained = 0;
  const tally = (outcome, mech) => {
    if (mechanism && mech !== mechanism) return;
    if (outcome === 'INCONCLUSIVE') abstained++;
    else if (outcome === 'BARRIER_OBSERVED' || outcome === 'NO_BARRIER_OBSERVED') decided++;
  };
  for (const c of results.claims || []) tally(c.observationOutcome, mechanismOfRecord(c));
  if (includeShadow) for (const s of results.shadowObservations || []) tally((s.wouldBe || {}).observationOutcome, s.mechanism || mechanismOfRecord(s));
  const total = decided + abstained;
  return { decided, abstained, total, coverage: total ? +(decided / total).toFixed(4) : null };
}

// Full per-mechanism scorecard: both directions + coverage. The promotion VERDICT is asymmetric — a
// clear may NOT promote with any false clear (and stays shadow under the zero-false-clear gate); a
// barrier MAY reach canary when its false rate is within tolerance AND coverage is adequate.
function scoreMechanism(results, gold, mechanism, opts = {}) {
  const clears = scoreClears(results, gold, { ...opts, mechanism });
  const barriers = scoreBarriers(results, gold, { ...opts, mechanism });
  const coverage = decisionCoverage(results, mechanism, opts);
  return {
    mechanism, clears, barriers, coverage,
    // a clear NEVER auto-promotes here (the clear lane is deterministic-only — §1); a barrier MAY,
    // subject to the asymmetric + coverage gate. Authoritative is never a target for an LLM mechanism.
    barrierCanaryEligible: barriers.promotionEligible && coverage.coverage != null && coverage.coverage >= (opts.coverageFloor != null ? opts.coverageFloor : 0.5),
  };
}

module.exports = {
  computeMetrics, zeroEventUpperBound, ruleOfThree, requiredZeroEventN,
  scoreClears, scoreBarriers, decisionCoverage, scoreMechanism, mechanismOfRecord,
};
