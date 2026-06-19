# Trusted Tester v5.1.3 vs. v3 Harness — Validated Gap Analysis

**Date:** 2026-06-18
**Inputs:**
- DHS *Trusted Tester Section 508 Conformance Test Process for Web*, v5.1.3 (April 2024) — extracted per-SC into
  `refs/trusted-tester/` (untracked).
- Live harness code (rubrics, catalog runners, instruments, collector) — every claim below was grep/Read-verified
  against `scripts/v3/**` and `scripts/eval-page.js` on 2026-06-18 (see **Validation log** at end).

**Scope:** the 22 SCs in `categories.json`. Trusted Tester (TT) implements **Revised Section 508 = WCAG 2.0 A/AA**,
so it covers **17 of our 22**; the other 5 (1.4.10, 1.4.11, 1.4.13, 4.1.3 are WCAG 2.1; 2.4.10 is AAA) have **no TT
baseline** — for those our harness has *more* coverage than TT has tests.

---

## Implementation status (2026-06-18)

The in-scope gaps below were implemented this date (see `scripts/v3/tests/trusted-tester-gaps.test.js` + the
`probe-collect-lists.js` / `probe-bgimage-captcha.js` manual probes; both collectors kept at parity).

A 4-agent **adversarial review** (one skeptic per lane, novel counter-examples run through the real code) hardened
the lanes: fixed two **G5 false barriers** (disabled / readonly required fields are now not-applicable), a **G2**
recall bug (`aria-labelledby` is resolved to TEXT, so a dangling ref no longer masks a barrier), a **G3** Turnstile
class-detection gap, and a **G1** container-of-lists false-nesting + prose-dash false-positive, while extending G1
recall to roman/lettered/emoji/fullwidth ordered markers. **Architectural note (G1):** "is this a list?" is a
*perception* judgment the vision-backed `info-relationships-v0` rubric owns — the collector's faux-list entries are
**high-recall CANDIDATES**, not verdicts (nothing deterministic keys off `kind:'faux'`); the rubric confirms/rejects
them from the viewport screenshot, so prose/attribution/footnote/toolbar/breadcrumb false candidates are rejected at
the LLM, not chased with an ever-growing glyph regex. CSS-`::before`-bulleted lists (invisible to any DOM-text
heuristic) are left to the rubric+screenshot by design.

| Gap | Status | What shipped |
|---|---|---|
| **G1 list semantics** (1.3.1/10.D) | ✅ **DONE** | `collect-lists.js` (real `ul/ol/dl` + the canonical faux-list failure: `<br>`-bulleted / sibling-bulleted blocks) → `structure.lists[]` in BOTH collectors → `s.structure.lists` precompute → `info-relationships-v0` clause. |
| **G2 background-image meaning** (1.1.1/7.C) | ✅ **DONE** | `backgroundImageMeaningful` collector signal (url() bg, no text, no accessible name, not aria-hidden; nominated when interactive at any size, or a rendered non-tracking-pixel background that is not a full-bleed backdrop — **size is NOT used as a meaning proxy; informational-vs-decorative is deferred to the rubric**) → existing `non-text-content` family → `alt-text-adequacy-v0` extended (decorative is the default; barrier only when info has no text equivalent). |
| **G3 CAPTCHA modalities** (1.1.1/7.D) | ✅ **DONE** | `isCaptcha` collector signal → new `captcha-alternative` family + `captcha` skill + review-tier `captcha-alternative-v0` rubric (asks the multi-modal question, defaults to PARTIAL); `RUBRIC_GATE` keeps it captcha-only and keeps captchas out of alt-text-adequacy. |
| **G5 error-trigger depth** (3.3.1/5.F) | ✅ **DONE (sound subset)** | `form-error-probe` `fieldConstrained` widened to UNAMBIGUOUS client-side framework REQUIRED markers (`data-val-required`, `data-required="true"`, `data-rule-required="true"`, `ng-required="true"`, `data-val-email`). Bare `type=password` and ambiguous/expression markers deliberately EXCLUDED — a non-navigating probe cannot see server-side validation, so widening there would false-barrier. |
| **G4 reveal-focus-order** (2.4.3/4.F) | ⏸ **DEFERRED** | Same work as backlog item D — `docs/DEFERRED-TODO.md` §F. |
| **G6 cross-page** (2.4.2/2.4.4) | ⏸ **STRUCTURAL** | Single-page boundary; rubrics already avoid a false PASS. Documented in `docs/DEFERRED-TODO.md` §F. |
| **G7 keystroke-timing** / **G8 `<frame>` title** | ⏸ **TRACKED** | Niche/obsolete; `docs/DEFERRED-TODO.md` §F. |

