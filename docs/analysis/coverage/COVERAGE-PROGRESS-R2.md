# Coverage progress tracker — ROUND 2 (with auditor column)

**Date:** 2026-06-17 · Response to: *"fix ALL backlogs (not only the prioritized ones) with test coverage
and adversarial checks; new column for the auditor to review."* Itemizes every recommendation from the two
source analyses and records its status **after round 2**, plus the adversarial-verification verdict and the
exact thing an auditor should confirm.

**Sources:** [COVERAGE-PROGRESS.md](./COVERAGE-PROGRESS.md) (round-1 tracker) ·
[COVERAGE-IMPLEMENTATION-REVIEW.md](./COVERAGE-IMPLEMENTATION-REVIEW.md) (round-1 review) ·
[ACT-RULES-COVERAGE-ANALYSIS.md](./ACT-RULES-COVERAGE-ANALYSIS.md) ·
[WCAG-TECHNIQUE-COVERAGE-ANALYSIS.md](./WCAG-TECHNIQUE-COVERAGE-ANALYSIS.md).

## Status legend
| | Meaning |
|---|---|
| ✅ | Shipped round 2 (or earlier) — verified working + tested |
| 🟡 | Partial / scaffold — deferred residual with a precise plan below |
| ⛔ | Declined / withdrawn (intentionally not done) — rationale given |
| 🌫 | Out of domain (single-page-DOM harness cannot collect the signal) |

## Auditor column legend
The **Auditor** column carries the round-2 adversarial verifier's verdict and the single thing to spot-check:
`WELL_IMPLEMENTED` · `FIXED` (verifier found a problem → fix applied + re-verified) · `DECLINED` (reasoned).

> **Load-bearing caveat (unchanged):** every gain here is a **NON-AUTHORITATIVE shadow cross-signal** (scored
> vs gold / routed to the review queue). The `AUTHORITY` registry still publishes nothing, so **nothing gates
> conformance**. A signal can only *add* a scored observation; it can never false-clear or false-barrier an
> obligation. "✅" means "a sound scored signal now exists," not "this SC is authoritatively decided."

