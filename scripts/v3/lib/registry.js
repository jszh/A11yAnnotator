// Harness 3.0 — schema-validated clearability / completeness / accessibility-support REGISTRY
// (plan Rules 11 & 12; Asymmetric-Promotion "classify every SC/verdict direction").
//
// DEFAULT-CLOSED: a CLEARING direction (NO_BARRIER_OBSERVED / INAPPLICABLE) may publish ONLY
// when this registry carries an explicit `closed-scope-clearable` OR `exception-clearable` entry
// with a finite completeness predicate. A missing / `open-scope-never-clearable` / malformed
// entry means the direction CANNOT clear. Lookups are FAIL-CLOSED: an unknown clearability value
// is refused, not allowed (whitelist, not blacklist).
//
// Completeness obligations are TYPED-OUTCOME flag names (same namespace as catalog typedOutcomes),
// and validateConsistency() proves every completeness obligation is actually measured by the
// supporting experiment — closing the registry/catalog drift.
'use strict';

const V = require('./v3-schema.js');

// SCs whose CLEARING relies on accessibility support (Rule 12): a clear is meaningful only
// relative to a declared AT baseline. Visual/in-browser SCs are AT-INDEPENDENT (false).
const AT_DEPENDENT_CLEAR = new Set(['1.1.1', '4.1.2', '4.1.3', '1.3.1', '1.3.2', '2.4.4', '2.4.6', '2.4.10', '2.5.3', '3.3.1', '3.3.2', '3.3.3']);

