// Harness 3.0 — Level-3 contextual experiment planner (plan 3.0-B, Phase 2).
//
// The deterministic scheduler resolves Level 1/2 candidates with NO agent. A Level-3 candidate is one
// whose experiment/recipe choice is CONTEXT-DEPENDENT (e.g. which advised-exit key a modal documents,
// or which of several allowed experiments fits). Such candidates are escalated; a PLANNER selects
// among them. The planner is UNTRUSTED — it may be an LLM reading page text — so its output is a
// REQUEST that the deterministic, validating merger (`scheduler.mergeAgentPlan`) re-checks against the
// catalog-declared Level-3 candidates: it cannot retarget, re-SC, swap in an unlisted experiment, add
// a non-Level-3 candidate, or inject a recipe; the candidate's identity wins and misleading page text
// cannot validate anything. The deterministic default planner picks each candidate's first allowed
// experiment (no agent); automatic scheduling stays deterministic with no planner at all.
'use strict';

const sch = require('./scheduler.js');

// the default planner: deterministic, no agent — for each Level-3 escalation pick the FIRST
// allowed experiment the candidate declares. (An LLM planner can be injected with the same signature;
// its output rides the identical merger gate.)
function deterministicPlanner(escalations) {
  const requests = [];
  for (const c of escalations || []) {
    if (!c || c.selectionLevel !== 3) continue;
    const allowed = (Array.isArray(c.allowedExperiments) && c.allowedExperiments.length) ? c.allowedExperiments : [c.experimentId];
    requests.push({ candidateId: c.candidateId, experimentId: allowed[0], targetXpath: c.xpath, sc: c.sc });
  }
  return { requests };
}

// Run `planner` over the auto-plan's Level-3 escalations and MERGE its (untrusted) output through the
// validating merger. Returns { plan, errors }. A planner that throws, or whose requests escape the
// allowlist, never widens the plan — the merger drops the offending request and reports it.
function planLevel3(autoPlan, candidatesArtifact, planner = deterministicPlanner) {
  const escalations = ((autoPlan && autoPlan.escalations) || []).filter((c) => c && c.selectionLevel === 3);
  if (!escalations.length) return { plan: autoPlan, errors: [] };
  let agentPlan;
  try { agentPlan = planner(escalations, { candidates: candidatesArtifact }); }
  catch (e) { return { plan: autoPlan, errors: [`planner threw: ${String((e && e.message) || e)}`] }; }
  if (!agentPlan || !Array.isArray(agentPlan.requests)) return { plan: autoPlan, errors: ['planner produced no valid requests'] };
  return sch.mergeAgentPlan(autoPlan, agentPlan, candidatesArtifact);
}

module.exports = { deterministicPlanner, planLevel3 };