## Headline
- Round 2 implemented **19 backlog items + the must-fix (#43) + a new cross-cutting fix (#44)**, each with
  tests; ran **7 parallel adversarial verifiers**; they found **3 must-fixes + 4 should-fixes**, all now
  fixed and re-verified. Full v3 suite: **377 / 377** (round 1 was 362).
- **Your flag became #44:** deterministic checkers that abstain now hand the LLM the *reason* they're
  uncertain (not a bare absence), and every new rubric has a "how to read the checker evidence + why it's
  uncertain (absence ≠ pass)" section. This was a real gap — the contrast branch of `precomputeSignals` was
  dead on real records (it read `fg/bg`, which collection never produces) so the LLM got neither a ratio nor
  a reason. Fixed.
- **Deferred as one coherent cluster:** the five experiment-runner *measurement* items (#18, #24, #25, #27,
  #29) each modify a delicate authoritative-candidate runner and have no clean scored-finding home; per the
  CLAUDE.md probe+screenshot+vision-verify discipline they get a precise plan (Part C), not a rushed edit.

---

## Part A — Itemized tracker

`From`: **T** = technique analysis, **A** = ACT analysis. Evidence = files + test (nothing committed yet).

### Theme 1 — Surface existing axe capability
| # | Item | SC | Status | Evidence | Auditor |
|---|---|---|---|---|---|
| 1 | image-alt family | 1.1.1 | ✅ (r1) | `axe-surface.js` | — |
| 2 | 4.1.2 name family | 4.1.2 | ✅ (r1) | per-rule allow-list | — |
| 3 | 4.1.2 aria-validity | 4.1.2 | ✅ (r1) | allow-list | — |
| 4 | 2.1.1 scrollable/frame | 2.1.1 | ✅ (r1) | wholesale | — |
| 5 | 2.4.2 document-title | 2.4.2 | ✅ (r1) | wholesale | — |
| 6 | **Best-practice rule expansion** | 1.1.1/1.3.1/2.4.3/4.1.2 | ✅ | `axe-surface.js` `BEST_PRACTICE_RULE_SC` → `{sc,review}`; +11 advisory rules (heading-order, landmark-unique/one-main, region, page-has-heading-one, empty-table-header, scope-attr-valid, aria-allowed-role, aria-dialog-name, aria-treeitem-name, image-redundant-alt, tabindex). `checker-findings.test.js` | **FIXED** — verifier: `presentation-role-conflict` must be **review-tier** (axe fires it on non-decorative/focusable elements where ACT 46ca7f is *not* a 1.1.1 failure). Changed `review:true`. **Confirm:** advisory rules emit `review:true`; `empty-heading` stays `review:false`. |
| 7 | axe `incomplete` review-tier | — | ✅ (r1) | `collect.axeIncomplete` | — |
| 8 | **link-in-text-block (F73)** | 1.4.1 | ✅ | added to `AXE_SURFACED_RULES`; `1.4.1` added to `ALLOWLIST_SCS` | **WELL_IMPLEMENTED** — verifier confirmed link-in-text-block is the *only* allow-listed rule carrying `wcag141`, so 1.4.1 opens no other limb; feeds the 1.4.1 triage queue. |
| 9 | 1.4.3 color-contrast corroboration | 1.4.3 | ⛔ | — | DECLINED (r1) — pixel runner owns 1.4.3. |
| 10 | **4.1.1 leak filter** | 4.1.2 family | ✅ | `ALLOWLIST_SCS` gate in `surfacedScsFor`; `checker-findings.test.js` | **WELL_IMPLEMENTED** — verifier (against axe-core 4.12.1): *no* allow-listed rule actually carries `wcag411` in this build, so the review's specific claim was inaccurate; the filter is a sound **defensive** guard (drops 4.1.1 while keeping 4.1.2/2.4.4/1.3.1/1.4.1; still drops non-allow-listed `aria-roledescription`). |

### Theme 2 — New deterministic detectors
| # | Item | SC | Status | Evidence | Auditor |
|---|---|---|---|---|---|
| 11 | Static ax-name-presence | 1.1.1/4.1.2/1.3.1 | ✅ (r1) | `build-v3.js` | — |
| 12 | **Group-label / fieldset (F82/H71)** | 3.3.2 | ✅ | collection `structure.fieldsets` (eval-page.js) + detector (build-v3.js); `checker-findings.test.js` + `collection-signals.test.js` | **FIXED** — verifier: `controlCount` counted *all* descendant controls, so a nameless wrapper fieldset around legended inner fieldsets false-fired. Now counts **direct** controls only (`c.closest(grpSel) === g`); guarded by a nested-fieldset case in the real-collector test. |
| 13 | Required-cue ↔ aria-required parity | 1.3.1/3.3.2 | ⛔ | — | DECLINED (deterministic) — the barrier direction (a *visible* required cue with no programmatic state) needs reliable visible-cue recognition (asterisk vs decoration, "required" in placeholder); FP-prone. Belongs to the forms rubric/skill. |
| 14 | **Keyboard-orphan / pointer-only (F42/F54/F59)** | 2.1.1 | ✅ | `#23` event-listener inventory + cursor (eval-page.js); review-tier detector (build-v3.js); `checker-findings.test.js` | **FIXED** — verifier: a `role=list` delegation root with cursor:pointer could be flagged. Tightened: only fire when the element has **no explicit role** (or a presentational one). Review-tier + shadow, so it can never barrier. |
| 15 | **Focus-rejection (F55 onfocus→blur)** | 2.1.1/2.4.7 | ✅ | `detectFocusRejection` (kbd-graph.js) + run-instruments wiring; fixture `fx-v3-focus-rejection.html`; `kbd-graph.test.js` | **WELL_IMPLEMENTED** — verifier ran 6 redirect/edge counterexamples → **0 false positives**; catches sync, async, and addEventListener F55; body-bounce gate + two-attempt confirm are sound. |
| 16 | **Dangling-IDREF** | 1.1.1/1.3.1/4.1.2 | ✅ | `structure.pageIds` (eval-page.js) + detector (build-v3.js); `checker-findings.test.js` | **WELL_IMPLEMENTED** — verifier: correctly does NOT fire on resolve-but-empty (no double-count with ax-name-presence); size-cap skip is fail-safe; SC attribution defensible. |
| 17 | Plain-text layout (F32/F33/F34/F48) | 1.3.1/1.3.2 | ⛔ | — | DECLINED (deterministic) — whitespace pseudo-columns vs legitimate monospace/ASCII art is semantically undecidable without judgment; FP-prone. Rubric/skill territory. |
| 18 | Focus-indicator contrast/geometry (F78/G195) | 1.4.11/2.4.7 | 🟡 | plan in Part C | DEFERRED — modifies the pinned-authority `focus-visual-retry` runner; needs per-runner vision verification. |
| 19 | Page-title runner | 2.4.2 | ⛔ | — | Superseded by #5 (r1). |

### Theme 3 — Robustness
| # | Item | SC | Status | Evidence | Auditor |
|---|---|---|---|---|---|
| 20 | **keyboard-activation must not navigate/popup off-page** | 2.1.1 | ✅ | r1 link guard + r2 `window.open` stub across Enter **and** Space (exp-runners.js); `experiments.test.js` + probe | **FIXED** — verifier: the r2 stub was restored *before* the Space probe, so a Space-popup escaped AND produced a false 2.1.1 barrier. Now the stub spans both keys; Space-open folds into `activatedBySpace`. Probe: no popup escapes; `noKeyEffectStable:false`. |

### Theme 4 — New instruments
| # | Item | SC | Status | Evidence | Auditor |
|---|---|---|---|---|---|
| 21 | **`page.on('dialog')` native alert/confirm** | 3.3.1/3.3.3/4.1.3 | ✅ | run-instruments.js; fixture `fx-v3-native-dialog.html`; `instruments-pipeline.test.js` | **WELL_IMPLEMENTED** — verifier: listener removed (no cross-run leak), dismiss prevents hang, 4.1.3 review-tier is defensible. |
| 22 | **`document.ariaNotify` spy** | 4.1.3 | ✅ | run-instruments.js | **WELL_IMPLEMENTED** — verifier: spy is **live in the project Chrome** (the API ships as a function), safe + non-double-wrapping; stale "inert/forward-looking" comment corrected. |
| 23 | **Event-listener inventory (CDP)** | 2.1.1/4.1.2 | ✅ | `DOMDebugger.getEventListeners` (eval-page.js); `collection-signals.test.js` | **WELL_IMPLEMENTED** — verifier: own-try/catch can't crash the run; delegation FN documented; unblocks #14. |
| 24 | Cross-viewport content-delta (F102) | 1.4.10 | 🟡 | plan in Part C | DEFERRED — instrument-heavier; needs a 1280-baseline pass + FP control on responsive hiding. |
| 25 | Sticky/vertical-occupancy @320×256 (C34) | 1.4.10 | 🟡 | plan in Part C | DEFERRED — clean deterministic measurement but needs a scored-finding home + fixture vision-verify. |
| 26 | Zoom / text-resize control (C30/G206) | 1.4.5/1.4.10 | ⛔ | — | DECLINED — the on-page text-resize-widget activation is low-ROI/structurally complex; the 320×256 viewport already encodes 400% zoom, so the reflow runner covers the zoom-reflow concern. |
| 27 | Forced-colors re-render | 1.4.1/1.4.3/1.4.11 | 🟡 | plan in Part C | DEFERRED — `emulateMediaFeatures` forced-colors re-check of indicators; a standalone `verify-finding.js` already does part of this. |
| 28 | Real-AT VSR voicing | 4.1.3 | 🌫 | — | DECLINED — a Puppeteer harness cannot observe what a real screen reader announces; structural inference is the canary (out of domain). |
| 29 | Focus-trigger limb for hover-content | 1.4.13 | 🟡 | plan in Part C | DEFERRED — adds a focus-driven second pass to the hover runner (real 1.4.13 blind spot); needs runner surgery + vision-verify. |

### Theme 5 — LLM rubrics + lane
| # | Item | SC | Status | Evidence | Auditor |
|---|---|---|---|---|---|
| 30 | **non-text-contrast rubric** | 1.4.11 | ✅ | `non-text-contrast-v0.md` | **WELL_IMPLEMENTED** — verifier: WCAG-scoped (defers text contrast/indicators), real per-SC interpretation section. (Field-name prose `contrast.uncertainReason` corrected.) |
| 31 | **use-of-color rubric** | 1.4.1 | ✅ | `use-of-color-v0.md` | **WELL_IMPLEMENTED** — "hunt for the second cue" interpretation; F73/F81 scoped. |
| 32 | **focus-order rubric** | 2.4.3 | ✅ | `focus-order-meaning-v0.md` | **WELL_IMPLEMENTED** — separates trap/visibility/obscured; "sequence not goodness" interpretation. |
| 33 | section-headings rubric | 2.4.10 | ⛔ | (file removed) | **WITHDRAWN** — verifier: 2.4.10 (AAA) is **not in `V.ALL_SCS`**, so no obligation is ever routed to it → the rubric is permanently unreachable. Removed (mirrors the 1.4.6 out-of-universe decision); re-add only if 2.4.10 is added to the tracked-SC universe. |
| 34 | **accessible-name adequacy rubric** | 4.1.2 | ✅ | `accessible-name-adequacy-v0.md` + `precomputeSignals` name-presence | **FIXED** — verifier: owning 4.1.2 makes the agent skip it, so empty-name 4.1.2 routes *only* here, and the rubric's "no-name never reaches you" premise was false → false-clear risk. Fix: `precomputeSignals` now hands the rubric the deterministic name-PRESENCE result + "absence IS the barrier"; rubric updated to return REPRODUCED on empty name. |
| 35 | **long-description-completeness rubric** | 1.1.1 | ✅ | `long-description-completeness-v0.md` | **WELL_IMPLEMENTED** — distinguished from short-alt adequacy (self-routes simple images to N/A); F67/G92/ARIA15. |
| 36 | Activate the inert LLM lane | many | ⛔ | — | DECLINED — withheld per the standing on-hold constraint; the lane stays env-gated INERT (verifier confirmed `runLlm && runAgent` gate + default-refusing `runAgent`). Rubric **assets** are added inert; activation is a separate policy decision. |

### Theme 6 — Declined / out of domain (unchanged)
| # | Item | Status | Note |
|---|---|---|---|
| 37 | Relational link/iframe-set instruments | ⛔ | out of single-page-DOM domain |
| 38 | Hand-rolled WAI-ARIA validity tables | ⛔ | superseded by surfacing axe aria-* (#3) |
| 39 | Promote axe to authoritative | ⛔ | needs the full readiness gate |
| 40 | 1.4.6 enhanced contrast | ⛔ | out of scope per instruction |
| 41 | Media-transcript rules | 🌫 | needs media playback + multi-page |
| 42 | Multi-page / corpus crawl | 🌫 | harness is single-page |

### Review backlog + cross-cutting
| # | Item | Status | Evidence | Auditor |
|---|---|---|---|---|
| 43 | **Regression guard (axName:'' not null)** | ✅ | `coerceAxName` helper (a11y-eval.js) used at the CDP line; `collection-signals.test.js` runs the **real** `eval-page.js` over a `file://` fixture | **WELL_IMPLEMENTED** — verifier: the guard is real + end-to-end — reverting `coerceAxName` to `|| null` fails *here*, not just the helper unit. |
| 44 | **Uncertainty-reason propagation (your flag)** | ✅ | `precomputeSignals` `s.contrast{ratio,computable,reliable,uncertainReason,needsPixelContrast}` + `s.accessibleName` + buildPrompt "absence ≠ pass"; every new rubric's "Interpreting the deterministic evidence" section; `llm-lane.test.js` | **WELL_IMPLEMENTED** — verifier: `uncertainReason` appears only when no sound ratio, passes the real `contrastUnreliableReason`, reads the real `color/effBg` fields (not the dead `fg/bg` branch), crash-safe. |

---

## Part B — Per-SC roll-up (round-2 delta)

| SC | Round-2 delta |
|---|---|
| 1.1.1 | + image-redundant-alt (review), presentation-role-conflict now review-tier; long-description rubric (inert) |
| 1.3.1 | + heading-order/landmark/region/empty-table-header/scope-attr (review priors); + dangling-describedby detector |
| 1.4.1 | + axe link-in-text-block (F73); + use-of-color rubric (inert) |
| 1.4.11 | + non-text-contrast rubric (inert) — first automated lane for this SC |
| 2.1.1 | + keyboard-orphan detector (review); + focus-rejection instrument (F55); nav guard now blocks window.open on Enter+Space |
| 2.4.3 | + axe positive-tabindex (review); + focus-order rubric (inert) |
| 3.3.2 | + group-label/fieldset detector |
| 4.1.2 | + dangling-labelledby detector; + aria-allowed-role/dialog-name/treeitem-name (review); + name-adequacy rubric (inert) + name-presence handoff |
| 4.1.3 | + native-dialog capture; + ariaNotify spy (live) |

---

## Part C — Deferred measurement cluster (precise plans for greenlight)

These five share a shape: a **measurement on an existing experiment runner**, each touching an
authoritative-candidate runner, with no clean scored-finding home. Recommended path for each is given so the
auditor can greenlight a focused, vision-verified pass.

1. **#18 focus-indicator contrast/geometry (1.4.11/2.4.7).** Plug: extend `readIndicator()` /
   `spatialStatsInPage()` in `run-experiments.js` (focus-visual-retry) to emit `indicatorColor/thickness` +
   measured contrast of the indicator pixels vs the unfocused backdrop crop. **Risk:** this is the *pinned
   authority* runner — add measurement fields ONLY, never touch the existing verdict. Vision-verify against a
   known-thin-indicator fixture.
2. **#24 cross-viewport content-delta (F102, 1.4.10).** Plug: a last-step instrument in `run-instruments.js`
   (after status-detector, since it mutates viewport) that inventories interactive controls + visible text at
   the natural width, then at 320×256, and emits a **review-tier** finding when substantive content vanishes
   (not merely reflows). **Risk:** responsive hiding of decorative content is legitimate → gate on substantive
   delta to control FP.
3. **#25 sticky/vertical-occupancy (C34, 1.4.10).** Plug: same last-step instrument; measure
   `position:sticky|fixed` elements' summed height as a % of the 256px viewport; review-tier when occupancy is
   high. Clean deterministic measurement; needs the finding home (#24's instrument) + a fixture.
4. **#27 forced-colors re-render (1.4.1/1.4.3/1.4.11).** Plug: `page.emulateMediaFeatures([{name:'forced-colors',value:'active'}])`
   then re-read focus/indicator/borders; flag if they vanish. Partly exists in `verify-finding.js`. Vendor-
   specific emulation caveat.
5. **#29 focus-trigger limb for hover-content (1.4.13).** Plug: after the hover channel in `runHoverContentTri`
   (exp-runners.js), add a focus-driven pass (keyboard-reach the trigger, re-capture, diff) and emit a
   separate `focusTriggersContent` outcome. Highest-value of the five (a real 1.4.13 blind spot).

---

## Verification round (adversarial)

7 parallel verifiers independently read the code, built counterexample fixtures, and ran probes/tests.
Verdicts: **WELL_IMPLEMENTED** — collection (#16/#23/#43), detectors (#16/#14/#12 logic), focus-rejection
(#15), dialog/ariaNotify (#21/#22), #44. **HAS_PROBLEM → FIXED** — axe-surface (#6 presentation-role
review-tier), collection FP (#12 controlCount), nav guard (#20 Space popup), rubrics (#34 routing, #33
unreachable). All fixes re-verified; full suite **377/377**.

**Not committed** (per standing constraint). New/changed files: `scripts/v3/lib/{axe-surface,build-v3,
run-instruments,kbd-graph,exp-runners,llm-adjudicator}.js`, `scripts/eval-page.js`, `scripts/lib/a11y-eval.js`,
5 new `scripts/v3/llm-rubrics/*.md`, fixtures `assets/saved/fx-v3-{focus-rejection,native-dialog}.html`,
tests `scripts/v3/tests/{collection-signals,checker-findings,kbd-graph,llm-lane,instruments-pipeline}.test.js`.
