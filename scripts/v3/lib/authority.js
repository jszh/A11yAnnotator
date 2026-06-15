// Harness 3.0 — per-mechanism / per-direction AUTHORITY promotion (plan 3.0-G; audit V3-C2).
//
// A gate-passing claim is NOT automatically publishable. Publication authority is a SEPARATE,
// versioned, per-(experiment, direction) rollout state that the builder consults AFTER every
// evidentiary gate. The default — for any mechanism/direction with no explicit, readiness-backed
// promotion entry — is SHADOW: the would-be claim is recorded for offline scoring against gold but
// is NEVER emitted as authoritative. This is the last fail-closed line: even if an upstream binding
// bug let a wrong claim pass the gates, shadow keeps it out of the authoritative corpus.
//
// A direction reaches `authoritative` only when its readiness evidence is satisfied: a gold set at
// the sizing target, a sealed-test promotion evaluation, independent rater provenance, and a
// validated measurement (the adversarial fixtures pass). Those facts are asserted here per version;
// the gold/sealed machinery (metrics.js + eval-results/v3-gold) supplies the numbers.
'use strict';

const STATES = ['shadow', 'canary', 'authoritative'];

// Default-shadow registry. focus-visual-retry stays shadow in BOTH directions because (a) its gold
// seed (3 cases) is far below the worksheet sizing target (149), and (b) its measurement is only
// just being validated against the transparent-shadow / visible-border adversarial fixtures. The
// barrier direction is shadow too: the audit demonstrated a false-barrier path, so neither
// direction of this mechanism may publish until the measurement and gold gates are met.
const AUTHORITY = Object.freeze({
  'focus-visual-retry/NO_BARRIER_OBSERVED': Object.freeze({
    state: 'shadow',
    reason: 'gold seed (3) below sizing target (149); measurement under adversarial validation — shadow until promotion gates pass.',
    readiness: Object.freeze({ goldSized: false, sealedEval: false, independentRaters: false, measurementValidated: false }),
  }),
  'focus-visual-retry/BARRIER_OBSERVED': Object.freeze({
    state: 'shadow',
    reason: 'a false-barrier measurement path was demonstrated; barrier direction is shadow until the measurement is validated and gold-confirmed.',
    readiness: Object.freeze({ goldSized: false, sealedEval: false, independentRaters: false, measurementValidated: false }),
  }),
});

const key = (experimentId, direction) => `${experimentId}/${direction}`;

// May this (experiment, direction) be published as an AUTHORITATIVE claim?
// FAIL-CLOSED: no entry, an unknown state, or any unmet readiness flag ⇒ shadow (mayPublish:false).
function authorityFor(experimentId, direction, reg = AUTHORITY) {
  const entry = reg[key(experimentId, direction)];
  if (!entry) return { state: 'shadow', mayPublish: false, reason: `no promotion entry for ${experimentId}/${direction} — default-shadow` };
  if (!STATES.includes(entry.state)) return { state: 'shadow', mayPublish: false, reason: `invalid promotion state ${JSON.stringify(entry.state)} — fail-closed to shadow` };
  if (entry.state !== 'authoritative') return { state: entry.state, mayPublish: false, reason: entry.reason || `${entry.state}: not authoritative` };
  // 'authoritative' must be backed by ALL readiness flags — registration is not promotion.
  const r = entry.readiness || {};
  const unmet = ['goldSized', 'sealedEval', 'independentRaters', 'measurementValidated'].filter((f) => r[f] !== true);
  if (unmet.length) return { state: 'shadow', mayPublish: false, reason: `marked authoritative but readiness unmet: ${unmet.join(', ')} — fail-closed to shadow` };
  return { state: 'authoritative', mayPublish: true, reason: entry.reason || 'promoted' };
}

// Validate the authority registry shape (states + readiness booleans). Returns errors[].
function validateAuthority(reg = AUTHORITY) {
  const E = [];
  for (const [k, entry] of Object.entries(reg)) {
    if (!STATES.includes(entry.state)) E.push(`authority ${k}: invalid state ${JSON.stringify(entry.state)}`);
    if (entry.state === 'authoritative') {
      const r = entry.readiness || {};
      for (const f of ['goldSized', 'sealedEval', 'independentRaters', 'measurementValidated'])
        if (typeof r[f] !== 'boolean') E.push(`authority ${k}: authoritative requires boolean readiness.${f}`);
    }
  }
  return E;
}

module.exports = { AUTHORITY, STATES, authorityFor, validateAuthority };
