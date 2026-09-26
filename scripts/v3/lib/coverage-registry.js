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
const { colorReferencesIn } = require('./color-reference-lexicon.js'); // shared input contract (see colour-referencing-image)

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
  Object.freeze({ id: 'focusable', when: (el) => el.focusable === true, families: ['focus-indicator-visible'] }),
  // S4 (RCA R4) — keyboard-operable is owed by every focusable EXCEPT a bare iframe/frame container (its CONTENTS
  // own 2.1.1); re-declared here independently to match the oracle's new gate (Rule 16).
  Object.freeze({ id: 'keyboard-operable', when: (el) => el.focusable === true && el.tag !== 'iframe' && el.tag !== 'frame', families: ['keyboard-operable'] }),
  // 1.4.3 EXEMPTS inactive UI components ("Text or images of text that are part of an inactive user
  // interface component … have no contrast requirement"), so a text-bearing element that is INACTIVE
  // owes no text-contrast family. Re-declared here independently to match the oracle's gate (Rule 16).
  // This exemption was missing until 2026-08-15 and the drift did NOT read as a coverage gap on one
  // element — `coverageErrors` fails CLOSED, so `build-v3.js` aborted the ENTIRE build and every SC on
  // the page lost its obligations. 8/405 act-augmented pages were silently voided that way, and
  // `score-lib.js` recorded the crash as `noObligation`, indistinguishable from a real coverage gap.
  Object.freeze({ id: 'has-text', when: (el) => factHasText(el) && el.inactiveText !== true, families: ['text-contrast'] }),
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
  // Sync with applicability-oracle: an image REMOVED from the a11y tree (aria-hidden / role=presentation / alt="")
  // owes no 1.1.1 alt obligation (ACT inapplicable for an aria-hidden role=img), so the surface excludes it too.
  Object.freeze({ id: 'image', when: (el) => (IMG_ROLE.test(factRole(el)) || el.isImage === true) && el.removedFromA11yTree !== true && el.svgNamedDescendant !== true, families: ['non-text-content', 'images-of-text'] }),
  Object.freeze({ id: 'link', when: (el) => factRole(el) === 'link', families: ['link-purpose'] }),
  Object.freeze({ id: 'heading', when: (el) => HEADING_ROLE.test(factRole(el)), families: ['heading-descriptive'] }),
  Object.freeze({ id: 'form-field-suggestion', when: (el) => el.isFormField === true || FORMFIELD_ROLE.test(factRole(el)), families: ['error-suggestion'] }),
  // Coverage-audit broadenings — re-declared to match the oracle's new branches exactly (Rule 16).
  Object.freeze({ id: 'named-iframe', when: (el) => el.tag === 'iframe' && typeof el.axName === 'string' && el.axName.trim().length > 0, families: ['name-role-value'] }),
  // Item 12 — composite container roles owe name-role-value (re-declared to match the oracle's COMPOSITE_ROLE gate, Rule 16).
  Object.freeze({ id: 'composite-role', when: (el) => /^(menu|menubar|tree|treegrid|grid|tablist|listbox|radiogroup)$/.test(factRole(el)) && !WIDGET_ROLE.test(factRole(el)), families: ['name-role-value'] }),
  // Item 11 — a live region owes a status-message (4.1.3) obligation (re-declared to match the oracle, Rule 16).
  Object.freeze({ id: 'live-region', when: (el) => el.liveRegion === true, families: ['status-message'] }),
  // Item 10 — a <video> owes a captions alternative (1.2.2) obligation (re-declared to match the oracle, Rule 16).
  Object.freeze({ id: 'media-video', when: (el) => el.tag === 'video', families: ['media-alternatives'] }),
  // Item 14d — auto-moving content owes a motion-control (2.2.2) obligation (re-declared to match the oracle, Rule 16).
  Object.freeze({ id: 'auto-motion', when: (el) => el.autoMotion === true, families: ['motion-control'] }),
  // #9 — AUTO-UPDATING text (2.2.2 second clause: timer-driven recurring text swaps, no 5s grace) owes
  // motion-control too, unless a live region already owns it (4.1.3) — re-declared to match the oracle (Rule 16).
  Object.freeze({ id: 'auto-updating-text', when: (el) => el.autoUpdatingText === true && el.liveRegion !== true, families: ['motion-control'] }),
  Object.freeze({ id: 'non-text-contrast', when: (el) => WIDGET_ROLE.test(factRole(el)) || el.isImage === true, families: ['non-text-contrast'] }),
  Object.freeze({ id: 'heading-label', when: (el) => el.isFormField === true || FORMFIELD_ROLE.test(factRole(el)) || (el.tag === 'label' && factHasText(el)), families: ['heading-descriptive'] }),
  Object.freeze({ id: 'use-of-color', when: (el) => factRole(el) === 'link' || el.isFormField === true || FORMFIELD_ROLE.test(factRole(el)), families: ['use-of-color'] }),
  // TT gap G2 — a meaningful CSS background-image owes non-text-content (1.1.1); re-declared to match the oracle (Rule 16).
  Object.freeze({ id: 'background-image', when: (el) => el.backgroundImageMeaningful === true, families: ['non-text-content', 'images-of-text'] }),
  // TT gap G3 — a CAPTCHA owes a captcha-alternative (1.1.1) review obligation; re-declared to match the oracle (Rule 16).
  Object.freeze({ id: 'captcha', when: (el) => el.isCaptcha === true, families: ['captcha-alternative'] }),
  // ACT-REST expansion Round 1 — predicates RE-DECLARED to match the oracle's new gates exactly (Rule 16).
  Object.freeze({ id: 'autocomplete-field', when: (el) => el.autocompleteApplicable === true, families: ['autocomplete-valid'] }),        // 1.3.5
  Object.freeze({ id: 'important-text-spacing', when: (el) => el.spacingImportant === true, families: ['text-spacing-adequate'] }),        // 1.4.12
  Object.freeze({ id: 'meta-refresh', when: (el) => el.metaRefreshValid === true, families: ['no-meta-refresh-delay'] }),                  // 2.2.1
  Object.freeze({ id: 'meta-viewport', when: (el) => el.metaViewportKeyed === true, families: ['viewport-allows-zoom'] }),                 // 1.4.4
  // ACT-REST expansion Round 2 — re-declared to match the oracle's new gates (Rule 16).
  Object.freeze({ id: 'zoom-clip-text', when: (el) => el.zoomClipApplicable === true, families: ['text-not-clipped-zoom'] }),              // 1.4.4 (59br37)
  Object.freeze({ id: 'bypass-page', when: (el) => el.bypassApplicable === true, families: ['bypass-blocks'] }),                           // 2.4.1
  // ACT-REST expansion Round 3 — re-declared to match the oracle's new gate (Rule 16).
  Object.freeze({ id: 'sensory-text', when: (el) => el.sensoryWordHint === true, families: ['sensory-characteristics'] }),                 // 1.3.3 (9bd38c)
  // Residual RCA S6 — re-declared to match the oracle's new colour-reference gate (Rule 16 parity).
  Object.freeze({ id: 'color-reference-text', when: (el) => el.colorWordHint === true, families: ['use-of-color'] }),                      // 1.4.1 (F81 / G14 / Understanding 1.4.1)
  Object.freeze({ id: 'emulated-control', when: (el) => el.emulatedControl === true, families: ['control-semantics'] }),                  // 1.3.1 (F42)
  // batch-3 item 18 — F42's FOCUSABLE role-less sub-case (tabindex>=0, no interactive role, activation-proven);
  // re-declared to match the oracle's new gate exactly (Rule 16).
  Object.freeze({ id: 'emulated-control-focusable', when: (el) => el.emulatedControlFocusable === true, families: ['control-semantics'] }), // 1.3.1 (F42 focusable)
  // Residual RCA S10 aperture widenings — re-declared to match the oracle's four new branches (Rule 16).
  // <area href>: an image-map region link is a link with its own alt — 1.1.1 + 2.4.4; no href ⇒ nothing.
  Object.freeze({ id: 'image-map-area', when: (el) => el.tag === 'area' && typeof el.href === 'string' && el.href.length > 0, families: ['non-text-content', 'link-purpose'] }),
  // State-bearing widget roles whose visual state can be colour-only (regex re-declared, not imported).
  Object.freeze({ id: 'state-bearing-role', when: (el) => /^(switch|checkbox|radio|tab|option|menuitemcheckbox|menuitemradio)$/.test(factRole(el)), families: ['use-of-color'] }),
  // F13: an in-tree image whose own text alternative NAMES a colour construction owes use-of-color. The
  // construction lexicon is a SHARED input contract like factRole/factHasText (re-writing it here would
  // silently diverge on the vocabulary, not catch drift); the surface→family logic — including the
  // STRONG-patterns-only restriction (weak colour+noun over-matches photo alts: "a blue box truck") — is
  // re-declared. If the oracle's F13_STRONG set drifts narrower than this one, the build aborts loudly,
  // which is Rule 16 doing its job.
  Object.freeze({ id: 'colour-referencing-image', when: (el) => (IMG_ROLE.test(factRole(el)) || el.isImage === true) && el.removedFromA11yTree !== true
    && [el.alt, el.axName, el.describedByText, el.longDescriptionText].some((t) => typeof t === 'string' && t.length > 0
      && colorReferencesIn(t).some((h) => h.pattern === 'presented-in-colour' || h.pattern === 'ui-noun-in-colour' || h.pattern === 'colour-coding')), families: ['use-of-color'] }),
  // Muted live region: aria-live plumbing with no live semantics (aria-live present but not live, or
  // atomic/relevant with no live role, or an <output> whose native role is overridden) owes status-message.
  Object.freeze({ id: 'muted-live-region', when: (el) => {
    if (!el || el.liveRegion === true) return false;
    const role = factRole(el).toLowerCase();
    if (/^(status|alert|log|progressbar|marquee|timer)$/.test(role)) return false;
    const attrs = Array.isArray(el.ariaAttrs) ? el.ariaAttrs : [];
    return attrs.includes('aria-live') || attrs.includes('aria-atomic') || attrs.includes('aria-relevant') || (el.tag === 'output' && role.length > 0);
  }, families: ['status-message'] }),
]);

