# A11yAnnotator v3 — WCAG Technique Coverage Analysis

**Date:** 2026-06-17
**Scope:** 22 in-scope WCAG Success Criteria (from `categories.json`) across 9 categories. Technique inventory: **174 unique techniques / 210 SC–technique pairs** pulled from `w3c/wcag` into `wcag-techniques/`. This report audits, per SC and per technique, whether some lane of the v3 harness *assesses the condition the technique addresses* — for a FAILURE technique, detects the failure; for a SUFFICIENT technique, verifies the technique (or an equivalent) is satisfied; for an ADVISORY technique, assesses the quality it promotes.

The harness assesses **rendered web pages at runtime**. It does not author or assess PDF, Flash, Silverlight, SMIL, or server-side code; techniques in those media are marked OUT_OF_DOMAIN.

**Companion artifacts:** the technique corpus itself lives in [`wcag-techniques/`](../../../wcag-techniques/) (174 HTML pages from `w3c/wcag@7bc46c7`, by technology, + manifest); the full machine-readable verdict set (every technique's verdict, lanes, rationale, gap, recommendation, and audit changes) is in [`wcag-technique-coverage.json`](wcag-technique-coverage.json). A complementary **test-procedure** view — 40 manual/semi-automatic ACT rules (our SCs + ARIA) audited against the same lanes — is in [`ACT-RULES-COVERAGE-ANALYSIS.md`](ACT-RULES-COVERAGE-ANALYSIS.md).

---

## How to read this

### Verdicts (per technique)

| Verdict | Meaning |
|---|---|
| **CAPTURED** | Some lane genuinely assesses the technique's condition — a failure technique's failure is detected, or a sufficient technique's satisfied state is verified — at a tier that produces a real signal. |
| **PARTIAL** | The condition is touched but not fully assessed: e.g. only a sub-case is detected, the capability exists but is not surfaced/consumed, or the only assessing lane is non-authoritative and off by default. |
| **NOT_CAPTURED** | No lane assesses the technique's condition. A guidance-only skill that names the SC does **not** count as coverage — it emits no signal. |
| **OUT_OF_DOMAIN** | The technique targets a medium the harness does not assess (PDF/Flash/Silverlight/SMIL/server-side/pure authoring). |

### Authority tiers (which signals can decide conformance)

- **AUTHORITATIVE** — only deterministic CLAIM dispositions (catalog runners + collector DOM/geometry checks) can set an obligation pass/fail (cleared / BARRIER / PARTIAL).
- **SHADOW / CROSS-SIGNAL** — axe surfaced findings, IBM findings, LLM-rubric PROVISIONAL fills, VSR/keyboard instruments, order-check triage. Recorded and scored against gold, but **never** gate conformance. A PROVISIONAL fill only *fills* an auto-PARTIAL slot; it never overrides a CLAIM.
- **GUIDANCE-ONLY** — `skills/*.md` are instructions for a human/LLM judge. They are not detectors and emit no signal alone.

### Liveness (default run state)

- **Live by default:** catalog deterministic runners, collector DOM/geometry checks, and axe (axe-core runs ~90 rules at collection).
- **axe surfacing is allow-listed:** v3 consumes axe findings **only** for `{1.3.1, 1.3.5, 1.4.4, 2.4.4, 3.1.x}`. Every axe finding outside that set is **discarded** (raw `out.axe` dropped) — so axe rules for 1.1.1 (image-alt family), 1.4.3 (color-contrast), 1.4.1 (link-in-text-block), 3.3.2 (label), 4.1.2 (aria/name family) **run but are not consumed** = "capable but NOT surfaced."
- **Inert / opt-in by default:** IBM Equal Access (`opts.runChecker`), the LLM lane (atomic rubrics + whole-obligation agent; `opts.runLlm` + injected agent), and the VSR/keyboard instruments (`opts.runInstruments` + `resolveUrl`).

---

## Executive summary

### Per-SC overview

Verdict counts below are over the technique rows of each SC (including OUT_OF_DOMAIN). "Best tier" is the strongest authority tier reached by any in-domain technique of that SC.

| SC | Title | Category | #Tech | CAP | PART | NOT | OOD | Best tier | Single most important gap |
|---|---|---|---:|---:|---:|---:|---:|---|---|
| 1.1.1 | Non-text Content | text-alternatives | 39 | 1 | 19 | 17 | 2 | Shadow/inert | axe image-alt family runs but is dropped — surface it for 1.1.1 |
| 1.3.1 | Info and Relationships | adaptable | 28 | 1 | 17 | 10 | 0 | Shadow (live axe) | No authoritative runner; landmark/heading/presentation-conflict axe rules not surfaced |
| 1.3.2 | Meaningful Sequence | adaptable | 8 | 0 | 3 | 4 | 1 | Triage-only | Only uncalibrated within-column order triage; no meaning judgment |
| 1.4.1 | Use of Color | distinguishable | 9 | 0 | 4 | 5 | 0 | Shadow/inert | axe link-in-text-block (wcag141) runs but dropped; no color-meaning rubric |
| 1.4.3 | Contrast (Minimum) | distinguishable | 7 | 2 | 1 | 4 | 0 | **Authoritative** | Complex-backdrop failure (F83) only in inert rubric |
| 1.4.5 | Images of Text | distinguishable | 9 | 0 | 2 | 6 | 1 | Shadow/inert | Sole lane (images-of-text rubric) is inert; no authoritative/axe lane |
| 1.4.10 | Reflow | distinguishable | 11 | 5 | 2 | 4 | 0 | **Authoritative** | Probe is horizontal-only; F102 content-loss, vertical/sticky uncovered |
| 1.4.11 | Non-text Contrast | distinguishable | 5 | 0 | 2 | 3 | 0 | Guidance-only | Core 3:1 graphical-object/UI-boundary contrast has no automated lane |
| 1.4.13 | Content on Hover or Focus | distinguishable | 2 | 1 | 1 | 0 | 0 | **Authoritative** | Barrier-only runner cannot verify SCR39 success; focus limb unprobed |
| 2.1.1 | Keyboard | keyboard-accessible | 6 | 0 | 6 | 0 | 0 | **Authoritative** (barrier-only) | Roleless/non-focusable controls (F42/F54/F55) below applicability gate |
| 2.1.2 | No Keyboard Trap | keyboard-accessible | 2 | 0 | 2 | 0 | 0 | **Authoritative** | Opaque plug-in trap + G21 "documented-before-entry" precedence |
| 2.4.2 | Page Titled | navigable | 3 | 0 | 2 | 1 | 0 | Shadow/inert | Title descriptiveness only in inert rubric; presence is authoritative |
| 2.4.3 | Focus Order | navigable | 3 | 0 | 2 | 1 | 0 | Triage-only | F85 dynamic dialog focus management uncaptured; no 2.4.3 rubric |
| 2.4.4 | Link Purpose (In Context) | navigable | 10 | 1 | 6 | 3 | 0 | Shadow (live axe) | Purpose adequacy only in inert rubric; new-window advisories uncovered |
| 2.4.6 | Headings and Labels | navigable | 4 | 0 | 2 | 2 | 0 | Shadow/inert | Heading/label descriptiveness only in inert rubric |
| 2.4.7 | Focus Visible | navigable | 9 | 3 | 6 | 0 | 0 | **Authoritative** | Own-background focus shifts (C15/SCR31), F55 retention, contrast/size |
| 2.4.10 | Section Headings (AAA) | navigable | 2 | 0 | 2 | 0 | 0 | Guidance-only | No section-to-heading coverage lane at all |
| 3.3.1 | Error Identification | input-assistance | 13 | 0 | 9 | 2 | 2 | **Authoritative** (barrier-only) | All affirmative error-text quality only in inert rubric |
| 3.3.2 | Labels or Instructions | input-assistance | 8 | 1 | 2 | 4 | 1 | **Authoritative** | Per-field probe blind to groups (F82/H71); aria-required vs visual cue |
| 3.3.3 | Error Suggestion | input-assistance | 9 | 0 | 6 | 2 | 1 | Shadow/inert | No authoritative lane; suggestion content only in inert rubric |
| 4.1.2 | Name, Role, Value | compatible | 14 | 3 | 7 | 4 | 0 | **Authoritative** | Roleless controls (F42/F59) below applicability gate; name adequacy |
| 4.1.3 | Status Messages | compatible | 9 | 0 | 5 | 4 | 0 | Shadow/inert | Sole lane insertion-only + click-only + opt-in; skips submit triggers |

> Counts are derived from the audited verdict data; per-SC tables below are authoritative for individual technique rows. Some techniques recur across SCs (e.g. ARIA2, ARIA18, ARIA19, G84, G85, G140, G174, H2, H24, H30, H44, SCR18, SCR24, G201, F82-family) — the 210 figure counts each SC–technique pair once.

### Big cross-cutting findings

- **Surfacing existing axe capability is the single highest-ROI win.** axe-core already runs the image-alt family (1.1.1: `image-alt`/`svg-img-alt`/`input-image-alt`/`object-alt`/`area-alt`), `color-contrast` (1.4.3), `link-in-text-block` (1.4.1), `label`/`select-name`/`button-name`/aria-name family (3.3.2/4.1.2), and landmark/heading rules (1.3.1) at collection time — but v3 **discards** every finding outside the `{1.3.1, 1.3.5, 1.4.4, 2.4.4, 3.1.x}` allow-list. Adding 1.1.1 (and the 3.3.x/4.1.2/1.4.1/1.4.3 paths) to surfacing converts a large band of PARTIAL rows into CAPTURED-shadow signals for zero new detection logic.
- **Every "meaning" SC depends on the inert LLM lane.** Alt-text adequacy (1.1.1), info-relationships (1.3.1), color redundancy (1.4.1), images-of-text (1.4.5), title/heading/label descriptiveness (2.4.2/2.4.6/2.4.10), link purpose (2.4.4), error identification/suggestion (3.3.1/3.3.3), and name adequacy (4.1.2) are all assessed **only** by LLM rubrics that are SHADOW and OFF by default. Activating `opts.runLlm` with an injected agent is the difference between "no signal" and a scored PROVISIONAL fill across roughly a dozen SCs.
- **Two SCs have no automated lane at all: 1.4.11 (Non-text Contrast) and 2.4.10 (Section Headings).** Their only "lane" is a guidance-only skill. There is no runner, no surfaced/consumed axe rule, and no LLM rubric for the 3:1 graphical-object/UI-boundary contrast (G207/G209) or the section-to-heading coverage check (G141/H69).
- **The strongest authoritative runners are barrier-only and cannot verify sufficient techniques.** 2.1.1 (keyboard-activation), 1.4.13 (hover-content-tri), and 3.3.1 (form-error-probe) are open-scope-never-clearable: they can flag a failure but can never positively confirm a sufficient/advisory technique is satisfied. This caps SCR39, G90/G202/SCR29, and the G83/G84/G85 family at PARTIAL even where the deterministic lane fires.
- **Applicability gates create systematic blind spots for roleless scripted controls.** The 4.1.2 oracle only enrolls a name-role-value obligation when a `WIDGET_ROLE` matches, and the keyboard-activation runner only acts on `isActivationControl` elements. The canonical "div/span turned into a control with no role" failures (F42, F54, F55, F59) fall below these gates and are NOT_CAPTURED for the role facet.
- **Whitespace/character-level and cross-viewport/temporal failures are structural blind spots.** Plain-text pseudo-columns/tables (F32/F33/F34/F48), intra-word whitespace, homoglyphs/ASCII art (F71/F72/H86), content that disappears at 320px (F102), and stale text-alternatives after a content update (F20) require character analysis, cross-viewport diffs, or temporal vision diffs that no lane performs.
- **The 4.1.3 status-detector is real but narrow.** It is the only runtime 4.1.3 signal: opt-in, shadow, insertion-only (toggling pre-rendered hidden content is invisible), and click-only (it deliberately **excludes submit triggers**) — so it catches the canonical F103 failure but misses each technique's own submit-driven and async/timer-driven examples, and `ariaNotify()` leaves no DOM footprint at all.
- **Some gaps are missing *instruments*, not missing judges** (see [Missing interaction-data instruments](#missing-interaction-data-instruments)). The harness never listens to native dialogs or `ariaNotify`, never drives a form *submit* for status, never captures a second viewport or activates a style/zoom control, and only sees inline `onclick` (not `addEventListener`). No judge can decide those until the raw signal is collected — distinct from the (larger) set of gaps where the data is already in hand and only a detector/rubric is missing.
- **Several lane overclaims were corrected in audit.** Across the SCs, **39** overclaims were found and reversed by the adversarial pass — most commonly (a) crediting a runner bound to a *different* SC (e.g. `ax-state-diff` is `sc:'4.1.2'`, not 1.1.1/2.4.4) as authoritative coverage, (b) crediting a guidance-only skill as PARTIAL coverage, and (c) crediting the barrier-only catalog runners as positive verification of sufficient techniques.

---

## Coverage gaps & recommendations roadmap

Grouped by theme, ordered roughly by return on investment.

### 1. Surface existing axe capability (highest ROI — capability already runs)

axe-core runs these rules at collection; v3 just needs to consume them (add the SC to `AXE_SURFACED_SCS` or add a rule-id → SC mapping). Each becomes a live shadow cross-signal scored vs gold.

- **1.1.1 — `image-alt` / `input-image-alt` / `area-alt` / `svg-img-alt` family.** Converts F65, F38, F39, H2, H24, H36, H37, H67, G94, G95, G196, ARIA10 (idref validity) from PARTIAL toward CAPTURED-shadow for the presence/null half. *This is the single highest-impact action for SC 1.1.1.*
- **1.3.1 — `region` / `landmark-unique` / `heading-order` / `empty-heading` / `presentation-role-conflict`.** These are best-practice tagged (no `wcag131`), so tag-based surfacing alone will not pick them up — add explicit rule-id → 1.3.1 mappings. Lifts ARIA11/13/20, H101 (landmarks), ARIA12/G141 (heading nesting), F92 (presentation-role-conflict).
- **1.4.1 — `link-in-text-block` (carries `wcag141`).** Directly detects F73 and the in-text-link subset of G182/G183; currently dropped.
- **1.4.3 — `color-contrast`.** Redundant with the authoritative runner for the flat-bg case, but worth surfacing as a corroborating shadow signal.
- **3.3.x / 4.1.2 — `aria-required-attr`, `aria-valid-attr-value`, `label`, `select-name`, `button-name`.** These carry `wcag412`, not `wcag131`/`wcag33x`; surfacing them gives shadow signals for ARIA2 (required-state), ARIA21 (aria-invalid validity), F68/F86 corroboration.

### 2. New deterministic detectors

Concrete, mechanically-checkable conditions no lane currently inspects:

- **Keyboard-orphan / pointer-only-handler detector (2.1.1 + 4.1.2 + 1.3.1).** Enumerate elements carrying click/pointer handlers or interactive ARIA roles that are absent from the kbd-graph focus ring (no tabindex / not natively focusable). Closes F42, F54, F59 role/keyboard blind spots and relaxes the `WIDGET_ROLE` / `isActivationControl` gates.
- **Focus-retention probe (2.1.1 + 2.4.7).** Programmatically focus each element, then check `document.activeElement` still equals it on the next microtask — the only reliable detector for F55 (`onfocus=this.blur()`).
- **Dangling-idref detector (1.3.1 + 1.1.1 + 4.1.2).** Verify `aria-labelledby` / `aria-describedby` IDREFs resolve to real, unique elements. Covers ARIA1, ARIA9, ARIA10/16/23 idref-resolution.
- **Group-label / fieldset detector (3.3.2).** Detect logically-grouped field sets (phone triplets, address blocks, radio groups) lacking a group label/legend. Closes F82 and H71 (both currently NOT_CAPTURED) and ARIA17.
- **Required-cue ↔ aria-required parity (1.3.1/3.3.2/3.3.1).** Flag fields with a visual required cue (asterisk, "(required)", color) but no `aria-required`/`required`. Covers ARIA2.
- **Plain-text layout detector (1.3.1 + 1.3.2).** Heuristic for whitespace pseudo-columns/tables in `<pre>`/text nodes, intra-word whitespace, and `<pre>`-as-table. Covers F32, F33, F34, F48.
- **Focus-indicator contrast/geometry measurement (1.4.11 + 2.4.7).** Diff focused vs unfocused pixels, compute the indicator's 3:1 contrast change, thickness (≥2px), and minimum area. Covers F78 (look-alike/occluded), G195, C40, and feeds 1.4.11.
- **Cross-viewport content-delta probe (1.4.10).** Inventory interactive + textual content at ~1280px and at 320px, diff for elements that vanish with no disclosure/dialog/link/icon equivalent. Covers F102 — currently a complete blind spot.
- **Sticky-occupancy / vertical-overflow probe at 320×256 (1.4.10).** Measure painted height of `position:sticky`/`fixed` regions vs the 256px viewport. Covers C34.
- **`page.on('dialog')` handler in form-error-probe (3.3.1/3.3.3).** Native `window.alert()` validation messages are currently auto-dismissed by Puppeteer and invisible — capturing them closes the alert-based SCR18 blind spot.
- **`document.ariaNotify` spy in the collector (4.1.3).** Hook the imperative announcement API so ARIA27 calls become observable (no DOM footprint otherwise).
- **Homoglyph / ASCII-art / emoji text-node detectors (1.1.1).** Unicode confusables and dense-punctuation heuristics for F71, F72, H86.

### 3. New / extended LLM rubrics (meaning judgments)

- **1.4.11 graphical-object / non-text-contrast rubric (new).** Identify meaning-bearing icons/graphics and judge ≥3:1 vs adjacent/gradient background; extend for adjoining-color/segment boundaries (G207, G209).
- **1.4.1 color-meaning rubric (new).** Judge whether color-encoded distinctions have a redundant text equivalent (G14) or non-color pattern (G111), and whether image color information is in the alt (F13).
- **2.4.3 focus-order rubric (new).** Judge whether the recorded Tab traversal preserves content meaning (F44, G59); pair with a dynamic dialog/menu focus-management probe (F85).
- **2.4.10 section-headings rubric (new).** Judge whether each content/nav region begins with a heading and whether levels nest (G141, H69).
- **4.1.2 accessible-name adequacy rubric (new).** Judge whether the computed accName describes the control's purpose (ARIA14, ARIA16 accuracy half).
- **Long-description-completeness rubric (1.1.1, new, with image vision).** Judge whether name + long description together convey the image's information (ARIA15, F67, G92, G73, G74).
- **Extend alt-text-adequacy rubric** to cover aria-label on non-image objects (ARIA6/ARIA10), grouped-image semantics (G196), color-conveyed information (F13), and a dynamic-update mode (F20).
- **Extend info-relationships rubric** to flag style-only meaning (F2/F43/G117/H49), `<pre>`-as-table (F48), and layout-vs-data table classification (F46).

### 4. Activate inert lanes (no new code — flip the switch)

Setting `opts.runLlm` + injecting an agent activates the existing, calibrated rubrics as PROVISIONAL fills. This is the difference between NOT/PARTIAL and a scored signal for:

- **alt-text-adequacy** (1.1.1: F30, F39, G82, G94, G95, G100, H30) — the intended F30/G94 detector.
- **contrast-over-complex-backdrop** (1.4.3 F83) — the only lane for image-background contrast.
- **images-of-text** (1.4.5 C22, G140) — the only lane for the SC.
- **reflow-no-hscroll** (1.4.10 G224/G225 exempt-2D fills).
- **hover-content** (1.4.13 SCR39 affirmative judgment).
- **page-title** (2.4.2 F25/G88 descriptiveness).
- **link-purpose / alt-text** (2.4.4 F63, G53, G91, H24, H30, H80).
- **heading-descriptive** (2.4.6 G130/G131).
- **error-identification / error-suggestion** (3.3.1 / 3.3.3 quality of error text).
- **label-in-name** (4.1.2/2.5.3 F111 containment — already exists, just inert and bound to 2.5.3).

### 5. Genuinely hard / human-only / cross-page

- **Conforming-alternate-version model** (1.4.3 G174, 1.4.11 G174) — requires a style-switcher detector, navigation, and cross-page conformance roll-up. Track as a structural gap.
- **Style-switcher activate-and-re-measure** (1.4.5 C30, 1.4.10 G206) — find a switch control, activate it, diff renderings.
- **Forced-colors / user-stylesheet override re-render** (1.4.3 G156).
- **Cross-page corpus title-uniqueness** (2.4.2 F25 templated-duplicate, G127 collection-relationship).
- **Real-AT announcement confirmation** (4.1.3 — wire the VSR `/sr-act` transcript so non-announcement is confirmed against AT-equivalent voicing rather than inferred structurally).
- **Opaque plug-in keyboard trap** (2.1.2 F10) — emit a triage prior when `<object>`/`<embed>`/`<iframe>` foreign content is present rather than silently passing.

### 6. Out of domain (no action)

PDF authoring/structure techniques: PDF1, PDF3, PDF4, PDF5, PDF7, PDF10, PDF22. These parallel in-domain techniques conceptually but target tagged-PDF tooling outside the rendered-web-page harness.

---

## Missing interaction-data instruments

A separate lens from "which lane judges this": **which raw interaction signals does the harness never *collect*?** Many NOT_CAPTURED/PARTIAL rows are *not* judgment gaps — the DOM, AX tree, and screenshots are already captured and just need a detector or an activated rubric. A smaller set are genuine **instrument gaps**: the collector/runners never drive the interaction or never read the channel, so *no lane could decide them no matter how good the judge is.* These are the highest-leverage missing capabilities because they unblock multiple techniques at once. Grounded in the current collection code (`scripts/eval-page.js`, `scripts/v3/lib/exp-runners.js`, `run-instruments.js`, `kbd-graph.js`, `status-detector.js`).

### A. Genuinely missing collection instruments (no raw signal today)

| Instrument (new) | What it would collect | How (mechanism) | Unblocks |
|---|---|---|---|
| **Native dialog/alert capture** | `window.alert()/confirm()/prompt()`-based validation & status text — currently a Puppeteer dialog that is **auto-dismissed and invisible** (no `page.on('dialog')` exists). | Register a `page.on('dialog')` handler in the collector + form-error-probe; record message, then dismiss. | 3.3.1, 3.3.3 (SCR18 alert path), 4.1.3 |
| **Imperative-announcement spy** | `document.ariaNotify()` calls (leave **no DOM footprint**, so the MutationObserver-based status-detector is blind) and live-region `textContent` *replacements* (not just node insertions). | `page.evaluateOnNewDocument()` to patch/record `ariaNotify`; extend status-detector to observe `characterData`/`childList` on pre-existing live regions, not only insertions. | 4.1.3 (ARIA27, ARIA22/23/25 toggle cases) |
| **Event-listener inventory** | `addEventListener('click'/'pointerdown'/…)` handlers. The collector only reads the inline `onclick` **attribute** (`hasOnclick`); the code itself notes "addEventListener is invisible." So pointer-only handlers on roleless elements (the dominant modern case) are uncollected. | CDP `DOMDebugger.getEventListeners` per element during collection. | 2.1.1 (F54 pointer-only), 4.1.2 (roleless), 1.3.1 |
| **Cross-viewport content-delta capture** | A **wide-baseline** content/interactive inventory to diff against the 320 px render, to catch content that *disappears* at narrow width with no equivalent. The probe currently renders at 320×256 only and measures horizontal scroll — it never captures a second viewport to diff. | Inventory text+interactive nodes at ~1280 px and at 320 px; diff for vanished, non-disclosed elements. | 1.4.10 (F102), 1.4.4 (resize) |
| **Style/zoom/text-resize control activation** | The rendering *after* a user activates a page-provided text-resize, style-switcher, or zoom control. No instrument finds such a control, activates it, and re-renders. | Locate candidate controls, click, re-collect + re-screenshot, compare. | 1.4.5 (C30), 1.4.10 (G206), conforming-alternate-version (G174) |
| **Forced-colors / user-stylesheet re-render (pipeline)** | Page render under Windows High Contrast / forced-colors / a user stylesheet. This exists **only** as the standalone `verify-finding.js --forced-colors` manual tool (raw CDP `Emulation`), not wired into v3 collection. | Promote that CDP emulation into a collection pass that re-screenshots. | 1.4.1, 1.4.3, 1.4.11 robustness |
| **Submit-driven + async/timer status observation** | Status messages that fire on **form submit** or after an async/timer delay. `status-detector` deliberately **excludes submit triggers** and settles in ~300 ms, so it catches click-driven F103 but misses each technique's own submit/async examples. | Add a submit-trigger limb + a longer/poll-based settle window to the status instrument. | 4.1.3 (ARIA19/22/25), corroborates 3.3.1 |
| **Real-AT announcement transcript for status** | Whether a status change is *actually voiced* by AT, vs. structurally inferred. The VSR instrument exists but its screen-reader-action (`/sr-act`) capture is not wired to the status flow. | Wire the VSR `/sr-act` transcript around the status-trigger interaction. | 4.1.3 confirmation |
| **Focus-trigger limb for hover content** | The 1.4.13 behavior under **keyboard focus** (dismissable/hoverable/persistent). The hover runner exercises pointer hover but not `el.focus()`, so the focus-triggered branch is never collected. | Add a `focus()`-then-observe limb to the hover-content runner. | 1.4.13 (focus branch of F95/SCR39) |
| **Multi-page / corpus crawl** *(different scope)* | Per-page titles/headings across a site for uniqueness and collection-relationship checks. The harness is single-page. | A crawl+roll-up collection layer. | 2.4.2 (F25 templated duplicate, G127), alternate-version roll-up |

### B. NOT instrument gaps — signal already collected, only a detector/judge is missing

Listed explicitly so we don't build instruments we don't need:

- **Vertical / 2-D reflow + sticky-region occupancy** — the 320×256 render already exists; only the *measurement* (`scrollHeight` vs viewport, painted height of `position:sticky`/`fixed`) is missing. Detector, not instrument.
- **Focus-indicator contrast / thickness / area** — `focus-visual-retry` already captures focused vs unfocused screenshots; needs a pixel-diff *metric extractor*, not a new interaction.
- **F55 `onfocus=this.blur()`** — already observed: the runners do `el.focus(); activeElement===el; el.blur()` and the self-blur makes that read *false*. The signal exists but is consumed as an applicability **gate** (element excluded) instead of being **re-routed** to a 2.1.1/F55 barrier. A routing fix, not a new instrument.
- **Dangling IDREFs, whitespace pseudo-tables, homoglyph/ASCII text, group-label/fieldset absence, visual-required-cue ↔ `aria-required` parity** — all derivable from the already-collected DOM/text/geometry. Detector gaps.
- **All "meaning" judgments** (alt/title/heading/label/link/error adequacy, color redundancy, images-of-text) — screenshots + AX tree already collected; this is the **inert LLM lane**, an activation gap.
- **axe's dropped rules** — axe already runs at collection; a *consumption/surfacing* gap, not a collection gap.

> Net: of the gaps in this report, the genuinely missing **interaction-data instruments** cluster on (1) channels the harness never listens to — native dialogs and `ariaNotify`; (2) interactions it never drives — submit-triggered status, a second viewport, style/zoom controls, the focus limb of hover; and (3) handler/AT signals it never reads — `addEventListener` listeners and the AT voicing transcript. Everything else is a detector or lane-activation gap over data already in hand.

---

## Per-SC detail

### SC 1.1.1 — Non-text Content (text-alternatives)

> SC 1.1.1 has **NO authoritative lane** in v3. The axe image-alt family RUNS but 1.1.1 is not in `AXE_SURFACED_SCS`, so all findings are dropped; the alt-text-adequacy rubric is shadow + inert; `ax-state-diff`/`field-label-probe` are bound to 4.1.2/3.3.2, not 1.1.1. Presence/null/missing-alt failures are mechanically assessable only at the label-association level (H44); short-alt equivalence/placeholder/functional-name adequacy sits only in the inert rubric; long-description, CSS-background, color-semantic, temporal, homoglyph/ASCII/emoji, CAPTCHA, live-media, object-fallback, and PDF techniques are NOT_CAPTURED or OUT_OF_DOMAIN.

**Best coverage:** Shadow/inert. **Audit:** 4 overclaims found and corrected (ARIA15 PARTIAL→NOT_CAPTURED; ARIA6/G82 ax-state-diff lane removed; H30 axe link-name lane relabeled).

| Technique | Tech | Role | Verdict | Lane(s) | Gap / Recommendation |
|---|---|---|---|---|---|
| ARIA6 | aria | sufficient | PARTIAL | alt-text rubric (shadow,inert); skill | No authoritative aria-label adequacy check. Activate rubric; surface axe name rules; extend prompt to non-image objects. |
| ARIA9 | aria | sufficient | PARTIAL | alt-text + field-label rubrics (inert); skill | No idref-resolution check wired to 1.1.1; descriptiveness inert. Add idref detector; route to rubric. |
| ARIA10 | aria | sufficient | PARTIAL | alt-text rubric (inert); axe aria-* (capable,NOT-surfaced); skill | Idref validity not surfaced; adequacy inert. Surface axe name findings; activate rubric. |
| ARIA15 | aria | sufficient | NOT_CAPTURED | skill only | Long-description adequacy unassessed. Add describedby idref detector + long-description rubric. |
| C9 | css | sufficient | NOT_CAPTURED | none | No CSS background-image / decorativeness lane. Low priority (decorative is the conformant path). |
| C18 | css | advisory | NOT_CAPTURED | none | No spacer-image detection. Leave as guidance or fold into F39 heuristic. |
| F3 | failures | failure | NOT_CAPTURED | none | No CSS-background-conveys-info lane. New detector + vision rubric. |
| F13 | failures | failure | NOT_CAPTURED | alt-text rubric (inert, no color compare); skills | No vision compare of image color meaning vs alt. Extend alt-text rubric with vision. |
| F20 | failures | failure | NOT_CAPTURED | none | No temporal alt-vs-image staleness diff. Stateful vision diff — defer / known gap. |
| F30 | failures | failure | PARTIAL | alt-text rubric (inert, placeholder/filename); skill; axe image-alt (empty only) | Junk-alt detector is inert. Activate rubric; add filename/placeholder blacklist. |
| F38 | failures | failure | PARTIAL | axe image-alt (capable,NOT-surfaced); skill | Missing-alt findings dropped for 1.1.1. Surface axe image-alt. |
| F39 | failures | failure | PARTIAL | alt-text rubric (inert); skill; axe image-alt (no non-null junk) | Only inert rubric flags placeholder alt. Activate rubric + blacklist. |
| F65 | failures | failure | PARTIAL | axe image-alt/input-image-alt/area-alt (capable,NOT-surfaced); skill; alt-text rubric (inert) | Highest-value deterministic detector dropped. **Surface axe image-alt family — top action.** |
| F67 | failures | failure | NOT_CAPTURED | skill only | No long-description completeness lane. New vision rubric. |
| F71 | failures | failure | NOT_CAPTURED | skill only | No homoglyph/mixed-script detector. New Unicode-confusables detector. |
| F72 | failures | failure | NOT_CAPTURED | skill only | No ASCII-art detector. New heuristic/LLM detector. |
| G68 | general | sufficient | NOT_CAPTURED | skill only | No live-media label-purpose lane. Low priority. |
| G73 | general | sufficient | NOT_CAPTURED | skill only | No adjacent long-description-link traversal. New rubric (needs navigation). |
| G74 | general | sufficient | NOT_CAPTURED | skill only | No short-alt→adjacent-text correlation. Extend rubric (vision + layout). |
| G82 | general | sufficient | PARTIAL | alt-text rubric (inert, functional-name); skill | Only inert rubric judges purpose. Activate rubric; surface axe name rules. |
| G92 | general | sufficient | NOT_CAPTURED | skill only | No long-description completeness lane. New vision rubric. |
| G94 | general | sufficient | PARTIAL | alt-text rubric (inert); skill; axe image-alt (presence only) | Core adequacy lane inert. Activate rubric; surface axe presence. |
| G95 | general | sufficient | PARTIAL | alt-text rubric (inert); skill; axe image-alt (presence only) | Presence not surfaced; adequacy inert. Surface axe; activate rubric. |
| G100 | general | sufficient | PARTIAL | alt-text rubric (inert); skill | Name adequacy inert; pure-audio uncovered. Activate/extend rubric. |
| G143 | general | sufficient | NOT_CAPTURED | skill only | No CAPTCHA-purpose lane. Low priority. |
| G144 | general | sufficient | NOT_CAPTURED | none | No multi-modality CAPTCHA detector. Out of practical scope. |
| G196 | general | sufficient | PARTIAL | alt-text rubric (inert); skill; axe image-alt (null/present, NOT-surfaced) | Group-alt pattern unevaluated. Surface axe; extend rubric for grouped images. |
| H2 | html | sufficient | PARTIAL | alt-text rubric (inert); axe image-alt (capable,NOT-surfaced); skill | Null-alt-in-anchor not surfaced. Surface axe; activate rubric. |
| H24 | html | sufficient | PARTIAL | axe area-alt (capable,NOT-surfaced); alt-text rubric (inert); skill | area-alt dropped for 1.1.1. Surface axe area-alt; route adequacy to rubric. |
| H30 | html | sufficient | PARTIAL | link-purpose + alt-text rubrics (inert); axe link-name (surfaced for 2.4.4, not credited to 1.1.1); skill | Image-link alt-purpose inert. Activate rubrics; credit axe name rules. |
| H36 | html | sufficient | PARTIAL | axe input-image-alt (capable,NOT-surfaced); alt-text rubric (inert); skill | input-image-alt dropped. Surface axe; activate functional-name rubric. |
| H37 | html | sufficient | PARTIAL | axe image-alt (capable,NOT-surfaced); alt-text rubric (inert); skill | Core technique: presence dropped, meaning inert. Surface axe; activate rubric. |
| H44 | html | sufficient | **CAPTURED** | field-label-probe (authoritative,live — disposes 3.3.2, assesses label-association); axe label (NOT-surfaced); field-label rubric (inert); skill | — (label-association mechanism authoritatively assessed) |
| H53 | html | sufficient | NOT_CAPTURED | skill only | Object fallback not rendered at runtime. Surface object-alt / parse fallback if in scope. |
| H65 | html | sufficient | PARTIAL | field-label-probe (authoritative,live — title-derived name presence); field-label rubric (inert); skill | Title adequacy / visual-match inert. Activate rubric; credit title-derived names. |
| H67 | html | sufficient | PARTIAL | axe image-alt (null detection, NOT-surfaced); skill | Null-alt + no-title not surfaced. Surface axe image-alt. |
| H86 | html | sufficient | NOT_CAPTURED | skill only | No emoji/emoticon/ASCII/leetspeak detector. New detector + rubric (overlaps F71/F72). |
| PDF1 | pdf | sufficient | OUT_OF_DOMAIN | none | PDF authoring (/Alt). |
| PDF4 | pdf | sufficient | OUT_OF_DOMAIN | none | PDF authoring (/Artifact). |

---

### SC 1.3.1 — Info and Relationships (adaptable)

> SC 1.3.1 has **NO authoritative deterministic catalog runner**; its only LIVE signal is axe's DECIDED+SURFACED findings (axe keys on the violation's own `wcag131` tag; 1.3.1 is in `AXE_SURFACED_SCS`) — a shadow cross-signal covering data-table header relationships, list/dl structure, the p-as-heading pseudo-heading failure, and composite-widget child/parent integrity. Everything else (landmark/region naming, heading semantics, emphasis markup, role=presentation misuse, plain-text/pre pseudo-tables, structural-markup-misuse, emulated-link role exposure) is touched only by the inert info-relationships rubric, guidance skills, and capable-but-NOT-surfaced axe rules.

**Best coverage:** Shadow (live axe). **Audit:** 3 overclaims found (ARIA17 NOT_CAPTURED→PARTIAL via surfaced aria-required-children; F42 PARTIAL→NOT_CAPTURED; F91 CAPTURED→PARTIAL).

| Technique | Tech | Role | Verdict | Lane(s) | Gap / Recommendation |
|---|---|---|---|---|---|
| ARIA1 | aria | advisory | NOT_CAPTURED | none | No describedby idref-resolution/adequacy lane. Add dangling-idref detector. |
| ARIA2 | aria | advisory | NOT_CAPTURED | none | No visual-vs-programmatic required parity. Add required-cue detector. |
| ARIA11 | aria | sufficient | PARTIAL | axe region/landmark-unique (capable,NOT-surfaced); info-rel rubric (inert, punts landmarks); skill | Landmark presence/naming not live. Surface axe landmark rules. |
| ARIA12 | aria | sufficient | PARTIAL | axe heading-order/empty-heading (capable,NOT-surfaced); descriptiveness rubrics (inert); skill | role=heading/aria-level validity not live. Surface axe heading rules. |
| ARIA13 | aria | sufficient | PARTIAL | axe landmark-unique/region (capable,NOT-surfaced); info-rel rubric (inert); skill | Landmark labelledby idref/accuracy not live. Surface axe; add name detector. |
| ARIA16 | aria | sufficient | PARTIAL | ax-state-diff name + field-label-probe (authoritative,live — presence); axe label/button-name (wcag412,NOT-surfaced); field-label rubric (inert) | Name presence covered authoritatively; accuracy/idref not. Activate rubric; add idref detection. |
| ARIA17 | aria | sufficient | PARTIAL | axe aria-required-children/parent (SURFACED, decided shadow, live — radiogroup proxy); info-rel rubric (inert); skill | Malformed radiogroup caught (shadow); "should-be-grouped" + group naming unmonitored. Add grouping detector. |
| ARIA20 | aria | sufficient | PARTIAL | axe region (capable,NOT-surfaced); info-rel rubric (inert); skill | role=region naming/appropriateness not live. Surface axe region. |
| ARIA24 | aria | sufficient | NOT_CAPTURED | none | No icon-font ::before + role=img detector. Low priority. |
| C22 | css | sufficient | PARTIAL | axe p-as-heading (SURFACED — styled-heading edge); info-rel rubric (inert); skill | Only pseudo-heading variant live. Extend rubric for style-only meaning. |
| F2 | failures | failure | PARTIAL | axe p-as-heading (SURFACED, decided, live); info-rel rubric (inert); skill | Only CSS pseudo-heading detected; image-of-text headings missed. Extend info-rel / 1.4.5 rubric. |
| F33 | failures | failure | NOT_CAPTURED | none | No whitespace pseudo-column detector. Add text-node heuristic. |
| F34 | failures | failure | NOT_CAPTURED | none | No whitespace pseudo-table detector. Add heuristic for `<pre>` grids. |
| F42 | failures | failure | NOT_CAPTURED | keyboard-activation (2.1.1 half only); axe link-name (NOT-surfaced for 1.3.1); info-rel rubric (inert) | No emulated-link role-mismatch detector. Add click-handler-without-role detector. |
| F43 | failures | failure | NOT_CAPTURED | info-rel rubric (inert); skill | Structural-markup-for-presentation undetected. Activate/extend info-rel rubric. |
| F46 | failures | failure | PARTIAL | axe th-has-data-cells/td-has-header/table-fake-caption (SURFACED proxy); info-rel rubric (inert) | Layout-vs-data classification missing. Add classifier to rubric. |
| F48 | failures | failure | NOT_CAPTURED | info-rel rubric (inert) | No `<pre>`-as-table detector. Extend info-rel rubric. |
| F90 | failures | failure | **CAPTURED** | axe td-headers-attr + th-has-data-cells (SURFACED, decided, live) | — (faulty headers/id wiring directly detected, shadow tier) |
| F91 | failures | failure | PARTIAL | axe td-has-header (>3×3 only) + th-has-data-cells (needs a `<th>`) (SURFACED) | Small all-`td` no-`th` tables slip both rules. Add runner-tier small-table confirmation. |
| F92 | failures | failure | NOT_CAPTURED | info-rel rubric (inert) | presentation-role-conflict not surfaced (best-practice tag). Add rule-id mapping or detector. |
| F111 | failures | failure | PARTIAL | field-label-probe + ax-state-diff name (authoritative,live); field-label rubric (inert); axe label (wcag412,NOT-surfaced) | Name-contains-visible-label (check #3) inert; non-form controls outside reach. Activate rubric. |
| G115 | general | sufficient | PARTIAL | axe list/dl + table-header rules (SURFACED, live, partial); info-rel rubric (inert); skill | Semantic-markup completeness inert. Keep axe surfaced; activate rubric. |
| G117 | general | sufficient | PARTIAL | axe p-as-heading (SURFACED — heading sub-case); info-rel rubric (inert); skill | General style-only meaning unverified. Activate/extend info-rel rubric. |
| G140 | general | sufficient | PARTIAL | axe list/table rules (SURFACED, well-formedness); info-rel rubric (inert); skill | Whole-page structure/presentation separation inert. Use info-rel rubric; PDF path out of scope. |
| G141 | general | advisory | PARTIAL | axe heading-order/empty-heading (capable,NOT-surfaced); descriptiveness rubrics (inert); skill | No live heading inventory/nesting. Surface axe heading rules. |
| G162 | general | advisory | NOT_CAPTURED | field-label-probe (presence only, NOT position); skill | No label-position geometry. Add geometry detector. Low priority. |
| H49 | html | sufficient | PARTIAL | info-rel rubric (inert); skill | No phrase-level semantics lane. Activate/extend info-rel rubric. |
| H101 | html | sufficient | PARTIAL | axe region/landmark-unique (capable,NOT-surfaced); info-rel rubric (inert); skill | Native landmark correctness not live. Surface axe; add inventory detector. |

---

### SC 1.3.2 — Meaningful Sequence (adaptable)

> SC 1.3.2 is touched by exactly one substantive signal — the shared `visualOrderDivergence` detector exposed as the VSR reading-order check (`vsr-analysis`, `sc:'1.3.2'`). It is SHADOW, opt-in, and explicitly UNCALIBRATED high-recall triage (`review:true, calibrated:false`) that only flags within-column backward jumps and never cross-column moves, so it cannot verify or fail any technique. No authoritative runner, no LLM rubric, no surfaced axe rule.

**Best coverage:** Triage-only. **Audit:** 1 overclaim (F49 PARTIAL→NOT_CAPTURED; C27/G57 kbd-graph lane relabeled to 2.4.3-scoped co-signal).

| Technique | Tech | Role | Verdict | Lane(s) | Gap / Recommendation |
|---|---|---|---|---|---|
| C27 | css | sufficient | PARTIAL | order-check/vsr reading-order triage `sc:1.3.2` (shadow,opt-in,uncalibrated); kbd-graph (same algo, `sc:2.4.3` co-signal); skill | No calibrated/authoritative DOM-vs-visual confirmation; cross-column undecidable. Add 1.3.2 rubric (PROVISIONAL). |
| F1 | failures | failure | PARTIAL | order-check/vsr reading-order triage (shadow,opt-in,uncalibrated); skill | Cross-column reorderings missed; can't decide meaning change. Surface triage + pair with rubric. |
| F32 | failures | failure | NOT_CAPTURED | none | No intra-word whitespace detector. Add text-content detector (with initialism exemption). |
| F33 | failures | failure | NOT_CAPTURED | none | No plain-text pseudo-column detector. Add layout detector (1.3.2 + 1.3.1). |
| F34 | failures | failure | NOT_CAPTURED | none | No whitespace pseudo-table detector. Extend plain-text-layout detector. |
| F49 | failures | failure | NOT_CAPTURED | skill only | Detector is structurally blind to F49's cross-column interleaving. Add layout-table linearization triage + rubric. |
| G57 | general | sufficient | PARTIAL | order-check/vsr reading-order triage (shadow,opt-in,uncalibrated); kbd-graph (2.4.3 co-signal); skill | No meaning-preservation judgment; cross-column undecided. Add 1.3.2 rubric. |
| PDF3 | pdf | sufficient | OUT_OF_DOMAIN | none | PDF tag/reading order authoring. |

---

### SC 1.4.1 — Use of Color (distinguishable)

> SC 1.4.1 has **NO authoritative runner and NO LLM rubric**. Its only mechanical signal is axe's `link-in-text-block` rule (carries `wcag141`, runs at collection, computes the 3:1 surrounding-text test plus presence of a non-color distinction), but v3 DROPS it because 1.4.1 is not in `AXE_SURFACED_SCS`. IBM `r_color` is an inert review-only triage prior.

**Best coverage:** Shadow/inert. **Audit:** 2 overclaims (G182 NOT_CAPTURED→PARTIAL for consistency with F73/G183; G183 focus-visual-retry lane removed).

| Technique | Tech | Role | Verdict | Lane(s) | Gap / Recommendation |
|---|---|---|---|---|---|
| C15 | css | advisory | PARTIAL | focus-visual-retry (authoritative,live — 2.4.7 focus only); skills | Hover/pointer-feedback half unassessed. Optionally extend focus probe (advisory). |
| F13 | failures | failure | NOT_CAPTURED | none | No image-color-meaning-vs-alt lane. Extend alt-text rubric with vision; cross-tag to 1.4.1. |
| F73 | failures | failure | PARTIAL | axe link-in-text-block (capable,NOT-surfaced); IBM r_color (shadow,review,INERT); skill | axe detects this failure but it's discarded. **Surface link-in-text-block.** |
| F81 | failures | failure | NOT_CAPTURED | IBM r_color (INERT); skills | No color-only required/error-field detector. Add 1.4.1 detector/rubric. |
| G14 | general | sufficient | NOT_CAPTURED | IBM r_color (INERT); skill | No redundant-text-equivalent verification. Add 1.4.1 LLM rubric (core check). |
| G111 | general | sufficient | NOT_CAPTURED | skill only | No color-coding-in-images pattern check. Add 1.4.1 vision rubric. |
| G182 | general | sufficient | PARTIAL | axe link-in-text-block (capable,NOT-surfaced — link subset); skill | Link subset detectable but dropped; non-link colored text uncovered. Surface axe + add rubric. |
| G183 | general | sufficient | PARTIAL | axe link-in-text-block (capable,NOT-surfaced — 3:1 surrounding-text); skill | Contrast half computed but dropped; hover-cue half unassessed. Surface axe + hover probe. |
| G205 | general | sufficient | NOT_CAPTURED | field-label-probe (name presence only); skills | No color-meaning-in-name check for labels. Add 1.4.1 check/rubric. |

---

### SC 1.4.3 — Contrast (Minimum) (distinguishable)

> SC 1.4.3's flat-opaque-backdrop contrast is fully covered by the AUTHORITATIVE `text-contrast-pixel` runner (G18 4.5:1 + G145 3:1, with size class/exemptions). The non-uniform-backdrop failure (F83) sits only in the inert/shadow complex-backdrop rubric. The four author-specification/capability/alternate-version techniques (F24, G148, G156, G174) are uncaptured because they are code-inspection or re-render/cross-page conformance conditions no lane assesses; axe `color-contrast` runs but is discarded.

**Best coverage:** **Authoritative.** **Audit:** 0 overclaims.

| Technique | Tech | Role | Verdict | Lane(s) | Gap / Recommendation |
|---|---|---|---|---|---|
| F24 | failures | failure | NOT_CAPTURED | none | Runner resolves missing color from defaults, masking the fg/bg-asymmetry risk. Add author-origin cascade check (shadow). |
| F83 | failures | failure | PARTIAL | contrast-over-complex-backdrop rubric (shadow,inert); skill | Only the inert rubric assesses image-background contrast; runner auto-PARTIALs. Promote rubric to live shadow. |
| G18 | general | sufficient | **CAPTURED** | text-contrast-pixel (authoritative,live); complex-backdrop rubric (inert residue); axe color-contrast (NOT-surfaced); skill | — (4.5:1 verified for flat backdrop) |
| G145 | general | sufficient | **CAPTURED** | text-contrast-pixel (authoritative,live — size class); complex-backdrop rubric (inert residue); axe (NOT-surfaced); skill | — (3:1 large-text verified) |
| G148 | general | sufficient | NOT_CAPTURED | none | A rendered pass doesn't confirm "author specified nothing." Add author-origin absence check (shadow, low priority). |
| G156 | general | advisory | NOT_CAPTURED | none | No forced-colors / user-override re-render. Add opt-in forced-colors instrument (low priority). |
| G174 | general | sufficient | NOT_CAPTURED | none | No conforming-alternate-version model. Document as structural gap. |

---

### SC 1.4.5 — Images of Text (distinguishable)

> SC 1.4.5 turns on one meaning judgment — is meaningful text baked into image pixels when it could be real text, modulo logotype/essential exceptions. The harness has exactly ONE lane: the LLM atomic rubric `images-of-text-v0`, which is SHADOW and INERT by default. No authoritative/deterministic lane, no axe rule (axe-core has no images-of-text check).

**Best coverage:** Shadow/inert. **Audit:** 0 overclaims (G140 lane list refined to include images-of-text rubric).

| Technique | Tech | Role | Verdict | Lane(s) | Gap / Recommendation |
|---|---|---|---|---|---|
| C6 | css | advisory | NOT_CAPTURED | none | No CSS-off structure re-check (belongs to 1.3.1). No 1.4.5 action. |
| C8 | css | advisory | NOT_CAPTURED | none | No letter-spacing-vs-blank-chars check. Low value. |
| C12 | css | advisory | NOT_CAPTURED | none | No font-size unit inspection (belongs to 1.4.4). None for 1.4.5. |
| C13 | css | advisory | NOT_CAPTURED | none | No font-size keyword inspection. None for 1.4.5. |
| C14 | css | advisory | NOT_CAPTURED | none | No em-unit inspection. None for 1.4.5. |
| C22 | css | sufficient | PARTIAL | images-of-text rubric (shadow,inert); skill | Central technique covered only by inert rubric. Activate rubric (NOT-REPRODUCED = C22 satisfied). |
| C30 | css | sufficient | NOT_CAPTURED | none | No style-switcher activate-and-diff. Out of practical reach. |
| G140 | general | sufficient | PARTIAL | images-of-text rubric (inert, direct); axe 1.3.1 (live,indirect); info-rel rubric (inert,indirect); skills | All touching lanes non-authoritative/indirect. Activate images-of-text + info-rel rubrics. |
| PDF7 | pdf | sufficient | OUT_OF_DOMAIN | none | PDF OCR authoring workflow. |

---

### SC 1.4.10 — Reflow (distinguishable)

> SC 1.4.10 has the harness's strongest layout lane: an AUTHORITATIVE, live, page-level `reflow-overflow-probe` that loads at 320×256 CSS px and measures HORIZONTAL overflow, routing 2-D/exempt overflow to an auto-PARTIAL the inert rubric fills. But the probe measures only horizontal overflow — it never assesses vertical/256px sticky occlusion (C34), text-only 200% resize (SCR34), cross-viewport content disappearance (F102), or author layout-switcher activation (G206).

**Best coverage:** **Authoritative.** **Audit:** 1 overclaim (C34 PARTIAL→NOT_CAPTURED — guidance-only skill is not a detector).

| Technique | Tech | Role | Verdict | Lane(s) | Gap / Recommendation |
|---|---|---|---|---|---|
| C31 | css | sufficient | **CAPTURED** | reflow-overflow-probe (authoritative,live); reflow rubric (inert); skill | — (clean reflow at 320px verified) |
| C32 | css | sufficient | **CAPTURED** | reflow-overflow-probe (authoritative,live); reflow rubric (inert); skill | — (grid single-column reflow verified) |
| C33 | css | sufficient | **CAPTURED** | reflow-overflow-probe (authoritative,live); skill | — (long-string wrap detected; non-exempt) |
| C34 | css | advisory | NOT_CAPTURED | skill only | Probe is horizontal-only; no sticky vertical-occupancy at 256px. Add sticky-occupancy probe. |
| C37 | css | advisory | **CAPTURED** | reflow-overflow-probe (authoritative,live); reflow rubric (inert); skill | — (oversized-image overflow detected) |
| C38 | css | sufficient | **CAPTURED** | reflow-overflow-probe (authoritative,live); reflow rubric (inert); skill | — (form stacking at 320px verified) |
| F102 | failures | failure | NOT_CAPTURED | none | No cross-viewport content-equivalence diff; tidy reflow via dropped content passes. Add content-delta probe — canonical reflow blind spot. |
| G206 | general | sufficient | NOT_CAPTURED | skill only | No layout-switcher activation nor per-column line-readability. Add activate-and-re-measure instrument. |
| G224 | general | sufficient | PARTIAL | reflow-overflow-probe (authoritative,live — routes 2-D to auto-PARTIAL); reflow rubric (inert); skill | Indentation 2-D exemption only auto-PARTIAL; rubric inert. Activate rubric; name nested-list indentation. |
| G225 | general | sufficient | PARTIAL | reflow-overflow-probe (authoritative,live — routes carousel to auto-PARTIAL); reflow rubric (inert); skill | No per-panel ≤320px width check. Add sub-probe; sharpen rubric. |
| SCR34 | client-side-script | sufficient | NOT_CAPTURED | skill only | No text-only 200% resize/clipping check (overlaps 1.4.4). Add text-resize probe. |

---

### SC 1.4.11 — Non-text Contrast (distinguishable)

> SC 1.4.11 is GUIDANCE_ONLY for its core obligation (3:1 contrast of graphical objects/icons and UI-component boundaries): no authoritative non-text-contrast runner, no axe non-text-contrast rule, no dedicated 1.4.11 LLM rubric — only the color-and-visual-text skill. The shared focus-indicator slice (F78/G195) gets PARTIAL coverage where the focus-visual-retry runner catches the missing-indicator case but no lane measures the indicator's 3:1 contrast, thickness, or area.

**Best coverage:** Guidance-only. **Audit:** 3 overclaims (G174 OUT_OF_DOMAIN→NOT_CAPTURED; G207/G209 lanes corrected to include the guidance skill; F78 lane added).

| Technique | Tech | Role | Verdict | Lane(s) | Gap / Recommendation |
|---|---|---|---|---|---|
| F78 | failures | failure | PARTIAL | focus-visual-retry (authoritative,live — presence/absence); focus-visible-clear rubric (inert, disclaims contrast); skills | Indicator 3:1 contrast + look-alike/occluded-border cases unmeasured. Activate rubric; add contrast/thickness diff. |
| G174 | general | sufficient | NOT_CAPTURED | none | No control-contrast-in-G174-context nor alternate-version equivalence. In domain; track as gap. |
| G195 | general | sufficient | PARTIAL | focus-visual-retry (authoritative,live — presence); focus-visible-clear rubric (inert); skill | No 3:1 contrast-change / area / 2px-fallback computation. Add focus-indicator measurement runner. |
| G207 | general | sufficient | NOT_CAPTURED | color-and-visual-text skill (guidance) | No icon/graphical-object 3:1 detector. Add 1.4.11 rubric + non-text-contrast runner. |
| G209 | general | sufficient | NOT_CAPTURED | color-and-visual-text skill (guidance) | No adjoining-color/segment-boundary contrast. Add 1.4.11 rubric + boundary detector. |

---

### SC 1.4.13 — Content on Hover or Focus (distinguishable)

> 1.4.13 has a strong AUTHORITATIVE/live lane, but it is BARRIER-ONLY and open-scope-never-clearable: `hover-content-tri` can only DETECT a hoverable/dismissible/persistent failure, never affirmatively VERIFY the sufficient behavior — so it fully captures the F95 failure but only partially covers the sufficient SCR39 (whose satisfaction, plus the entire focus-triggered limb, falls to the inert rubric).

**Best coverage:** **Authoritative.** **Audit:** 1 overclaim (SCR39 CAPTURED→PARTIAL).

| Technique | Tech | Role | Verdict | Lane(s) | Gap / Recommendation |
|---|---|---|---|---|---|
| F95 | failures | failure | **CAPTURED** | hover-content-tri (authoritative,live,BARRIER-ONLY); hover rubric (inert); skill | — (hoverable/dismissable failure directly detected; UA-title exemption honored) |
| SCR39 | client-side-script | sufficient | PARTIAL | hover-content-tri (authoritative,live,BARRIER-ONLY — detects negation only); hover rubric (inert — affirmative judge); skill | Barrier-only can't confirm satisfaction; focus limb never exercised (no `el.focus()`); fixed ~1.6s dwell. Surface rubric; add focus limb; parameterize dwell. |

---

### SC 2.1.1 — Keyboard (keyboard-accessible)

> 2.1.1 has a genuine AUTHORITATIVE lane (`keyboard-activation`, live) but it is BARRIER-ONLY by registry decree (clearing is WITHDRAWN). It can only flag a BARRIER on a reached, focusable, finite-contract activation control whose real Enter/Space produces no effect — never positively confirm operability. The runner is gated twice: the obligation enrolls only for focusable elements, and activation runs only for `isActivationControl`. So the canonical failures (F42 bare span/img, F54 mouse-only handler, F55 onfocus=blur) fall below the gate and are undetected.

**Best coverage:** **Authoritative (barrier-only).** **Audit:** 4 overclaims (SCR29 CAPTURED→PARTIAL; G90/G202 false NO_BARRIER pass claims removed; F42/F55 rationales corrected).

| Technique | Tech | Role | Verdict | Lane(s) | Gap / Recommendation |
|---|---|---|---|---|---|
| F42 | failures | failure | PARTIAL | keyboard-activation (authoritative,live,BARRIER-ONLY — only focusable+isActivationControl); kbd-graph (shadow) | Non-focusable + roleless emulated links below gates. Add keyboard-orphan detector; relax applicability. |
| F54 | failures | failure | PARTIAL | keyboard-activation (authoritative,live,BARRIER-ONLY); kbd-graph (shadow) | Pointer-only handler on non-focusable element undetected (most common 2.1.1 failure). Add pointer-only-handler detector. |
| F55 | failures | failure | PARTIAL | keyboard-activation (incidental — self-blur defeats focusability check); focus-visual-retry (2.4.7 side); kbd-graph | No focus-retention test; onfocus=blur reads as non-focusable. Add focus-retention probe. |
| G90 | general | sufficient | PARTIAL | keyboard-activation (BARRIER-ONLY — cannot confirm operability); kbd-graph; skill | Barrier-only can't affirm any control is operable; drag/redundant-mechanism unverified. Aggregate barriers + add detectors + rubric. |
| G202 | general | sufficient | PARTIAL | keyboard-activation (BARRIER-ONLY); kbd-graph; skill | No functional inventory / alternate-path reasoning; mouse-only functions missed. Aggregate + whole-obligation LLM pass. |
| SCR29 | client-side-script | advisory | PARTIAL | keyboard-activation (BARRIER-ONLY — applicability satisfied but cannot CLEAR); ax-state-diff 4.1.2 (companion); kbd-graph; skill | Positive "Enter/Space invokes action" confirmation impossible (barrier-only). Add LLM/whole-obligation PROVISIONAL confirmation. |

---

### SC 2.1.2 — No Keyboard Trap (keyboard-accessible)

> SC 2.1.2 is AUTHORITATIVELY covered for the in-DOM case by the live `keyboard-trap-escape` runner (Tab/Shift+Tab/Esc + an advised-key probe that also detects in-region escape instructions), reinforced by kbd-graph LOTUS / vsr-graph cursor-trap shadow instruments. Residual gaps are G21 path-(c) "move-to-parent documented BEFORE entry" / instruction-adequacy judgment and the opaque plug-in / non-HTML-embed trap.

**Best coverage:** **Authoritative.** **Audit:** 1 overclaim (G21 under-claim corrected — runner DOES detect in-region documented escapes; gap rescoped to precedence + adequacy).

| Technique | Tech | Role | Verdict | Lane(s) | Gap / Recommendation |
|---|---|---|---|---|---|
| F10 | failures | failure | PARTIAL | keyboard-trap-escape (authoritative,live); kbd-graph LOTUS (shadow); vsr-graph (shadow); skill | DOM-only — opaque plug-in/embed trap (SMIL/XForms/applet) exposes no probeable DOM. Emit triage prior on `<object>`/`<embed>`/`<iframe>` foreign content. |
| G21 | general | sufficient | PARTIAL | keyboard-trap-escape (authoritative,live — detects in-region documented escape); kbd-graph; vsr-graph; skills | Paths (a)/(b) and in-region docs covered; path (c) precedence + instruction adequacy unassessed. Add 2.1.2 rubric for instruction precedence/correctness. |

---

### SC 2.4.2 — Page Titled (navigable)

> 2.4.2 presence is AUTHORITATIVE (catalog page-title slot presence, live), but title DESCRIPTIVENESS — the substance of every technique here — is covered ONLY by the SHADOW/INERT LLM rubric, and the G127 collection-relationship path has no lane at all.

**Best coverage:** Shadow/inert. **Audit:** 0 overclaims.

| Technique | Tech | Role | Verdict | Lane(s) | Gap / Recommendation |
|---|---|---|---|---|---|
| F25 | failures | failure | PARTIAL | page-title rubric (shadow,inert); page-title slot-presence (authoritative,live — presence); skill | Non-descriptive-title detection inert; templated-duplicate uncovered. Activate rubric; add corpus title-uniqueness. |
| G88 | general | sufficient | PARTIAL | page-title slot-presence (authoritative,live); page-title rubric (shadow,inert); skill | Descriptiveness/"identifiable by title" only in inert rubric. Activate rubric. |
| G127 | general | advisory | NOT_CAPTURED | none | No collection-relationship (rel=next/prev/up) or title-position lane. Add shadow rel detector; cross-page is out of single-page scope. |

---

### SC 2.4.3 — Focus Order (navigable)

> 2.4.3 has NO authoritative lane, NO axe rule, and NO LLM rubric. The ONLY 2.4.3-tagged signal is the opt-in, uncalibrated, shadow kbd-graph tab-order divergence triage (which partly assesses the static F44/G59 case). The dynamic dialog/menu focus-management failure F85 is touched by NO detector.

**Best coverage:** Triage-only. **Audit:** 1 overclaim (F85 PARTIAL→NOT_CAPTURED; F44/G59 vsr-analysis lane removed — it is `sc:'1.3.2'`-tagged).

| Technique | Tech | Role | Verdict | Lane(s) | Gap / Recommendation |
|---|---|---|---|---|---|
| F44 | failures | failure | PARTIAL | kbd-graph collectTabOrder + order-check `sc:2.4.3` (shadow,opt-in,uncalibrated triage); skills | Uncalibrated; flags within-column only; no logical-order judgment. Calibrate triage and/or add 2.4.3 rubric. |
| F85 | failures | failure | NOT_CAPTURED | skills (guidance-only) | Tab-order instrument is static — never activates triggers / tracks focus-on-open/return. Add dynamic focus-management probe + rubric. |
| G59 | general | sufficient | PARTIAL | kbd-graph collectTabOrder + order-check `sc:2.4.3` (shadow,opt-in,uncalibrated); skills | Can't affirm source/tab matches logical order; cross-column grouping undecided. Add 2.4.3 rubric; calibrate. |

---

### SC 2.4.4 — Link Purpose (In Context) (navigable)

> For SC 2.4.4 the only LIVE lane is axe's `link-name`/`area-alt` rules surfaced as a non-authoritative shadow cross-signal (2.4.4 is in `AXE_SURFACED_SCS`; both carry `wcag244`), detecting only the hard "link/area has no accessible name" failure (F89) and the name-presence half of G91/H24/H30. There is NO authoritative catalog runner for link purpose; the purpose/context-adequacy judgment lives only in the SHADOW+INERT rubrics; the new-window/redundant-link advisories (G201, SCR24, H2) have no lane.

**Best coverage:** Shadow (live axe). **Audit:** 1 overclaim (F89 ax-state-diff lane removed — bound to 4.1.2).

| Technique | Tech | Role | Verdict | Lane(s) | Gap / Recommendation |
|---|---|---|---|---|---|
| F63 | failures | failure | PARTIAL | link-purpose rubric (shadow,inert); skill | Only inert rubric; doesn't encode F63 locality test. Enable rubric + add same-sentence/paragraph/list-item locality. |
| F89 | failures | failure | **CAPTURED** | axe link-name (shadow,live,surfaced — wcag244); alt-text rubric (inert) | — (no-accessible-name link directly detected, shadow tier; no authoritative 2.4.4 lane) |
| G53 | general | sufficient | PARTIAL | link-purpose rubric (shadow,inert); skill | Purpose-from-sentence judgment inert. Enable rubric; evaluate enclosing sentence. |
| G91 | general | sufficient | PARTIAL | link-purpose rubric (shadow,inert); axe link-name (live — presence); skill | Descriptiveness inert; axe presence only. Enable rubric. |
| G201 | general | advisory | NOT_CAPTURED | none | No new-window warning detector. Add shadow detector / extend rubric. |
| H2 | html | advisory | NOT_CAPTURED | none | No adjacent duplicate same-href image+text pair detector. Optional shadow heuristic. Low priority. |
| H24 | html | sufficient | PARTIAL | axe area-alt (shadow,live,surfaced — wcag244); link-purpose rubric (inert) | Area name presence surfaced; descriptiveness (check #2) inert. Extend/enable rubric for area purpose. |
| H30 | html | sufficient | PARTIAL | axe link-name (live — presence); link-purpose + alt-text rubrics (inert); skill | Descriptiveness in inert rubrics. Enable rubrics; axe as presence pre-filter. |
| H80 | html | advisory | PARTIAL | link-purpose rubric (shadow,inert); skills | Heading-context purpose only in inert rubric. Enable rubric; incorporate preceding heading. |
| SCR24 | client-side-script | advisory | NOT_CAPTURED | none | No scripted new-window-warning/device-independence detector. Optional shadow detector (shares G201 impl). |

---

### SC 2.4.6 — Headings and Labels (navigable)

> SC 2.4.6 is a descriptiveness/clarity criterion for headings (G130) and labels (G131) plus two advisory new-window techniques (G201, SCR24). The only lane touching the core quality is the shadow+inert `heading-descriptive` rubric (covers headings AND labels), with IBM excluded as noise, no axe descriptiveness rule, the authoritative 3.3.2 probe checking only name-presence (not clarity), and zero lane for the advisory new-window techniques.

**Best coverage:** Shadow/inert. **Audit:** 0 overclaims.

| Technique | Tech | Role | Verdict | Lane(s) | Gap / Recommendation |
|---|---|---|---|---|---|
| G130 | general | sufficient | PARTIAL | heading-descriptive rubric (shadow,inert); skill | Heading "identifies section" only in inert rubric. Enable rubric (PROVISIONAL). |
| G131 | general | sufficient | PARTIAL | heading-descriptive rubric (shadow,inert); skill; 3.3.2 field-label-probe (authoritative,live — presence/visible-match, NOT clarity) | Label clarity only in inert rubric; don't credit 3.3.2 for clarity. Enable rubric. |
| G201 | general | advisory | NOT_CAPTURED | none | No new-window warning lane (raw `newTab` flag captured but unconsumed). Add detector/rubric. |
| SCR24 | client-side-script | advisory | NOT_CAPTURED | none | No new-window warning / device-independence / same-window-fallback lane. Cover runtime portion via G201 detector. |

---

### SC 2.4.7 — Focus Visible (navigable)

> The AUTHORITATIVE `focus-visual-retry` runner soundly clears OUTLINE/BORDER/SHADOW-based focus indicators (C45, G149, G165) via real keyboard Tab + dual-channel agreement (computed signature AND pixel diff). But its computed channel ignores the element's OWN background-color, so background-shift indicators (C15's bg variant, SCR31) hit a channel conflict and only reach inconclusive PARTIAL. It cannot retain-test blur-on-focus (F55) nor compute contrast/size thresholds (G195, C40) or judge look-alike/occluded indicators (F78).

**Best coverage:** **Authoritative.** **Audit:** 3 overclaims (C15/SCR31/F55 CAPTURED→PARTIAL).

| Technique | Tech | Role | Verdict | Lane(s) | Gap / Recommendation |
|---|---|---|---|---|---|
| C15 | css | sufficient | PARTIAL | focus-visual-retry (authoritative,live — outline/border only); focus-visible-clear rubric (inert); skill | Own-background focus shift defeats dual-channel agreement → inconclusive. Add base background-color to computed signature. |
| C45 | css | sufficient | **CAPTURED** | focus-visual-retry (authoritative,live); focus-visible-clear rubric (inert) | — (`:focus-visible` outline confirmed via real keyboard focus) |
| SCR31 | client-side-script | sufficient | PARTIAL | focus-visual-retry (authoritative,live — border only); focus-visible-clear rubric (inert); skill | Scripted background toggle defeats computed channel. Include own background-color in signature. |
| G149 | general | sufficient | **CAPTURED** | focus-visual-retry (authoritative,live); focus-visible-clear rubric (inert) | — (UA default outline ring confirmed) |
| G165 | general | sufficient | **CAPTURED** | focus-visual-retry (authoritative,live); focus-visible-clear rubric (inert) | — (default focus indicator confirmed; native-vs-author distinction has no runtime signal) |
| G195 | general | sufficient | PARTIAL | focus-visual-retry (authoritative,live — presence); focus-visible-clear rubric (inert — perceivability); skill | No 3:1 contrast-change / area / 2px-fallback computation. Add focus-indicator measurement. |
| C40 | css | sufficient | PARTIAL | focus-visual-retry (authoritative,live — presence); focus-visible-clear rubric (inert); skills | No 9:1 inter-color / per-band 2px / single-solid-bg checks. Extend measurement runner. |
| F55 | failures | failure | PARTIAL | focus-visual-retry (collapses to non-focusable, no labeled barrier); keyboard-activation (operability not retention); kbd-graph; skills | No focus-retention test; blur-on-focus invisible. Add focus-retention probe. |
| F78 | failures | failure | PARTIAL | focus-visual-retry (authoritative,live — removal sub-case); focus-visible-clear rubric (inert — occluded/ambiguous); skill | Look-alike/occluded sub-cases only in inert rubric. Promote rubric; add border-vs-ring discriminability. |

---

### SC 2.4.10 — Section Headings (AAA) (navigable)

> SC 2.4.10: both sufficient techniques (G141, H69) address the same condition — each logical content/navigational section begins with a properly nested heading — for which v3 has NO catalog runner, NO surfaced/capable axe rule, and NO LLM rubric. The only lane is the guidance-only page-structure skill (names 2.4.10, emits no signal).

**Best coverage:** Guidance-only. **Audit:** 0 overclaims (both verdicts upheld after codebase verification).

| Technique | Tech | Role | Verdict | Lane(s) | Gap / Recommendation |
|---|---|---|---|---|---|
| G141 | general | sufficient | PARTIAL | page-structure skill (guidance-only) | No automated section-to-heading coverage / nesting check. Add 2.4.10 rubric fed by heading outline + landmark map. |
| H69 | html | sufficient | PARTIAL | page-structure skill (guidance-only) | No detector that each region begins with a heading. Add 2.4.10 section-headings rubric + optional shadow triage. |

---

### SC 3.3.1 — Error Identification (input-assistance)

> SC 3.3.1's only authoritative lane is the catalog `form-error-probe`, which is barrier-only (it detects when an invalid submit surfaces NO error message of any channel). Every affirmative quality requirement (error in TEXT, identifies the field, programmatic association, alertdialog/aria-invalid correctness) sits in the inert 3.3.1 rubric and guidance skill. The 4.1.3 status-detector does NOT apply (it skips form-submit triggers), and axe's aria-* rules run but are dropped (3.3.x outside the allow-list).

**Best coverage:** **Authoritative (barrier-only).** **Audit:** 4 overclaims (ARIA19/SCR32 status-detector lane removed — skips submit; ARIA2 field-label-probe lane removed; ARIA21 ax-state-diff lane removed).

| Technique | Tech | Role | Verdict | Lane(s) | Gap / Recommendation |
|---|---|---|---|---|---|
| ARIA2 | aria | advisory | PARTIAL | error-id rubric (shadow,inert); skill; axe aria-required-attr (capable,NOT-surfaced) | No required-state-vs-visual-cue verification. Add required-cue detector or surface axe; rubric C2 caveat forbids inference. |
| ARIA18 | aria | sufficient | PARTIAL | form-error-probe (authoritative,live,barrier-only); error-id rubric (inert); skill | Alertdialog name/focus mechanics unverified; text quality inert. Run rubric live; lean on focus-management. |
| ARIA19 | aria | sufficient | PARTIAL | form-error-probe (authoritative,live,barrier-only); error-id rubric (inert); skills | Live-container-present-at-load unverified; status-detector does NOT apply (skips submit). Run rubric live; add load-time live-region check. |
| ARIA21 | aria | sufficient | PARTIAL | form-error-probe (authoritative,live,barrier-only); error-id rubric (inert); skill; axe aria-valid-attr-value (capable,NOT-surfaced) | aria-invalid flip + describedby quality unverified. Add aria-invalid detector; run rubric; optionally surface axe. |
| G83 | general | sufficient | PARTIAL | form-error-probe (authoritative,live,barrier-only); error-id rubric (inert); skill | Text-names-omitted-field + data re-display only inert. Run rubric live. |
| G84 | general | sufficient | PARTIAL | form-error-probe (authoritative,live,barrier-only); error-id rubric (inert); skill | Color-only-vs-text + allowed-values quality only inert. Run rubric live. |
| G85 | general | sufficient | PARTIAL | form-error-probe (authoritative,live,barrier-only); error-id rubric (inert); skill | Text-identifies-field/nature only inert; fix-suggestion in 3.3.3. Run rubric live. |
| G139 | general | advisory | NOT_CAPTURED | none | No jump-to-error-link mechanism check. Add detector / extend rubric for anchors. Advisory. |
| G199 | general | advisory | NOT_CAPTURED | none | No success-feedback path (harness doesn't submit valid data). Out of typical scope. |
| PDF5 | pdf | sufficient | OUT_OF_DOMAIN | none | PDF /Ff required-field flag. |
| PDF22 | pdf | sufficient | OUT_OF_DOMAIN | none | PDF format/value validation alerts. |
| SCR18 | client-side-script | sufficient | PARTIAL | form-error-probe (authoritative,live,barrier-only); error-id rubric (inert); skill | Native `window.alert()` not observable (no dialog handler). Run rubric live; add `page.on('dialog')`. |
| SCR32 | client-side-script | sufficient | PARTIAL | form-error-probe (authoritative,live,barrier-only); error-id rubric (inert); skills | Inserted error-list text quality inert; status-detector does NOT apply (skips submit). Run rubric live. |

---

### SC 3.3.2 — Labels or Instructions (input-assistance)

> 3.3.2's per-field visible-label-presence core (H44) is genuinely AUTHORITATIVE via the catalog `field-label-probe`; descriptiveness (G131) and the adjacent-button pattern (G167) are PARTIAL (authoritative presence + inert rubric for the quality judgment); and everything group-level or behavioral — F82 and H71 (missing group label), ARIA2 (aria-required vs visual cue), G13 (change-of-context warning) — is NOT_CAPTURED, since the per-field probe is structurally blind to groups, no surfaced axe rule applies, and the only touching rubric is inert and not framed for those cases.

**Best coverage:** **Authoritative.** **Audit:** 2 overclaims (F82 and H71 PARTIAL→NOT_CAPTURED — per-field probe is group-blind; only inert/unframed rubric).

| Technique | Tech | Role | Verdict | Lane(s) | Gap / Recommendation |
|---|---|---|---|---|---|
| ARIA2 | aria | advisory | NOT_CAPTURED | none | No aria-required-vs-visual-cue check (probe ignores aria-required; ax-state-diff is activation-only). Add shadow detector / extend rubric. |
| F82 | failures | failure | NOT_CAPTURED | field-label rubric (shadow,inert — NOT framed for groups); field-label-probe (per-field — `nearbyVisibleText` passes the punctuation trap); skill | No group-label concept; probe actively passes the trap case. Add group-label heuristic + extend rubric. |
| G13 | general | advisory | NOT_CAPTURED | none | No change-of-context-on-change detector. New shadow detector/rubric. |
| G131 | general | sufficient | PARTIAL | field-label rubric (shadow,inert — descriptiveness core); field-label-probe (authoritative,live — presence only); skill | Label purpose-clarity only in inert rubric. Enable rubric (PROVISIONAL). |
| G167 | general | sufficient | PARTIAL | field-label-probe (authoritative,live — nearby button text + accName); field-label rubric (inert); skill | Field+button pairing/adjacency not modeled. Extend rubric/add detector for adjacent-button-as-label. |
| H44 | html | sufficient | **CAPTURED** | field-label-probe (authoritative,live) | — (visible associated label presence directly verified) |
| H71 | html | sufficient | NOT_CAPTURED | field-label rubric (shadow,inert — NOT framed for group description); field-label-probe (per-field, no group concept); skill | No fieldset/legend / role=group label check. Add group-label detector + extend rubric. |
| PDF10 | pdf | sufficient | OUT_OF_DOMAIN | none | PDF /TU tooltip field labels. |

---

### SC 3.3.3 — Error Suggestion (input-assistance)

> SC 3.3.3 has NO authoritative lane: only the inert, shadow `error-suggestion` rubric can judge whether a correction is suggested. The authoritative `form-error-probe` is an SC 3.3.1 barrier-only runner (cross-signal for 3.3.3, never authoritative for it). Suggestion-content techniques are PARTIAL; jump-to-error/success-feedback advisories are NOT_CAPTURED; PDF is OUT_OF_DOMAIN.

**Best coverage:** Shadow/inert. **Audit:** 6 lane-label overclaims corrected (form-error-probe relabeled "authoritative for 3.3.1 only / 3.3.3 cross-signal" across ARIA18/G84/G85/G177/SCR18/SCR32; verdicts unchanged).

| Technique | Tech | Role | Verdict | Lane(s) | Gap / Recommendation |
|---|---|---|---|---|---|
| ARIA18 | aria | sufficient | PARTIAL | error-suggestion rubric (shadow,inert); error-id rubric (inert); form-error-probe (3.3.1-only barrier-gate); skill | Suggestion content inert; submit-state clip is form-region-only (alertdialog may be excluded). Enable rubric; union dialog rect in capture. |
| G84 | general | sufficient | PARTIAL | error-suggestion rubric (shadow,inert); error-id rubric (inert); form-error-probe (3.3.1-only); skill | Allowed-values listing only in inert rubric. Enable rubric. |
| G85 | general | sufficient | PARTIAL | error-suggestion rubric (shadow,inert); form-error-probe (3.3.1-only); skill | Correction-example presence inert; data re-display (test #3) uncovered. Enable rubric; add persistence check. |
| G139 | general | advisory | NOT_CAPTURED | none | No jump-to-error-link mechanism check. Add anchor-resolution detector / rubric. |
| G177 | general | sufficient | PARTIAL | error-suggestion rubric (shadow,inert); form-error-probe (3.3.1-only); skill | Correction-text presence/placement only in inert rubric. Enable rubric. |
| G199 | general | advisory | NOT_CAPTURED | none | No success-path probe / success-feedback rubric. Add valid-submit flow. Advisory. |
| PDF22 | pdf | sufficient | OUT_OF_DOMAIN | none | PDF format-validation alerts. |
| SCR18 | client-side-script | advisory | PARTIAL | error-suggestion + error-id rubrics (inert); form-error-probe (3.3.1-only); skill | Suggestion adequacy inert; native `alert()` text not DOM-observable. Enable rubric; capture native alerts. |
| SCR32 | client-side-script | advisory | PARTIAL | error-suggestion + error-id rubrics (inert); form-error-probe (3.3.1-only); status-detector (4.1.3,opt-in,does-not-judge); skill | Suggestion adequacy inert; jump-to-error link wiring uncovered. Enable rubric; add anchor-resolution check. |

---

### SC 4.1.2 — Name, Role, Value (compatible)

> 4.1.2's authoritative lane is catalog `ax-state-diff` (AX name/role/state-on-activation, closed ARIA state set, fires only on widget-role/native-control elements) plus `field-label-probe` (form-input name absence) and the surfaced axe `link-name` (via 2.4.4). It authoritatively captures the MISSING-ACCESSIBLE-NAME failures (F68/F86/F89), but is blind to (a) ROLE-absence on roleless scripted controls (F59 AND F42 — both excluded by the `WIDGET_ROLE` gate), (b) NAME ADEQUACY for ARIA14/ARIA16 (no 4.1.2 rubric), and (c) focus-state notification (F79) / stale-text-alternative-on-update (F20).

**Best coverage:** **Authoritative.** **Audit:** 1 verdict overclaim (F42 PARTIAL→NOT_CAPTURED) plus F68/F86/F111 lane-accuracy corrections (ax-state-diff does not fire on plain text inputs; F111 label-in-name rubric exists but inert).

| Technique | Tech | Role | Verdict | Lane(s) | Gap / Recommendation |
|---|---|---|---|---|---|
| ARIA14 | aria | sufficient | PARTIAL | ax-state-diff axNamePresent (authoritative,live — presence); vsr-analysis no-name/name-mismatch (shadow); skill; axe button-name family (capable,NOT-surfaced) | Name adequacy unjudged (no 4.1.2 rubric). Add accessible-name-adequacy rubric. |
| ARIA16 | aria | sufficient | PARTIAL | ax-state-diff axNamePresent (authoritative,live); vsr-analysis no-name (shadow); skill; axe aria-input-field-name (NOT-surfaced) | idref-resolution captured via accName; "accurately labels" adequacy unassessed. Same name-adequacy rubric. |
| F15 | failures | failure | PARTIAL | ax-state-diff (authoritative,live — WIDGET_ROLE-gated); vsr-analysis no-name (shadow); skill | Roleless custom controls bypass the gate; value-completeness beyond closed state set. Add interactivity-without-role detector; relax gate. |
| F20 | failures | failure | NOT_CAPTURED | none | No temporal alt-vs-content staleness diff. Add dynamic-update mode to alt-text rubric. |
| F42 | failures | failure | NOT_CAPTURED | vsr-analysis no-name (shadow — only if also nameless); skill | No emulated-link role-mismatch detector; roleless elements never enter the runner. Add click-handler-without-role detector (shared with F59). |
| F59 | failures | failure | NOT_CAPTURED | vsr-analysis no-name (shadow — only if nameless); skill | Roleless scripted controls never generate a 4.1.2 obligation (WIDGET_ROLE gate). Add event-handler/interactivity probe; relax gate. |
| F68 | failures | failure | **CAPTURED** | field-label-probe fieldLabelBarrier `sc:3.3.2` (authoritative,live — all input/textarea/select); ax-state-diff (corroborates WIDGET_ROLE subset only); vsr-analysis (shadow); axe label/select-name (wcag412,NOT-surfaced) | — (missing programmatic name on form controls directly detected) |
| F79 | failures | failure | NOT_CAPTURED | none | No AX focus-state / focus-change-notification reading. Add CDP focus-state instrument. |
| F86 | failures | failure | **CAPTURED** | field-label-probe (authoritative,live — per sub-input); ax-state-diff (corroborates native sub-controls); vsr-analysis (shadow) | — (per-subfield missing name detected) |
| F89 | failures | failure | **CAPTURED** | axe link-name (DECIDED+SURFACED via wcag244/2.4.4, shadow,live); ax-state-diff (authoritative,live — `<a>` matches WIDGET_ROLE → BARRIER); vsr-analysis (shadow) | — (image-only link with no accName detected, dual lanes) |
| F111 | failures | failure | PARTIAL | field-label-probe/ax-state-diff axNamePresent (authoritative,live — mode a); label-in-name rubric `sc:2.5.3` (shadow,INERT — mode b containment); vsr-analysis name-mismatch (shadow,uncalibrated); skill | Containment (mode b) rubric exists but inert and bound to 2.5.3. Activate/surface label-in-name rubric for 4.1.2. |
| G10 | general | sufficient | PARTIAL | ax-state-diff role+name+state-change (authoritative,live); field-label-probe (authoritative,live); skill | Property-setting/full value semantics beyond closed check; widget-role-gated. Name/role/notification facet covered. |
| G108 | general | sufficient | PARTIAL | ax-state-diff (authoritative,live); field-label-probe (authoritative,live); keyboard-activation (operability); skill | Property-setting depth not verified; per-widget-role only. Most web-relevant — name/role/operability covered. |
| G135 | general | sufficient | PARTIAL | ax-state-diff (authoritative,live); skill | Value/property setting; Java-applet framing partly out of medium. AX name/role/notification covered for web. |

---

### SC 4.1.3 — Status Messages (compatible)

> 4.1.3 has NO authoritative lane (the registry only carries a never-clearable 4.1.3/INAPPLICABLE entry). The sole runtime signal is the opt-in, shadow, insertion-only `status-detector.js`, which detects the canonical F103 unannounced-status failure (PARTIAL at best) and inversely recognizes injection into a pre-existing live region as a non-barrier. There is NO LLM rubric and NO consumed axe rule for 4.1.3, and `ariaNotify` + the opt-out-toggle + the multimedia-avatar help technique are entirely uncovered.

**Best coverage:** Shadow/inert. **Audit:** 1 overclaim (G193 OUT_OF_DOMAIN→NOT_CAPTURED — it is an in-domain rendered-page avatar, just uncovered).

| Technique | Tech | Role | Verdict | Lane(s) | Gap / Recommendation |
|---|---|---|---|---|---|
| ARIA18 | aria | advisory | NOT_CAPTURED | none | status-detector only SUPPRESSES the alertdialog focus-move as non-barrier; never affirms name+focus+error-text. Add alertdialog rubric + cross-ref 2.1.2/2.4.3. |
| ARIA19 | aria | sufficient | PARTIAL | status-detector (shadow,opt-in,insertion-only); skill | Detector skips submit (technique's own 500ms submit example); can't confirm container pre-existed load. Extend to drive submit + longer settle; verify load-time live region. |
| ARIA22 | aria | sufficient | PARTIAL | status-detector (shadow,opt-in,insertion-only); skill | Click-driven case non-flagged; role=status pre-existence + equivalent-visual-context (test #3) unverified. Add rubric + pre-change role check. |
| ARIA23 | aria | sufficient | PARTIAL | status-detector (shadow,opt-in,insertion-only); skill | role=log non-flagged but no positive presence verification. Add static role=log check/rubric. |
| ARIA25 | aria | sufficient | PARTIAL | status-detector (shadow,opt-in,insertion-only); skill | Async/timer progress updates fall outside 300ms settle; progressbar↔live wiring unverified. Extend settle window; add wiring rubric. |
| ARIA27 | aria | sufficient | NOT_CAPTURED | none | `document.ariaNotify()` leaves no DOM footprint. Hook/spy ariaNotify in collector. Low urgency (experimental). |
| F103 | failures | failure | PARTIAL | status-detector (shadow,opt-in,insertion-only); skill | Canonical failure detected, but shadow/never-authoritative, insertion-only, click-only (skips submit/async); structural inference not real-AT. Promote to PROVISIONAL; extend coverage; wire VSR transcript. |
| G193 | general | sufficient | NOT_CAPTURED | none | In-domain help-avatar; no presence/understanding-help lane. Optional low-priority content rubric. |
| SCR14 | client-side-script | advisory | NOT_CAPTURED | none | No announcement-toggle (opt-out) affordance check; timer-driven updates missed. Add toggle/instrument check. Advisory. |

---

## Appendix

### Verdict distribution (across all 210 SC–technique rows)

Tallied from the per-SC tables above.

| Verdict | Count | Share |
|---|---:|---:|
| CAPTURED | 18 | 8.6% |
| PARTIAL | 108 | 51.4% |
| NOT_CAPTURED | 76 | 36.2% |
| OUT_OF_DOMAIN | 8 | 3.8% |
| **Total** | **210** | **100%** |

(Exact, tallied programmatically from the audited verdict data — the per-SC tables above are the source of record.)

Reading: only **8.6%** of in-scope SC–technique pairs are genuinely CAPTURED today; **51.4%** are PARTIAL (a lane touches the condition but cannot fully assess it, most often because the assessing lane is inert/non-authoritative or a capable axe rule is dropped); **36.2%** are NOT_CAPTURED; **3.8%** are OUT_OF_DOMAIN. The PARTIAL band is where the roadmap's highest-ROI moves live — surfacing axe and activating the inert LLM lane would convert a large fraction of PARTIAL rows into scored signals.

### Counts by technology

Rows = SC–technique pairs (a technique under two SCs counts in both), so these sum to 210; the 174 *unique* techniques break down as general 58 / failures 46 / aria 21 / css 19 / html 15 / client-side-script 8 / pdf 7.

| Technology | Rows | CAP | PART | NOT | OOD | Notes |
|---|---:|---:|---:|---:|---:|---|
| general (G*) | 68 | 4 | 38 | 26 | 0 | Largely PARTIAL — sufficient techniques whose adequacy judgment is in inert rubrics; several barrier-only-capped. |
| failures (F*) | 56 | 6 | 24 | 26 | 0 | Mix of CAPTURED (table/name failures) and NOT_CAPTURED (whitespace, temporal, roleless-control, CSS-background failures). |
| aria (ARIA*) | 27 | 0 | 20 | 7 | 0 | Name/role/idref/live-region; presence partly authoritative, adequacy/idref-resolution inert or missing. |
| css (C*) | 21 | 6 | 6 | 9 | 0 | Reflow C31–C38 strongest (CAPTURED); font-size/letter-spacing/CSS-background advisories NOT_CAPTURED. |
| html (H*) | 19 | 2 | 13 | 4 | 0 | H44 the standout CAPTURED (authoritative); most others PARTIAL pending axe-surfacing/rubric activation. |
| client-side-script (SCR*) | 11 | 0 | 7 | 4 | 0 | SCR39/SCR31 PARTIAL on barrier-only/dual-channel limits; SCR18/SCR32 PARTIAL on inert rubrics + native-alert blind spot. |
| pdf (PDF*) | 8 | 0 | 0 | 0 | 8 | All OUT_OF_DOMAIN (PDF22 serves both 3.3.1 and 3.3.3). |
| **Total** | **210** | **18** | **108** | **76** | **8** | |

### Techniques deemed OUT_OF_DOMAIN

All 8 OUT_OF_DOMAIN rows are PDF authoring/structure techniques (7 unique techniques; PDF22 serves both 3.3.1 and 3.3.3) outside the rendered-web-page-at-runtime harness:

- **PDF1** (1.1.1) — /Alt entry for images in tagged PDF.
- **PDF3** (1.3.2) — tab/reading order in tagged PDF.
- **PDF4** (1.1.1) — /Artifact tag for decorative images in tagged PDF.
- **PDF5** (3.3.1) — /Ff required-field flag in tagged PDF forms.
- **PDF7** (1.4.5) — OCR conversion of scanned PDF images of text.
- **PDF10** (3.3.2) — /TU tooltip field labels in tagged PDF forms.
- **PDF22** (3.3.1, 3.3.3) — format/value validation alerts in tagged PDF forms.

Each parallels an in-domain technique conceptually (PDF1↔H37/G94, PDF3↔C27/G57, PDF4↔H67/C9, PDF5↔ARIA2, PDF7↔C22, PDF10↔H44/G131, PDF22↔SCR18/G85) but targets PDF tooling (Acrobat, tag structure) the harness neither authors nor inspects.