// EXPLICIT, reasoned entries. Everything else is auto-filled `open-scope-never-clearable` below,
// so default-closed is COMPLETE and explicit — never an accidental omission.
const EXPLICIT = {
  // ---- 2.4.7 Focus Visible (AA) — walking-skeleton slice. AT-INDEPENDENT (visual). ----
  '2.4.7/BARRIER_OBSERVED': {
    clearability: 'open-scope-never-clearable', // informational for the barrier dir (no completeness needed to assert a barrier)
    accessibilitySupportDependent: false,
    rationale: 'A reproduced "no visible focus indicator" is a positive observation; no completeness proof needed to assert a barrier.',
  },
  '2.4.7/NO_BARRIER_OBSERVED': {
    clearability: 'closed-scope-clearable',
    accessibilitySupportDependent: false,
    completeness: {
      resolver: 'focus-visible-completeness-v1',
      requiredObligations: ['keyboardReachableInState', 'realKeyboardFocus', 'focusDependentIndicator', 'obviouslyVisible', 'hydrationReady'],
      derivation: 'docs/completeness/2.4.7.md',
    },
    rationale: 'Cleared only with a focus-DEPENDENT, obviously-visible indicator reached by real keyboard nav on a hydrated page; forced/always-on styling and under-hydration do not clear.',
  },
  // ---- C3: 1.4.3 Text Contrast (AA) — CLEARABLE over a flat opaque backdrop. AT-independent. ----
  '1.4.3/NO_BARRIER_OBSERVED': {
    clearability: 'closed-scope-clearable', accessibilitySupportDependent: false,
    completeness: {
      resolver: 'all-true-completeness-v1',
      requiredObligations: ['textRendersVisible', 'foregroundResolved', 'backgroundResolved', 'backdropIsSolidUniform', 'contrastComputable', 'sizeClassResolved', 'thresholdMet', 'notExemptText', 'measurementStable'],
      derivation: 'docs/completeness/1.4.3.md',
    },
    rationale: 'Cleared only for opaque flat foreground over a single opaque flat backdrop (contrast is then a finite decidable ratio ≥ threshold). Image/gradient backdrops cannot clear; channel disagreement or animation ⇒ INCONCLUSIVE.',
  },
  '1.4.3/BARRIER_OBSERVED': { clearability: 'open-scope-never-clearable', accessibilitySupportDependent: false, rationale: 'A text run whose worst-case sampled contrast is below threshold is a positive observation; no completeness needed.' },

  // ---- C5: 2.1.2 No Keyboard Trap (A) — CLEARABLE per-component (finite escape-mechanism set). ----
  '2.1.2/NO_BARRIER_OBSERVED': {
    clearability: 'closed-scope-clearable', accessibilitySupportDependent: false,
    completeness: {
      resolver: 'all-true-completeness-v1',
      requiredObligations: ['keyboardReachableInState', 'focusEnteredRegion', 'escapeProvenForWidget', 'focusStaysInDocument', 'hydrationReady'],
      derivation: 'docs/completeness/2.1.2.md',
    },
    rationale: 'Per-component: focus entered the region by real keyboard and left via a real mechanism (Tab/Shift+Tab/Esc) without escaping to browser chrome. The mechanism set is finite ⇒ decidable. One-way traps / focus loss ⇒ INCONCLUSIVE.',
  },
  '2.1.2/BARRIER_OBSERVED': { clearability: 'open-scope-never-clearable', accessibilitySupportDependent: false, rationale: 'A reproduced trap (focus cycles, no mechanism escapes) is a positive observation; no completeness needed.' },

  // ---- Broad-scope: 2.1.4 Character Key Shortcuts (A) — BARRIER-ONLY. ----
  '2.1.4/NO_BARRIER_OBSERVED': { clearability: 'open-scope-never-clearable', accessibilitySupportDependent: false, rationale: 'A scoped clean shortcut probe cannot prove the absence of other page/application single-character shortcuts or all exception mechanisms. Controls and absence stay UNCERTAIN.' },
  '2.1.4/BARRIER_OBSERVED': { clearability: 'open-scope-never-clearable', accessibilitySupportDependent: false, rationale: 'A trusted single printable character key that changes page state outside a focused component, with no observed off/remap/focus-only exception, is a positive barrier observation; no completeness needed.' },

  // ---- C6: 3.3.2 Labels or Instructions (A) — CLEARABLE for the label sub-claim. AT-dependent. ----
  '3.3.2/NO_BARRIER_OBSERVED': {
    clearability: 'closed-scope-clearable', accessibilitySupportDependent: true,
    completeness: {
      resolver: 'all-true-completeness-v1',
      requiredObligations: ['isUserInputField', 'fieldRendered', 'hydrationReady', 'programmaticNamePresent', 'visibleLabelText'],
      derivation: 'docs/completeness/3.3.2.md',
    },
    rationale: 'Cleared only for the LABEL sub-claim: a rendered field with a non-placeholder programmatic name AND a co-located visible label. Format-instruction sufficiency is OUT OF SCOPE and never cleared here.',
  },
  '3.3.2/BARRIER_OBSERVED': { clearability: 'open-scope-never-clearable', accessibilitySupportDependent: true, rationale: 'A rendered field with no programmatic name, or a placeholder masquerading as a label, is a positive observation; no completeness needed.' },

  // ---- C4: 2.1.1 Keyboard (A) — BARRIER-ONLY. Clearing authority WITHDRAWN (audit V3R4-H3). ----
  // "All functionality" (SC 2.1.1) cannot be proven keyboard-operable from markup: a native control
  // may carry pointer-only secondary functionality (ondblclick / oncontextmenu / addEventListener)
  // the runner cannot observe, so `singleModeControl`/`modeInventoryClosed` inferred from tag/role is
  // not a sound closed mode inventory. 2.1.1 stays barrier-only until a genuinely closed functionality
  // contract can be independently established (or the claim is narrowed to a positively-observed
  // activation function). A reached control where NO real key produced any effect is still a barrier.
  '2.1.1/NO_BARRIER_OBSERVED': { clearability: 'open-scope-never-clearable', accessibilitySupportDependent: false, rationale: 'WITHDRAWN (audit V3R4-H3): markup cannot prove the absence of pointer-only secondary functionality, so "all functionality is keyboard operable" is not soundly clearable.' },
  '2.1.1/BARRIER_OBSERVED': { clearability: 'open-scope-never-clearable', accessibilitySupportDependent: false, rationale: 'A reached interactive control where no real key produced any observable effect (stably, hydrated) is a positive observation; no completeness needed.' },

  // ---- C1: 4.1.2 Name/Role/Value (A) — CLEARABLE only for a role's closed ARIA state set. AT-dep. ----
  '4.1.2/NO_BARRIER_OBSERVED': {
    clearability: 'closed-scope-clearable', accessibilitySupportDependent: true,
    completeness: {
      resolver: 'all-true-completeness-v1',
      requiredObligations: ['hydrationReady', 'axNodeResolved', 'axRolePresentAndExpected', 'axNamePresent', 'axNameNotFromError', 'axStatePropertyExposed', 'axStateChanged', 'axDomAgree', 'axDiffStable', 'activationWasReal', 'noNavigation', 'statesInventoryClosed'],
      derivation: 'docs/completeness/4.1.2.md',
    },
    rationale: '"All states" is finite per ARIA role; clearable only when statesInventoryClosed (the role state set is the closed ARIA set) and a fresh CDP AX snapshot agrees with the DOM on the state change. Notifications are out of scope. Baseline-relative (CDP/Chrome AX).',
  },
  '4.1.2/BARRIER_OBSERVED': { clearability: 'open-scope-never-clearable', accessibilitySupportDependent: true, rationale: 'A widget whose DOM state changed but the AX tree did not reflect it (or which exposes no role-prescribed state) is a positive observation; no completeness needed.' },

  // ---- C9/C8/C7: BARRIER-ONLY SCs — explicitly NEVER-CLEARABLE in the clearing direction. ----
  '1.4.13/NO_BARRIER_OBSERVED': { clearability: 'open-scope-never-clearable', accessibilitySupportDependent: false, rationale: 'Content-on-hover/focus triggers are an open set (JS/portal tooltips) and Persistence needs an unbounded dwell; a universal CLEAR is undecidable. Property failures publish as barriers.' },
  '1.4.13/BARRIER_OBSERVED': { clearability: 'open-scope-never-clearable', accessibilitySupportDependent: false, rationale: 'A proven Dismissible/Hoverable/Persistent failure on a detected hover/focus mechanism is a positive observation; no completeness needed.' },
  '1.4.10/NO_BARRIER_OBSERVED': { clearability: 'open-scope-never-clearable', accessibilitySupportDependent: false, rationale: 'No-horizontal-scroll at 320px is necessary but not sufficient: "no loss of info/function" (truncation, display:none, clip) is an open-world comparison no probe bounds.' },
  '1.4.10/BARRIER_OBSERVED': { clearability: 'open-scope-never-clearable', accessibilitySupportDependent: false, rationale: 'A reproduced non-exempt horizontal scroll at 320 CSS px is a positive observation; no completeness needed.' },
  '2.4.11/BARRIER_OBSERVED': { clearability: 'open-scope-never-clearable', accessibilitySupportDependent: false, rationale: 'A focused element observed ENTIRELY obscured by an opaque author overlay/consent/sticky layer (after scroll settle) is a positive observation; no completeness needed.' },

  // ---- explicitly NEVER-CLEARABLE (open state space). ----
  '2.4.11/NO_BARRIER_OBSERVED': {
    clearability: 'open-scope-never-clearable', accessibilitySupportDependent: false,
    rationale: 'Obscuration depends on every fixed/sticky/overlay layer across the continuous scroll range; no experiment proves worst-case obscuration, so it cannot clear.',
  },
  '2.4.13/NO_BARRIER_OBSERVED': {
    clearability: 'open-scope-never-clearable', accessibilitySupportDependent: false,
    rationale: 'Focus appearance (AAA) is captured as proxies, not enforced; a clearing verdict is unsupported.',
  },
  '4.1.3/INAPPLICABLE': {
    clearability: 'open-scope-never-clearable', accessibilitySupportDependent: false,
    rationale: 'N/A asserts no status message exists across the unbounded app-flow space; not provable by experiment (only a non-markup structural inapplicability could clear).',
  },

  // ---- ACT-REST expansion Round 1: static-DOM deterministic runners. Each CLEARS on a closed decidable
  // sub-domain (a spec-fixed grammar/threshold read from the DOM), so the clearing direction is
  // closed-scope-clearable with a completeness predicate whose obligations are exactly the runner's
  // NO_BARRIER support outcomes. All AT-INDEPENDENT (attribute/computed-style/string comparison). ----
  '1.3.5/NO_BARRIER_OBSERVED': {
    clearability: 'closed-scope-clearable', accessibilitySupportDependent: false,
    completeness: { resolver: 'all-true-completeness-v1', requiredObligations: ['autocompleteApplicable', 'passConfirmed'], derivation: 'docs/analysis/coverage/ACT-REST-GAP-PLANS.md#3' },
    rationale: 'Cleared only when the applicable field\'s autocomplete value is a valid ordered autofill-token sequence (full WHATWG field-name table); an unknown/mis-ordered token is a barrier, not a clear.',
  },
  '1.3.5/BARRIER_OBSERVED': { clearability: 'open-scope-never-clearable', accessibilitySupportDependent: false, rationale: 'An applicable form field whose autocomplete value contains an unknown or mis-ordered token is a positive observation; no completeness needed.' },
  '1.4.12/NO_BARRIER_OBSERVED': {
    clearability: 'closed-scope-clearable', accessibilitySupportDependent: false,
    completeness: { resolver: 'all-true-completeness-v1', requiredObligations: ['spacingApplicable', 'passConfirmed'], derivation: 'docs/analysis/coverage/ACT-REST-GAP-PLANS.md#4' },
    rationale: 'Cleared only when every !important letter/word/line-spacing declared over the element\'s visible text meets its WCAG text-spacing ratio (0.12/0.16/1.5), measured from the used computed values.',
  },
  '1.4.12/BARRIER_OBSERVED': { clearability: 'open-scope-never-clearable', accessibilitySupportDependent: false, rationale: 'An element locking a spacing property !important below the WCAG text-spacing metric over visible text is a positive observation; no completeness needed.' },
  '2.2.1/NO_BARRIER_OBSERVED': {
    clearability: 'closed-scope-clearable', accessibilitySupportDependent: false,
    completeness: { resolver: 'all-true-completeness-v1', requiredObligations: ['metaRefreshApplicable', 'passConfirmed'], derivation: 'docs/analysis/coverage/ACT-REST-GAP-PLANS.md#5' },
    rationale: 'Cleared only when the first valid meta refresh delay is 0 (instant redirect) or > 72000s (effectively none within a session); a delay in (0, 72000] is a barrier.',
  },
  '2.2.1/BARRIER_OBSERVED': { clearability: 'open-scope-never-clearable', accessibilitySupportDependent: false, rationale: 'A first meta refresh with a timed delay in (0, 72000] seconds is a positive observation; no completeness needed.' },
  '1.4.4/NO_BARRIER_OBSERVED': {
    clearability: 'closed-scope-clearable', accessibilitySupportDependent: false,
    completeness: { resolver: 'all-true-completeness-v1', requiredObligations: ['viewportApplicable', 'passConfirmed'], derivation: 'docs/analysis/coverage/ACT-REST-GAP-PLANS.md#6a' },
    rationale: 'Cleared only when a viewport declaring user-scalable/maximum-scale permits zoom (user-scalable yes or |n|>=1; maximum-scale undefined/>=2/device-*/negative); an unrecognized token is not a passing value.',
  },
  '1.4.4/BARRIER_OBSERVED': { clearability: 'open-scope-never-clearable', accessibilitySupportDependent: false, rationale: 'A meta viewport that restricts zoom (user-scalable=no/0/in-range, or maximum-scale < 2, or an unrecognized token) is a positive observation; no completeness needed.' },
  // 2.5.3 — the containment is a STRUCTURAL string comparison of the collected visible label vs the computed
  // accessible name; observing it needs no AT baseline, so this OVERRIDES the AT_DEPENDENT_CLEAR default.
  '2.5.3/NO_BARRIER_OBSERVED': {
    clearability: 'closed-scope-clearable', accessibilitySupportDependent: false,
    completeness: { resolver: 'all-true-completeness-v1', requiredObligations: ['labelInNameApplicable', 'passConfirmed'], derivation: 'docs/analysis/coverage/ACT-REST-GAP-PLANS.md#7' },
    rationale: 'Cleared only when the normalized visible label is a contiguous substring of the computed accessible name for a name-from-content widget with an explicit aria name; a genuinely different word is a barrier. Structural (no AT baseline needed).',
  },
  '2.5.3/BARRIER_OBSERVED': { clearability: 'open-scope-never-clearable', accessibilitySupportDependent: false, rationale: 'A name-from-content widget whose readable visible label is not contained in its accessible name is a positive observation; no completeness needed. Icon-font/single-char labels abstain to the rubric, never a hard barrier.' },
};

