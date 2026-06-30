'use strict';
// Scoring for the FP-reduction experiments. `scoreCase` and `summarize` are copied VERBATIM from
// eval/checker-comparison/run-fn-llm.js (the reference harness) so a replayed judge scores byte-identically to a
// live run. If run-fn-llm's scorer changes, update here — the replay↔live validation (replay over frozen evidence
// vs a fresh live tools-OFF run) is the canary that catches any drift.

// ---- scoring one case (verbatim from run-fn-llm.js scoreCase) ----
function scoreCase(tc, out) {
  const inScope = new Set(tc.sc || []);
  const built = out && out.built;
  const bundle = (out && out.bundle) || {};
  const rec = { testcaseId: tc.testcaseId, ruleId: tc.ruleId, ruleName: tc.ruleName, sc: tc.sc, expected: tc.expected, draft: !!tc.draft, url: tc.url };

  const agentV = (bundle.llm && bundle.llm.verdicts) || [];
  const rubricV = (bundle.judgments && bundle.judgments.judgments) || [];
  const agentInScope = agentV.filter((v) => inScope.has(v.sc));
  const rubricInScope = rubricV.filter((j) => inScope.has(j.sc));

  const shadow = (built && built.results && built.results.shadowObservations) || [];
  rec.v3Barrier = shadow.some((o) => o.source === 'deterministic' && inScope.has(o.sc) && o.wouldBe && o.wouldBe.observationOutcome === 'BARRIER_OBSERVED');

  const ledger = (built && built.results && built.results.obligationLedger) || [];
  const inScopeOblig = ledger.filter((r) => inScope.has(r.sc));
  rec.inScopeObligations = inScopeOblig.length;
  rec.inScopeAutoPartial = inScopeOblig.filter((r) => r.autoPartial).length;
  rec.inScopeBarrierFilled = inScopeOblig.filter((r) => r.disposition === 'PROVISIONAL' && r.cleared === false).length;

  // RESPECT the obligation-ledger reconcile (kept in sync with run-fn-llm.js): a rubric LIKELY_BARRIER the ledger
  // RECONCILED-SUPPRESSED (PROVISIONAL/cleared with provisional.reconciled.suppressed) must NOT be re-counted as a
  // raw catch — else the link-equivalence-authoritative FP fix is invisible to the replay metric.
  const reconciledSuppressed = new Set();
  for (const r of inScopeOblig) {
    const sup = r && r.cleared === true && r.provisional && r.provisional.reconciled && r.provisional.reconciled.suppressed;
    if (Array.isArray(sup)) for (const mech of sup) reconciledSuppressed.add(`${r.xpath}::${r.sc}::${String(mech).replace(/^llm-rubric:/, '')}`);
  }
  const barrierAgent = agentInScope.filter((v) => v.agentVerdict === 'REPRODUCED');
  const barrierRubric = rubricInScope.filter((j) => j.verdict === 'LIKELY_BARRIER'
    && !reconciledSuppressed.has(`${j.targetXpath}::${j.sc}::${j.rubricRef}`));
  const okAgent = agentInScope.filter((v) => v.agentVerdict === 'NOT REPRODUCED');
  const okRubric = rubricInScope.filter((j) => j.verdict === 'LIKELY_OK');
  const nVerdicts = agentInScope.length + rubricInScope.length;

  let outcome;
  if (rec.v3Barrier || rec.inScopeBarrierFilled > 0) outcome = 'caught';
  else if (barrierAgent.length || barrierRubric.length) outcome = 'caught';
  else if (nVerdicts === 0) outcome = rec.inScopeAutoPartial > 0 ? 'noVerdict' : 'noObligation';
  else if (okAgent.length || okRubric.length) outcome = 'missedAgree';
  else outcome = 'uncertain';
  rec.outcome = outcome;
  rec.llmFlag = outcome === 'caught';
  rec.polarity = tc.expected === 'failed' ? 'recall' : 'specificity';
  rec.correct = rec.polarity === 'recall' ? (outcome === 'caught') : (outcome !== 'caught');
  rec.falsePositive = rec.polarity === 'specificity' && outcome === 'caught';

  const rats = (bundle.llmRationale && bundle.llmRationale.rationales) || [];
  const ratById = {}; for (const r of rats) ratById[r.verdictId] = r;
  rec.agentVerdicts = agentInScope.map((v) => ({ sc: v.sc, verdict: v.agentVerdict, confidence: v.confidence, claimFamily: v.claimFamily, xpath: v.targetXpath,
    summary: (ratById[v.verdictId] && ratById[v.verdictId].summary) || null }));
  rec.rubricVerdicts = rubricInScope.map((j) => ({ sc: j.sc, verdict: j.verdict, confidence: j.confidence, rubric: j.rubricRef, xpath: j.targetXpath, summary: j.summary || null }));
  rec.otherBarriers = [
    ...agentV.filter((v) => !inScope.has(v.sc) && v.agentVerdict === 'REPRODUCED').map((v) => ({ kind: 'agent', sc: v.sc, xpath: v.targetXpath })),
    ...rubricV.filter((j) => !inScope.has(j.sc) && j.verdict === 'LIKELY_BARRIER').map((j) => ({ kind: 'rubric', sc: j.sc, rubric: j.rubricRef, xpath: j.targetXpath })),
  ];
  rec.timings = (bundle.timings && bundle.timings.stages) || null;
  return rec;
}

