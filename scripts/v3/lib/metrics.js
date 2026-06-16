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
// a malformed gold ROW (null / non-object) must DEGRADE (skip it), never crash the scorer — gold is
// operator-supplied config and a single bad row must not fail-crash a soundness-critical build.
// FAMILY-AWARE keying (audit D-GATE-2): a single (xpath, sc) can carry materially different assertions
// in different claim families (the documented future 1.3.1 case), with different ground truths — so a
// gold label that names a `claimFamily` is keyed to it and credits ONLY that family; a family-agnostic
// label keys to `*` and credits any family (back-compat with today's family-less gold).
const goldIndex = (gold) => {
  const m = Object.create(null);
  for (const g of gold || []) {
    if (!g || typeof g !== 'object') continue;
    const key = `${g.xpath}::${g.sc}::${g.claimFamily != null ? g.claimFamily : '*'}`;
    // BARRIER-DOMINANT fold (audit D-GATE/gold): once a key is a BARRIER (a caught false clear), a later
    // NO_BARRIER/INAPPLICABLE row must NEVER erase it — file/array order cannot weaken the clear gate.
    if (m[key] === 'BARRIER_OBSERVED') continue;
    m[key] = g.goldOutcome;
  }
  return m;
};
// the resolved gold CELL key for a record (family-specific wins; else the family-agnostic '*'), or null.
const recCellKey = (goldBy, r) => {
  const base = `${r.scope && r.scope.actionTargetRef}::${r.sc}`;
  if (r.family != null && Object.prototype.hasOwnProperty.call(goldBy, `${base}::${r.family}`)) return `${base}::${r.family}`;
  if (Object.prototype.hasOwnProperty.call(goldBy, `${base}::*`)) return `${base}::*`;
  return null;
};
const recLookup = (goldBy, r) => { const k = recCellKey(goldBy, r); return k == null ? undefined : goldBy[k]; };

function collectDirection(results, includeShadow, predicate) {
  const out = [];
  for (const c of results.claims || []) if (predicate(c.observationOutcome, c.wcagApplicability)) out.push({ scope: c.observationScope, sc: c.sc, family: c.claimFamily, source: 'authoritative', mechanism: mechanismOfRecord(c) });
  if (includeShadow) for (const s of results.shadowObservations || []) { const wb = s.wouldBe || {}; if (predicate(wb.observationOutcome, wb.wcagApplicability)) out.push({ scope: s.observationScope, sc: s.sc, family: s.claimFamily, source: 'shadow', mechanism: s.mechanism || mechanismOfRecord(s) }); }
  return out;
}

