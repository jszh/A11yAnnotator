# A11yAnnotator v3 — ACT-Rule Coverage Analysis

**Date:** 2026-06-17

## 1. Title + scope

This report audits **A11yAnnotator v3's coverage of 40 W3C ACT (Accessibility Conformance Testing) rules** that require manual or semi-automatic inspection. The 40 rules reproduce the WAI ACT-rules filter:

- **requirements** = `A`, `AA`, `ARIA`
- **status** = `approved`, `proposed`
- **implement** = `manual`, `semi-auto`

scoped to the harness's **22 in-scope success criteria + ARIA author requirements**. An ACT rule defines an **applicability** (which elements it covers) + an **expectation** (the pass condition) + a test procedure. "Coverage" here means: can some v3 lane actually evaluate that applicability+expectation, and does the harness's real test procedure align (or miss edge cases)?

**6 of the 40 rules are NOT fully automatable** — they require either semantic content judgment that only a non-authoritative LLM lane can attempt, or capabilities outside the harness's single-page-DOM domain:

| Rule | Name | Why not fully automatable |
|---|---|---|
| `qt1vmo` | Image accessible name is descriptive | Semantic name-vs-pixel equivalence judgment (LLM-only, non-authoritative) |
| `1a02b0` | Audio and visuals of video element have transcript | Media playback + content equivalence — **out of domain** |
| `ee13b5` | Video element visual-only content has transcript | Media playback + video-frame comprehension + multi-page — **out of domain** |
| `fd3a94` | Links with identical names + same context serve equivalent purpose | Relational cross-link comparison + href/redirect resolution + equivalence judgment |
| `36b590` | Error message describes invalid form field value | Semantic cause/fix-description content judgment (LLM-only) |
| `4b1c6c` | Iframes with identical names have equivalent purpose | Relational cross-iframe comparison + embedded-resource capture + equivalence judgment |

**Source material:**
- ACT rule definitions (extracted markdown + HTML): [`act-rules/`](../../../act-rules/) — 40 extracted rules in [`act-rules/extracted/`](../../../act-rules/extracted/), source HTML in [`act-rules/pages/`](../../../act-rules/pages/).
- Companion technique audit: [`WCAG-TECHNIQUE-COVERAGE-ANALYSIS.md`](./WCAG-TECHNIQUE-COVERAGE-ANALYSIS.md).

---

## 2. How to read this report

### Coverage verdicts

| Verdict | Meaning |
|---|---|
| **CAPTURED** | An authoritative lane evaluates the rule's applicability + expectation and gates conformance. (None of these 40 rules reach CAPTURED today.) |
| **PARTIAL** | The rule is partly covered — usually an authoritative runner that decides a sub-domain, an axe rule that *runs but is dropped*, and/or an inert LLM rubric. No authoritative lane fully decides it. |
| **NOT_CAPTURED** | No lane evaluates the rule's applicability or expectation at all (even non-authoritatively). |
| **OUT_OF_DOMAIN** | The rule needs raw signals (media playback, multi-page crawl, video-frame comprehension) the single-page-DOM harness never collects. |

### Authority tiers (from the dossier)

Only **deterministic CLAIM dispositions** — catalog runners + collector DOM/geometry/axe checks — **gate conformance**. Everything else is **non-authoritative** (scored vs gold, never gates):

- **axe surfaced findings** (`axe-surface.js`)
- **IBM checker findings** (`checker-ibm.js`, inert/opt-in)
- **LLM-rubric PROVISIONAL fills** (inert by default)
- **VSR/keyboard instruments** (opt-in)
- **Skills** are guidance-only (no signal)

### The axe "capable-but-not-surfaced" caveat — the dominant theme of this report

`axe-core` runs ~90 rules at collection (`eval-page.js`), but v3 **only consumes** decided findings for the allow-list **`AXE_SURFACED_SCS = {1.3.1, 1.3.5, 1.4.4, 2.4.4}` + prefix `3.1.`** (`axe-surface.js`). For most of these 40 ACT rules, **axe ships the exact (or near-exact) reference implementation and it RUNS — but the decided finding is dropped** because its SC (typically **4.1.2** or **1.1.1**) is not allow-listed. Two further drop mechanisms recur:

1. **No `wcag*` tag at all** — `eval-page.js` retains only `/^wcag\d/`-tagged tags into `collect.axe[].wcag`; rules tagged only `best-practice` (e.g. `presentation-role-conflict` → 46ca7f, `empty-heading` → ffd0e9) get an empty SC set and are dropped at `axe-surface.js` (`if (!scs.length) continue`).
2. **`resultTypes:['violations']` only** — `eval-page.js` drops axe's `incomplete`/needs-review outcomes (empty-`headers`, empty required-owned containers), so review priors are silently absent.

Even when surfaced, an axe finding is **non-authoritative** — so "surface axe" raises coverage toward PARTIAL but **never reaches CAPTURED on its own**; an authoritative deterministic runner is always additionally required to gate.

---

## 3. Executive summary

### Coverage distribution

| Verdict | Count | Rules |
|---|---:|---|
| **CAPTURED** | **0** | — |
| **PARTIAL** | **35** | 23a2a8, 46ca7f, 59796f, 7d6734, 8fc3b6, c487ae, e88epe, qt1vmo, 4e8ab6, 5c01ea, 5f99a7, 674b10, 6a7281, a25f45, bc4a75, e086e5, ff89c9, b4f0c3, 09o5cg, afw4f7, 0ssw9k, 2779a5, c4a8a4, 5effbb, b49b2e, cc0f0a, oj04fd, 36b590, 2t702h, 307n5z, 6cfa84, 97a4e1, cae760, m6b1q3, ffd0e9 |
| **NOT_CAPTURED** | **3** | akn7bn, fd3a94, 4b1c6c |
| **OUT_OF_DOMAIN** | **2** | 1a02b0, ee13b5 |
| **Total** | **40** | |

**No rule is fully CAPTURED.** Even where an authoritative runner exists (e.g. `text-contrast-pixel`, `ax-state-diff`, `focus-visual-retry`), it is either mis-calibrated, gated to the wrong applicability, held at shadow state, or evaluates a different limb than the rule's expectation.

### Coverage by rule class (dominant gap per class)

