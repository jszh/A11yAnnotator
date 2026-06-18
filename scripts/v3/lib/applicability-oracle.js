// Harness 3.0 — INDEPENDENT applicability / claim-family oracle (plan Rule 16; audit V3-C3, V3-C5).
//
// This module derives obligations INDEPENDENTLY of any precomputed `applicableScs` (which the
// candidate-generator writes), from RAW collector facts (role / focusable / hasText / …). Its
// independence matters: if a candidate-generation branch is forgotten, the obligation is STILL
// enumerated here, so it surfaces as an honest auto-PARTIAL instead of silently disappearing.
//
// SCOPE NOTE (audit V3R2-M3): this is an explicitly PARTIAL Phase-0 inventory, NOT complete
// independent coverage of all WCAG SCs. `familiesFor` is a hand-authored seed; surfaces it does not
// cover are reported via `outOfScopeElements` (never silently dropped), but absence of a family
// branch is a coverage gap, not a proof of conformance. A separately-owned category/skill coverage
// registry that fails closed on a missing family is future work.
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
  // ---- experiment families C1/C3 reuse the above; C4–C9 add these ----
  'no-keyboard-trap':        Object.freeze({ sc: '2.1.2', skills: ['keyboard-operability'] }),   // C5
  'field-label':             Object.freeze({ sc: '3.3.2', skills: ['forms-instructions-errors'] }), // C6
  'error-identification':    Object.freeze({ sc: '3.3.1', skills: ['forms-instructions-errors'] }), // C6 (form-error-probe)
  'hover-content':           Object.freeze({ sc: '1.4.13', skills: ['color-and-visual-text'] }),  // C9
  'reflow-no-hscroll':       Object.freeze({ sc: '1.4.10', skills: ['reflow'] }),                 // C8 (page-level)
  'focus-not-obscured':      Object.freeze({ sc: '2.4.11', skills: ['focus-management'] }),       // C7
  // ---- Harness 3.2 ○-tier: the collector HAS these facts but no runner enumerates an obligation, so
  //      the SC was invisible to reconciliation. Registering the family makes it an auto-PARTIAL the LLM
  //      can fill provisionally (and is the shared prerequisite for a future deterministic runner). ----
  'target-size-minimum':     Object.freeze({ sc: '2.5.8', skills: ['reflow-and-pointer-affordances'] }), // 3.2 ○
  'target-size-enhanced':    Object.freeze({ sc: '2.5.5', skills: ['reflow-and-pointer-affordances'] }), // 3.2 ○ (AAA)
  'page-title':              Object.freeze({ sc: '2.4.2', skills: ['page-structure'] }),                  // 3.2 ○ (page-level)
  'label-in-name':           Object.freeze({ sc: '2.5.3', skills: ['name-role-state'] }),                 // 3.2 ○
  // ---- Harness 3.2 MEANING-call families: an LLM-judged adequacy obligation no deterministic runner can
  //      decide. Enumerated so the authored atomic rubrics REACH a prompt (audit D12-1) and become
  //      auto-PARTIAL the LLM fills provisionally. Strict role/page predicates ⇒ minimal fixtures unaffected.
  'non-text-content':        Object.freeze({ sc: '1.1.1', skills: ['name-role-state'] }),                 // alt adequacy (img)
  'images-of-text':          Object.freeze({ sc: '1.4.5', skills: ['color-and-visual-text'] }),           // image renders text that should be real text (img) — LLM-judged
  'link-purpose':            Object.freeze({ sc: '2.4.4', skills: ['name-role-state'] }),                 // link purpose (link)
  'heading-descriptive':     Object.freeze({ sc: '2.4.6', skills: ['page-structure'] }),                  // heading descriptiveness
  'error-suggestion':        Object.freeze({ sc: '3.3.3', skills: ['forms-instructions-errors'] }),       // error suggestion (form field)
  'info-relationships':      Object.freeze({ sc: '1.3.1', skills: ['grouping-and-reading-order'] }),      // info+relationships (page-level)
  // Coverage-audit broadenings: families that un-orphan already-authored rubrics (1.4.1/1.4.11/2.4.3) and
  // close the 2.4.10 gap. None has a deterministic decider — all are LLM-rubric / agent judged, non-authoritative.
  'use-of-color':            Object.freeze({ sc: '1.4.1', skills: ['color-and-visual-text'] }),           // 1.4.1 (rubric use-of-color-v0) — link/field color-cue
  'non-text-contrast':       Object.freeze({ sc: '1.4.11', skills: ['color-and-visual-text'] }),          // 1.4.11 (rubric non-text-contrast-v0) — widget/graphic
  'focus-order-meaning':     Object.freeze({ sc: '2.4.3', skills: ['focus-management'] }),                // 2.4.3 (rubric focus-order-meaning-v0) — page-level
  'section-headings':        Object.freeze({ sc: '2.4.10', skills: ['page-structure'] }),                 // 2.4.10 (rubric section-headings-v0) — page-level (AAA, fill stays non-authoritative)
});

