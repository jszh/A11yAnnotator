// Harness 3.0 — INDEPENDENT applicability / claim-family oracle (plan Rule 16; audit V3-C3, V3-C5).
//
// This module is the single AUTHORITY for "what atomic obligations does a collected page carry".
// It derives obligations from RAW collector facts (role / focusable / hasText / …) — it does NOT
// read any precomputed `applicableScs`, which the candidate-generator writes. Independence matters:
// if a candidate-generation branch is forgotten, the obligation is STILL enumerated here, so it
// surfaces as an honest auto-PARTIAL instead of silently disappearing.
//
// An atomic obligation is keyed by (xpath, sc, CLAIM-FAMILY), not (xpath, sc): a single SC can carry
// materially different assertions in different skills (2.4.7 is both focus-management and focus-
// visibility; 1.3.1 spans forms, page structure, grouping). A claim family names ONE assertion and
// maps to exactly the skills it participates in, so clearing one family never clears a sibling
// assertion that shares its SC.
'use strict';

// Claim-family registry: assertionId -> { sc, skills[] }. The seed covers the Phase-1 walking
// skeleton; new experiments register their family here. `skills` are S2.SKILL_SCS keys.
const FAMILIES = Object.freeze({
  'focus-indicator-visible': Object.freeze({ sc: '2.4.7', skills: ['focus-visibility'] }),
  'keyboard-operable':       Object.freeze({ sc: '2.1.1', skills: ['keyboard-operability'] }),
  'text-contrast':           Object.freeze({ sc: '1.4.3', skills: ['color-and-visual-text'] }),
  'name-role-value':         Object.freeze({ sc: '4.1.2', skills: ['name-role-state'] }),
});

const WIDGET_ROLE = /^(button|link|checkbox|switch|tab|menuitem|combobox|radio|slider)$/;

// Is this a collected element with any evaluable accessibility surface at all? Used to fail closed:
// a non-empty page of evaluable elements that yields ZERO obligations is a generation defect.
function isEvaluable(el) {
  return !!el && !!el.xpath && (el.focusable === true || el.hasText === true || (typeof el.role === 'string' && el.role.length > 0));
}

// Derive the atomic obligations for ONE element from raw facts. Each branch is the independent
// twin of a candidate-generation branch; the two must agree (validateApplicableScs checks drift).
function familiesFor(el) {
  const fams = [];
  if (!el) return fams;
  if (el.focusable === true) { fams.push('focus-indicator-visible'); fams.push('keyboard-operable'); }
  if (el.hasText === true) fams.push('text-contrast');
  if (typeof el.role === 'string' && WIDGET_ROLE.test(el.role)) fams.push('name-role-value');
  return [...new Set(fams)];
}

// The atomic obligation list for a collect artifact, derived independently of any applicableScs.
// Each obligation: { obligationId, xpath, sc, claimFamily }.
function deriveObligations(collect) {
  const out = [];
  for (const el of (collect && collect.elements) || []) {
    if (!el || !el.xpath) continue;
    for (const fam of familiesFor(el)) {
      const f = FAMILIES[fam];
      out.push({ obligationId: oblId(el.xpath, f.sc, fam), xpath: el.xpath, sc: f.sc, claimFamily: fam });
    }
  }
  return out;
}

const oblId = (xpath, sc, claimFamily) => `${xpath}::${sc}::${claimFamily}`;

// The canonical applicable-SC set an element should carry, derived from raw facts. Used by the
// candidate-generator AND by the drift check, so the two paths cannot diverge silently.
function applicableScsFor(el) {
  return [...new Set(familiesFor(el).map((fam) => FAMILIES[fam].sc))].sort();
}

// FAIL-CLOSED enumeration checks (audit V3-C3):
//  - a non-empty page of evaluable elements that produced no obligations is a generation defect;
//  - any precomputed `applicableScs` that DISAGREES with the oracle is drift (one path forgot a SC).
function enumerationErrors(collect) {
  const E = [];
  const els = (collect && collect.elements) || [];
  const evaluable = els.filter(isEvaluable);
  const obligations = deriveObligations(collect);
  if (evaluable.length > 0 && obligations.length === 0)
    E.push(`enumeration fail-closed: ${evaluable.length} evaluable element(s) produced ZERO obligations (a generation branch is missing)`);
  for (const el of els) {
    if (!el || !Array.isArray(el.applicableScs)) continue; // absent annotation is fine — the oracle is authority
    const want = applicableScsFor(el).join(',');
    const have = [...new Set(el.applicableScs)].sort().join(',');
    if (want !== have) E.push(`enumeration drift on ${el.xpath}: applicableScs=[${have}] but the oracle derives [${want}]`);
  }
  return E;
}

// OUT-OF-SCOPE accounting (audit R1-F5): an element with an accessibility surface the Phase-0
// family seed does not yet cover (e.g. a non-widget role: img/heading/region) yields zero
// obligations. That is NOT a silent drop — it is an explicit coverage boundary the builder must
// surface, so a consumer can never mistake "0 obligations" for "fully evaluated".
function outOfScopeElements(collect) {
  const out = [];
  for (const el of (collect && collect.elements) || []) {
    if (!el || !el.xpath) continue;
    if (isEvaluable(el) && familiesFor(el).length === 0) {
      const surface = el.focusable === true ? 'focusable' : el.hasText === true ? 'text' : (el.role ? `role:${el.role}` : 'unknown');
      out.push({ xpath: el.xpath, surface, reason: 'no Phase-0 claim-family covers this surface' });
    }
  }
  return out.sort((a, b) => (a.xpath < b.xpath ? -1 : a.xpath > b.xpath ? 1 : 0));
}

// Map a claim family to the skills it participates in (for family-aware skill aggregation).
function skillsForFamily(claimFamily) { return (FAMILIES[claimFamily] && FAMILIES[claimFamily].skills) || []; }
function scForFamily(claimFamily) { return FAMILIES[claimFamily] && FAMILIES[claimFamily].sc; }

module.exports = {
  FAMILIES, WIDGET_ROLE, isEvaluable, familiesFor, deriveObligations, oblId,
  applicableScsFor, enumerationErrors, outOfScopeElements, skillsForFamily, scForFamily,
};
