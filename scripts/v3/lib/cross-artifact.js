// Harness 3.0 — ONE bundle-aware identity / freshness / scope / reconciliation gate (plan Rule 5,
// 3.0-E; audit V3-H1/H6/H7). Used identically by the CLI and the sweep. Also enforces the v3 schema
// break: a legacy verdict LABEL in a SCHEMA position (an object key, or the value of a verdict-
// bearing field) is REJECTED — but legitimate PAGE CONTENT that merely equals an old label (an
// accessible name "N/A") is NOT, so the gate rejects legacy schema, not user data.
'use strict';

const norm = (x) => String(x).replace(/\s+/g, '');
// Legacy verdict tokens, matched as a WHOLE trimmed value/key (case-insensitive). PARTIAL is a
// shared v3 disposition, so it is NOT a legacy token.
const LEGACY_TOKENS = new Set(['REPRODUCED', 'NOT REPRODUCED', 'N/A']);
const isLegacyToken = (s) => typeof s === 'string' && LEGACY_TOKENS.has(s.trim().toUpperCase().replace(/\s+/g, ' '));

// Field names whose VALUE carries a verdict/disposition in v3 (or a legacy) schema. Only these
// fields' string values are scanned for legacy tokens; page-content fields (name, text, value,
// label, …) are exempt so real page data equal to an old label does not trip the gate.
const VERDICT_FIELDS = new Set([
  'verdict', 'legacyVerdict', 'outcome', 'observationOutcome', 'wcagApplicability',
  'conformanceOutcome', 'disposition', 'result', 'status', 'direction', 'goldOutcome',
]);

// Scan for a legacy label in a SCHEMA position. `inVerdictField` is true when the current node is
// the value of a verdict-bearing field (so its string value is checked). Object keys are always
// checked. Returns a path string for the first hit, else null.
function findLegacyLabel(node, path = '$', inVerdictField = false) {
  if (node == null) return null;
  // boxed primitives (new String('N/A')) are typeof 'object' yet serialize to the bare token — coerce
  // so a wrapper object cannot smuggle a legacy label past the typeof-string check (adversarial gap).
  if (node instanceof String || node instanceof Number || node instanceof Boolean) node = node.valueOf();
  if (typeof node === 'string') return (inVerdictField && isLegacyToken(node)) ? `${path}=${JSON.stringify(node)}` : null;
  if (Array.isArray(node)) { for (let i = 0; i < node.length; i++) { const h = findLegacyLabel(node[i], `${path}[${i}]`, inVerdictField); if (h) return h; } return null; }
  if (typeof node === 'object') {
    for (const k of Object.keys(node)) {
      if (isLegacyToken(k)) return `${path} key ${JSON.stringify(k)}`;
      const h = findLegacyLabel(node[k], `${path}.${k}`, VERDICT_FIELDS.has(k)); if (h) return h;
    }
    return null;
  }
  return null;
}

// STRICT scan for harness-authored output (no page content to protect): any legacy token in ANY
// key OR ANY string value refuses. Used by build-v3 on the v3 results only.
function findLegacyLabelStrict(node, path = '$') {
  if (node == null) return null;
  // boxed primitives serialize to a bare token but are typeof 'object' — coerce so a wrapper object
  // (new String('N/A')) cannot evade the typeof-string check and leak into published results (HIGH).
  if (node instanceof String || node instanceof Number || node instanceof Boolean) node = node.valueOf();
  if (typeof node === 'string') return isLegacyToken(node) ? `${path}=${JSON.stringify(node)}` : null;
  if (Array.isArray(node)) { for (let i = 0; i < node.length; i++) { const h = findLegacyLabelStrict(node[i], `${path}[${i}]`); if (h) return h; } return null; }
  if (typeof node === 'object') {
    for (const k of Object.keys(node)) {
      if (isLegacyToken(k)) return `${path} key ${JSON.stringify(k)}`;
      const h = findLegacyLabelStrict(node[k], `${path}.${k}`); if (h) return h;
    }
    return null;
  }
  return null;
}

const ID_FIELDS = ['file', 'runId', 'pageDigest'];