function tallyClears(clears, goldBy, conf) {
  let shadowClears = 0, unlabelledClears = 0;
  // Count DISTINCT gold CELLS, not records (audit D-GATE/dedup): an authoritative claim + a same-mechanism
  // shadow obs on ONE obligation share one gold label, so the 149-bound's "independent true cases" premise
  // requires deduping by cell — else the labelled count (and the false-clear count) inflate.
  const cells = new Map();
  for (const c of clears) {
    if (c.source === 'shadow') shadowClears++;
    const cell = recCellKey(goldBy, c);
    if (cell == null) { unlabelledClears++; continue; } // a clear with NO gold label — must NOT be silently dropped (audit R2-M1)
    if (!cells.has(cell)) cells.set(cell, goldBy[cell]);
  }
  const labelledClears = cells.size;
  let falseClears = 0;
  for (const outcome of cells.values()) if (outcome === 'BARRIER_OBSERVED') falseClears++;
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
  let shadowBarriers = 0, unlabelledBarriers = 0;
  const cells = new Map(); // distinct gold cells (dedup — audit)
  for (const b of barriers) {
    if (b.source === 'shadow') shadowBarriers++;
    const cell = recCellKey(goldBy, b);
    if (cell == null) { unlabelledBarriers++; continue; }
    if (!cells.has(cell)) cells.set(cell, goldBy[cell]);
  }
  const labelledBarriers = cells.size;
  let falseBarriers = 0;
  // a barrier gold says is NOT a barrier (a clear / out of scope) is a FALSE BARRIER — review-noise.
  for (const outcome of cells.values()) if (outcome === 'NO_BARRIER_OBSERVED' || outcome === 'INAPPLICABLE') falseBarriers++;
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

// Full per-mechanism scorecard: both directions + coverage, with the ASYMMETRIC canary gates (Harness
// 3.2). A provisional BARRIER reaches canary under the lenient gate (false rate ≤ threshold + coverage);
// a provisional CLEAR — the dangerous direction — reaches canary only under the STRICT gate: zero
// observed false clears, zero UNLABELLED clears, AND enough labelled clears to bound the false-clear
// rate below `clearTarget` (requiredZeroEventN, e.g. 149 for a 2% bound), plus the coverage floor. This
// is materially harder than a barrier and much harder than a deterministic clear, by design.
function scoreMechanism(results, gold, mechanism, opts = {}) {
  const clears = scoreClears(results, gold, { ...opts, mechanism });
  const barriers = scoreBarriers(results, gold, { ...opts, mechanism });
  const coverage = decisionCoverage(results, mechanism, opts);
  // BARRIER gate: a false barrier is review-noise, so the operator MAY relax its coverage floor (but a
  // non-finite/negative floor falls back to the default — never an accidental zero-floor).
  const barrierCoverageFloor = Number.isFinite(opts.coverageFloor) && opts.coverageFloor >= 0 ? opts.coverageFloor : 0.5;
  const barrierCoverageOk = coverage.coverage != null && coverage.coverage >= barrierCoverageFloor;
  // CLEAR gate: the DANGEROUS direction. The 2%-bound (149) + 50% coverage are HARD floors. The clamp is
  // TWO-SIDED (audit D-GATE-1): a non-finite/≤0 clearTarget previously made requiredZeroEventN NEGATIVE,
  // collapsing the 149-floor so one labelled clear passed. Validate to (0, 0.02], AND floor `need` at 149
  // so provisionOpts can only make the clear gate STRICTER, never weaker.
  const rawTarget = Number.isFinite(opts.clearTarget) && opts.clearTarget > 0 ? opts.clearTarget : 0.02;
  const clearTarget = Math.min(rawTarget, 0.02);
  const need = Math.max(requiredZeroEventN(clearTarget), requiredZeroEventN(0.02)); // never below the 149 floor
  const clearCoverageOk = coverage.coverage != null && coverage.coverage >= Math.max(barrierCoverageFloor, 0.5);
  return {
    mechanism, clears, barriers, coverage,
    barrierCanaryEligible: barriers.promotionEligible && barrierCoverageOk,
    // the strict clear gate (3.2 §"safety crux"): promotionEligible already requires zero false + zero
    // unlabelled clears; we additionally require the sample to actually BOUND the rate (≥ need) + coverage.
    clearCanaryEligible: clears.promotionEligible && clears.labelledClears >= need && clearCoverageOk,
    clearRequiredN: need,
  };
}

// Per-direction canary verdicts for a mechanism (Harness 3.2 §gated PROVISIONAL). Returns the metrics
// half of the gate; the authority half is `authority.provisionFor`. build-v3 requires BOTH in gated mode.
function provisionEligibility(results, gold, mechanism, opts = {}) {
  const sc = scoreMechanism(results, gold, mechanism, opts);
  return {
    mechanism,
    NO_BARRIER_OBSERVED: sc.clearCanaryEligible,
    BARRIER_OBSERVED: sc.barrierCanaryEligible,
    scorecard: sc,
  };
}

module.exports = {
  computeMetrics, zeroEventUpperBound, ruleOfThree, requiredZeroEventN,
  scoreClears, scoreBarriers, decisionCoverage, scoreMechanism, provisionEligibility, mechanismOfRecord,
};
