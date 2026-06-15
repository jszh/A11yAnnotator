// Harness 3.0 — experiment catalog & typed DIRECTIONAL support registry (plan 3.0-A, Rule 4).
//
// Each entry maps an experiment to the SC/direction it can POSITIVELY support, with a separate
// predicate per direction (clearing generally needs more than reproducing). The catalog is the
// SINGLE SOURCE OF TRUTH for directional support; the builder consumes these predicates rather
// than maintaining a parallel mapping. `supports[direction].requires` are typed-outcome flags
// the trusted runner emits; `applicability` is independent of a successful measurement (Rule 15).
'use strict';

const oracle = require('./applicability-oracle.js');

const CATALOG = {
  catalogVersion: '3.0.0-phase0',
  experiments: {
    // ---- Walking-skeleton slice: focus visual retry → 2.4.7 (AT-independent, visual). ----
    'focus-visual-retry': {
      sc: '2.4.7',
      claimFamily: 'focus-indicator-visible', // the ONE assertion this experiment measures (audit V3-C5)
      accessibilitySupportDependent: { BARRIER_OBSERVED: false, NO_BARRIER_OBSERVED: false },
      // applicability must hold regardless of the measured outcome (independent precondition).
      applicability: {
        requires: ['targetIsFocusable', 'keyboardReachableInState'],
      },
      supports: {
        // Cleared only with a focus-DEPENDENT, obviously-visible indicator (not forced/always-on),
        // reached by real keyboard nav on a hydrated page.
        NO_BARRIER_OBSERVED: {
          requires: ['keyboardReachableInState', 'realKeyboardFocus', 'focusDependentIndicator', 'obviouslyVisible', 'hydrationReady'],
        },
        // A barrier (no visible indicator) needs a STABLE absence after real keyboard focus on a
        // hydrated page — under-hydration must not manufacture a false 2.4.7 failure.
        BARRIER_OBSERVED: {
          requires: ['keyboardReachableInState', 'realKeyboardFocus', 'stableIndicatorAbsence', 'hydrationReady', 'modeCompletenessProven'],
        },
      },
      typedOutcomes: [
        'targetIsFocusable', 'keyboardReachableInState', 'realKeyboardFocus', 'hydrationReady',
        'focusDependentIndicator', 'obviouslyVisible', 'stableIndicatorAbsence', 'modeCompletenessProven',
      ],
    },
  },
};

function getExperiment(id) { return CATALOG.experiments[id] || null; }

// Validate catalog shape. Returns errors[].
function validateCatalog(cat = CATALOG) {
  const E = [];
  if (!cat.catalogVersion) E.push('catalog: missing catalogVersion');
  for (const [id, exp] of Object.entries(cat.experiments || {})) {
    if (!exp.sc) E.push(`catalog ${id}: missing sc`);
    // The experiment must name the ONE claim-family it measures, and that family's SC must match
    // the experiment's SC — so evidence can be bound to an atomic (sc, family) obligation.
    if (!exp.claimFamily) E.push(`catalog ${id}: missing claimFamily (the assertion it measures)`);
    else if (!oracle.FAMILIES[exp.claimFamily]) E.push(`catalog ${id}: unknown claimFamily ${JSON.stringify(exp.claimFamily)}`);
    else if (oracle.scForFamily(exp.claimFamily) !== exp.sc) E.push(`catalog ${id}: claimFamily ${exp.claimFamily} is SC ${oracle.scForFamily(exp.claimFamily)} but experiment declares sc ${exp.sc}`);
    if (!exp.supports || !Object.keys(exp.supports).length) E.push(`catalog ${id}: no directional supports`);
    for (const [dir, pred] of Object.entries(exp.supports || {})) {
      if (!pred || !Array.isArray(pred.requires) || !pred.requires.length)
        E.push(`catalog ${id}/${dir}: supports.requires must be a non-empty flag list`);
      // every required flag must be a declared typed outcome of this experiment
      for (const f of (pred && pred.requires) || [])
        if (!(exp.typedOutcomes || []).includes(f)) E.push(`catalog ${id}/${dir}: requires undeclared typed outcome "${f}"`);
    }
    if (!exp.applicability || !Array.isArray(exp.applicability.requires))
      E.push(`catalog ${id}: applicability.requires[] is required (independent of outcome)`);
  }
  return E;
}

// Does the experiment's typed `outcome` positively satisfy the support predicate for `direction`?
// Returns { supported, missing[] }. A flag counts only when STRICTLY true (no truthy coercion).
function supportsDirection(experimentId, direction, outcome, cat = CATALOG) {
  const exp = cat.experiments[experimentId];
  if (!exp) return { supported: false, missing: ['unknown-experiment'] };
  const pred = exp.supports[direction];
  if (!pred) return { supported: false, missing: ['no-support-predicate-for-direction'] };
  const missing = pred.requires.filter((f) => outcome[f] !== true);
  return { supported: missing.length === 0, missing };
}

// Applicability check, independent of the support outcome (Rule 15). The applicability flags
// must come from an independent applicability validator, not the support measurement; here we
// just verify they are all positively present in the supplied applicability evidence. FAIL-CLOSED
// on a malformed catalog entry: an experiment with no declared applicability cannot establish it.
function applicabilityHolds(experimentId, appEvidence, cat = CATALOG) {
  const exp = cat.experiments[experimentId];
  if (!exp) return { holds: false, missing: ['unknown-experiment'] };
  if (!exp.applicability || !Array.isArray(exp.applicability.requires) || !exp.applicability.requires.length)
    return { holds: false, missing: ['applicability-undeclared'] };
  const ev = (appEvidence && typeof appEvidence === 'object') ? appEvidence : {};
  const missing = exp.applicability.requires.filter((f) => ev[f] !== true);
  return { holds: missing.length === 0, missing };
}

// freeze the validated default catalog so it cannot be mutated out from under a later build
Object.values(CATALOG.experiments).forEach((e) => Object.freeze(e));
Object.freeze(CATALOG.experiments); Object.freeze(CATALOG);

module.exports = { CATALOG, getExperiment, validateCatalog, supportsDirection, applicabilityHolds };
