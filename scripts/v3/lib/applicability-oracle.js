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
  'character-key-shortcut':   Object.freeze({ sc: '2.1.4', skills: ['keyboard-operability'] }),   // Broad-scope 2.1.4 — barrier-only LLM bridge from trusted key probe evidence
  'field-label':             Object.freeze({ sc: '3.3.2', skills: ['forms-instructions-errors'] }), // C6
  // 1.3.1 Test 5.C (per refs/trusted-tester/sc-1.3.1-info-and-relationships.md): the PROGRAMMATIC-association
  // side of a form field's label (accessible name/description + table row/column context + graphical cues) —
  // distinct from 3.3.2's purely-visual "is a label present at all" question (field-label above covers 3.3.2;
  // this family is 1.3.1's own, not a re-scope of field-label, since 3.3.2 still needs checking independently).
  'field-programmatic-association': Object.freeze({ sc: '1.3.1', skills: ['grouping-and-reading-order'] }),
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
  'status-message':          Object.freeze({ sc: '4.1.3', skills: ['dynamic-announcement'] }),            // 4.1.3 (Item 11, rubric status-message-v0) — element-level on a live region; un-deads the status-detector + CDP tools
  'meaningful-sequence':     Object.freeze({ sc: '1.3.2', skills: ['grouping-and-reading-order'] }),      // 1.3.2 (Item 14c, rubric sequence-meaning-v0) — page-level, gated on a vsr reading-order divergence
  'media-alternatives':      Object.freeze({ sc: '1.2.2', skills: ['media-alternatives'] }),             // 1.2.2 (Item 10, rubric media-alternatives-v0) — a <video> owes captions; presence+plausibility, abstain on sync
  'motion-control':          Object.freeze({ sc: '2.2.2', skills: ['timing-and-motion'] }),              // 2.2.2 (Item 14d, rubric motion-control-v0) — auto-moving >5s/looping/autoplay content owes a pause/stop
  // #9 fix (TT 4.1.2 Test 2.D): a carousel/slideshow's automatic content change owes AT NOTIFICATION — distinct
  // from motion-control (2.2.2, owes pause/stop) and status-message (4.1.3, an ALREADY-live-region-marked
  // container's announcement adequacy). Confirmed via refs/trusted-tester/sc-4.1.2-name-role-value.md that TT
  // scores this under 4.1.2, not 4.1.3, despite the conceptual overlap — a shared multi-SC rubric is unsafe here
  // (llm-adjudicator.js's bySc construction string-coerces an array `sc`, breaking routing), hence its own family.
  'auto-update-notification': Object.freeze({ sc: '4.1.2', skills: ['dynamic-announcement'] }),
  // TT gap G3 (TT 7.D, 1.1.1): a CAPTCHA owes a non-visual AND non-auditory alternative. Its own skill+rubric
  // (captcha-alternative-v0) asks the multi-modal question and returns review/PARTIAL — never a hard verdict.
  // (The 1.1.1 background-image-meaning gap G2 reuses the existing non-text-content family + alt-text-adequacy rubric.)
  'captcha-alternative':     Object.freeze({ sc: '1.1.1', skills: ['captcha'] }),                        // 1.1.1 (TT 7.D) — review-tier, gated on isCaptcha
  // C8 small deterministic signals (runSmallSignalExp): unlike the rubric-only broadenings above, each HAS a
  // deterministic decider (barrier/pass) and abstains to a rubric only on the semantic residual.
  'glyph-text-alternative':  Object.freeze({ sc: '1.1.1', skills: ['name-role-state'] }),                // 1.1.1 — icon-font/PUA glyph in own text with no text alternative (gated on hasGlyphText)
  'long-description':        Object.freeze({ sc: '1.1.1', skills: ['name-role-state'] }),                // 1.1.1 — complex image with no long-description source (gated on complexImageHint)
  'multipart-field-grouping': Object.freeze({ sc: '4.1.2', skills: ['name-role-state'] }),               // 4.1.2 — split field with no group label + unnamed parts (gated on splitFieldGroup)
  'positive-tabindex-order': Object.freeze({ sc: '2.4.3', skills: ['focus-management'] }),               // 2.4.3 — tabindex>0 disrupting focus order, F44 (gated on tabindexEffective>0)
  'composite-arrow-trap':    Object.freeze({ sc: '2.1.2', skills: ['keyboard-operability'] }),           // 2.1.2 — C2 arrow-key roving-widget trap (gated on composite role); complements no-keyboard-trap
  // ---- ACT-REST expansion, Round 1: static-deterministic runners (OUT of the paper's 22-SC scope; scored
  //      only on the disjoint act-rest corpus). Each gates on a NEW collector fact minimal synthetic fixtures
  //      lack, so no existing applicableScs drifts. See scripts/v3/lib/static-checks.js for the decision logic.
  'autocomplete-valid':      Object.freeze({ sc: '1.3.5', skills: ['name-role-state'] }),                // 1.3.5 (73f2c2) — autocomplete token grammar
  'text-spacing-adequate':   Object.freeze({ sc: '1.4.12', skills: ['color-and-visual-text'] }),         // 1.4.12 (24afc2/9e45ec/78fd32) — !important letter/word/line spacing wide enough
  'no-meta-refresh-delay':   Object.freeze({ sc: '2.2.1', skills: ['timing-and-motion'] }),              // 2.2.1 (bc659a) — first meta refresh has no timed delay
  'viewport-allows-zoom':    Object.freeze({ sc: '1.4.4', skills: ['color-and-visual-text'] }),          // 1.4.4 (b4f0c3) — meta viewport permits zoom
  // ---- ACT-REST expansion, Round 2: instrument-needing SCs (dynamic browser probes; barrier-primary).
  //      2.2.2 (efbfc7) reuses the EXISTING motion-control family (above) — the auto-update-pausable instrument
  //      feeds its rubric via abstention reasons, so no new 2.2.2 family is registered here. ----
  'text-not-clipped-zoom':   Object.freeze({ sc: '1.4.4', skills: ['color-and-visual-text'] }),          // 1.4.4 (59br37) — text clipped by overflow at the 640x512 zoom-equivalent viewport (a SECOND 1.4.4 family)
  'bypass-blocks':           Object.freeze({ sc: '2.4.1', skills: ['page-structure'] }),                  // 2.4.1 (cf77f2/ye5d6e/3e12e1) — a page bypass mechanism (landmark/heading/skip-link/collapse)
  // ---- ACT-REST expansion, Round 3: judgment-heavy LLM lane. NO deterministic runner — the deterministic layer is
  //      a REQUIREMENT-SOURCED sensory-word pre-filter (applicability only); the sensory-characteristics-v0 rubric
  //      fills the auto-PARTIAL as a non-authoritative LLM PROVISIONAL (canary ceiling). ----
  'sensory-characteristics': Object.freeze({ sc: '1.3.3', skills: ['grouping-and-reading-order'] }),      // 1.3.3 (9bd38c) — a text node using a visual-reference word to identify content owes a non-visual alternative
});