// bundle = { manifest?, collect, drive?, candidates?, plan?, experiments?, claimProposals? }
function crossArtifactErrors(bundle, requiredStages = ['collect', 'experiments', 'claimProposals']) {
  const E = [];
  const push = (m) => E.push(m);
  if (!bundle || typeof bundle !== 'object') return ['cross-artifact: missing/unparseable bundle'];

  for (const stage of requiredStages) if (bundle[stage] == null) push(`bundle missing required stage artifact: ${stage}`);

  const arts = [
    ['manifest', bundle.manifest], ['collect', bundle.collect], ['drive', bundle.drive],
    ['candidates', bundle.candidates], ['plan', bundle.plan], ['experiments', bundle.experiments], ['claimProposals', bundle.claimProposals],
    // applicability is publication-influencing (it gates authoritative claims) so its identity must be
    // bound to the run like experiments/claimProposals — a wrong-page/run observer artifact whose facts
    // happen to agree must not satisfy the boundary (audit R5R-C1).
    ['applicability', bundle.applicability],
    // the Harness 3.1 LLM lane is gold-SCORED, so a STALE artifact would score against the wrong page
    // (3.1 §4/M5) — content-bind both the structured verdicts and the free-text rationale to the run.
    ['llm', bundle.llm],
    ['llmRationale', bundle.llmRationale],
    ['llmVision', bundle.llmVision],
  ].filter(([, a]) => a != null);

  for (const [name, art] of arts) { const hit = findLegacyLabel(art, name); if (hit) push(`legacy verdict label present in ${name} (v3 is a clean schema break): ${hit}`); }

  // identity: collect MUST declare file/runId/pageDigest, and every present artifact must match
  // it exactly — a missing field is a MISMATCH, not an absent assertion (no fail-open).
  const ref = bundle.collect;
  if (ref) {
    for (const f of ID_FIELDS) if (ref[f] == null) push(`collect must declare ${f} (v3 identity binding)`);
    for (const [name, art] of arts) {
      if (name === 'collect') continue;
      // drive and manifest are baseline/provenance: match only the identity fields they DECLARE
      // (so a minimal artifact is allowed) — but a DECLARED-yet-wrong identity is still caught
      // (audit R1-F4: a manifest naming a different page must not pass).
      const lenient = name === 'drive' || name === 'manifest';
      for (const f of ID_FIELDS) {
        if (lenient && art[f] == null) continue;
        if (art[f] !== ref[f]) push(`${f} mismatch: ${name}.${f}=${JSON.stringify(art[f])} != collect.${f}=${JSON.stringify(ref[f])}`);
      }
    }
  }

  // freshness: experiments must start at/after the collector completed (all finite)
  if (bundle.collect && bundle.experiments) {
    const c = bundle.collect.collectedAt, x = bundle.experiments.startedAt;
    if (!Number.isFinite(c) || !Number.isFinite(x)) push('freshness: collect.collectedAt and experiments.startedAt must both be finite');
    else if (x < c) push(`stale experiments: experiments.startedAt (${x}) is before collect.collectedAt (${c})`);
  }

  // scope: every experiment target must be in the collector inventory (report all mismatches)
  if (bundle.collect && bundle.experiments) {
    const inv = new Set((bundle.collect.elements || []).map((e) => e && e.xpath).filter(Boolean).map(norm));
    for (const r of (bundle.experiments.results || [])) {
      const t = r && (r.targetXpath || r.actionTargetRef);
      if (t && !inv.has(norm(t))) push(`experiment target ${String(t).slice(-40)} is NOT in the collector inventory (cross-artifact mismatch)`);
    }
  }

  // reconciliation (audit V3-H6): when the plan and candidates travel in the bundle, every
  // request needs exactly one typed result XOR explicit failure/deferral, and every candidate
  // needs exactly one request XOR a scheduling disposition (escalation). Nothing disappears.
  for (const m of reconcileErrors(bundle)) push(m);

  return E;
}

// Plan↔result↔candidate reconciliation. Only enforced for stages present in the bundle.
function reconcileErrors(bundle) {
  const E = [];
  const plan = bundle.plan, exp = bundle.experiments, cands = bundle.candidates;
  if (plan && exp) {
    const requests = plan.requests || [];
    const reqById = new Map(requests.map((r) => [r.candidateId, r]));
    const results = exp.results || [];
    const resultIds = results.map((r) => r.claimId);
    const unrun = exp.unrun || []; // [{candidateId, status:'skipped'|'failed'|'deferred', reason}]
    const unrunIds = unrun.map((u) => u.candidateId);
    // each request gets exactly one disposition (result XOR unrun)
    for (const req of requests) {
      const inResults = resultIds.filter((id) => id === req.candidateId).length;
      const inUnrun = unrunIds.filter((id) => id === req.candidateId).length;
      const total = inResults + inUnrun;
      if (total === 0) E.push(`unreconciled plan request ${req.candidateId}: no result, failure, or deferral (experiment disappeared)`);
      else if (total > 1) E.push(`plan request ${req.candidateId} has ${total} dispositions (must be exactly one)`);
    }
    // a result must answer the SAME question its request asked: target + SC must match (audit R1-F6).
    for (const r of results) {
      const req = reqById.get(r.claimId);
      if (!req) { E.push(`experiment result ${r.claimId} has no matching plan request (unrequested experiment)`); continue; }
      if (norm(r.targetXpath) !== norm(req.targetXpath)) E.push(`result ${r.claimId} target ${r.targetXpath} != request target ${req.targetXpath} (answered the wrong element)`);
      if (r.sc != null && req.sc != null && r.sc !== req.sc) E.push(`result ${r.claimId} sc ${r.sc} != request sc ${req.sc} (answered the wrong SC)`);
    }
    for (const id of unrunIds) if (!reqById.has(id)) E.push(`unrun record ${id} has no matching plan request`);
  }
  if (plan && cands) {
    const requested = new Set((plan.requests || []).map((r) => r.candidateId));
    const escalated = new Set((plan.escalations || []).map((c) => c.candidateId));
    for (const c of cands.candidates || []) {
      const inReq = requested.has(c.candidateId), inEsc = escalated.has(c.candidateId);
      if (!inReq && !inEsc) E.push(`candidate ${c.candidateId} has no scheduling disposition (neither requested nor escalated)`);
      if (inReq && inEsc) E.push(`candidate ${c.candidateId} is both requested and escalated (ambiguous)`);
    }
  }
  return E;
}

module.exports = { crossArtifactErrors, findLegacyLabel, findLegacyLabelStrict, reconcileErrors, VERDICT_FIELDS };
