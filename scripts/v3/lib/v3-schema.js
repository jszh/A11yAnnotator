// Harness 3.0 — core v3 vocabulary (HARNESS-3.0-PLAN.md "V3 claims separate").
// Pure data + tiny helpers. V3 is a CLEAN SCHEMA BREAK: authoritative output carries only
// the v3 triple below — never legacy REPRODUCED/NOT REPRODUCED/N/A labels.
'use strict';

const S2 = require('../../lib/result-schema.js');

// The three orthogonal axes a v3 claim separates (plan Objective).
const OBSERVATION_OUTCOMES = ['BARRIER_OBSERVED', 'NO_BARRIER_OBSERVED', 'INCONCLUSIVE'];
const APPLICABILITY = ['APPLICABLE', 'INAPPLICABLE', 'UNKNOWN'];
const CONFORMANCE = 'NOT_ASSESSED'; // constant; conformance is never assessed by the harness

// WHO produced an observation — a FOURTH orthogonal axis (Harness 3.1 §2). It is a tag, not a new
// observation value and not a new disposition: an `llm` observation is ALWAYS a non-authoritative
// shadow record, scored against gold before any promotion (and even then capped — authority.js).
// Harness 3.3 adds external-checker sources: `axe` (surfaced from the collector's own run, C0) and
// `checker` (a live external engine, e.g. IBM, C1). Both are non-authoritative cross-signals that
// live in the side `checkerFindings` lane, never an obligation disposition (no tie-break — §2).
const EVIDENCE_SOURCES = ['deterministic', 'instrument', 'llm', 'axe', 'checker'];
const LLM_CONFIDENCE = ['low', 'medium', 'high'];

// SINGLE SOURCE OF TRUTH for lifting a v2.9 agent verdict into a v3 observation outcome (3.1 §2.2).
// Critically: `N/A → INCONCLUSIVE` is an ABSTENTION, never `INAPPLICABLE` — applicability is owned by
// the independent oracle (applicability-oracle.js); an LLM may not assert a page is out of scope (H1).
// NOTE: the KEYS here are legacy tokens by construction. This map is an INTERNAL lookup used only to
// translate an offline artifact; it must NEVER be embedded in `results` (build-v3's strict scanner
// rejects a legacy token in any key/value). Only the mapped v3 VALUES ever reach the published output.
const V2_9_VERDICT_MAP = Object.freeze({
  REPRODUCED: 'BARRIER_OBSERVED',
  'NOT REPRODUCED': 'NO_BARRIER_OBSERVED',
  PARTIAL: 'INCONCLUSIVE',
  'N/A': 'INCONCLUSIVE', // abstain (H1) — not an applicability ruling
});
// the rubric verdicts judgments.js emits (a parallel, coarser vocabulary) map the same way.
const RUBRIC_VERDICT_MAP = Object.freeze({
  LIKELY_BARRIER: 'BARRIER_OBSERVED',
  LIKELY_OK: 'NO_BARRIER_OBSERVED',
  UNCERTAIN: 'INCONCLUSIVE',
});

// Normalize a raw verdict (case/space tolerant) to a v3 observation outcome via a chosen map.
// Returns null for an unmappable verdict, so a caller fails closed rather than guessing a direction.
function mapVerdict(verdict, map = V2_9_VERDICT_MAP) {
  if (typeof verdict !== 'string') return null;
  const key = verdict.trim().toUpperCase().replace(/\s+/g, ' ');
  for (const k of Object.keys(map)) if (k.toUpperCase() === key) return map[k];
  return null;
}

// A claim asserts a DIRECTION. INCONCLUSIVE/UNKNOWN are not assertable directions — they map
// to a PARTIAL disposition (the safe sink), never to an authoritative claim.
const DIRECTIONS = ['BARRIER_OBSERVED', 'NO_BARRIER_OBSERVED', 'INAPPLICABLE'];
// CLEARING directions positively assert "no barrier"/"out of scope" and therefore require a
// finite, sound completeness scope AND a clearability class that permits clearing (plan Rule 11).
const CLEARING_DIRECTIONS = ['NO_BARRIER_OBSERVED', 'INAPPLICABLE'];

const CLEARABILITY = ['closed-scope-clearable', 'open-scope-never-clearable', 'exception-clearable'];

// Keyboard-interaction SCs: a clear additionally requires demonstrated keyboard reachability
// in the tested state (plan Rule 14 — atomicity does not license ignoring cross-SC deps).
const KEYBOARD_INTERACTION_SCS = ['2.1.1', '2.1.2', '2.1.4', '2.4.7', '2.4.3'];

// Full SC inventory derived from the existing v2 schema, so the registry must cover exactly
// the SCs the harness actually evaluates (no drift between the two layers).
const ALL_SCS = [...new Set([
  ...Object.values(S2.SKILL_SCS).flat(),
  ...Object.values(S2.PAGE_SKILL_SCS).flat(),
])].sort();

const scKey = (sc, direction) => `${sc}/${direction}`;
const isClearing = (direction) => CLEARING_DIRECTIONS.includes(direction);
const isKeyboardInteractionSc = (sc) => KEYBOARD_INTERACTION_SCS.includes(sc);

// The three ledger disposition tiers (Harness 3.2). Precedence CLAIM ▸ PROVISIONAL ▸ PARTIAL: a
// deterministic CLAIM always wins; a PROVISIONAL fills an otherwise-auto-PARTIAL obligation with a
// calibrated/ungated LLM verdict; PARTIAL is the safe sink. PROVISIONAL is NEVER authoritative.
const DISPOSITIONS = ['CLAIM', 'PROVISIONAL', 'PARTIAL'];