const WIDGET_ROLE = /^(button|link|checkbox|switch|tab|menuitem|combobox|radio|slider)$/;
const FORMFIELD_ROLE = /^(textbox|combobox|listbox|spinbutton|searchbox|slider)$/;
// 4.1.2 COMPOSITE container roles (Item 12): a relational name-role-value obligation axe abstains on. EXCLUDES
// bare group/region (no name/state obligation, floods every app page) — only roles that owe a name + child states.
const COMPOSITE_ROLE = /^(menu|menubar|tree|treegrid|grid|tablist|listbox|radiogroup)$/;
const IMG_ROLE = /^(img|image|figure)$/;   // 3.2 non-text-content (1.1.1)
const HEADING_ROLE = /^heading$/;          // 3.2 heading-descriptive (2.4.6)

// DECORATIVE-SUSPECT (the "don't BLINDLY exclude decorative" lane). An image REMOVED from the a11y tree
// (alt=""/aria-hidden/role=presentation) that the author did NOT name (so the Tier-0 #5 decorativeConflict route does
// not apply). Deterministically we cannot tell a genuinely-decorative image from an INFORMATIVE one wrongly given alt=""
// (a wrongly-decorated logo/photo/image-of-text is a real 1.1.1/1.4.5 failure — the e88epe/0va7u6 FNs — indistinguishable
// from legit decoration without judging the pixels + redundancy with nearby text). So instead of excluding it outright,
// route it to a redundancy-aware verification rubric — UNLESS its geometry makes it physically incapable of carrying
// information. WCAG 1.1.1 / ACT e88epe carry NO size floor, so size alone may only clear what a SPACER definitionally
// is (a pure-layout shim that cannot render legible content), never merely-small informative images (finding #10: the
// old min-dim>=24 wall silently cleared a 320×20 image-of-text). Geometry gates, spec-grounded:
//   - SQUARE-ish images below the square gate (default 24px, V3_DECORATIVE_MIN_DIM experiment override) stay excluded:
//     bullets/sprite icons/avatar chips. Provenance: the corpus geometry scan (scan-decorative-geom.js) confirmed
//     those buckets were 100% genuinely decorative (0 recall loss) — but that scan is evidence, not the rule; the
//     rule is that an ELONGATED strip escapes this gate below.
//   - ELONGATED escape hatch: rendered text is intrinsically elongated (average glyph advance ≈ 0.5em, so even one
//     short word is wider than ~4× the line height), and banners/wordmarks/images-of-text share that shape — so an
//     elongated strip big enough to hold a legible word is a suspect REGARDLESS of the square gate.
//   - SPACER floors (what "too small to inform" means, from typography, not corpus buckets): an extreme-aspect
//     strip's only plausible information payload is rendered TEXT, and legible text needs ~10 CSS px of height
//     (browsers' minimum-font-size defaults are 9–10px; below that no word renders legibly) — so an elongated strip
//     narrower than DECORATIVE_TEXT_MIN_HEIGHT is a rule/divider/shim by construction (1–2px slivers a fortiori),
//     e.g. a 300×6 decorative border stripe, and one under DECORATIVE_SPACER_MIN_AREA cannot hold even one legible
//     word (~10px tall × ~40px wide at the 4:1 shape).
// The size gates cannot separate large-decorative from large-informative — that residual is the rubric's redundancy
// call. Disable the whole lane with V3_DECORATIVE_LANE=0 (reverts to blanket exclusion). Read per-call so tests/runs
// can tune.
const DECORATIVE_ELONGATED_ASPECT = 4;   // max(w,h)/min(w,h) — the spec-plausible SHAPE of rendered text (one word ≳ 4:1)
const DECORATIVE_TEXT_MIN_HEIGHT = 10;   // px — narrow dimension below which no legible word renders (min font-size ≈ 9–10px)
const DECORATIVE_SPACER_MIN_AREA = 400;  // px² — smallest elongated strip holding one legible word (~10px × ~40px)
function decorativeSuspect(el) {
  if (process.env.V3_DECORATIVE_LANE === '0' || !el) return false;
  const role = String(el.role || el.roleAttr || el.axRole || el.sampledRole || '').toLowerCase();
  if (!(IMG_ROLE.test(role) || el.isImage === true)) return false;
  if (el.removedFromA11yTree !== true) return false;   // an IN-tree image already owes the normal alt/1.4.5 obligation
  if (el.decorativeConflict === true) return false;    // author-NAMED-but-hidden is already routed (Tier-0 #5)
  if (el.svgNamedDescendant === true) return false;    // an <svg> named via a <title> descendant is not bare-decorative
  const b = el.box;                                    // two collectors: act-page-collect {width,height}, eval-page {w,h}
  if (!b) return false;
  const w = b.width != null ? b.width : b.w;
  const h = b.height != null ? b.height : b.h;
  if (!(w > 0 && h > 0)) return false;
  const minDim = Math.min(w, h);
  const squareGate = Math.max(1, Number(process.env.V3_DECORATIVE_MIN_DIM) || 24);
  if (minDim >= squareGate) return true;               // substantial in BOTH dimensions ⇒ always a suspect
  // ELONGATED escape hatch (#10): a text-shaped strip above the spacer floors is a suspect even under the square
  // gate — recovers the 320×20 removed-from-tree image-of-text without un-gating 8×8 spacers / 16×16 icons
  // (aspect 1 fails the shape test) or slivers / border stripes / sub-word shims (the spacer floors; a 300×6
  // stripe stays excluded — 6px cannot render a word). Note: at aspect ≥ 4 and minDim ≥ 10 the area floor is
  // implied (4·10² = 400); it stays explicit so the spacer definition survives independent tuning of either bound.
  return (Math.max(w, h) / minDim) >= DECORATIVE_ELONGATED_ASPECT
    && minDim >= DECORATIVE_TEXT_MIN_HEIGHT
    && (w * h) >= DECORATIVE_SPACER_MIN_AREA;
}
// page-level pseudo-element for the page-scoped reflow obligation (C8).
const PAGE_REFLOW_XPATH = '/page-level::reflow';
// page-level pseudo-element for the page-title obligation (3.2 ○-tier, 2.4.2).
const PAGE_TITLE_XPATH = '/page-level::title';
// page-level pseudo-element for the info-and-relationships obligation (3.2, 1.3.1).
const PAGE_INFOREL_XPATH = '/page-level::info-relationships';
// page-level pseudo-elements (coverage audit): section-headings (2.4.10) + focus-order meaning (2.4.3).
const PAGE_SECTIONHEADINGS_XPATH = '/page-level::section-headings';
const PAGE_FOCUSORDER_XPATH = '/page-level::focus-order';
// page-level pseudo-element for 1.3.2 meaningful sequence (Item 14c) — enumerated ONLY when the vsr detector
// reports a visual-vs-source reading-order divergence (gated in build-v3, not on every multi-column page).
const PAGE_MEANINGFUL_SEQUENCE_XPATH = '/page-level::meaningful-sequence';
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
  if (el.focusable === true) {
    fams.push('focus-indicator-visible');
    // S4 (RCA R4): a bare <iframe>/<frame> is focusable but is NOT itself a keyboard-OPERABLE control — its
    // CONTENTS own 2.1.1. Enumerating keyboard-operable on the container only yields an unjudgeable abstain/FP
    // (the akn7bn iframe). The frame's inner focusables carry keyboard-operable on their own.
    if (el.tag !== 'iframe' && el.tag !== 'frame') fams.push('keyboard-operable');
  }
  if (factHasText(el) && el.inactiveText !== true) fams.push('text-contrast'); // 1.4.3 exempts inactive UI components (B)
  if (WIDGET_ROLE.test(role)) fams.push('name-role-value');
  // 4.1.2 NAMED-IFRAME facet (coverage audit): a named <iframe> owes name-role-value so the rubric can judge
  // name/purpose equivalence (ACT 4b1c6c) — a name-role question v3's widget-only gate missed and that axe
  // does NOT decide in v3. The OTHER 4.1.2 facet — ARIA-attribute VALIDITY (aria-* prohibited on a generic
  // element, ACT kb1m8s) — is deliberately NOT enumerated here: it floods on real pages (aria-* is ubiquitous)
  // AND the accessible-name-adequacy rubric judges the wrong question (the name IS adequate; the attribute is
  // prohibited). axe's aria-prohibited-attr owns it → routed via the axe-checker disposition lane, not the oracle.
  if (el.tag === 'iframe' && typeof el.axName === 'string' && el.axName.trim().length > 0) fams.push('name-role-value');
  // 4.1.2 COMPOSITE widgets (Item 12): a container role owes name-role-value — does it expose the right role + a
  // meaningful name, do its children carry required states (selected/expanded/checked/level). axe abstains on this
  // semantics; states/axStates are surfaced into the name-role-state precompute. bare group/region are excluded above.
  if (COMPOSITE_ROLE.test(role) && !WIDGET_ROLE.test(role)) fams.push('name-role-value');
  // 4.1.3 STATUS MESSAGES (Item 11): a live-region container owes a status-message obligation — is a status change
  // announced to AT without moving focus. The insertion-only status-detector can't decide the un-hide case and
  // names no trigger; this routes the residue to the rubric (+ the observe_state_after_activation /
  // probe_screen_reader_after_action CDP tools when enabled). "absence ≠ pass": a detector that found no insertion
  // is NOT a clear (the un-hide case is exactly what it misses).
  if (el.liveRegion === true) fams.push('status-message');
  // #9 fix (TT 4.1.2 2.D): auto-updating content (carousel/slideshow) that is NOT already inside a live region —
  // if it IS (liveRegion:true), status-message-v0 already owns judging whether the announcement is adequate;
  // this family owns the prior question ("is there ANY notification mechanism at all").
  if (el.autoUpdatingContent === true && el.liveRegion !== true) fams.push('auto-update-notification');
  // 1.2.x TIME-BASED MEDIA (Item 10): a <video> owes a captions alternative (1.2.2) — does an adequate captions
  // track exist (presence + plausibility; sync/quality are not judgeable from a static crop → abstain). No checker
  // decides caption ADEQUACY. "absence ≠ pass": a present-but-empty <track> must NOT read as "has captions".
  if (el.tag === 'video') fams.push('media-alternatives');
  // 2.2.2 PAUSE/STOP/HIDE (Item 14d): auto-MOVING content (a looping/>5s CSS animation, <marquee>, or autoplay
  // media) owes a pause/stop/hide mechanism. Gated on the collected auto-motion signal (NOT brief/sub-5s decorative
  // animation). Whether a usable pause EXISTS and whether the motion is essential/loading is the rubric's judgment.
  if (el.autoMotion === true) fams.push('motion-control');
  // #9 (round-3 overfit audit): SC 2.2.2's SECOND clause — AUTO-UPDATING content. A timer-driven text ticker
  // (the collector's autoUpdatingText MutationObserver signal — recurring text swaps on a visible in-parallel
  // element) owes pause/stop/hide/frequency-control with NO 5-second grace, and previously tripped NO gate at
  // all (autoMotion is keyframes/marquee/autoplay only; autoUpdatingContent is the carousel-library 4.1.2
  // marker). Routes to the SAME motion-control family/rubric (2.2.2, timing-and-motion) as a distinct
  // auto-updating sub-family; liveRegion:true routes to status-message (4.1.3) instead — same guard as the
  // carousel lane above. Deduped so an element that is BOTH auto-moving and auto-updating mints one family.
  if (el.autoUpdatingText === true && el.liveRegion !== true && !fams.includes('motion-control')) fams.push('motion-control');
  // 1.4.11 NON-TEXT CONTRAST (coverage audit — un-orphans non-text-contrast-v0): UI components (widgets) and
  // graphical objects (img/svg/canvas) owe it. No deterministic 1.4.11 runner exists ⇒ rubric-judged.
  if (WIDGET_ROLE.test(role) || el.isImage === true) fams.push('non-text-contrast');
  // RISK-GATED families: a focusable element carries a trap obligation only inside a focus-trapping
  // region, and an obscuration obligation only when the page has an overlay/sticky/consent layer that
  // could cover it — so plain controls don't accrue obligations for risks their page doesn't present.
  if (el.focusable === true && (el.inModal === true || el.focusRisk === true)) fams.push('no-keyboard-trap'); // C5 (coverage audit: focusRisk widens the inModal-only gate to non-modal traps)
  if (el.focusable === true && el.underOverlay === true) fams.push('focus-not-obscured');           // C7
  if (el.isFormField === true || FORMFIELD_ROLE.test(role)) { fams.push('field-label'); fams.push('error-identification'); fams.push('field-programmatic-association'); } // C6: label (3.3.2) + error id (3.3.1) + programmatic association (1.3.1, TT 5.C)
  if (el.hasHoverContent === true) fams.push('hover-content');                                       // C9
  // ---- Harness 3.2 ○-tier (per-element). Strict raw-fact predicates: a rendered POINTER TARGET (it
  //      has a box AND is interactive) owes the target-size SCs; a WIDGET with BOTH a visible label and
  //      a computed accessible name owes label-in-name. Minimal synthetic fixtures lack box/axName, so
  //      these never fire there — only real collector records carry them. ----
  const interactive = el.focusable === true || WIDGET_ROLE.test(role);
  if (el.box != null && interactive) { fams.push('target-size-minimum'); fams.push('target-size-enhanced'); } // 2.5.8 + 2.5.5
  if (WIDGET_ROLE.test(role) && typeof el.axName === 'string' && el.axName.trim().length > 0) fams.push('label-in-name'); // 2.5.3 (axName non-empty already proves a name — factHasText was redundant)
  // MEANING-call families (3.2) — role-precise so they fire only on real img/link/heading/form elements.
  // 1.1.1 alt + 1.4.5: owed only for an image that is IN the a11y tree. A graphic REMOVED from the tree
  // (aria-hidden=true, role=presentation/none, alt="") is intentionally decorative and owes no text alternative
  // (ACT inapplicable — e.g. an aria-hidden role=img logo). Gate on the collector's removedFromA11yTree fact so a
  // bare/decorative svg/canvas/role=img is not enumerated.
  if ((IMG_ROLE.test(role) || el.isImage === true) && el.removedFromA11yTree !== true && el.svgNamedDescendant !== true) { fams.push('non-text-content'); fams.push('images-of-text'); }
  // Tier-0 #5 (e88epe FN): the EXCEPTION to the rule above — a removed-from-tree image is normally decorative, BUT a
  // DECORATIVE-CONFLICT (explicitly hidden via aria-hidden / role=presentation|none, yet author-NAMED and RENDERED)
  // is a deterministic smell: the author signalled the image carries meaning, then removed it from AT. Mint the 1.1.1
  // alt-adequacy obligation ONLY (not images-of-text) so the rubric judges the rendered pixels vs the hidden name
  // (the decorativeMarking precompute already surfaces the conflict). Gated tightly on decorativeConflict — a bare
  // alt="" decorative image (no author name) stays unenumerated, so no flood on ordinary decorative imagery.
  else if ((IMG_ROLE.test(role) || el.isImage === true) && el.decorativeConflict === true && el.svgNamedDescendant !== true) { fams.push('non-text-content'); }
  // "Don't BLINDLY exclude decorative": an UNnamed removed-from-tree image (not a decorativeConflict) that could
  // plausibly carry information — substantial in both dimensions, OR text-shaped (elongated) above the spacer floors —
  // is routed to a redundancy-aware verification lane (1.1.1 alt + 1.4.5 image-of-text) instead of being silently
  // dropped; only spacer-geometry images (sub-gate squares, slivers, sub-word shims) stay excluded, per the geometry
  // rationale on decorativeSuspect(). RUBRIC_GATE binds ONLY the decorative-image-verification rubric to these
  // (alt-text-adequacy/long-description are gated OFF for them).
  else if (decorativeSuspect(el)) { fams.push('non-text-content'); fams.push('images-of-text'); }
  // TT gap G2 (TT 7.C): a CSS background-image conveying INFORMATION owes a text alternative — the SAME
  // non-text-content family + alt-text-adequacy rubric as an <img> (1.1.1). It ALSO owes images-of-text (1.4.5):
  // a background-image can render TEXT-AS-IMAGE (e.g. a textimage.jpg); the images-of-text rubric judges that and
  // self-clears a photo/logo. It does NOT owe non-text-contrast (1.4.11 needs an actual widget/graphic element).
  if (el.backgroundImageMeaningful === true) { fams.push('non-text-content'); fams.push('images-of-text'); } // 1.1.1 + 1.4.5
  // TT gap G3 (TT 7.D, 1.1.1): a CAPTCHA owes a non-visual AND non-auditory alternative — its own review-tier family.
  if (el.isCaptcha === true) fams.push('captcha-alternative');                             // 1.1.1 (CAPTCHA modalities)
  if (role === 'link') fams.push('link-purpose');                                          // 2.4.4
  if (HEADING_ROLE.test(role)) fams.push('heading-descriptive');                           // 2.4.6 (heading facet)
  // 2.4.6 LABEL facet (coverage audit): a form field / <label> owes heading-descriptive too — the v0 rubric
  // judges BOTH heading AND label descriptiveness (ACT cc0f0a). The heading-only gate missed labels.
  if (el.isFormField === true || FORMFIELD_ROLE.test(role) || (el.tag === 'label' && factHasText(el))) fams.push('heading-descriptive');
  // 1.4.1 USE OF COLOR (coverage audit — un-orphans use-of-color-v0): links and form fields are the clearest
  // color-cue surfaces (link distinguished by colour alone; field state by colour). Rubric self-abstains otherwise.
  if (role === 'link' || el.isFormField === true || FORMFIELD_ROLE.test(role)) fams.push('use-of-color');
  if (el.isFormField === true || FORMFIELD_ROLE.test(role)) fams.push('error-suggestion'); // 3.3.3 (alongside field-label/error-identification)
  // C8 small-signal predicates (collector-provided cheap facts; the runner re-verifies in-page).
  if (el.hasGlyphText === true) fams.push('glyph-text-alternative');                        // 1.1.1 (icon-font/PUA in own text)
  if (el.complexImageHint === true && el.removedFromA11yTree !== true) fams.push('long-description'); // 1.1.1 (data-bearing image)
  if (el.splitFieldGroup === true) fams.push('multipart-field-grouping');                   // 4.1.2 (split field group)
  if (Number(el.tabindexEffective) > 0) fams.push('positive-tabindex-order');               // 2.4.3 (F44 positive tabindex)
  if (/^(menu|menubar|tablist|listbox|grid|treegrid|toolbar|radiogroup|tree)$/.test(role)) fams.push('composite-arrow-trap'); // 2.1.2 (C2 arrow-key trap)
  // ---- ACT-REST expansion Round 1 (each gated on a NEW collector fact; runner re-measures in-page) ----
  if (el.autocompleteApplicable === true) fams.push('autocomplete-valid');                   // 1.3.5 — a form field with a non-toggle autocomplete on an applicable, enabled, visible control
  if (el.spacingImportant === true) fams.push('text-spacing-adequate');                       // 1.4.12 — an element whose inline style declares letter/word/line-spacing !important over visible text
  if (el.metaRefreshValid === true) fams.push('no-meta-refresh-delay');                        // 2.2.1 — the first <meta http-equiv=refresh> with a valid (numeric-leading) content
  if (el.metaViewportKeyed === true) fams.push('viewport-allows-zoom');                        // 1.4.4 — a <meta name=viewport> whose content declares user-scalable/maximum-scale
  // ---- Round 2 (each gated on a NEW collector fact detected at the RIGHT dynamic condition; runner re-verifies) ----
  if (el.zoomClipApplicable === true) fams.push('text-not-clipped-zoom');                      // 1.4.4 (59br37) — a clip-ancestor element wrapping visible text at the 640x512 viewport
  if (el.bypassApplicable === true) fams.push('bypass-blocks');                                // 2.4.1 — a page with repeated blocks + non-repeated content owes a bypass mechanism
  if (el.sensoryWordHint === true) fams.push('sensory-characteristics');                       // 1.3.3 (9bd38c) — a text node containing a requirement-sourced visual-reference word (LLM judges the alternative)
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
  FAMILIES, WIDGET_ROLE, FORMFIELD_ROLE, IMG_ROLE, HEADING_ROLE, decorativeSuspect, PAGE_REFLOW_XPATH, PAGE_TITLE_XPATH, PAGE_INFOREL_XPATH,
  PAGE_SECTIONHEADINGS_XPATH, PAGE_FOCUSORDER_XPATH, PAGE_MEANINGFUL_SEQUENCE_XPATH, pageTitleSlotPresent,
  isEvaluable, familiesFor, deriveObligations, oblId,
  applicableScsFor, enumerationErrors, outOfScopeElements, skillsForFamily, scForFamily, factHasText, factRole,
};