---

## 0. How to read this (the two systems are not the same kind of thing)

| | Trusted Tester | v3 Harness |
|---|---|---|
| Operator | Certified human tester | Automated pipeline |
| Inspection instrument | **ANDI** bookmarklet (AX name/role/structure), **CCA** (contrast), manual keyboard | **CDP** AX-tree + collector facts, pixel/CSSOM contrast, VSR, OCR |
| Judgment | The human decides pass/fail | SC-scoped **LLM rubric** (capped at shadow/canary — *never authoritative*) |
| Output | **Authoritative** PASS/FAIL/DNA/Not-Tested per Test Condition | **Non-authoritative** PROVISIONAL/shadow annotation |
| Unit | Per Test Condition, page- and site-level | Per element × SC obligation, single page |

**Consequence:** even where the harness "covers" a TT test, its verdict is a *triage annotation*, not a conformance
determination — by design (the AUTHORITY registry gates every mechanism to shadow except `focus-visual-retry`,
itself still shadow). So "ALIGNED" below means *"the harness makes the same determination with an equivalent
mechanism,"* not *"the harness can replace a Trusted Tester."*

**Where the harness is genuinely strong vs. typical automated tools:** TT has many **trigger-and-observe** tests
(submit an invalid form, tab into a trap, activate a control, let content auto-update). The harness *actually
performs these interactions* via deterministic runners and mutating CDP tools, rather than statically inspecting
the DOM — see §2 runners and §3 tools. That is the most important structural alignment and the reason a per-SC
comparison is even meaningful.

---

## 1. Per-SC alignment table (the 17 TT-covered SCs)

Legend: **✅ ALIGNED** (equivalent mechanism exists & exercised) · **🟡 PARTIAL** (covered, with a named limitation)
· **🔴 GAP** (no harness equivalent).

