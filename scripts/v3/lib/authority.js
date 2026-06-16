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
// the gold/sealed machinery (metrics.js + eval/gold/v3) supplies the numbers.
'use strict';

const STATES = ['shadow', 'canary', 'authoritative'];
const READINESS_FLAGS = ['goldSized', 'sealedEval', 'independentRaters', 'measurementValidated'];
// A promoted mechanism must NAME the provenance-bearing artifacts its readiness rests on, so a
// promotion cannot be a bare boolean assertion (audit V3R2-H7). Hash verification of these artifacts
// against on-disk files is a further step (documented in the gold README); naming them is the floor.
const PROVENANCE_REFS = ['goldRef', 'sealedRef', 'raterRef', 'measurementSuiteHash'];

// LLM MECHANISMS (Harness 3.1 §4/§6) are a STRICTER, CAPPED class. The whole-obligation agent
// (`llm-agent`) and every atomic rubric (`llm-rubric:<id>`) promote through THIS one gate — there is
// no parallel registry. But an LLM calibrated on gold does NOT generalize to unseen pages the way
// fixed deterministic code does (H4), so an LLM mechanism is CAPPED at `canary` and can never publish
// authoritative. A `canary` LLM promotion additionally requires model+prompt version pinning (H5),
// gold-blinding provenance (H3), and a mandatory sealed/held-out eval (H4) — stricter than a
// deterministic promotion. Default (no entry) is `shadow`, exactly like any other mechanism.
const LLM_PROVENANCE_REFS = ['modelRef', 'promptHash', 'goldBlindedRef'];
const MAX_LLM_STATE = 'canary';
const mechanismOf = (key) => { const i = key.lastIndexOf('/'); return i > 0 ? key.slice(0, i) : key; };
const isLlmMechanism = (experimentId) => experimentId === 'llm-agent' || (typeof experimentId === 'string' && experimentId.startsWith('llm-rubric:'));

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
  // LLM mechanisms cap at canary — they never publish authoritative (3.1 §4/H4). A config that marks
  // one 'authoritative' fails closed here (and validateAuthority rejects the registry outright).
  if (isLlmMechanism(experimentId) && entry.state === 'authoritative')
    return { state: 'shadow', mayPublish: false, reason: `${experimentId} is an LLM mechanism — capped at ${MAX_LLM_STATE}; cannot publish authoritative (3.1 §4/H4)` };
  if (entry.state !== 'authoritative') return { state: entry.state, mayPublish: false, reason: entry.reason || `${entry.state}: not authoritative` };
  // 'authoritative' must be backed by ALL readiness flags as OWN booleans — registration is not
  // promotion, and an inherited (prototype-chain) flag does not count (audit R2-L2).
  const r = entry.readiness || {};
  const own = (f) => Object.prototype.hasOwnProperty.call(r, f) && r[f] === true;
  const unmet = READINESS_FLAGS.filter((f) => !own(f));
  if (unmet.length) return { state: 'shadow', mayPublish: false, reason: `marked authoritative but readiness unmet: ${unmet.join(', ')} — fail-closed to shadow` };
  // readiness booleans must be backed by NAMED provenance artifacts (audit V3R2-H7).
  const prov = entry.provenance || {};
  const noProv = PROVENANCE_REFS.filter((f) => typeof prov[f] !== 'string' || !prov[f].trim());
  if (noProv.length) return { state: 'shadow', mayPublish: false, reason: `marked authoritative but provenance refs missing: ${noProv.join(', ')} — fail-closed to shadow` };
  return { state: 'authoritative', mayPublish: true, reason: entry.reason || 'promoted' };
}

// Are this promotion's NAMED provenance artifacts independently VERIFIED (audit V3R3-C1/M1)?
// `verifier(name, ref, expectedHash) -> boolean` resolves a ref to bytes and checks its hash. When
// no verifier is configured the named-ref floor (authorityFor, above) is all that applies; when one
// IS configured (the production CLI's on-disk verifier), EVERY provenance ref must verify with its
// declared hash, so a promotion cannot rest on a fictional reference. FAIL-CLOSED on a bad shape.
function provenanceArtifactsVerified(experimentId, direction, reg = AUTHORITY, verifier = null) {
  if (!verifier) return true; // named-ref floor only (no on-disk anchor supplied)
  const entry = reg[key(experimentId, direction)];
  if (!entry || entry.state !== 'authoritative') return false;
  const prov = entry.provenance || {};
  const hashes = entry.provenanceHashes || {};
  return PROVENANCE_REFS.every((f) => { try { return verifier(f, prov[f], hashes[f]) === true; } catch (e) { return false; } });
}

// Validate the authority registry shape (states + readiness booleans). Returns errors[].
function validateAuthority(reg = AUTHORITY) {
  const E = [];
  for (const [k, entry] of Object.entries(reg)) {
    if (!STATES.includes(entry.state)) E.push(`authority ${k}: invalid state ${JSON.stringify(entry.state)}`);
    // LLM mechanisms (3.1 §4/§6): capped at canary; a canary promotion carries STRICTER provenance.
    if (isLlmMechanism(mechanismOf(k))) {
      if (entry.state === 'authoritative') E.push(`authority ${k}: an LLM mechanism cannot be 'authoritative' — capped at ${MAX_LLM_STATE} (3.1 §4/H4)`);
      if (entry.state === 'canary') {
        const r = entry.readiness || {};
        if (!(Object.prototype.hasOwnProperty.call(r, 'sealedEval') && r.sealedEval === true)) E.push(`authority ${k}: an LLM canary promotion requires readiness.sealedEval === true (mandatory held-out eval, H4)`);
        const prov = entry.provenance || {};
        for (const f of LLM_PROVENANCE_REFS)
          if (typeof prov[f] !== 'string' || !prov[f].trim()) E.push(`authority ${k}: an LLM canary promotion requires provenance.${f} (model/prompt pinning + gold-blinding, H3/H5)`);
      }
    }
    if (entry.state === 'authoritative') {
      const r = entry.readiness || {};
      for (const f of READINESS_FLAGS)
        if (!Object.prototype.hasOwnProperty.call(r, f) || typeof r[f] !== 'boolean') E.push(`authority ${k}: authoritative requires an OWN boolean readiness.${f}`);
      const prov = entry.provenance || {};
      for (const f of PROVENANCE_REFS)
        if (typeof prov[f] !== 'string' || !prov[f].trim()) E.push(`authority ${k}: authoritative requires provenance.${f} (a named artifact reference)`);
    }
  }
  return E;
}

module.exports = { AUTHORITY, STATES, authorityFor, validateAuthority, provenanceArtifactsVerified, PROVENANCE_REFS, LLM_PROVENANCE_REFS, MAX_LLM_STATE, isLlmMechanism, mechanismOf };