// V2 EXPOSURE — re-declared independently of the oracle's exposureDrops (Rule 16): the surfaces above describe
// what an element IS; how a user MEETS it (the collector's `exposure` facts) removes the families that cannot
// apply. Kept as a separate table so a drift between the two gates reads as a coverage error, not agreement.
const EXPOSURE_RULES = Object.freeze([
  Object.freeze({ id: 'not-rendered', when: (el, x) => x.rendered === false,
    families: ['text-contrast', 'non-text-contrast', 'use-of-color', 'images-of-text', 'target-size-minimum', 'target-size-enhanced', 'focus-indicator-visible', 'keyboard-operable', 'no-keyboard-trap', 'focus-not-obscured', 'hover-content'] }),
  Object.freeze({ id: 'visually-hidden', when: (el, x) => x.rendered !== false && x.srOnly === true && x.revealedOnFocus !== true,
    families: ['text-contrast', 'non-text-contrast', 'use-of-color', 'images-of-text', 'target-size-minimum', 'target-size-enhanced'] }),
  Object.freeze({ id: 'roving-member', when: (el, x) => x.rovingMember === true && x.widgetEntryReachable === true, families: ['keyboard-operable'] }),
  Object.freeze({ id: 'negative-tabindex-non-control', when: (el, x) => {
    if (x.tabindexNegative !== true || x.rovingMember === true) return false;
    const control = /^(button|link|checkbox|switch|tab|menuitem|menuitemcheckbox|menuitemradio|combobox|radio|slider|option|spinbutton|textbox|searchbox|treeitem|gridcell)$/.test(factRole(el))
      || el.isFormField === true || el.hasKeyHandler === true || el.emulatedControlFocusable === true
      || (Array.isArray(el.listenerTypes) && el.listenerTypes.some((t) => /^(click|keydown|keyup|keypress)$/.test(String(t))));
    return !control;
  }, families: ['keyboard-operable', 'focus-indicator-visible'] }),
  Object.freeze({ id: 'aria-hidden-unfocusable', when: (el) => el.hiddenMechanism === 'aria-hidden' && el.focusable !== true,
    families: ['name-role-value', 'link-purpose', 'heading-descriptive', 'label-in-name'] }),
]);

// The families this registry requires for one element (independent of the oracle).
function expectedFamilies(el) {
  const out = new Set();
  if (!el) return out;
  for (const s of SURFACES) if (s.when(el)) for (const f of s.families) out.add(f);
  const x = el.exposure;
  if (x && typeof x === 'object') for (const r of EXPOSURE_RULES) if (r.when(el, x)) for (const f of r.families) out.delete(f);
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