| SC | TT test(s) → human determination | Harness mechanism (verified) | Verdict |
|---|---|---|---|
| **1.1.1** | 7.A meaningful-image alt is equivalent | `alt-text-adequacy-v0` + `long-description-completeness-v0` rubrics; `ocr_image_text` tool; decorative-marking-conflict collector (eval-page.js, ACT e88epe) | ✅ |
| | 7.B decorative image: empty name, not in tab order, not sole conveyor | rubric + collector (alt=""+meaningful-pixel) | ✅ |
| | 7.C **CSS background-image** info survives hiding it | `backgroundImageMeaningful` collector signal → `non-text-content` → `alt-text-adequacy-v0` (bg-image clause) | ✅ (G2 — was 🔴) |
| | 7.D **CAPTCHA** has non-visual **and** non-auditory alternative | `isCaptcha` → `captcha-alternative` family + review-tier `captcha-alternative-v0` rubric | ✅ (G3 — was 🔴) |
| **1.3.1** | 5.C programmatic form label/cues | `field-label-probe` runner (3.3.2) + `accessible-name-adequacy-v0` (4.1.2) + `info-relationships-v0` | ✅ |
| | 10.B visual heading ⇄ programmatic heading | `info-relationships-v0` explicitly judges "visual heading not marked up" (ACT 047fe0/H69) | ✅ |
| | 10.C heading **level** logically matches | rubric de-emphasizes level ("heading-skip is best-practice, not auto-fail"); TT 10.C is also lenient | 🟡 |
| | 10.D **visually-apparent lists** coded by type (ul/ol/dl), nesting | `collect-lists.js` (real `ul/ol/dl` shape/nesting/stray-child + faux `<br>`/sibling-bulleted lists) → `structure.lists[]` → `info-relationships-v0` | ✅ (G1 — was 🔴) |
| | 14.A/B/C data-table identification, cell-header association, layout-table not mis-coded | `collect-tables.js` (`headers[]`, `tdHeaderSamples[].resolved`, `danglingIdref`, `headerWithNoDataCell`, `looksLikeDataTable`) → `info-relationships-v0` | ✅ |
| **1.3.2** | 15.A reading order sensible without CSS positioning | `sequence-meaning-v0` rubric + `vsr-reading-order` instrument | ✅ |
| **1.4.1** | 13.A color not sole cue (grayscale technique) | `use-of-color-v0` rubric + `render_with_overrides` tool (grayscale/protanopia/deuteranopia/tritanopia) | ✅ |
| **1.4.3** | 13.C text contrast (ANDI auto + CCA least-contrast eyedropper for images/varied bg) | `text-contrast-pixel` runner + `contrast-over-complex-backdrop-v0` + `compute_contrast_ratio`/`resolve_part_color` tools; size-class via `contrastThresholdFor` | ✅ (🟡 image-of-text/gradient: tool refuses translucent/gradient → LLM judges pixels) |
| **1.4.5** | 7.E image-of-text replaceable-by-text or customizable (logotype exception) | `images-of-text-v0` rubric + `ocr_image_text` + `request_hi_res_crop` tools | ✅ |
| **2.1.1** | 4.A all functionality keyboard-operable; 4.B no keystroke-timing | `keyboard-activation` runner (Enter/Space) + `focus-rejection` instrument (F55) + pointer-vs-key listener inventory (keyboard-orphan) | ✅ (🟡 4.A essential-info-in-tooltip; 🔴 4.B keystroke-timing — niche) |
| **2.1.2** | 4.C no keyboard trap (Tab/Shift+Tab/Esc; documented escape) | `keyboard-trap-escape` runner + `keyboard-trap` instrument (+directional +self-refocus) | ✅ |
| **2.4.2** | 12.A title defined/non-empty; 12.B describes purpose **& distinguishes among the set** | `page-title-v0` rubric (page-level) | ✅ (🟡 "distinguishes from sibling pages" needs cross-page context the single-page harness lacks) |
| **2.4.3** | 4.F focus order preserves meaning — **including revealed content** (menus/dialogs/trees) | `tab-order` instrument + `focus-order-meaning-v0` rubric | 🟡 (reveal-then-check-within deferred — see G5) |
| **2.4.4** | 6.A link purpose from text+context; same-named links | `link-purpose-v0` rubric + `resolve_destination` tool (same-name→different-dest) | ✅ |
| **2.4.6** | 5.B form label descriptive; 10.A heading descriptive | `heading-descriptive-v0` (sc:2.4.6) — covers **both** headings and labels | ✅ |
| **2.4.7** | 4.D visible focus indicator | `focus-visual-retry` runner + `focus-rejection` instrument | ✅ |
| **3.3.1** | 5.F enter invalid input, submit, error identified **in text** | `form-error-probe` runner (gates on `required\|pattern\|type∈{email,url,number,tel}\|min\|max\|minlength`; **synthesizes a constraint-violating value**, submits without navigating, detects error surface — exp-runners.js:452–577) + `error-identification-v0` | ✅ (🟡 only fires on fields with a *detectable* HTML constraint — see G5) |
| **3.3.2** | 5.A visible label/instruction present | `field-label-probe` runner (sc:3.3.2) | ✅ |
| **3.3.3** | 5.G error message suggests how to fix | `error-suggestion-v0` rubric | ✅ (🟡 only meaningful when 5.F trigger produced an error) |
| **4.1.2** | 5.C/6.A/7.x name-role-value; 12.C `<frame>` title; 12.D `<iframe>` name; 2.D auto-update notification | `ax-state-diff` runner + `accessible-name-adequacy-v0` + `query_ax_node` tool; 2.D → `status-message`/`native-dialog`/`observe_state_after_activation` | ✅ (🟡 12.C obsolete `<frame>`) |