const WIDGET_ROLE = /^(button|link|checkbox|switch|tab|menuitem|combobox|radio|slider)$/;
const FORMFIELD_ROLE = /^(textbox|combobox|listbox|spinbutton|searchbox|slider)$/;
const IMG_ROLE = /^(img|image|figure)$/;   // 3.2 non-text-content (1.1.1)
const HEADING_ROLE = /^heading$/;          // 3.2 heading-descriptive (2.4.6)
// page-level pseudo-element for the page-scoped reflow obligation (C8).
const PAGE_REFLOW_XPATH = '/page-level::reflow';
// page-level pseudo-element for the page-title obligation (3.2 ○-tier, 2.4.2).
const PAGE_TITLE_XPATH = '/page-level::title';
// page-level pseudo-element for the info-and-relationships obligation (3.2, 1.3.1).
const PAGE_INFOREL_XPATH = '/page-level::info-relationships';
// page-level pseudo-elements (coverage audit): section-headings (2.4.10) + focus-order meaning (2.4.3).
const PAGE_SECTIONHEADINGS_XPATH = '/page-level::section-headings';
const PAGE_FOCUSORDER_XPATH = '/page-level::focus-order';
// The page's title slot, read from EITHER the synthetic `collect.page` convention OR the real
// collector's `collect.structure` (eval-page.js emits page-level facts under `structure`). Presence of
// the slot — even an empty title — means this is a titled-document context that owes a 2.4.2 obligation.
const pageTitleSlotPresent = (collect) => {
  for (const p of [collect && collect.page, collect && collect.structure]) {
    if (p && typeof p === 'object' && Object.prototype.hasOwnProperty.call(p, 'title')) return true;
  }
  return false;
};