| rule_class | Rules | Dominant gap |
|---|---|---|
| **name-presence** | 23a2a8, 59796f, 7d6734, 8fc3b6, c487ae, e086e5, 2t702h, 97a4e1, cae760, m6b1q3, ffd0e9 (11) | axe ships the exact name rule (image-alt, input-image-alt, svg-img-alt, object-alt, link-name, label-family, summary-name, button-name, frame-title, aria-command-name, empty-heading) but it is **dropped** (1.1.1/4.1.2 not surfaced). `ax-state-diff` only reaches **widget roles on activation** — never static img/svg/object/iframe/summary/heading name-presence. |
| **aria-validity** | 46ca7f, 4e8ab6, 5c01ea, 5f99a7, 674b10, 6a7281, bc4a75, ff89c9, 307n5z, 6cfa84 (10) | axe's `aria-*` family decides each rule but rides the **4.1.2 drop**. `ax-state-diff` uses a **closed 4-state set {expanded,pressed,checked,selected}** + activation — it cannot evaluate required-properties presence, permitted-ness, value-type validity, name-validity, required-owned/context structure, presentational-children, or aria-hidden subtree focusability. |
| **name-descriptiveness** | qt1vmo, 5effbb, b49b2e, cc0f0a (4) | Only the **inert LLM rubrics** (alt-text-adequacy, link-purpose, heading-descriptive) target descriptiveness; non-authoritative, often **input-starved** (no programmatic link context, no flat-tree adjacency, no per-field visual context). |
| **contrast** | b4f0c3, 09o5cg, afw4f7 (3) | `text-contrast-pixel` decides the **flat-opaque-uniform** sub-domain only; **no 1.4.6 (enhanced) threshold exists**; non-uniform/gradient/text-shadow/shadow-DOM abstain to PARTIAL. (b4f0c3 is actually a meta-viewport zoom check whose primary SC 1.4.4 *is* surfaced via axe, but only the secondary 1.4.10 is in-scope here.) |
| **keyboard-focus** | 0ssw9k, akn7bn, oj04fd (3) | axe owns the rule (`scrollable-region-focusable`, `frame-focusable-content`) but 2.1.1 is **not surfaced**; the only 2.1.1 runner tests **activation of a control**, not scroll-reach or iframe tab-order; `focus-visual-retry` exists but is **pinned at shadow** and mis-calibrated (clip too small, sRGB not HSL, threshold stricter than the rule). |
| **page-title** | 2779a5, c4a8a4 (2) | Only `document.title` is collected + an inert rubric; **no deterministic 2.4.2 runner** (non-empty is trivially mechanical, descriptiveness is LLM-only). |
| **media-transcript** | 1a02b0, ee13b5 (2) | **Out of domain** — no media playback, audio-track decode, video-frame comprehension, or multi-page fetch. |
| **table-semantics** | a25f45 (1) | axe `td-headers-attr` is **already surfaced** (1.3.1 allow-listed) but only as a **non-authoritative shadow**; no authoritative table-header runner; `incomplete` (empty-headers) edge dropped. |
| **relational-comparison** | fd3a94 (1) | Inherently a **cross-element comparison + href/redirect resolution + resource-equivalence** judgment — **no signal collected at all**. |
| **other** | e88epe, 4b1c6c (2) | e88epe (decorative-but-meaningful — inverse of name-presence, semantic pixel judgment, applicability never enumerated); 4b1c6c (relational cross-iframe equivalence — no signal). |

### Key findings — what the ACT rules reveal beyond the technique analysis

1. **"axe runs it but v3 drops it" is the single biggest gap.** At least **22 of the 40 rules** are decided by an axe rule that *executes at collection* and is then discarded — almost always because the rule's SC is **4.1.2** (or **1.1.1**), neither of which is in `AXE_SURFACED_SCS`. The specific rule→axe mappings (all verified in the audit): 23a2a8→`image-alt`/`role-img-alt`, 46ca7f→`presentation-role-conflict`, 59796f→`input-image-alt`, 7d6734→`svg-img-alt`, 8fc3b6→`object-alt`, c487ae→`link-name`, 4e8ab6→`aria-required-attr`, 5c01ea→`aria-allowed-attr`, 5f99a7→`aria-valid-attr`, 674b10→`aria-roles`, 6a7281→`aria-valid-attr-value`, a25f45→`td-headers-attr`, bc4a75/ff89c9→`aria-required-children`/`aria-required-parent`, e086e5→`label`/`select-name`/`aria-input-field-name`/`aria-toggle-field-name`, 0ssw9k→`scrollable-region-focusable`, akn7bn→`frame-focusable-content`, 2779a5→`document-title`, 2t702h→`summary-name`, 307n5z→`nested-interactive`, 6cfa84→`aria-hidden-focus`, 97a4e1→`button-name`, cae760→`frame-title`, m6b1q3→`aria-command-name`, ffd0e9→`empty-heading`.

2. **NEW need — relational cross-element comparison instruments.** The technique analysis did not surface this: `fd3a94` (identical links → equivalent purpose) and `4b1c6c` (identical iframes → equivalent purpose) require comparing **two or more elements to each other**, resolving their **destinations/embedded resources** (incl. instant-redirect following), and judging **resource equivalence**. *None* of this is collected — the dossier's KNOWN MISSING INSTRUMENTS explicitly lists "compare two links' destinations" and "compare two iframes' content." `5effbb` also needs the by-name sibling-destination index. These are genuinely new raw-signal instruments, not detectors over existing data.

3. **NEW need — the precise applicability edges `ax-state-diff` misses for non-widget name-presence.** The 4.1.2 runner is hard-gated to **WIDGET_ROLE** `{button,link,checkbox,switch,tab,menuitem,combobox,radio,slider}` (+ native `BUTTON|A|INPUT|SELECT`) **driven by activation**. The ACT rules show this systematically misses static name-presence on **`object` (8fc3b6), `svg` img/graphics-document/graphics-symbol (7d6734), `iframe` (cae760), `summary` (2t702h, exposed as `DisclosureTriangle`), `area[href]` and `role=doc-biblioref` (c487ae), and `heading` (ffd0e9)** — and that activation **self-invalidates on navigation** (c487ae: a real `a[href]` navigates → `valid=false` → no disposition). The fix is a **static AX-name presence runner** that reads the already-collected CDP `axName`/`axRole`/`inTree` without activating — a detector over existing AX data, not a new instrument.