**Tally (17 SCs):** ✅ ALIGNED on the core of 15 · 🟡 PARTIAL limitation noted on 7 · 🔴 hard GAP on **3 narrow
cells**: 1.1.1/7.C (background-image meaning), 1.1.1/7.D (CAPTCHA modalities), **1.3.1/10.D (list semantics)**.

---

## 2. The 5 SCs TT does NOT cover — harness exceeds the manual baseline

These are WCAG 2.1 (or AAA) and therefore **have no Trusted Tester test to compare against**. The harness already
builds barrier-only lanes for them, so the "gap" is reversed — there is no manual-process anchor to validate them.

| SC | Harness mechanism (verified) | Note |
|---|---|---|
| 1.4.10 Reflow | `reflow-overflow-probe` runner (320px) + `reflow-no-hscroll-v0` + `measure_geometry_live(viewportWidth)` | No TT anchor (TT predates 1.4.10) |
| 1.4.11 Non-text Contrast | `non-text-contrast-v0` + `resolve_part_color` + `compute_contrast_ratio` | No TT anchor |
| 1.4.13 Content on Hover/Focus | `hover-content-tri` runner + `hover-content-v0` + `set_state_and_capture` | No TT anchor |
| 4.1.3 Status Messages | `status-message` instrument + `native-dialog` + `aria-notify` + `status-message-v0` + `probe_screen_reader_after_action` | Closest TT anchor is **2.D** (auto-update notification, WCAG-2.0-era) — see `refs/trusted-tester/sc-4.1.2-name-role-value.md` |
| 2.4.10 Section Headings (AAA) | `section-headings-v0` rubric | TT covers A/AA only |

**Cross-check opportunity:** TT's **2.D** live-region/dialog/focus-move trichotomy is a useful manual reference for
sanity-checking our 4.1.3 lane even though 4.1.3 itself isn't in TT. Our lane already distinguishes the same three
mechanisms (live region / native dialog / focus-moved-to-change).

---

## 3. Prioritized gaps & recommendations (validated, in-scope)

### G1 — List semantics (1.3.1 / TT 10.D) — **highest-value in-scope gap** 🔴
**Evidence:** no `collect-lists.js`; `structure` is assembled with `headings[]` + `tables[]` only; the sole list
signal is a `listStyleNone` count (eval-page.js:190–191) used as a checker hint, not a per-list analysis. The
`info-relationships-v0` rubric's `signals.structure` does not receive a `lists[]` array.
**What's missing vs. TT 10.D:** (a) a *visually-apparent* list built from `<div>`/`<br>`/`<span>` with no
`ul/ol/dl` (the canonical failure); (b) wrong list **type** (sequence-bearing content as `ul`, or vice-versa);
(c) broken nesting/hierarchy. None are detectable today.
**Recommendation:** add `collect-lists.js` (heuristic visually-apparent-list detection + programmatic list-type +
nesting) mirroring `collect-tables.js`, and thread `structure.lists[]` into the `info-relationships-v0` signals
block. This is the cleanest, most defensible addition — it closes a real 1.3.1 sub-test with the same collector +
rubric pattern already proven for tables.

### G2 — CSS background-image carrying meaning (1.1.1 / TT 7.C) 🔴
**Evidence:** collector inspects `<img>`/SVG accessible names and a decorative-marking conflict; no detector for
*CSS `background-image`* that conveys information (TT explicitly hides backgrounds with ANDI and checks survival).
**Recommendation (low priority, lower frequency):** collect elements with non-empty `background-image` + no text
content + not-decorative heuristics, and route to an alt-adequacy-style rubric. Note this often overlaps 1.4.5 when
the background is an image of text.