// COLLECTOR FIELD CONTRACT (audit V3R5-H1). The real collector (scripts/eval-page.js) emits `text`
// (string) and `roleAttr`, NOT the `hasText`/`role` booleans the synthetic v3 fixtures use. Reading
// only the synthetic names silently under-enumerates text-contrast and name-role-value obligations on
// real artifacts (the coverage registry, which reads the SAME names, agrees on "nothing" and so does
// not catch it). These accessors normalize BOTH shapes at the single point every consumer reads a
// fact, so the family LOGIC stays independently declared while the INPUT contract is shared + explicit.
const factHasText = (el) => !!el && (el.hasText === true || (typeof el.text === 'string' && el.text.trim().length > 0));
// The collector reports an element's role across several channels: an explicit ARIA `role`/`roleAttr`
// AND, for NATIVE controls (where roleAttr is null), the sampled/computed role under `sampledRole` /
// `axRole` (audit R5R-H1). Read the full contract first-non-empty, else native <a>/<button>/<input>
// lose their name-role-value (4.1.2) obligations entirely.
const factRole = (el) => {
  if (!el) return '';
  for (const f of ['role', 'roleAttr', 'sampledRole', 'axRole']) {
    const v = el[f];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
};

// Is this a collected element with any evaluable accessibility surface at all? Used to fail closed:
// a non-empty page of evaluable elements that yields ZERO obligations is a generation defect.
function isEvaluable(el) {
  return !!el && !!el.xpath && (el.focusable === true || factHasText(el) || factRole(el).length > 0);
}

// Derive the atomic obligations for ONE element from raw facts. Each branch is the independent
// twin of a candidate-generation branch; the two must agree (validateApplicableScs checks drift).
function familiesFor(el) {
  const fams = [];
  if (!el) return fams;
  const role = factRole(el);
  if (el.focusable === true) { fams.push('focus-indicator-visible'); fams.push('keyboard-operable'); }
  if (factHasText(el)) fams.push('text-contrast');
  if (WIDGET_ROLE.test(role)) fams.push('name-role-value');
  // 4.1.2 NAMED-IFRAME facet (coverage audit): a named <iframe> owes name-role-value so the rubric can judge
  // name/purpose equivalence (ACT 4b1c6c) — a name-role question v3's widget-only gate missed and that axe
  // does NOT decide in v3. The OTHER 4.1.2 facet — ARIA-attribute VALIDITY (aria-* prohibited on a generic
  // element, ACT kb1m8s) — is deliberately NOT enumerated here: it floods on real pages (aria-* is ubiquitous)
  // AND the accessible-name-adequacy rubric judges the wrong question (the name IS adequate; the attribute is
  // prohibited). axe's aria-prohibited-attr owns it → routed via the axe-checker disposition lane, not the oracle.
  if (el.tag === 'iframe' && typeof el.axName === 'string' && el.axName.trim().length > 0) fams.push('name-role-value');
  // 1.4.11 NON-TEXT CONTRAST (coverage audit — un-orphans non-text-contrast-v0): UI components (widgets) and
  // graphical objects (img/svg/canvas) owe it. No deterministic 1.4.11 runner exists ⇒ rubric-judged.
  if (WIDGET_ROLE.test(role) || el.isImage === true) fams.push('non-text-contrast');
  // RISK-GATED families: a focusable element carries a trap obligation only inside a focus-trapping
  // region, and an obscuration obligation only when the page has an overlay/sticky/consent layer that
  // could cover it — so plain controls don't accrue obligations for risks their page doesn't present.
  if (el.focusable === true && (el.inModal === true || el.focusRisk === true)) fams.push('no-keyboard-trap'); // C5 (coverage audit: focusRisk widens the inModal-only gate to non-modal traps)
  if (el.focusable === true && el.underOverlay === true) fams.push('focus-not-obscured');           // C7
  if (el.isFormField === true || FORMFIELD_ROLE.test(role)) { fams.push('field-label'); fams.push('error-identification'); } // C6: label (3.3.2) + error id (3.3.1)
  if (el.hasHoverContent === true) fams.push('hover-content');                                       // C9
  // ---- Harness 3.2 ○-tier (per-element). Strict raw-fact predicates: a rendered POINTER TARGET (it
  //      has a box AND is interactive) owes the target-size SCs; a WIDGET with BOTH a visible label and
  //      a computed accessible name owes label-in-name. Minimal synthetic fixtures lack box/axName, so
  //      these never fire there — only real collector records carry them. ----
  const interactive = el.focusable === true || WIDGET_ROLE.test(role);
  if (el.box != null && interactive) { fams.push('target-size-minimum'); fams.push('target-size-enhanced'); } // 2.5.8 + 2.5.5
  if (WIDGET_ROLE.test(role) && typeof el.axName === 'string' && el.axName.trim().length > 0) fams.push('label-in-name'); // 2.5.3 (axName non-empty already proves a name — factHasText was redundant)
  // MEANING-call families (3.2) — role-precise so they fire only on real img/link/heading/form elements.
  if (IMG_ROLE.test(role) || el.isImage === true) { fams.push('non-text-content'); fams.push('images-of-text'); } // 1.1.1 alt + 1.4.5 (incl. role=none/svg/canvas graphics — the mis-marked-decorative case)
  if (role === 'link') fams.push('link-purpose');                                          // 2.4.4
  if (HEADING_ROLE.test(role)) fams.push('heading-descriptive');                           // 2.4.6 (heading facet)
  // 2.4.6 LABEL facet (coverage audit): a form field / <label> owes heading-descriptive too — the v0 rubric
  // judges BOTH heading AND label descriptiveness (ACT cc0f0a). The heading-only gate missed labels.
  if (el.isFormField === true || FORMFIELD_ROLE.test(role) || (el.tag === 'label' && factHasText(el))) fams.push('heading-descriptive');
  // 1.4.1 USE OF COLOR (coverage audit — un-orphans use-of-color-v0): links and form fields are the clearest
  // color-cue surfaces (link distinguished by colour alone; field state by colour). Rubric self-abstains otherwise.
  if (role === 'link' || el.isFormField === true || FORMFIELD_ROLE.test(role)) fams.push('use-of-color');
  if (el.isFormField === true || FORMFIELD_ROLE.test(role)) fams.push('error-suggestion'); // 3.3.3 (alongside field-label/error-identification)
  return [...new Set(fams)];
}

// The atomic obligation list for a collect artifact, derived independently of any applicableScs.
// Each obligation: { obligationId, xpath, sc, claimFamily }. Includes the page-level reflow
// obligation (C8) when the page declares it — enumerated outside the per-element loop.
function deriveObligations(collect) {
  const out = [];
  for (const el of (collect && collect.elements) || []) {
    if (!el || !el.xpath) continue;
    for (const fam of familiesFor(el)) {
      const f = FAMILIES[fam];
      out.push({ obligationId: oblId(el.xpath, f.sc, fam), xpath: el.xpath, sc: f.sc, claimFamily: fam });
    }
  }
  if (collect && collect.page && collect.page.reflowApplicable === true) {
    const f = FAMILIES['reflow-no-hscroll'];
    out.push({ obligationId: oblId(PAGE_REFLOW_XPATH, f.sc, 'reflow-no-hscroll'), xpath: PAGE_REFLOW_XPATH, sc: f.sc, claimFamily: 'reflow-no-hscroll' });
  }
  // Harness 3.2 ○-tier: a page-level 2.4.2 page-title obligation whenever the collector carries a title slot.
  if (pageTitleSlotPresent(collect)) {
    const f = FAMILIES['page-title'];
    out.push({ obligationId: oblId(PAGE_TITLE_XPATH, f.sc, 'page-title'), xpath: PAGE_TITLE_XPATH, sc: f.sc, claimFamily: 'page-title' });
  }
  // Harness 3.2 page-level 1.3.1 info-and-relationships obligation whenever the page has a structure slot.
  if (collect && collect.structure && typeof collect.structure === 'object') {
    const f = FAMILIES['info-relationships'];
    out.push({ obligationId: oblId(PAGE_INFOREL_XPATH, f.sc, 'info-relationships'), xpath: PAGE_INFOREL_XPATH, sc: f.sc, claimFamily: 'info-relationships' });
    // Coverage audit — page-level 2.4.10 section-headings + 2.4.3 focus-order, same structure-slot gate as 1.3.1.
    const sh = FAMILIES['section-headings'];
    out.push({ obligationId: oblId(PAGE_SECTIONHEADINGS_XPATH, sh.sc, 'section-headings'), xpath: PAGE_SECTIONHEADINGS_XPATH, sc: sh.sc, claimFamily: 'section-headings' });
    const fo = FAMILIES['focus-order-meaning'];
    out.push({ obligationId: oblId(PAGE_FOCUSORDER_XPATH, fo.sc, 'focus-order-meaning'), xpath: PAGE_FOCUSORDER_XPATH, sc: fo.sc, claimFamily: 'focus-order-meaning' });
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
  FAMILIES, WIDGET_ROLE, FORMFIELD_ROLE, IMG_ROLE, HEADING_ROLE, PAGE_REFLOW_XPATH, PAGE_TITLE_XPATH, PAGE_INFOREL_XPATH,
  PAGE_SECTIONHEADINGS_XPATH, PAGE_FOCUSORDER_XPATH, pageTitleSlotPresent,
  isEvaluable, familiesFor, deriveObligations, oblId,
  applicableScsFor, enumerationErrors, outOfScopeElements, skillsForFamily, scForFamily, factHasText, factRole,
};