// A PARTIAL disposition — the safe sink. Returned whenever support/completeness/applicability
// is not positively demonstrated. It is NOT an authoritative claim and carries no clear.
function partial(reason, extra = {}) {
  return { disposition: 'PARTIAL', authoritative: false, reason, ...extra };
}

// A PROVISIONAL sub-block (Harness 3.2) — the channel-tagged, STRUCTURED-ONLY record carried on a
// PROVISIONAL ledger row. It is NEVER authoritative and never sets conformance; it only fills an
// obligation the deterministic + instrument lanes left at auto-PARTIAL. Every field is an enum / xpath /
// SC / mechanism / opaque ref / number, so the strict legacy scanner cannot trip — the free-text basis
// stays in the side rationale artifact, referenced by `rationaleRef`. `mode` is 'ungated' (research
// default — the registry is bypassed, `calibrated:false`) or 'gated' (a mechanism earned canary on gold).
function provisional({ source, mechanism, mode, calibrated, outcome, confidence, rationaleRef, evidenceRefs, calibration, conflict, supportRefs }) {
  const block = {
    source: source != null ? String(source) : 'llm',
    mechanism: mechanism != null ? String(mechanism) : 'llm-agent',
    mode: mode === 'gated' ? 'gated' : 'ungated',
    calibrated: calibrated === true,
    outcome, // NO_BARRIER_OBSERVED (provisional clear) | BARRIER_OBSERVED (provisional barrier)
    confidence: LLM_CONFIDENCE.includes(confidence) ? confidence : 'low',
    rationaleRef: rationaleRef != null ? String(rationaleRef) : null,
    evidenceRefs: Array.isArray(evidenceRefs) ? evidenceRefs.map(String) : [],
    calibration: calibration || null,
    supportRefs: Array.isArray(supportRefs) ? supportRefs.map(String) : [],
    authoritative: false,
  };
  if (conflict) block.conflict = conflict; // a clear blocked by a dominating barrier (or vice-versa)
  return block;
}

// An authoritative v3 claim. Carries its observation scope and the NOT_ASSESSED conformance
// marker; the builder refuses to emit anything that lacks these (plan Rule 18).
function claim({ claimId, sc, claimFamily, observationOutcome, wcagApplicability, observationScope, scopeCompletenessRef, supportRefs }) {
  return {
    disposition: 'CLAIM',
    authoritative: true,
    claimId,
    sc,
    claimFamily: claimFamily || null,
    observationOutcome,
    wcagApplicability,
    conformanceOutcome: CONFORMANCE,
    observationScope,
    scopeCompletenessRef: scopeCompletenessRef || null,
    supportRefs: supportRefs || [],
  };
}

// An LLM SHADOW OBSERVATION (3.1 §2.1) — a record of the shape `scoreClears`/`scoreBarriers` already
// consume, tagged `source:'llm'`, ALWAYS non-authoritative. It rides results.shadowObservations as a
// pure ANNOTATION: it never enters obligation reconciliation, so the obligation's disposition is
// untouched (it stays auto-PARTIAL when no deterministic CLAIM exists). STRUCTURED-ONLY — every field
// is an enum / xpath / SC code / opaque id; no agent free text (that lives in the side rationale
// artifact, referenced by `rationaleRef`), so the strict legacy-token scanner can never trip on it.
const _SCOPE_FIELDS = ['actionTargetRef', 'state', 'action', 'environment'];
function llmShadowObservation({ sc, claimFamily, observationScope, observationOutcome, wcagApplicability, mechanism, confidence, evidenceRefs, decisionCoverageRef, rationaleRef }) {
  // COERCE every agent-controlled string to a primitive (a boxed `new String('N/A')` is typeof 'object'
  // and evades the strict legacy scanner but serializes to the bare token) and rebuild the scope from
  // ONLY the known fields, so nothing extra rides into the published record (defense-in-depth; the
  // lane validators already reject a legacy token in any of these fields before we reach here).
  let scope = null;
  if (observationScope && typeof observationScope === 'object') {
    scope = {};
    for (const f of _SCOPE_FIELDS) if (observationScope[f] != null) scope[f] = String(observationScope[f]);
  }
  return {
    source: 'llm',
    mechanism: mechanism != null ? String(mechanism) : 'llm-agent',
    sc,
    claimFamily: claimFamily != null ? String(claimFamily) : null,
    observationScope: scope,
    wouldBe: {
      observationOutcome,
      wcagApplicability: wcagApplicability || (observationOutcome === 'INCONCLUSIVE' ? 'UNKNOWN' : 'APPLICABLE'),
    },
    confidence: LLM_CONFIDENCE.includes(confidence) ? confidence : 'low',
    evidenceRefs: Array.isArray(evidenceRefs) ? evidenceRefs.map(String) : [],
    decisionCoverageRef: decisionCoverageRef != null ? String(decisionCoverageRef) : null,
    rationaleRef: rationaleRef != null ? String(rationaleRef) : null,
  };
}

module.exports = {
  OBSERVATION_OUTCOMES, APPLICABILITY, CONFORMANCE, DIRECTIONS, CLEARING_DIRECTIONS,
  CLEARABILITY, KEYBOARD_INTERACTION_SCS, ALL_SCS, DISPOSITIONS,
  EVIDENCE_SOURCES, LLM_CONFIDENCE, V2_9_VERDICT_MAP, RUBRIC_VERDICT_MAP, mapVerdict,
  scKey, isClearing, isKeyboardInteractionSc, partial, claim, provisional, llmShadowObservation,
};