### G3 — CAPTCHA multi-modal alternative (1.1.1 / TT 7.D) 🔴
**Evidence:** `alt-text-adequacy-v0` handles CAPTCHA *purpose description*; no check that an alternative exists for
users **without vision AND without hearing**.
**Recommendation (low priority, rare):** detect CAPTCHA widgets and emit a review-tier obligation prompting the
"is there a non-visual and non-auditory alternative?" question rather than a verdict.

### G4 — Reveal-then-check focus order & focus within revealed content (2.4.3 / TT 4.F.2.b) 🟡 (already deferred)
**Evidence:** TT 4.F requires *activating triggers that reveal hidden focusables* (menus, dialogs, expandable
trees) and checking focus order **to/from/within** them. Per the prior routing analysis this is the deferred
"#14b reveal-discovery" item (backlog D). The `tab-order` instrument captures the static tab sequence; it does not
systematically open every reveal.
**Recommendation:** keep on the backlog; when picked up, reuse `observe_state_after_activation` to open reveals,
then re-run tab-order within the revealed subtree.

### G5 — Error-trigger depth (3.3.1/3.3.3 / TT 5.F) 🟡 — **mostly resolved on inspection**
**Evidence (verified, exp-runners.js:452–577):** `form-error-probe` gates on
`fieldConstrained = required || pattern || type∈{email,url,number,tel} || min || max || minlength`, then *makes
the field invalid for the constraint it detects* ("make the field invalid (the error condition this constraint
detects)", line 530), submits without navigating (`requestSubmit`/synthetic submit, lines 539–546), and detects
whether an error is identified by native validation OR a custom mechanism (`aria-invalid` + referenced visible
message, or an error-class/error-text live region). So it **does** enter format-violating input (e.g. bad email,
out-of-range number), matching TT 5.F's intent — not just empty-required.
**Residual limitation:** a field whose validation is **purely custom JS with no HTML constraint attribute** and is
not `required` evaluates `fieldConstrained:false` → *not applicable*, so a real "weak password" check implemented
entirely in JS without `pattern`/`minlength` would be skipped. This is a narrow, honest residual, not a hard gap.
**Recommendation (low priority):** consider a soft-constraint heuristic (e.g. password fields, `aria-required`,
`data-val-*` framework attributes) to widen `fieldConstrained` for JS-validated fields.

### G6 — Cross-page / set-of-pages determinations (2.4.2/2.4.4) 🟡 (structural)
**Evidence:** single-page harness. TT 12.B asks whether a title **distinguishes the page within its set**; TT's
link-context and (out-of-scope) 3.2.3/3.2.4 are inherently multi-page.
**Recommendation:** accept as a scope boundary; if multi-page corpora are introduced, a thin "title-uniqueness /
nav-consistency" pass over a page set would close it. Document the boundary so these never read as false PASSes.

### G7 / G8 — Minor: keystroke-timing (2.1.1/TT 4.B) 🔴 niche; obsolete `<frame>` title (4.1.2/TT 12.C) 🟡
Low value — `<frame>` is HTML5-obsolete and keystroke-timing applies to a vanishing set of pages. Track but do not
prioritize.

---

## 4. What TT validates that confirms existing harness design choices

- **Grayscale for 1.4.1** (TT 13.A Identify-Content tip) ≡ our `render_with_overrides` grayscale transform — the
  manual process and the automated tool use the *same* technique.
- **Least-contrast eyedropper for varied backgrounds** (TT 13.C step 3.b/3.c) ≡ our `needsPixelContrast` →
  pixel-contrast worst-case path; TT's manual "choose the pixel that provides the least contrast" is exactly the
  worst-case-barrier logic.
- **"Absence of a finding is not a pass"** — TT's DNA/Not-Tested discipline matches our rubrics' explicit rule
  ("an ABSENT signal is 'could not determine', never 'passes'", e.g. `use-of-color-v0`, `info-relationships-v0`).