// ---- summarize (verbatim from run-fn-llm.js summarize, minus the run-level model/vision/tools fields) ----
function summarize(results) {
  const tally = { caught: 0, missedAgree: 0, uncertain: 0, noVerdict: 0, noObligation: 0, error: 0 };
  const bySc = {};
  const byExpected = {};
  for (const r of results) {
    tally[r.outcome] = (tally[r.outcome] || 0) + 1;
    const e = r.expected || 'unknown';
    const be = byExpected[e] || (byExpected[e] = { n: 0, caught: 0, missedAgree: 0, uncertain: 0, noVerdict: 0, noObligation: 0, error: 0 });
    be.n++; be[r.outcome] = (be[r.outcome] || 0) + 1;
    for (const sc of (r.sc || [])) {
      bySc[sc] = bySc[sc] || { total: 0, expected: e, caught: 0, missedAgree: 0, uncertain: 0, noVerdict: 0, noObligation: 0, error: 0 };
      bySc[sc].total++; bySc[sc][r.outcome] = (bySc[sc][r.outcome] || 0) + 1;
    }
  }
  const n = results.length;
  const recallCases = results.filter((r) => r.polarity === 'recall');
  const specCases = results.filter((r) => r.polarity === 'specificity');
  const recallCaught = recallCases.filter((r) => r.outcome === 'caught').length;
  const falsePos = specCases.filter((r) => r.falsePositive).length;
  return { generatedAt: new Date().toISOString(), n, tally, byExpected,
    recall: { failedN: recallCases.length, caught: recallCaught, recallRate: recallCases.length ? +(recallCaught / recallCases.length).toFixed(3) : null },
    specificity: { n: specCases.length, falsePositive: falsePos, falsePositiveRate: specCases.length ? +(falsePos / specCases.length).toFixed(3) : null },
    caughtRate: n ? +(tally.caught / n).toFixed(3) : null, bySc };
}

function printSummary(results, label) {
  const s = summarize(results);
  const fpSCs = {};
  for (const r of results) if (r.falsePositive) { const sc = (r.sc || [])[0]; fpSCs[sc] = (fpSCs[sc] || 0) + 1; }
  console.log(`\n=== ${label || 'replay'} === n=${s.n}`);
  console.log(`  recall:   ${s.recall.caught}/${s.recall.failedN} = ${s.recall.recallRate != null ? (100 * s.recall.recallRate).toFixed(1) + '%' : '-'}`);
  console.log(`  FP:       ${s.specificity.falsePositive}/${s.specificity.n} = ${s.specificity.falsePositiveRate != null ? (100 * s.specificity.falsePositiveRate).toFixed(1) + '%' : '-'}  by-SC ${JSON.stringify(fpSCs)}`);
  console.log(`  outcomes: ${JSON.stringify(s.tally)}`);
  return s;
}

module.exports = { scoreCase, summarize, printSummary };
