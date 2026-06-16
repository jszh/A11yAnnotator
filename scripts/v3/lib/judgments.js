// Harness 3.0/3.1 — semantic judgment skills (plan 3.0-D, Phase 3, Rule 6; 3.1 §3b unify M1).
//
// Some SCs need MEANING (alt-text adequacy, error-message helpfulness, instruction clarity) that no
// deterministic experiment can decide. A SKILL (an untrusted LLM agent with a rubric) produces a
// `judgments.json` artifact. This module binds + verdict-maps those atomic judgments — but it no
// longer owns CALIBRATION. Under the 3.1 unify, EVERY LLM opinion (the whole-obligation agent AND
// each atomic rubric) promotes through the SINGLE gate in authority.js. So a judgment is emitted as a
// `source:'llm'`, `mechanism:'llm-rubric:<rubricRef>'` SHADOW observation: non-authoritative by
// construction, scored against gold per-mechanism before any promotion, and even then capped at
// `canary` (authority.js). The parallel `RUBRICS` registry that used to live here is DELETED — there
// is one review queue and one calibration gate. Ambiguous judgments (`UNCERTAIN`) map to INCONCLUSIVE.
'use strict';

const V = require('./v3-schema.js');

const VERDICTS = ['LIKELY_BARRIER', 'LIKELY_OK', 'UNCERTAIN'];
const LEGACY = new Set(['REPRODUCED', 'NOT REPRODUCED', 'N/A']);
const isLegacyToken = (s) => s != null && LEGACY.has(String(s).trim().toUpperCase().replace(/\s+/g, ' '));
const scrubRefs = (refs) => (Array.isArray(refs) ? refs.map(String).filter((r) => !isLegacyToken(r)) : []);
const rejectLegacy = (E, p, field, val) => { if (val != null && isLegacyToken(val)) E.push(`${p}.${field} must not be a legacy verdict token ${JSON.stringify(String(val))} (v3 schema break)`); };

const SCOPE_FIELDS = ['actionTargetRef', 'state', 'action', 'environment'];
const isStr = (v) => typeof v === 'string' && v.length > 0;
const isObj = (v) => v != null && typeof v === 'object' && !Array.isArray(v);

// Validate the judgments stage shape (closed records).
function validateJudgmentsShape(art) {
  const E = [];
  if (art == null) return E;
  if (!isObj(art)) return ['judgments: must be an object'];
  if (!Array.isArray(art.judgments)) return ['judgments.judgments must be an array'];
  // `rationale`/`summary`/`reasoning` are the free-text ANNOTATION COMPANION (1 sentence each): they
  // stay in this lenient-scanned artifact and are NEVER copied into strict `results` (processJudgments
  // emits only structured shadow obs + a rationaleRef back to here), so a hand-annotator can review the
  // verdict against its basis. Mirrors the agent lane's llm-rationale artifact.
  const KEYS = ['judgmentId', 'sc', 'claimFamily', 'targetXpath', 'observationScope', 'rubricRef', 'verdict', 'rationale', 'summary', 'reasoning', 'evidenceRefs', 'confidence'];
  art.judgments.forEach((j, i) => {
    const p = `judgments.judgments[${i}]`;
    if (!isObj(j)) return E.push(`${p}: must be an object`);
    for (const k of Object.keys(j)) if (!KEYS.includes(k)) E.push(`${p}: unknown key ${JSON.stringify(k)}`);
    if (!isStr(j.judgmentId)) E.push(`${p}.judgmentId required`);
    if (!V.ALL_SCS.includes(j.sc)) E.push(`${p}.sc ${JSON.stringify(j.sc)} is not a known SC`);
    if (!isStr(j.targetXpath)) E.push(`${p}.targetXpath required`);
    if (!isStr(j.rubricRef)) E.push(`${p}.rubricRef required`);
    if (!VERDICTS.includes(j.verdict)) E.push(`${p}.verdict must be one of ${VERDICTS.join('|')}`);
    if (j.observationScope != null) { if (!isObj(j.observationScope)) E.push(`${p}.observationScope must be an object`); else for (const f of SCOPE_FIELDS) { if (!isStr(j.observationScope[f])) E.push(`${p}.observationScope.${f} must be a non-empty string`); else rejectLegacy(E, `${p}.observationScope`, f, j.observationScope[f]); } }
    // structural strings that reach results may never be a legacy token (boxed wrappers are coerced).
    for (const f of ['judgmentId', 'targetXpath', 'rubricRef', 'claimFamily']) rejectLegacy(E, p, f, j[f]);
  });
  return E;
}

// Bind + verdict-map judgments into `source:'llm'` SHADOW observations (3.1 unify). Returns
// { shadowObservations[], errors[] }. STRUCTURED-ONLY: the verdict is lifted to a v3 outcome via
// RUBRIC_VERDICT_MAP; the free-text rationale is NOT echoed into the record (it stays in the bundle's
// judgments artifact, referenced by `rationaleRef = judgmentId`), so nothing the strict scanner sees
// in `results` carries agent prose. `UNCERTAIN → INCONCLUSIVE` (never clears/barriers). Each record's
// mechanism is `llm-rubric:<rubricRef>`, so a per-rubric reliability is calibrated independently in
// authority.js — never pooled with the whole-obligation agent or another rubric.
function processJudgments(judgmentsArt) {
  const errors = validateJudgmentsShape(judgmentsArt);
  if (errors.length) return { shadowObservations: [], errors };
  const shadowObservations = [];
  for (const j of (judgmentsArt && judgmentsArt.judgments) || []) {
    const outcome = V.mapVerdict(j.verdict, V.RUBRIC_VERDICT_MAP);
    if (outcome == null) { errors.push(`judgment verdict ${JSON.stringify(j.verdict)} is not mappable to a v3 outcome`); continue; }
    shadowObservations.push(V.llmShadowObservation({
      sc: j.sc, claimFamily: j.claimFamily || null,
      observationScope: j.observationScope || { actionTargetRef: j.targetXpath },
      observationOutcome: outcome,
      wcagApplicability: outcome === 'INCONCLUSIVE' ? 'UNKNOWN' : 'APPLICABLE',
      mechanism: `llm-rubric:${j.rubricRef}`,
      confidence: j.confidence,
      evidenceRefs: scrubRefs(j.evidenceRefs),
      rationaleRef: j.judgmentId,
    }));
  }
  return { shadowObservations, errors };
}

module.exports = { VERDICTS, validateJudgmentsShape, processJudgments };