- **Trigger-and-observe** — TT's active interaction model (5.F submit, 4.C tab-trap, 2.D auto-update, 4.A operate)
  is mirrored by our mutating runners/tools, which is unusual for an automated harness and is the main reason the
  per-SC mapping holds up.
- **Heading level leniency** — TT 10.C explicitly allows out-of-sequence levels when they match visual
  importance; our rubric's "heading-skip is best-practice, not auto-fail" stance is *consistent* with TT, not a
  defect (so G's 10.C 🟡 is a deliberate alignment, not a miss).

---

## 5. Summary

- **Coverage:** of the 17 SCs TT tests, the harness has an equivalent, *exercised* mechanism for the core of all
  but list-semantics. The remaining 5 of our 22 SCs are beyond TT's WCAG-2.0 baseline and are covered by the
  harness with no manual anchor to compare against.
- **Hard in-scope gaps (all now CLOSED — see Implementation status):** the one that mattered — **G1 list semantics
  (1.3.1/10.D)** — plus the two narrow 1.1.1 cells (G2 background-image meaning, G3 CAPTCHA modalities) were all
  implemented 2026-06-18.
- **Partial/known:** reveal-focus-order depth (G4, deferred), error-trigger depth (G5 — *the sound subset shipped*:
  widened to unambiguous client-side framework-required markers; bare-password/server-side excluded), cross-page
  determinations (G6, structural — rubrics already avoid a false PASS), two minor legacy cases (G7/G8, tracked).
- **No new instruments are required** for the bulk of TT — the interaction-driven runners and CDP tools already
  perform TT's trigger-and-observe steps. The single highest-leverage build item is **`collect-lists.js` + a
  `lists[]` signal into `info-relationships-v0`**, which closes the only material in-scope gap using the exact
  collector-plus-rubric pattern already validated for tables.

---

## Validation log (claims checked against code on 2026-06-18)

| Claim | How verified | Result |
|---|---|---|
| 27 rubric files, SC scopes | `ls scripts/v3/llm-rubrics/`; `grep '^sc:'` | confirmed (field-label=3.3.2, heading-descriptive=2.4.6 [headings+labels], accessible-name-adequacy=4.1.2, use-of-color=1.4.1, status-message=4.1.3, error-identification=3.3.1, error-suggestion=3.3.3, info-relationships=1.3.1) |
| 10 deterministic runners + SCs | `grep 'sc:/claimFamily:' catalog.js` | confirmed (2.4.7,1.4.3,2.1.2,3.3.2,3.3.1,2.1.1,4.1.2,1.4.13,1.4.10,2.4.11) |
| 9 instrument detectors + SCs | `grep "add(" run-instruments.js` | confirmed (tab-order 2.4.3; keyboard-trap 2.1.2 +directional+self-refocus; focus-rejection 2.1.1/2.4.7; vsr-reading-order 1.3.2; vsr-meaning 4.1.2; status-message/native-dialog/aria-notify 4.1.3) |
| Table header-association exists | `collect-tables.js` required at eval-page.js:48, called :246; consumed by `info-relationships-v0` (`danglingIdref`,`headerWithNoDataCell`,`tdHeaderSamples[].resolved`,`looksLikeDataTable`) | confirmed — **not a gap** |
| List collector | `grep collectLists / structure.lists / list-type` (src only, venv excluded) | **absent** — only `listStyleNone` count → G1 |
| `form-error-probe` enters format-violating input | Read exp-runners.js:452–577 (`fieldConstrained` gate + "make the field invalid" line 530 + synthetic submit) | confirmed — enters constraint-violating values; only residual is JS-validated unconstrained fields → G5 |
| Background-image-meaning detector | grep collector/rubrics | not found → G2 |
| On-focus/on-input, time-limit, consistent-nav | clean grep (venv/node_modules excluded) | absent — but those SCs (3.2.1/3.2.2/2.2.1/3.2.3/3.2.4) are **outside our 22**, so not in-scope gaps |