// Build full coverage: an explicit entry where given, else a default-closed entry for every
// clearing direction of every SC the harness evaluates.
const REGISTRY = {};
for (const sc of V.ALL_SCS) {
  for (const direction of V.CLEARING_DIRECTIONS) {
    const key = V.scKey(sc, direction);
    REGISTRY[key] = EXPLICIT[key] || {
      clearability: 'open-scope-never-clearable',
      accessibilitySupportDependent: AT_DEPENDENT_CLEAR.has(sc),
      rationale: `No finite-completeness experiment exists yet for ${sc} ${direction}; default-closed until one is built (Phase 0).`,
    };
  }
}
// carry any explicit BARRIER_OBSERVED informational entries through too
for (const [key, entry] of Object.entries(EXPLICIT)) if (!REGISTRY[key]) REGISTRY[key] = entry;

// Clearing directions that POSITIVELY clear must carry completeness (closed AND exception).
const CLEARS_NEED_COMPLETENESS = ['closed-scope-clearable', 'exception-clearable'];

// Validate registry shape. Returns errors[].
function validateRegistry(reg = REGISTRY) {
  const E = [];
  for (const [key, entry] of Object.entries(reg)) {
    const [sc, direction] = key.split('/');
    if (!V.ALL_SCS.includes(sc)) E.push(`registry key ${key}: unknown SC ${sc}`);
    if (!V.DIRECTIONS.includes(direction)) E.push(`registry key ${key}: unknown direction ${direction}`);
    if (!V.CLEARABILITY.includes(entry.clearability)) E.push(`registry ${key}: invalid clearability ${JSON.stringify(entry.clearability)}`);
    if (typeof entry.accessibilitySupportDependent !== 'boolean') E.push(`registry ${key}: accessibilitySupportDependent must be boolean`);
    if (!entry.rationale || String(entry.rationale).trim().length < 8) E.push(`registry ${key}: needs a substantive rationale`);
    // any CLEARING direction that positively clears MUST declare a completeness predicate
    if (V.isClearing(direction) && CLEARS_NEED_COMPLETENESS.includes(entry.clearability)) {
      const c = entry.completeness;
      if (!c || !c.resolver || !Array.isArray(c.requiredObligations) || !c.requiredObligations.length || !c.derivation)
        E.push(`registry ${key}: ${entry.clearability} clear must declare completeness {resolver, requiredObligations[], derivation}`);
    }
  }
  return E;
}