4. **NEW need — ARIA-spec validity vs the harness's closed state set.** Six aria-validity rules (`4e8ab6` required states/properties, `5c01ea` permitted, `5f99a7` defined-in-WAI-ARIA, `674b10` valid role value, `6a7281` valid value-type, plus `bc4a75`/`ff89c9` required-owned/context) need the **full WAI-ARIA 1.2 / Graphics-ARIA / DPUB-ARIA reference model** (role enumeration, per-role required/supported/permitted props, value types + token sets, ARIA-in-HTML matrix). The harness only has `ax-state-diff`'s **closed 4-state set** — which cannot express any of these. The reference tables ship *with* the runner as static lookup data (`aria-query` rolesMap is a starting point but is **insufficient** for conditional cases like focusable-separator `aria-valuenow`).

5. **NEW need — table headers-attr checker + a full-page `[role]`/AX-tree-with-parentage instrument.** `a25f45` (headers refer to same table) is already surfaced via axe `td-headers-attr` (1.3.1) but only as shadow. `674b10` (valid role value) reveals a **sampler gap**: `out.elements` is a stratified *focusable/meaningful* sample, so a non-focusable `<span role="lnik">` is **never inventoried** — an authoritative runner needs its own full-page `document.querySelectorAll('[role]')` sweep. `ff89c9`/`bc4a75` (required context/owned) need a **retained full AX tree with parent/child + owned-children edges** (`getFullAXTree`) — `eval-page.js` already *fetches* ancestors per element via `getAXNodeAndAncestors` but **discards them**.

6. **Media-transcript rules are firmly out of domain.** `1a02b0` and `ee13b5` need video playback, audio-track decode, **video-frame comprehension** (the failed examples have structurally-valid transcripts that are simply *wrong* — describe a dog, not the rabbit), and multi-page fetch for linked transcripts. No runner/rubric/instrument is warranted.

