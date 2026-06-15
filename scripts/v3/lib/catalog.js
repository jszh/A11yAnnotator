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

    // ---- C3: text contrast → 1.4.3 (AT-independent; CLEAR over a flat opaque backdrop). ----
    'text-contrast-pixel': {
      sc: '1.4.3', claimFamily: 'text-contrast',
      accessibilitySupportDependent: { BARRIER_OBSERVED: false, NO_BARRIER_OBSERVED: false },
      applicability: { requires: ['isTextNode', 'textRendersVisible', 'sizeClassResolved'] },
      supports: {
        NO_BARRIER_OBSERVED: { requires: ['textRendersVisible', 'foregroundResolved', 'backgroundResolved', 'backdropIsSolidUniform', 'contrastComputable', 'sizeClassResolved', 'thresholdMet', 'notExemptText', 'measurementStable'] },
        BARRIER_OBSERVED: { requires: ['isTextNode', 'textRendersVisible', 'foregroundResolved', 'backgroundResolved', 'contrastComputable', 'sizeClassResolved', 'thresholdFailed', 'notExemptText', 'measurementStable'] },
      },
      typedOutcomes: ['isTextNode', 'textRendersVisible', 'foregroundResolved', 'backgroundResolved', 'backdropIsSolidUniform', 'contrastComputable', 'sizeClassResolved', 'thresholdMet', 'thresholdFailed', 'notExemptText', 'measurementStable', 'hydrationReady'],
    },

    // ---- C5: keyboard trap escape → 2.1.2 (CLEAR per-component; finite mechanism set). ----
    'keyboard-trap-escape': {
      sc: '2.1.2', claimFamily: 'no-keyboard-trap',
      // cost (plan Rule 8): many Tab/Shift+Tab/Esc presses + an advised-key probe ⇒ longer wall-clock;
      // it activates keys on a focus-trapping region ⇒ HIGH mutation risk ⇒ always a fresh isolated page.
      cost: { maxWallClockMs: 30000, retries: 1, mutationRisk: 'high' },
      accessibilitySupportDependent: { BARRIER_OBSERVED: false, NO_BARRIER_OBSERVED: false },
      applicability: { requires: ['targetIsFocusable', 'keyboardReachableInState'] },
      supports: {
        NO_BARRIER_OBSERVED: { requires: ['keyboardReachableInState', 'focusEnteredRegion', 'escapeProvenForWidget', 'focusStaysInDocument', 'hydrationReady'] },
        BARRIER_OBSERVED: { requires: ['keyboardReachableInState', 'focusEnteredRegion', 'trapProven', 'focusStaysInDocument', 'hydrationReady'] },
      },
      typedOutcomes: ['targetIsFocusable', 'keyboardReachableInState', 'focusEnteredRegion', 'escapeProvenForWidget', 'trapProven', 'focusStaysInDocument', 'hydrationReady'],
    },

    // ---- C6: field label → 3.3.2 (CLEAR for the label sub-claim; AT-dependent). ----
    'field-label-probe': {
      sc: '3.3.2', claimFamily: 'field-label',
      accessibilitySupportDependent: { BARRIER_OBSERVED: false, NO_BARRIER_OBSERVED: true },
      applicability: { requires: ['isUserInputField', 'fieldRendered'] },
      supports: {
        NO_BARRIER_OBSERVED: { requires: ['isUserInputField', 'fieldRendered', 'hydrationReady', 'programmaticNamePresent', 'visibleLabelText'] },
        BARRIER_OBSERVED: { requires: ['isUserInputField', 'fieldRendered', 'hydrationReady', 'fieldLabelBarrier'] },
      },
      typedOutcomes: ['isUserInputField', 'fieldRendered', 'hydrationReady', 'programmaticNamePresent', 'visibleLabelText', 'fieldLabelBarrier'],
    },

    // ---- C6b: form error identification → 3.3.1 (BARRIER-ONLY). ----
    'form-error-probe': {
      sc: '3.3.1', claimFamily: 'error-identification',
      cost: { maxWallClockMs: 25000, retries: 1, mutationRisk: 'high' }, // sets invalid input + attempts submit
      accessibilitySupportDependent: { BARRIER_OBSERVED: true }, // whether an error is "identified" is AT-relevant
      applicability: { requires: ['isUserInputField', 'fieldRendered', 'fieldConstrained'] },
      supports: {
        BARRIER_OBSERVED: { requires: ['isUserInputField', 'fieldRendered', 'fieldConstrained', 'hydrationReady', 'errorNotIdentified'] },
      },
      typedOutcomes: ['isUserInputField', 'fieldRendered', 'fieldConstrained', 'hydrationReady', 'errorNotIdentified'],
    },

    // ---- C4: keyboard activation → 2.1.1 (CLEAR only for finite-contract single-mode controls). ----
    'keyboard-activation': {
      sc: '2.1.1', claimFamily: 'keyboard-operable',
      cost: { maxWallClockMs: 25000, retries: 1, mutationRisk: 'high' }, // real Enter/Space activation mutates state (Rule 8)
      accessibilitySupportDependent: { BARRIER_OBSERVED: false, NO_BARRIER_OBSERVED: false },
      applicability: { requires: ['targetIsInteractive', 'targetIsFocusable', 'hydrationReady'] },
      supports: {
        NO_BARRIER_OBSERVED: { requires: ['hydrationReady', 'keyboardReachableInState', 'reachedForActivation', 'contractKeysAllOperated', 'observableEffectStable', 'realKeyDistinctFromSynthetic', 'singleModeControl', 'modeInventoryClosed'] },
        BARRIER_OBSERVED: { requires: ['hydrationReady', 'targetIsInteractive', 'reachedForActivation', 'noKeyEffectStable'] },
      },
      typedOutcomes: ['targetIsInteractive', 'targetIsFocusable', 'hydrationReady', 'keyboardReachableInState', 'reachedForActivation', 'contractKeysAllOperated', 'observableEffectStable', 'realKeyDistinctFromSynthetic', 'singleModeControl', 'modeInventoryClosed', 'noKeyEffectStable'],
    },

    // ---- C1: activation AX-tree diff → 4.1.2 (CLEAR for closed ARIA state set; AT-dependent). ----
    'ax-state-diff': {
      sc: '4.1.2', claimFamily: 'name-role-value',
      cost: { maxWallClockMs: 25000, retries: 1, mutationRisk: 'high' }, // activates the control to diff AX state (Rule 8)
      accessibilitySupportDependent: { BARRIER_OBSERVED: false, NO_BARRIER_OBSERVED: true },
      applicability: { requires: ['targetHasWidgetRole', 'hydrationReady', 'axNodeResolved'] },
      supports: {
        NO_BARRIER_OBSERVED: { requires: ['hydrationReady', 'axNodeResolved', 'axRolePresentAndExpected', 'axNamePresent', 'axNameNotFromError', 'axStatePropertyExposed', 'axStateChanged', 'axDomAgree', 'axDiffStable', 'activationWasReal', 'noNavigation', 'statesInventoryClosed'] },
        BARRIER_OBSERVED: { requires: ['hydrationReady', 'axNodeResolved', 'activationWasReal', 'noNavigation', 'nrvDefectStable'] },
      },
      typedOutcomes: ['targetHasWidgetRole', 'hydrationReady', 'axNodeResolved', 'axRolePresentAndExpected', 'axNamePresent', 'axNameNotFromError', 'axStatePropertyExposed', 'axStateChanged', 'axDomAgree', 'axDiffStable', 'activationWasReal', 'noNavigation', 'statesInventoryClosed', 'nrvDefectStable'],
    },

    // ---- C9: content on hover/focus → 1.4.13 (BARRIER-ONLY). ----
    'hover-content-tri': {
      sc: '1.4.13', claimFamily: 'hover-content',
      cost: { maxWallClockMs: 30000, retries: 1, mutationRisk: 'low' }, // ~1.6s persistent dwell + rehover (Rule 8)
      accessibilitySupportDependent: { BARRIER_OBSERVED: false },
      applicability: { requires: ['hasHoverFocusTrigger', 'triggerReachable'] },
      supports: {
        BARRIER_OBSERVED: { requires: ['hasHoverFocusTrigger', 'triggerReachable', 'appearingContentDetected', 'contentIsAdditional', 'contentAppeared', 'anyPropertyFails', 'measurementDeterministic'] },
      },
      typedOutcomes: ['hasHoverFocusTrigger', 'triggerReachable', 'appearingContentDetected', 'contentIsAdditional', 'contentAppeared', 'anyPropertyFails', 'measurementDeterministic', 'dismissible', 'hoverable', 'persistent'],
    },

    // ---- C8: reflow at 320px → 1.4.10 (BARRIER-ONLY, page-level). ----
    'reflow-overflow-probe': {
      sc: '1.4.10', claimFamily: 'reflow-no-hscroll',
      accessibilitySupportDependent: { BARRIER_OBSERVED: false },
      applicability: { requires: ['pageRenders', 'viewportSet320'] },
      supports: {
        BARRIER_OBSERVED: { requires: ['viewportSet320', 'hydrationReady', 'reflowSettled', 'horizontalScrollPresent', 'overflowSourceLocated', 'overflowBarrierObserved'] },
      },
      typedOutcomes: ['pageRenders', 'viewportSet320', 'hydrationReady', 'reflowSettled', 'horizontalScrollPresent', 'overflowSourceLocated', 'allOverflowExemptOr2D', 'clipHidingDetected', 'overflowBarrierObserved', 'noHorizontalScrollClear'],
    },

    // ---- C7: focus not obscured → 2.4.11 (BARRIER-ONLY). ----
    'focus-obscured-barrier': {
      sc: '2.4.11', claimFamily: 'focus-not-obscured',
      accessibilitySupportDependent: { BARRIER_OBSERVED: false },
      applicability: { requires: ['targetIsFocusable', 'keyboardReachableInState'] },
      supports: {
        BARRIER_OBSERVED: { requires: ['keyboardReachableInState', 'realKeyboardFocus', 'focusedRectResolved', 'entirelyObscuredByAuthorContent', 'obscuringLayerOpaqueAndBlocking', 'hydrationReady'] },
      },
      typedOutcomes: ['targetIsFocusable', 'keyboardReachableInState', 'realKeyboardFocus', 'focusedRectResolved', 'overlayLayerPresent', 'entirelyObscuredByAuthorContent', 'obscuringLayerOpaqueAndBlocking', 'notObscuredAfterScroll', 'hydrationReady'],
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