// ANTI-DRIFT: every completeness obligation must be a measured support requirement of SOME
// catalog experiment for that SC/direction — so a supported clear necessarily measured every
// obligation the completeness predicate will check (plan: outcome schemas must not drift from
// support predicates). Returns errors[].
function validateConsistency(reg, cat) {
  const E = [];
  const exps = Object.entries((cat && cat.experiments) || {});
  for (const [key, entry] of Object.entries(reg)) {
    const [sc, direction] = key.split('/');
    if (!V.isClearing(direction) || !entry.completeness) continue;
    const req = entry.completeness.requiredObligations;
    const covering = exps.filter(([, exp]) => exp.sc === sc && exp.supports && exp.supports[direction]
      && req.every((o) => (exp.supports[direction].requires || []).includes(o)));
    if (!covering.length) E.push(`registry/catalog drift: no experiment for ${key} measures every completeness obligation [${req.join(', ')}]`);
  }
  return E;
}

// FAIL-CLOSED default-closed lookup. BARRIER is always allowed; a clearing direction is allowed
// only with an explicit closed/exception-clearable entry. Unknown clearability ⇒ refused.
function clearabilityFor(sc, direction, reg = REGISTRY) {
  if (direction === 'BARRIER_OBSERVED') return { allowed: true, entry: reg[V.scKey(sc, direction)] || null, reason: null };
  const entry = reg[V.scKey(sc, direction)];
  if (!entry) return { allowed: false, entry: null, reason: `no registry entry for ${sc}/${direction} — default-closed (cannot clear)` };
  if (!V.CLEARABILITY.includes(entry.clearability)) return { allowed: false, entry, reason: `${sc}/${direction} has an invalid clearability ${JSON.stringify(entry.clearability)} — fail-closed` };
  if (!CLEARS_NEED_COMPLETENESS.includes(entry.clearability)) return { allowed: false, entry, reason: `${sc}/${direction} is ${entry.clearability}: ${entry.rationale}` };
  return { allowed: true, entry, reason: null };
}

// COVERAGE: every SC × every clearing direction must carry an EXPLICIT clearability class, so a
// default-closed verdict is intentional, not an accidental omission (plan: "registry coverage
// test rejects every SC/direction lacking an explicit clearability class").
function validateCoverage(reg = REGISTRY) {
  const E = [];
  for (const sc of V.ALL_SCS) for (const direction of V.CLEARING_DIRECTIONS)
    if (!reg[V.scKey(sc, direction)]) E.push(`registry coverage: ${sc}/${direction} has no explicit clearability class`);
  return E;
}

// freeze so the validated defaults cannot be mutated out from under a later build
Object.values(REGISTRY).forEach((e) => { if (e.completeness) Object.freeze(e.completeness); Object.freeze(e); });
Object.freeze(REGISTRY);

module.exports = { REGISTRY, validateRegistry, validateConsistency, validateCoverage, clearabilityFor };
