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
const IMG_ROLE = /^(img|image|figure)$/;   // re-declared (independence discipline) for non-text-content
const HEADING_ROLE = /^heading$/;          // re-declared for heading-descriptive
// the COLLECTOR FIELD CONTRACT (how to read hasText/role from a real collector record) IS shared with
// the oracle — that is the input contract both must agree on (audit V3R5-H1); only the surface→family
// LOGIC is independently re-declared. Reading raw `el.hasText`/`el.role` here would silently agree
// with the oracle on "nothing" for real artifacts and so hide the under-enumeration.
const { factHasText, factRole } = oracle;

// SURFACE → required families. Each `when` reads ONLY raw collector facts (never a runner outcome).
const SURFACES = Object.freeze([
  Object.freeze({ id: 'focusable', when: (el) => el.focusable === true, families: ['focus-indicator-visible', 'keyboard-operable'] }),
  Object.freeze({ id: 'has-text', when: (el) => factHasText(el), families: ['text-contrast'] }),
  Object.freeze({ id: 'widget-role', when: (el) => WIDGET_ROLE.test(factRole(el)), families: ['name-role-value'] }),
  Object.freeze({ id: 'focusable-trap-risk', when: (el) => el.focusable === true && (el.inModal === true || el.focusRisk === true), families: ['no-keyboard-trap'] }),
  Object.freeze({ id: 'focusable-under-overlay', when: (el) => el.focusable === true && el.underOverlay === true, families: ['focus-not-obscured'] }),
  Object.freeze({ id: 'form-field', when: (el) => el.isFormField === true || FORMFIELD_ROLE.test(factRole(el)), families: ['field-label', 'error-identification'] }),
  Object.freeze({ id: 'hover-content', when: (el) => el.hasHoverContent === true, families: ['hover-content'] }),
  // Harness 3.2 ○-tier — predicates RE-DECLARED to match the oracle's familiesFor branches exactly, so a
  // drift between the two is caught (Rule 16). A rendered pointer target owes the target-size SCs; a
  // widget with a visible label AND a computed accessible name owes label-in-name.
  Object.freeze({ id: 'pointer-target', when: (el) => el.box != null && (el.focusable === true || WIDGET_ROLE.test(factRole(el))), families: ['target-size-minimum', 'target-size-enhanced'] }),
  Object.freeze({ id: 'labelled-control', when: (el) => WIDGET_ROLE.test(factRole(el)) && typeof el.axName === 'string' && el.axName.trim().length > 0, families: ['label-in-name'] }),
  // Harness 3.2 meaning-call families — predicates re-declared to match the oracle exactly (Rule 16).
  Object.freeze({ id: 'image', when: (el) => IMG_ROLE.test(factRole(el)) || el.isImage === true, families: ['non-text-content', 'images-of-text'] }),
  Object.freeze({ id: 'link', when: (el) => factRole(el) === 'link', families: ['link-purpose'] }),
  Object.freeze({ id: 'heading', when: (el) => HEADING_ROLE.test(factRole(el)), families: ['heading-descriptive'] }),
  Object.freeze({ id: 'form-field-suggestion', when: (el) => el.isFormField === true || FORMFIELD_ROLE.test(factRole(el)), families: ['error-suggestion'] }),
  // Coverage-audit broadenings — re-declared to match the oracle's new branches exactly (Rule 16).
  Object.freeze({ id: 'named-iframe', when: (el) => el.tag === 'iframe' && typeof el.axName === 'string' && el.axName.trim().length > 0, families: ['name-role-value'] }),
  Object.freeze({ id: 'non-text-contrast', when: (el) => WIDGET_ROLE.test(factRole(el)) || el.isImage === true, families: ['non-text-contrast'] }),
  Object.freeze({ id: 'heading-label', when: (el) => el.isFormField === true || FORMFIELD_ROLE.test(factRole(el)) || (el.tag === 'label' && factHasText(el)), families: ['heading-descriptive'] }),
  Object.freeze({ id: 'use-of-color', when: (el) => factRole(el) === 'link' || el.isFormField === true || FORMFIELD_ROLE.test(factRole(el)), families: ['use-of-color'] }),
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
  // Harness 3.2 ○-tier page-level: a title slot must yield a page-title obligation (independent cross-check).
  if (oracle.pageTitleSlotPresent(collect)) {
    const obls = oracle.deriveObligations(collect);
    if (!obls.some((o) => o.claimFamily === 'page-title')) E.push('coverage gap: page carries a title slot but no page-level page-title obligation was enumerated (Rule 16)');
  }
  // page-level 1.3.1: a structure slot must yield an info-relationships obligation.
  if (collect && collect.structure && typeof collect.structure === 'object') {
    const obls = oracle.deriveObligations(collect);
    if (!obls.some((o) => o.claimFamily === 'info-relationships')) E.push('coverage gap: page carries a structure slot but no page-level info-relationships obligation was enumerated (Rule 16)');
    // coverage audit: the same structure slot must yield page-level section-headings (2.4.10) + focus-order (2.4.3).
    if (!obls.some((o) => o.claimFamily === 'section-headings')) E.push('coverage gap: page carries a structure slot but no page-level section-headings (2.4.10) obligation was enumerated (Rule 16)');
    if (!obls.some((o) => o.claimFamily === 'focus-order-meaning')) E.push('coverage gap: page carries a structure slot but no page-level focus-order-meaning (2.4.3) obligation was enumerated (Rule 16)');
  }
  return E;
}

module.exports = { SURFACES, WIDGET_ROLE, FORMFIELD_ROLE, expectedFamilies, coverageErrors };
