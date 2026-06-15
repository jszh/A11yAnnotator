// Harness 3.0 — INDEPENDENTLY-OWNED obligation-coverage registry (plan Rule 16; audit V3R4-H8).
//
// Candidate generation AND builder obligation-enumeration both derive families from
// `applicability-oracle.familiesFor`. If a family branch is removed/edited there, BOTH the candidate
// and the obligation vanish and a page with other obligations still validates — a silent coverage
// loss (Rule 16). This module is a SECOND, separately-authored source of truth: a flat declarative
// table mapping element SURFACE predicates to the families that MUST be enumerated. The builder
// requires `familiesFor(el) ⊇ expected(el)` for every element and FAILS CLOSED on a shortfall, so a
// drift between the two declarations is caught.
//
// Independence note (honest): the two are different REPRESENTATIONS (declarative table here vs.
// imperative branches in the oracle) authored separately and re-declaring their own role patterns, so
// removal/drift is caught. A blind spot SHARED by both at original authoring is not caught by a
// cross-check alone — that needs the catalog's declared family set (also cross-checked) or review.
'use strict';

const oracle = require('./applicability-oracle.js');

// re-declared here ON PURPOSE (not imported from the oracle) so a drift in the oracle's role sets is
// caught by disagreement rather than silently shared.
const WIDGET_ROLE = /^(button|link|checkbox|switch|tab|menuitem|combobox|radio|slider)$/;
const FORMFIELD_ROLE = /^(textbox|combobox|listbox|spinbutton|searchbox|slider)$/;

// SURFACE → required families. Each `when` reads ONLY raw collector facts (never a runner outcome).
const SURFACES = Object.freeze([
  Object.freeze({ id: 'focusable', when: (el) => el.focusable === true, families: ['focus-indicator-visible', 'keyboard-operable'] }),
  Object.freeze({ id: 'has-text', when: (el) => el.hasText === true, families: ['text-contrast'] }),
  Object.freeze({ id: 'widget-role', when: (el) => typeof el.role === 'string' && WIDGET_ROLE.test(el.role), families: ['name-role-value'] }),
  Object.freeze({ id: 'focusable-in-modal', when: (el) => el.focusable === true && el.inModal === true, families: ['no-keyboard-trap'] }),
  Object.freeze({ id: 'focusable-under-overlay', when: (el) => el.focusable === true && el.underOverlay === true, families: ['focus-not-obscured'] }),
  Object.freeze({ id: 'form-field', when: (el) => el.isFormField === true || (typeof el.role === 'string' && FORMFIELD_ROLE.test(el.role)), families: ['field-label', 'error-identification'] }),
  Object.freeze({ id: 'hover-content', when: (el) => el.hasHoverContent === true, families: ['hover-content'] }),
]);

// The families this registry requires for one element (independent of the oracle).
function expectedFamilies(el) {
  const out = new Set();
  if (!el) return out;
  for (const s of SURFACES) if (s.when(el)) for (const f of s.families) out.add(f);
  return out;
}

// FAIL-CLOSED coverage check: for every element the oracle's enumeration must be a SUPERSET of this
// registry's required families; the page-level reflow obligation must be enumerated when applicable.
// `familiesFor` is injectable so a mutation test can simulate a removed oracle branch.
function coverageErrors(collect, familiesFor = oracle.familiesFor) {
  const E = [];
  for (const el of (collect && collect.elements) || []) {
    if (!el || !el.xpath) continue;
    const expected = expectedFamilies(el);
    if (!expected.size) continue;
    const got = new Set(familiesFor(el) || []);
    for (const fam of expected) if (!got.has(fam)) E.push(`coverage gap on ${el.xpath}: surface requires family "${fam}" but the oracle enumerated [${[...got].join(',') || 'none'}] — a generation branch is missing (Rule 16)`);
  }
  if (collect && collect.page && collect.page.reflowApplicable === true) {
    const obls = oracle.deriveObligations(collect);
    if (!obls.some((o) => o.claimFamily === 'reflow-no-hscroll')) E.push('coverage gap: page declares reflowApplicable but no page-level reflow obligation was enumerated (Rule 16)');
  }
  return E;
}

module.exports = { SURFACES, WIDGET_ROLE, FORMFIELD_ROLE, expectedFamilies, coverageErrors };