7. **The contrast runner has no enhanced (1.4.6) threshold and abstains on non-flat backdrops.** `09o5cg` (7:1 enhanced) would be **false-cleared** on flat-opaque borderline cases (e.g. #666/white at 5.7:1 passes 1.4.3's 4.5 floor but fails 1.4.6's 7.0) because `text-contrast-pixel` is hardcoded to the 1.4.3 minimum thresholds and there is **no 1.4.6 obligation anywhere in v3**. `afw4f7` (the 1.4.3 rule itself) is faithfully covered only over flat-opaque-uniform backdrops; gradient/image/text-shadow/**shadow-DOM** all fall to auto-PARTIAL (shadow-DOM is a genuine raw-signal gap — the XPath-from-document addressing cannot pierce shadow roots).

8. **The focus-visible runner exists but is pinned at shadow and mis-calibrated.** `oj04fd` has a real `focus-visual-retry` runner whose applicability is a close match, but authority pins it at `shadow` in both directions (so it emits a non-authoritative PARTIAL), and its expectation diverges from the rule: it clips to an ~80px region (misses remote indicators the rule's Background says still pass → false BARRIER), compares **sRGB channel deltas not HSL**, and uses thresholds **stricter than the rule's "one device pixel" any-difference** test.

9. **Page-title non-emptiness (2779a5) is one trivial deterministic runner away from CAPTURED.** `structure.title = document.title` is already collected and aligns with the rule's whitespace-collapse + first-title semantics; a mechanical "barrier if empty/whitespace-only" catalog runner converts PARTIAL→CAPTURED. Descriptiveness (`c4a8a4`) remains LLM-only and over-enumerates on empty titles (the rule deems them Inapplicable).

10. **The 6 non-automatable rules, in brief:** `qt1vmo` needs the activated alt-adequacy rubric + per-img request-state fact; `36b590` needs the activated error rubric + a visible-vs-AX-tree split + pre-existing/async error capture; `fd3a94` & `4b1c6c` need relational link/iframe-set instruments + destination/resource resolution + equivalence rubrics; `1a02b0` & `ee13b5` are out of domain (media + multi-page).

---

## 4. Additional-needs roadmap

Aggregated across all 40 rules, grouped by `additional_needs.type`, **ordered by ROI** (highest first). Items marked **(NEW)** are needs the technique analysis did not surface.

### A. surface-axe — *highest ROI: zero new collection, axe already runs and decides the rule*

Surfacing is **non-authoritative** (scored vs gold, never gates) — it raises coverage toward PARTIAL-strong but cannot reach CAPTURED. Strongly prefer **per-ruleId allow-lists** over opening a whole SC (opening bare `4.1.2` pulls in the noisy name/aria family).

| Action | Rules served | axe rule(s) |
|---|---|---|
| Add `1.1.1` (scoped per-ruleId) to `AXE_SURFACED_SCS` | 23a2a8, 7d6734, 8fc3b6, 59796f, qt1vmo | `image-alt`, `role-img-alt`, `svg-img-alt`, `object-alt`, `input-image-alt` |
| Surface `presentation-role-conflict` — requires carrying the **best-practice rule id (no wcag tag)** + an explicit ruleId→1.1.1 map | 46ca7f | `presentation-role-conflict` |
| Add `4.1.2` via **per-ruleId allow-list** (avoid wholesale 4.1.2) | 4e8ab6, 5c01ea, 5f99a7, 674b10, 6a7281, e086e5, 2t702h, 307n5z, 6cfa84, 97a4e1, cae760, m6b1q3 | `aria-required-attr`, `aria-allowed-attr`, `aria-valid-attr`, `aria-roles`, `aria-valid-attr-value`, `label`/`select-name`/`aria-input-field-name`/`aria-toggle-field-name`, `summary-name`, `nested-interactive`, `aria-hidden-focus`, `button-name`, `frame-title`, `aria-command-name` |
| Extend the wcag412 binding for `link-name` so its 4.1.2 limb isn't dropped (2.4.4 limb already surfaces) | c487ae | `link-name` |
| Add `2.1.1` (or per-rule) to `AXE_SURFACED_SCS` | 0ssw9k, akn7bn | `scrollable-region-focusable`, `frame-focusable-content` |
| Add `2.4.2` to `AXE_SURFACED_SCS` (interim until deterministic runner) | 2779a5 | `document-title` |
| Surface `empty-heading` — **no wcag tag**, needs ruleId-keyed surfacing branch + a non-SC obligation slot | ffd0e9 | `empty-heading` |
| **Promote** the already-surfaced 1.3.1 shadow to authoritative (decision, not new code) | a25f45, bc4a75, ff89c9 | `td-headers-attr`, `aria-required-children`, `aria-required-parent` |
| **Enable** the disabled rule first (`enabled:false`, `wcag2aaa`), then map ruleId→2.4.4 | fd3a94 | `identical-links-same-purpose` |

**Caveats called out by the audit:** `meta-viewport` (b4f0c3) and `color-contrast`/`color-contrast-enhanced` (afw4f7/09o5cg) need the collection `runOnly` widened (09o5cg's AAA rule needs `wcag2aaa` which `eval-page.js` excludes; akn7bn/4b1c6c need all-frame axe injection because v3 only injects into the top frame). `frame-title` (4b1c6c) is name-presence only and does **not** capture the relational equivalent-purpose rule.

### B. new-runner — *authoritative deterministic dispositions over already-collected data*

These GATE conformance. Most are **detectors over existing DOM/AX data, not new instruments** (the audit verified the raw signals are already collected).

| Action | Rules served | Notes |
|---|---|---|
| **Static AX-name presence runner** (read CDP `axName`/`axRole`/`inTree` **without activation**) **(NEW applicability vs technique report)** | 23a2a8, 7d6734, 8fc3b6, 59796f, c487ae, e086e5, 2t702h, 97a4e1, cae760, m6b1q3, ffd0e9 | Covers the non-widget targets `ax-state-diff` misses (object/svg/iframe/summary/heading/area/doc-biblioref). Must handle: Presentational-Roles-Conflict (role=none + focusable → still applicable), space-trim, input-image **default-name "Submit Query" exclusion** (59796f), input[type=image] **exclusion** for buttons (97a4e1), media-MIME gating for objects (8fc3b6). |
| **ARIA-spec validity runner** with bundled WAI-ARIA 1.2 + Graphics + DPUB reference tables **(NEW)** | 4e8ab6, 5c01ea, 5f99a7, 674b10, 6a7281, 46ca7f | Five distinct checks: required states/props present; attribute permitted on role/element; attribute-name defined; role-token valid (non-abstract, fallback semantics); value-type valid (per token sets). `aria-query` rolesMap is a partial source but **insufficient** for conditionals (focusable-separator `aria-valuenow`). Static DOM, role-agnostic — do **not** reuse `ax-state-diff`'s widget gate. |
| **Required-owned / required-context runner** over a **full AX tree with parentage/ownership edges** | bc4a75, ff89c9 | Depends on the new full-AX-tree instrument (B-list below). Honors direct-parent strictness, aria-owns rewiring, shadow boundaries, presentational-node skipping, aria-busy exemption. |
| **Table header-association runner** (cell ids + headers token lists + same-table membership) **(NEW class)** | a25f45 | Mirrors `td-headers-attr`'s evaluate; raw DOM signal already in-page. Promote to gating. |
| **1.4.6 enhanced-contrast disposition** — parameterize `text-contrast-pixel` with `threshold = isLarge ? 4.5 : 7.0` + register a 1.4.6 obligation **(NEW SC)** | 09o5cg | Reuses existing `renderedRatio` + size class + exemptions; emit a second claim bound to `1.4.6`. |
| **Gradient/image + text-shadow contrast arms** — add `bestContrast()` (highest-possible region) alongside `worstContrast()`; model text-shadow halo as a backdrop layer | afw4f7, 09o5cg | Removes abstain on Passed Ex 2 / Failed Ex 2/3/7 and the white-shadow-lifts-contrast case. Computable from already-collected pixels. |
| **Deterministic 2.4.2 non-empty-title runner** (consume `structure.title`) | 2779a5 | Converts PARTIAL→CAPTURED for non-emptiness. Obligation slot already reserved (`build-v3.js`). |
| **Presentational-children focusable-content runner** (flat-tree descendant focusability over the applicable role set) **(NEW)** | 307n5z | Reuses `kbd-graph` FOCUSABLE_SEL scoped to the container; honors disabled/href-less-`a`/adjacent-sibling exemptions. |
| **aria-hidden subtree-focusability runner** (enumerate `[aria-hidden="true"]`, walk flat tree for tabbable descendants) **(NEW)** | 6cfa84 | Reuse `realKeyboardReach` + `closest('[aria-hidden="true"]')`; encode exact-string `"true"` matching, nested `aria-hidden=false` does-not-reset, focus-sentinel ~1s exception. |
| **1.1.1 decorative-exposure / ignored-image runner** (keyed off `inTree`/`ignoredReasons`/`isImage`, not `factRole`) **(NEW applicability path)** | 46ca7f, e88epe | Establishes applicability for AT-excluded img/svg/canvas the `IMG_ROLE` oracle never enumerates; e88epe's decorative-vs-content verdict then routes to the judge. |
| **Scrollable-region keyboard-reach runner** (region/descendant in Tab ring, or inert) **(NEW)** | 0ssw9k | Depends on the scrollable-region instrument (B-list). |
| **Iframe tab-order runner** (negative-tabindex on iframe with focusable inner content) **(NEW)** | akn7bn | Depends on inner-frame focusability instrument. |
| **Focus-visible re-calibration** (whole-viewport diff, HSL space, drop SIMPLE_CONTROL precondition + over-strict thresholds) | oj04fd | Aligns the existing runner to the rule's "one device pixel HSL difference" test. |
| **Relational identical-links runner** (same-resource pass; differing → judgment) | fd3a94 | Depends on link-set + destination instruments. |
| **Relational iframe-set pre-filter runner** (same-final-resource pass; distinct → review) | 4b1c6c | Depends on iframe-name-set + resource-resolution instruments. |
| **2.4.2 applicability fix** — treat empty/whitespace-only title as **Inapplicable** (not a barrier) | c4a8a4 | Fixes over-enumeration + barrier-vs-Inapplicable mismatch. |

### C. new-instrument — *genuinely uncollected raw signals*

| Action | Rules served | Notes |
|---|---|---|
| **Relational link-set instrument** — enumerate semantic links, group by matching non-empty name + same programmatic context **(NEW)** | fd3a94, 5effbb | Dossier KNOWN-MISSING: "compare two links' destinations." |
| **Link destination-resolution probe** — fetch/HEAD-follow href incl. **instant (0s) redirects**, distinguish instant vs delayed refresh **(NEW)** | fd3a94 | Every `page.goto` today hits only the single fixture; no per-link off-page fetch. |
| **Iframe-name-set instrument** — enumerate iframes, compute accessible name (title/aria-label/aria-labelledby; alt ignored), AX-tree inclusion, flat-tree/shadow-slot + srcdoc traversal, group by matching name **(NEW)** | 4b1c6c | Dossier KNOWN-MISSING: "compare two iframes' content." |
| **Embedded-resource resolution + content capture** for iframe sets (final URL after redirect, content snapshot) **(NEW)** | 4b1c6c | No iframe content delta collected. |
| **Full AX tree with parent/child + owned-children edges** (`getFullAXTree`) **(NEW)** | bc4a75, ff89c9 | `getAXNodeAndAncestors` already *fetches* ancestors per element but **discards** them; need retained tree + aria-owns/shadow rewiring. |
| **Full-page `[role]` attribute inventory** (`querySelectorAll('[role]')` + hidden flag) **(NEW sampler gap)** | 674b10 | `out.elements` is a focusable/meaningful sample — non-focusable typo-role spans never inventoried. |
| **Programmatic link-context as TEXT** (closest block/`<p>`, enclosing `<li>`, `<td>`+associated `<th>`, resolved aria-describedby/labelledby target) **(NEW)** | 5effbb, cc0f0a | A pixel surrounding-region crop is not a substitute (over-passes Failed Ex 4/5/6). |
| **Per-field visual-context signal** (nearest visible heading/legend linked to the field, with visibility state) + region screenshot **(NEW)** | cc0f0a | Drives Passed Ex 5/6 (disambiguating visible heading) vs Failed Ex 4/5 (SR-only context). |
| **Heading → first-following-content flat-tree adjacency** **(NEW)** | b49b2e | `structure.headings` is a flat list with no linkage to following content. |
| **Per-`<img>` request-state fact** (`complete`/`naturalWidth`/`currentSrc`) | qt1vmo, e88epe | For the broken-image Inapplicable exception (qt1vmo Ex 9, e88epe Ex 10). |
| **Flat-tree ancestor accessible-name chain** | e88epe | For the named-from-author-ancestor exception (Inapplicable Ex 4). |
| **Per-element scroll-distance vs padding probe** **(NEW)** | 0ssw9k | `scrollWidth/Height` only appears in the 320px reflow probe today. |
| **Inner-frame focusability + all-frame axe injection** **(NEW)** | akn7bn | Top-doc sampler never enters `contentDocument`; axe injected only into top frame. |
| **Shadow-DOM-piercing text-node enumeration + shadow-aware locator** **(NEW)** | afw4f7 | XPath-from-document cannot reach shadow trees; `measureContrast`'s painter scan doesn't pierce shadow roots. |
| **Title-element DOM inventory** (per-`<title>` text, count, first-document-descendant, shadow-tree flag) | 2779a5 | Precision/edge improvement over `document.title` (Expectation-1-vs-2 split, non-coincidental shadow-root handling). Not required for common pass/fail. |
| **Pre-existing + async error-indicator capture** | 36b590 | Probe today synthesizes one invalid submit; misses the page's real validation states + delayed/async surfacing. |
| **Iframe as a candidate** in the sampler (admit `<iframe>` so a collector record exists) **(NEW root cause)** | cae760 | Facts already collected per element, but iframes never become candidates. |

### D. activate-inert-lane — *turn on the LLM PROVISIONAL lanes (stays non-authoritative)*

Requires `opts.runLlm` + an injected agent. **Never gates** (PROVISIONAL ceiling = PARTIAL). Per the on-hold corpus-run policy, do **not** auto-trigger the corpus run.

| Lane | Rules served |
|---|---|
| `alt-text-adequacy-v0` | qt1vmo, e88epe |
| `link-purpose-v0` | 5effbb, fd3a94 |
| `heading-descriptive-v0` (+ form-label variant) | cc0f0a, b49b2e |
| `error-identification-v0` | 36b590 |
| `page-title-v0` | c4a8a4, 2779a5 |
| `focus-visible-clear-v0` (cross-check) | oj04fd |
| `contrast-over-complex-backdrop-v0` (PROVISIONAL fill on non-uniform backdrops) | afw4f7 |
| **Promote** `focus-visual-retry` from `shadow` to authoritative (grow gold to ~149, sealed eval, independent raters, measurement validation) | oj04fd |

### E. extend-rubric / new-rubric / prompt-change — *improve the (non-authoritative) judging lanes*

| Action | Rules served |
|---|---|
| Wire 2.4.6 descriptiveness family to **form fields** (`familiesFor()` + mirror in `coverage-registry.js`) | cc0f0a |
| Feed programmatic link context + sibling-destinations as **TEXT** (not pixels) into `link-purpose-v0`; align its self-description with reality | 5effbb, fd3a94 |
| Heading rubric: judge against first-following flat-tree content, treat off-screen-in-tree as applicable, gate on non-empty accessible name + in-tree | b49b2e |
| Error rubric: fold cause-OR-fix into one limb (don't defer fix to 3.3.3), add Exp1 field-identification + visible-vs-AX split | 36b590 |
| Broaden non-text-content applicability to enumerate img/canvas/svg by **tag** (not only `IMG_ROLE`), add named-from-author + broken-image exclusions | qt1vmo, e88epe |
| Add named-from-author-ancestor + broken-image N/A returns | e88epe, qt1vmo |
| New **relational 2.4.4 / iframe equivalent-purpose rubrics** | fd3a94, 4b1c6c |
| Tighten applicability gates (non-empty name + in-AX-tree) for adequacy/descriptiveness rubrics | qt1vmo, 5effbb, b49b2e |

### F. none / out-of-domain

| Disposition | Rules |
|---|---|
| Out of domain — no action warranted | 1a02b0, ee13b5 |
| Do **not** rely on the adequacy rubric for the *presence* check (wrong instrument) | 23a2a8 (alt-text-adequacy), 5effbb (link-name as descriptiveness), c487ae (link purpose), e086e5 (3.3.2 rubric), 307n5z (LLM is wrong lane) |

---

## 5. Per-rule detail table

Ordered by primary requirement (SC) then rule id. **Impl** = WAI implementation level (manual/semi-auto, per the reproduced filter).

| Rule | Requirement(s) | Class | Coverage | What it tests | Procedure divergence / primary additional need |
|---|---|---|---|---|---|
| **23a2a8** | 1.1.1 | name-presence | PARTIAL | img / role=img has non-empty accessible name OR role=none/presentation | axe `image-alt`/`role-img-alt` decide it exactly but 1.1.1 dropped; `ax-state-diff` never reaches static img. **→ surface-axe (1.1.1) + static name-presence runner** (handle Presentational-Roles-Conflict, alt-space trim). SVG is *not* broadly in scope (only explicit role=img). |
| **46ca7f** | 1.1.1 (secondary) | aria-validity | PARTIAL | Element marked decorative (empty alt / role=none) is absent from AX tree or stays presentational | axe `presentation-role-conflict` is the exact rule but is **best-practice-tagged (no wcag tag)** → empty SC set → double-dropped. **→ surface-axe (carry rule id + ruleId→1.1.1 map) constrained to img/svg + decorative-exposure runner.** |
| **59796f** | 1.1.1, 4.1.2 | name-presence | PARTIAL | input[type=image] has a name ≠ "" and ≠ default "Submit Query" | `ax-state-diff` false-CLEARs all 3 Failed examples (Chromium exposes default name "Submit"); no default-name guard. axe `input-image-alt` decides it. **→ surface-axe + name runner with default-name exclusion.** |
| **7d6734** | 1.1.1 | name-presence | PARTIAL | SVG with explicit role img/graphics-document/graphics-symbol has non-empty name | axe `svg-img-alt` is the literal implementation (excludes graphics-object, raw `<text>`); dropped. **→ surface-axe (scope to `svg-img-alt`) + optional svg-name-presence runner.** |
| **8fc3b6** | 1.1.1 | name-presence | PARTIAL | `<object>` embedding image/audio/video (no explicit role) has non-empty name | axe `object-alt` decides it; dropped. No object enumeration / MIME / load-state collected. **→ surface-axe + new-runner + new-instrument (object enumeration, resource MIME, load-vs-fallback).** |
| **c487ae** | 4.1.2, 2.4.4 (1.1.1 secondary) | name-presence | PARTIAL | Inheriting semantic link (a[href], role=link, area[href], doc-biblioref) has non-empty name | axe `link-name` (a[href] **only**) surfaces under 2.4.4 but the 4.1.2 limb is dropped; `ax-state-diff` self-invalidates on navigation. **→ surface-axe (promote + 4.1.2 binding) + full-applicability static link-name runner** (area, doc-biblioref, presentational-conflict). |
| **e88epe** | 1.1.1 | other | PARTIAL | Visible AT-ignored img/canvas/svg is *purely decorative* (inverse of name-presence; semantic pixel judgment) | Applicability never enumerated (oracle keys off `IMG_ROLE`, these resolve to `''`/`none`/`graphics-document`); axe is the wrong remedy (it passes alt=""). **→ decorative-ignored-image applicability path (off inTree/ignoredReasons/isImage) + activate adequacy rubric + new-instrument (ancestor name-chain, image request-state).** |
| **qt1vmo** | 1.1.1 | name-descriptiveness | PARTIAL | img/canvas/svg name serves equivalent purpose to the image (semantic) | Only inert `alt-text-adequacy-v0`; oracle gates on computed role (bare aria-labelled canvas/svg under-enumerated). **→ activate rubric + per-img request-state instrument + enumerate by tag.** *Not fully automatable.* |
| **1a02b0** | 1.3.1 (secondary; 1.2.8 primary) | media-transcript | OUT_OF_DOMAIN | Video audio+visuals have a correct text transcript | No media playback / audio+visual capture / content-equivalence / multi-page. **→ none (out of domain).** |
| **4e8ab6** | 1.3.1, 4.1.2, ARIA §5.2.2 | aria-validity | PARTIAL | Explicit role has all required states/properties present + non-empty | axe `aria-required-attr` is near-direct but 4.1.2 dropped; `ax-state-diff` tests state-change-on-activation, not presence; widget gate excludes heading/separator. **→ surface-axe (ruleId-scoped) + required-states runner (aria-query rolesMap + focusable-separator/scrollbar conditionals).** |
| **5c01ea** | 1.3.1, 4.1.2, ARIA §8.6 | aria-validity | PARTIAL | ARIA attribute is permitted (global / role-inherited / ARIA-in-HTML) | axe `aria-allowed-attr` decides it; dropped. `ax-state-diff` never checks permitted-ness. **→ surface-axe (ruleId) + static aria-permitted runner with ARIA-in-HTML matrix.** |
| **5f99a7** | 1.3.1, 4.1.2 | aria-validity | PARTIAL | Every `aria-*` attribute NAME is defined in WAI-ARIA 1.2 (static spelling check) | axe `aria-valid-attr` (actId 5f99a7) is exact; dropped (only wcag412 tag). **→ surface-axe (per-ruleId) or trivial DOM name-list runner.** |
| **674b10** | 1.3.1, 4.1.2 | aria-validity | PARTIAL | Role attribute has ≥1 valid non-abstract token (fallback semantics) | axe `aria-roles` decides it (whole-document sweep); dropped. **Sampler gap**: non-focusable typo-role spans never inventoried. **→ surface-axe (preferred, unaffected by sampler) OR full-page [role] instrument + token-validation runner.** |
| **6a7281** | 1.3.1, 4.1.2, ARIA §6.2.4 | aria-validity | PARTIAL | ARIA attribute value is valid for its WAI-ARIA value type | axe `aria-valid-attr-value` is near-1:1; dropped. **→ surface-axe (ruleId) + aria-value-type runner with WAI-ARIA value-type + token tables (ID-refs always valid).** |
| **a25f45** | 1.3.1 | table-semantics | PARTIAL | `headers` tokens refer to cells in the same table, none self-referential | axe `td-headers-attr` (actId a25f45) is faithful AND **already surfaced** under 1.3.1 — but as **non-authoritative shadow**; `incomplete` (empty-headers) dropped. **→ promote to gating disposition OR authoritative table-header runner; emit `incomplete`.** |
| **bc4a75** | 1.3.1 | aria-validity | PARTIAL | Container role only owns its required owned-element roles | axe `aria-required-children` IS surfaced (1.3.1) but shadow-only + violation-only (empty-container needs-review dropped). No ownership edges collected. **→ promote + collect axe `incomplete` + full-AX-tree-with-ownership instrument + required-owned runner.** |
| **ff89c9** | 1.3.1 | aria-validity | PARTIAL | Element with required context role is a DIRECT AX-tree child of a valid container | axe `aria-required-parent` IS surfaced (1.3.1) but shadow + looser matcher (ancestor not direct-parent); single-node fetch (`fetchRelatives:false`) drops parentage. **→ promote-with-caveats + full-AX-tree-with-parentage instrument + required-context runner.** |
| **e086e5** | 4.1.2 (1.3.1 secondary) | name-presence | PARTIAL | Form-field-role element / roleless typed input has non-empty name | axe label-family decides it (incl. trim, disabled-applies, in-tree); 4.1.2 dropped. `ax-state-diff` misses textbox/listbox/searchbox/spinbutton/textarea; `field-label-probe` is 3.3.2 (suppresses on nearby text, excludes placeholder). **→ surface-axe (4 rule ids) + resting AX-name runner OR widen ax-state-diff.** |
| **ee13b5** | 1.3.1 | media-transcript | OUT_OF_DOMAIN | Silent video's visual content has a correct transcript | No media playback / audio-track detection / video-frame comprehension / multi-page. **→ none (out of domain).** |
| **b4f0c3** | 1.4.10 (in-scope; 1.4.4 primary) | reflow-zoom | PARTIAL | meta viewport content doesn't lock zoom below 200% | axe `meta-viewport` decides it AND **is surfaced** — but under its primary SC **1.4.4**; the in-scope **1.4.10** is the rule's *secondary* SC, which nothing binds. `reflow-overflow-probe` never reads the meta. **→ deterministic meta-viewport runner (gate under 1.4.4; optional 1.4.10 supplement).** |
| **09o5cg** | 1.4.3 (in-scope; 1.4.6 primary) | contrast | PARTIAL | Text meets 7:1 (normal) / 4.5:1 (large) enhanced contrast | `text-contrast-pixel` applicability+exemptions match but threshold is **hardcoded to 1.4.3 minimum**; **no 1.4.6 obligation in v3** → false-clears 5.7–6.4:1 flat cases. **→ parameterize the runner with enhanced thresholds + register 1.4.6.** |
| **afw4f7** | 1.4.3 | contrast | PARTIAL | Text meets 3:1/4.5:1 minimum (highest-possible contrast) | Faithful over flat-opaque-uniform only; gradient/image/text-shadow/**shadow-DOM** abstain to PARTIAL. **→ bestContrast() gradient arm + text-shadow arm + shadow-DOM-piercing instrument + activate complex-backdrop rubric.** |
| **0ssw9k** | 2.1.1 | keyboard-focus | PARTIAL | Scrollable region reachable by sequential focus (or has focusable descendant / inert) | axe `scrollable-region-focusable` owns the full rule; 2.1.1 dropped. The 2.1.1 runner tests control activation, not scroll-reach. **→ surface-axe (primary) + per-element scroll-distance instrument + reach runner.** |
| **akn7bn** | 2.1.1 | keyboard-focus | NOT_CAPTURED | Iframe with focusable inner content has no negative tabindex | Sampler never enters `contentDocument`; iframe gets role=null/focusable=false → zero obligations; axe `frame-focusable-content` dropped **and** non-functional (top-frame-only injection). **→ inner-frame focusability instrument + all-frame axe + iframe tab-order runner.** |
| **2779a5** | 2.4.2 | page-title | PARTIAL | Document has a non-empty, non-whitespace first `<title>` | `structure.title` collected + inert rubric; **no deterministic runner** (auto-PARTIAL). **→ trivial non-empty 2.4.2 catalog runner (→ CAPTURED) + interim surface-axe `document-title`.** |
| **c4a8a4** | 2.4.2 | page-title | PARTIAL | First `<title>` *describes* the document topic (semantic) | Applicability captured via `document.title`; descriptiveness LLM-only + over-enumerates empty titles (should be Inapplicable). **→ activate rubric + harden to DOM topic + applicability fix.** *Descriptiveness not deterministic.* |
| **5effbb** | 2.4.4 | name-descriptiveness | PARTIAL | Link name + programmatic context describes purpose | Wrong axe rule (`link-name` = presence, passes "More"); rubric inert AND **input-starved** (no programmatic context collected — its prose claim is aspirational). **→ programmatic-context + sibling-destination instruments + feed as TEXT + activate rubric.** |
| **fd3a94** | 2.4.4 | relational-comparison | NOT_CAPTURED | Identically-named, same-context links resolve to equivalent resources | No link-set grouping / destination / redirect / equivalence collected; axe rule is `enabled:false` + 2.4.9. **→ link-set + destination instruments + same-resource runner + equivalence rubric + enable/surface axe.** *Not fully automatable.* |
| **b49b2e** | 2.4.6 | name-descriptiveness | PARTIAL | Heading describes first-following flat-tree content (semantic) | No 2.4.6 runner; axe has none; only inert rubric (judges viewport pixels, not flat-tree first-following content; misses off-screen-in-tree headings). **→ activate rubric + flat-tree adjacency instrument + applicability gates.** |
| **cc0f0a** | 2.4.6 | name-descriptiveness | PARTIAL | Field label + visual context describes purpose (semantic) | `field-label-probe` is 3.3.2 presence only; 2.4.6 family **never enumerated for form fields**; rubric structurally unreachable. **→ wire 2.4.6 to form fields + per-field visual-context instrument + activate rubric.** |
| **oj04fd** | 2.4.7 | keyboard-focus | PARTIAL | Focused element changes ≥1 viewport pixel's HSL | `focus-visual-retry` runs but is **pinned at shadow**; clip too small (misses remote indicator → false BARRIER), sRGB not HSL, thresholds stricter than rule, SIMPLE_CONTROL precondition narrows barrier. **→ promote lane + whole-viewport HSL re-calibration.** |
| **36b590** | 3.3.1 | error-message | PARTIAL | Error indicator identifies field + describes cause/fix, visible AND in AX tree | `form-error-probe` is barrier-only (total-absence); no content/identify/visible-vs-AX-tree check; menuitemcheckbox/menuitemradio unrouted. **→ extend rubric + activate lane + extend probe (visible-vs-AX split) + pre-existing/async error instrument.** *Content judgment not deterministic.* |
| **2t702h** | 4.1.2 | name-presence | PARTIAL | Summary disclosure button (first child of details) has non-empty name | axe `summary-name` exact (details parent, first-summary, name any-of); 4.1.2 dropped. `ax-state-diff` excludes role `DisclosureTriangle` + is activation probe. **→ surface-axe (scope to `summary-name`) + summary-name-presence runner (not via WIDGET_ROLE).** |
| **307n5z** | 4.1.2 | aria-validity | PARTIAL | Presentational-children role has no focusable descendant | axe `nested-interactive` is exact (confirmed FN in pilot, bucket fn); 4.1.2 dropped. `ax-state-diff` over/under-includes roles + tests own state. **→ surface-axe + deterministic presentational-children runner (DOM+focusability, honor disabled/href-less-a/adjacent exemptions).** |
| **4b1c6c** | 4.1.2 | other | NOT_CAPTURED | Identically-named iframes embed equivalent resources | No iframe name-set / embedded-resource capture / cross-element comparison; `frame-title` is presence only. **→ iframe-name-set + resource-resolution instruments + same-resource pre-filter runner + equivalence rubric.** *Not fully automatable.* |
| **6cfa84** | 4.1.2 | aria-validity | PARTIAL | `aria-hidden="true"` subtree has no tabbable descendant | axe `aria-hidden-focus` (actId 6cfa84) is exact; 4.1.2 dropped. `ax-state-diff` orthogonal. **→ surface-axe (ruleId allow-list) + structural subtree runner (reuse FOCUSABLE_SEL/realKeyboardReach; focus-sentinel ~1s via existing focus-drive primitive).** |
| **97a4e1** | 4.1.2 | name-presence | PARTIAL | Button-role element (≠ input[type=image]) has non-empty name | axe `button-name` decides it; 4.1.2 dropped. `ax-state-diff` is activation-gated side-effect; **does not exclude input[type=image]**. **→ surface-axe (1 SC) + barrier-only name-presence runner (exclude input[type=image], include role=none-conflict button).** |
| **cae760** | 4.1.2 | name-presence | PARTIAL | Iframe (in tree, not neg-tabindex/decorative) has non-empty name from title/aria-label/labelledby | axe `frame-title` decides it (whole-document); 4.1.2 dropped. Root cause: **sampler never admits `<iframe>` as a candidate**. **→ surface-axe + admit iframe in sampler + iframe-name runner with cae760 exclusions.** |
| **m6b1q3** | 4.1.2 | name-presence | PARTIAL | `role=menuitem` (in tree) has non-empty name (static, no activation) | axe `aria-command-name` is static/exact; 4.1.2 dropped. `ax-state-diff` barrier needs **keyboard-reach + no-navigation** — misses roving-tabindex + navigating menuitems. **→ surface-axe + static name-presence runner (decouple from activation gates).** |
| **ffd0e9** | ARIA §5.2.8 (no WCAG SC) | name-presence | PARTIAL | Semantic heading (in tree) has non-empty name | axe `empty-heading` (actId ffd0e9) is the reference impl but **no wcag tag** + ledger is SC-keyed (no obligation slot for an ARIA-author-only rule). **→ surface-axe (ruleId-keyed, preserve non-wcag id) + new non-SC family + heading-name-presence runner (point existing CDP AX read at the heading set).** |

---

## 6. Appendix

### A. The 6 non-automatable rules — specific needs

These cannot be fully captured by a deterministic gating runner. For each, the *only* path to any verdict is listed; **none can reach CAPTURED authoritatively**.

1. **`qt1vmo` — Image accessible name is descriptive (1.1.1).** Inherently a semantic name-vs-pixel equivalence judgment (e.g. alt "ERCIM logo" on a W3C logo = fail). **Need:** activate `alt-text-adequacy-v0` (compares name to element-crop), + a per-`<img>` request-state instrument for the broken-image Inapplicable exception, + enumerate img/canvas/svg by tag so bare aria-labelled canvas/svg aren't under-enumerated. Non-authoritative ceiling = PARTIAL.

2. **`1a02b0` — Audio and visuals of video have transcript (1.3.1 secondary).** **Out of domain.** Needs media playback, audio+visual output capture, content-equivalence comparison, and multi-page fetch for linked transcripts. The lone in-domain sliver (transcript exposed in AX tree) is non-dispositive. **No action warranted.**

3. **`ee13b5` — Video visual-only content has transcript (1.3.1).** **Out of domain.** Needs a media instrument (start video, detect absence of audio track), **video-frame comprehension** (failed examples are AX-valid transcripts that are simply inaccurate), and multi-page fetch. **No action warranted.**

4. **`fd3a94` — Identical-name links serve equivalent purpose (2.4.4).** Relational. **Need:** a link-set instrument (group by matching name + same context), a destination-resolution probe (fetch/follow incl. instant redirects), a same-resource pre-filter runner (authoritative for byte/URL-identical cases), and a relational equivalence rubric (the "equivalent resources" + "ambiguous to users in general" limbs). `link-purpose-v0` gestures at this mode but is input-starved. Enable/surface axe `identical-links-same-purpose` as a cheap cross-signal (misses SVG `a`).

5. **`36b590` — Error message describes invalid value (3.3.1).** `form-error-probe` only detects total absence of an error surface. **Need:** extend the rubric to judge cause/fix + field-identification, extend the probe with a **visible-text vs AX-tree split** (to separate the display:none case from the aria-hidden case), activate the rubric, and add a pre-existing/async error-indicator instrument. The cause/fix-quality judgment is not deterministic.

6. **`4b1c6c` — Identical-name iframes serve equivalent purpose (4.1.2).** Relational. **Need:** an iframe-name-set instrument (enumerate, compute name, AX-tree inclusion, flat-tree/shadow/srcdoc traversal, group by name), embedded-resource resolution + content capture, a same-resource deterministic pre-filter runner, and an equivalence rubric. `frame-title` (presence) does **not** capture it.

### B. Rules already adequately covered (CAPTURED)

**None.** All 40 audited rules are PARTIAL, NOT_CAPTURED, or OUT_OF_DOMAIN. The rules *closest* to CAPTURED — each one deterministic-runner-change away — are:

- **`2779a5`** (non-empty page title): `structure.title` is already collected; a trivial "barrier if empty/whitespace-only" catalog runner converts it to CAPTURED. The obligation slot is already reserved in `build-v3.js`.
- **`a25f45`** (headers refer to same table): axe `td-headers-attr` already runs **and is surfaced** (1.3.1) — only the promotion from non-authoritative shadow to gating disposition (or an equivalent native runner) is missing.
- **`bc4a75` / `ff89c9`** (required owned/context): axe `aria-required-children`/`aria-required-parent` already run **and are surfaced** under 1.3.1; promotion to authoritative is gated on collecting the full AX tree with ownership/parentage edges and validating axe's looser matcher against the rules' direct-parent strictness.

The general pattern: the harness has the **raw signals** for the large majority of these rules already collected (axe runs the rule; CDP AX name/role/inTree is captured; DOM attributes are present). The dominant blockers are (1) **surfacing/authority policy** (axe findings dropped or held as shadow) and (2) **missing detectors over existing data** — not missing instruments. The genuinely new *instruments* are concentrated in the relational rules (fd3a94, 4b1c6c, 5effbb), the full-AX-tree/ownership rules (bc4a75, ff89c9), shadow-DOM (afw4f7), iframe interiors (akn7bn, cae760), and the media rules (1a02b0, ee13b5 — out of domain).
