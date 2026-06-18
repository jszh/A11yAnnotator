// Harness 3.0 — deterministic scheduler + plan merger (plan 3.0-B). Level 1 (mandatory) and
// Level 2 (conditional) candidates are scheduled WITHOUT an agent; Level 3 are emitted as
// escalations (the agent planner is a later phase). Budgets defer candidates to escalation — they
// never silently clear. The plan merger validates optional agent requests against the catalog and
// rejects non-Level-3 or out-of-candidate-set additions.
'use strict';

const cat = require('./catalog.js');
const LIMITS = require('./limits.js'); // scheduling budget default (tier B)

const norm = (x) => String(x).replace(/\s+/g, '');

// Schedule automatic (Level 1/2) requests; emit Level 3 + budget-deferred as escalations.
function schedulePlan(candidatesArtifact, { maxAutomatic = LIMITS.scheduling.maxAutomatic } = {}) {
  const requests = [];
  const escalations = [];
  const seen = new Set();
  let used = 0;
  for (const c of (candidatesArtifact && candidatesArtifact.candidates) || []) {
    const key = `${norm(c.xpath)}::${c.experimentId}`;
    if (seen.has(key)) { escalations.push({ ...c, reason: 'deduped-equivalent' }); continue; } // never silently dropped
    seen.add(key);
    if (c.selectionLevel === 3) { escalations.push({ ...c, reason: 'requires contextual selection (Level 3)' }); continue; }
    if (c.selectionLevel !== 1 && c.selectionLevel !== 2) { escalations.push({ ...c, reason: `unknown selectionLevel ${c.selectionLevel}` }); continue; }
    if (used >= maxAutomatic) { escalations.push({ ...c, reason: 'budget-deferred' }); continue; }
    requests.push({
      candidateId: c.candidateId,
      experimentId: c.experimentId,
      targetXpath: c.xpath,
      sc: c.sc,
      claimFamily: c.claimFamily,
      selectionSource: c.selectionLevel === 1 ? 'mandatory-automatic' : 'conditional-automatic',
    });
    used++;
  }
  return {
    file: candidatesArtifact && candidatesArtifact.file,
    runId: candidatesArtifact && candidatesArtifact.runId,
    pageDigest: candidatesArtifact && candidatesArtifact.pageDigest,
    requests,
    escalations,
  };
}

// Merge optional agent-selected (Level 3) requests into the automatic plan. The planner may only
// CHOOSE among recipes the scheduler already escalated; it cannot retarget, re-SC, or swap in a
// different experiment (audit V3-H3). Every agent request must match an escalated Level-3 candidate
// by candidateId AND reproduce that candidate's exact (targetXpath, sc) AND name an experiment in
// that candidate's `allowedExperiments`. Anything else is rejected; the candidate's identity wins.
function mergeAgentPlan(autoPlan, agentPlan, candidatesArtifact) {
  const errors = [];
  const l3 = new Map();
  for (const c of (candidatesArtifact.candidates || []).filter((c) => c.selectionLevel === 3)) l3.set(c.candidateId, c);
  const merged = [...autoPlan.requests];
  const seen = new Set(merged.map((r) => `${norm(r.targetXpath)}::${r.experimentId}`));
  for (const req of (agentPlan && agentPlan.requests) || []) {
    // the planner is UNTRUSTED (may be an LLM): a non-object request element (null/undefined/scalar)
    // must be DROPPED-AND-REPORTED, never dereferenced — `req.experimentId` on null throws and would
    // crash the deterministic merger fail-open (gap-fill red-team). Containment, not trust.
    if (!req || typeof req !== 'object' || Array.isArray(req)) { errors.push('agent request is not an object (rejected)'); continue; }
    const exp = cat.getExperiment(req.experimentId);
    if (!exp) { errors.push(`agent request cites unknown experiment ${req.experimentId}`); continue; }
    const cand = l3.get(req.candidateId);
    if (!cand) { errors.push(`agent request ${req.candidateId} is not a catalog-declared Level-3 candidate`); continue; }
    if (norm(req.targetXpath) !== norm(cand.xpath)) { errors.push(`agent request ${req.candidateId} retargets ${cand.xpath} → ${req.targetXpath} (rejected)`); continue; }
    if (req.sc !== cand.sc) { errors.push(`agent request ${req.candidateId} re-SCs ${cand.sc} → ${req.sc} (rejected)`); continue; }
    const allowed = cand.allowedExperiments || [cand.experimentId];
    if (!allowed.includes(req.experimentId)) { errors.push(`agent request ${req.candidateId} uses experiment ${req.experimentId} not in allowedExperiments [${allowed.join(', ')}]`); continue; }
    // the chosen experiment must actually MEASURE the candidate's SC (no focus experiment for a 2.1.2 candidate)
    if (exp.sc !== cand.sc) { errors.push(`agent request ${req.candidateId}: experiment ${req.experimentId} measures SC ${exp.sc}, not candidate SC ${cand.sc} (rejected)`); continue; }
    const key = `${norm(cand.xpath)}::${req.experimentId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({ candidateId: cand.candidateId, experimentId: req.experimentId, targetXpath: cand.xpath, sc: cand.sc, claimFamily: cand.claimFamily, selectionSource: 'agent-selected' });
  }
  return { errors, plan: { ...autoPlan, requests: merged } };
}

module.exports = { schedulePlan, mergeAgentPlan };
