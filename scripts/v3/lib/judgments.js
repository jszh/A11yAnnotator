// Harness 3.0 — semantic judgment skills (plan 3.0-D, Phase 3, Rule 6).
//
// Some SCs need MEANING (alt-text adequacy, error-message helpfulness, instruction clarity) that no
// deterministic experiment can decide. A SKILL (an untrusted LLM agent with a rubric) produces a
// `judgments.json` artifact. This module binds + classifies those judgments. The keystone Phase-3
// rule: a subjective judgment CANNOT authorize an observation until its individual rubric passes a
// both-direction precision threshold (calibrated against gold). Until then — and by default ALL
// rubrics are uncalibrated — every judgment is a NON-DEFINITE adjudication RECOMMENDATION: it is
// surfaced for human review, never published as an authoritative clear/barrier, and the obligation it
// touches stays PARTIAL. Ambiguous judgments (`UNCERTAIN`) stay unresolved by construction.
'use strict';

const V = require('./v3-schema.js');

const VERDICTS = ['LIKELY_BARRIER', 'LIKELY_OK', 'UNCERTAIN'];

// Rubric calibration registry (parallels authority.js). DEFAULT: empty ⇒ every rubric uncalibrated ⇒
// recommendations only. A rubric becomes authorizable ONLY with `calibrated:true`, a met both-
// direction precision bound, and named gold provenance — none ship in Phase 0.
const RUBRICS = Object.freeze({});

function rubricState(rubricRef, reg = RUBRICS) {
  const r = reg && reg[rubricRef];
  if (!r) return { calibrated: false, reason: `rubric ${JSON.stringify(rubricRef)} is uncalibrated (no entry) — recommendation only` };
  const ok = r.calibrated === true && r.bothDirectionPrecisionMet === true && typeof r.goldRef === 'string' && !!r.goldRef.trim();
  return { calibrated: ok, reason: ok ? 'calibrated' : 'rubric not yet calibrated to the both-direction precision threshold — recommendation only' };
}

const SCOPE_FIELDS = ['actionTargetRef', 'state', 'action', 'environment'];
const isStr = (v) => typeof v === 'string' && v.length > 0;
const isObj = (v) => v != null && typeof v === 'object' && !Array.isArray(v);

// Validate the judgments stage shape (closed records).
function validateJudgmentsShape(art) {
  const E = [];
  if (art == null) return E;
  if (!isObj(art)) return ['judgments: must be an object'];
  if (!Array.isArray(art.judgments)) return ['judgments.judgments must be an array'];
  const KEYS = ['judgmentId', 'sc', 'claimFamily', 'targetXpath', 'observationScope', 'rubricRef', 'verdict', 'rationale', 'evidenceRefs', 'confidence'];
  art.judgments.forEach((j, i) => {
    const p = `judgments.judgments[${i}]`;
    if (!isObj(j)) return E.push(`${p}: must be an object`);
    for (const k of Object.keys(j)) if (!KEYS.includes(k)) E.push(`${p}: unknown key ${JSON.stringify(k)}`);
    if (!isStr(j.judgmentId)) E.push(`${p}.judgmentId required`);
    if (!V.ALL_SCS.includes(j.sc)) E.push(`${p}.sc ${JSON.stringify(j.sc)} is not a known SC`);
    if (!isStr(j.targetXpath)) E.push(`${p}.targetXpath required`);
    if (!isStr(j.rubricRef)) E.push(`${p}.rubricRef required`);
    if (!VERDICTS.includes(j.verdict)) E.push(`${p}.verdict must be one of ${VERDICTS.join('|')}`);
    if (j.observationScope != null) { if (!isObj(j.observationScope)) E.push(`${p}.observationScope must be an object`); else for (const f of SCOPE_FIELDS) if (!isStr(j.observationScope[f])) E.push(`${p}.observationScope.${f} must be a non-empty string`); }
  });
  return E;
}

// Bind + classify judgments. Returns { recommendations[], errors[] }. NO judgment is ever
// authoritative here (Phase 3 is not exited): each is an adjudication recommendation, and a judgment
// whose rubric IS calibrated is flagged `eligibleForAuthority` for the future wiring — but still
// emitted as a recommendation. `UNCERTAIN` verdicts are surfaced as unresolved.
function processJudgments(judgmentsArt, rubricReg = RUBRICS) {
  const errors = validateJudgmentsShape(judgmentsArt);
  if (errors.length) return { recommendations: [], errors };
  const recommendations = [];
  for (const j of (judgmentsArt && judgmentsArt.judgments) || []) {
    const cal = rubricState(j.rubricRef, rubricReg);
    recommendations.push({
      judgmentId: j.judgmentId, sc: j.sc, claimFamily: j.claimFamily || null, targetXpath: j.targetXpath,
      observationScope: j.observationScope || null, rubricRef: j.rubricRef, verdict: j.verdict,
      rationale: typeof j.rationale === 'string' ? j.rationale.slice(0, 500) : null,
      status: 'adjudication-recommendation', authoritative: false,
      eligibleForAuthority: cal.calibrated, calibration: cal.reason,
    });
  }
  return { recommendations, errors: [] };
}

module.exports = { VERDICTS, RUBRICS, rubricState, validateJudgmentsShape, processJudgments };
