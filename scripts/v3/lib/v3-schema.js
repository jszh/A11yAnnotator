// Harness 3.0 — core v3 vocabulary (HARNESS-3.0-PLAN.md "V3 claims separate").
// Pure data + tiny helpers. V3 is a CLEAN SCHEMA BREAK: authoritative output carries only
// the v3 triple below — never legacy REPRODUCED/NOT REPRODUCED/N/A labels.
'use strict';

const S2 = require('../../lib/result-schema.js');

// The three orthogonal axes a v3 claim separates (plan Objective).
const OBSERVATION_OUTCOMES = ['BARRIER_OBSERVED', 'NO_BARRIER_OBSERVED', 'INCONCLUSIVE'];
const APPLICABILITY = ['APPLICABLE', 'INAPPLICABLE', 'UNKNOWN'];
const CONFORMANCE = 'NOT_ASSESSED'; // constant; conformance is never assessed by the harness

// A claim asserts a DIRECTION. INCONCLUSIVE/UNKNOWN are not assertable directions — they map
// to a PARTIAL disposition (the safe sink), never to an authoritative claim.
const DIRECTIONS = ['BARRIER_OBSERVED', 'NO_BARRIER_OBSERVED', 'INAPPLICABLE'];
// CLEARING directions positively assert "no barrier"/"out of scope" and therefore require a
// finite, sound completeness scope AND a clearability class that permits clearing (plan Rule 11).
const CLEARING_DIRECTIONS = ['NO_BARRIER_OBSERVED', 'INAPPLICABLE'];

const CLEARABILITY = ['closed-scope-clearable', 'open-scope-never-clearable', 'exception-clearable'];

// Keyboard-interaction SCs: a clear additionally requires demonstrated keyboard reachability
// in the tested state (plan Rule 14 — atomicity does not license ignoring cross-SC deps).
const KEYBOARD_INTERACTION_SCS = ['2.1.1', '2.4.7', '2.4.3'];

// Full SC inventory derived from the existing v2 schema, so the registry must cover exactly
// the SCs the harness actually evaluates (no drift between the two layers).
const ALL_SCS = [...new Set([
  ...Object.values(S2.SKILL_SCS).flat(),
  ...Object.values(S2.PAGE_SKILL_SCS).flat(),
])].sort();

const scKey = (sc, direction) => `${sc}/${direction}`;
const isClearing = (direction) => CLEARING_DIRECTIONS.includes(direction);
const isKeyboardInteractionSc = (sc) => KEYBOARD_INTERACTION_SCS.includes(sc);

// A PARTIAL disposition — the safe sink. Returned whenever support/completeness/applicability
// is not positively demonstrated. It is NOT an authoritative claim and carries no clear.
function partial(reason, extra = {}) {
  return { disposition: 'PARTIAL', authoritative: false, reason, ...extra };
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

module.exports = {
  OBSERVATION_OUTCOMES, APPLICABILITY, CONFORMANCE, DIRECTIONS, CLEARING_DIRECTIONS,
  CLEARABILITY, KEYBOARD_INTERACTION_SCS, ALL_SCS,
  scKey, isClearing, isKeyboardInteractionSc, partial, claim,
};
