# Harness 3.4 Capability Review — Adversarial Review + Verification

**Date:** 2026-06-17
**Reviewer lane:** adversarial review → per-finding empirical verification (live CDP probes on Puppeteer 24.40.0 / headless Chromium, the WCAG/ACT corpora, and the shipped tests)
**Primary sources:**
[`scripts/v3/lib/cdp-tools.js`](../../scripts/v3/lib/cdp-tools.js) ·
[`docs/analysis/coverage/LLM-INTERACTIVE-TOOLS.md`](coverage/LLM-INTERACTIVE-TOOLS.md) ·
[`docs/analysis/coverage/COVERAGE-PROGRESS.md`](coverage/COVERAGE-PROGRESS.md)

---

## 1. Scope

This review covers the new capabilities landed since round 1 (Harness 3.4):

- **The 12 in-process CDP tools** for the multi-turn LLM judge (`scripts/v3/lib/cdp-tools.js`): `query_ax_node`, `observe_state_after_activation`, `set_state_and_capture`, `probe_screen_reader_after_action`, `measure_geometry_live`, `request_hi_res_crop`, `render_with_overrides`, `compute_contrast_ratio`, `resolve_part_color`, `resolve_destination`, `compare_named_regions`, `ocr_image_text`.
- **The multi-turn architecture + LLM activation gate** (`orchestrator.js`, `llm-agent-adapter.js`, `run-evaluation.js`, `authority.js`).
- **Round-2 deterministic detectors + axe breadth** (`build-v3.js`, `axe-surface.js`, `eval-page.js`) and **the round-1 must-fix verifications**.
- **The OCR sidecar** (`scripts/v3/lib/ocr-sidecar.js`, `scripts/v3/ocr/ocr_sidecar.py`).
- **The parallelized experiment lane** (`scripts/v3/lib/run-experiments.js`, `budget.js`).

**Method.** Each capability was first reviewed adversarially, then *every* finding was independently verified against the live code, a fresh CDP probe, the spec, and the WCAG/ACT corpora — rather than trusting the reviewer's claim. Verification corrected several severities and refuted/over-rated a handful of claims; those corrections are recorded below.

**Standing soundness invariants** (the rails the whole lane rests on, per `cdp-tools.js:9-14`):

1. **Objective return, never an interpretation** — a tool returns a measurement/observation, never pass/fail/equivalent/barrier.
2. **Read-only by default; mutating tools run on a fresh clone** (`ctx.freshClone`) so they cannot corrupt the frozen bundle or a peer subject.
3. **The verdict stays canary-capped shadow** regardless of tool use — tools only widen what the model *sees*.

---

## 2. Verdict

**Soundness rails are largely honored, but the new work is not yet clean: 62 confirmed findings — 2 critical, 5 high, 28 medium, 25 low, 2 nit (consolidated from 74 verified findings, with downgrades noted inline) — a subset of them genuine WCAG-compliance gaps.**

- **Invariant #1 (no verdict leak) holds everywhere.** No tool emits a pass/fail/equivalent/barrier. The single thresholded boolean in the suite (`compute_contrast_ratio.passes`) is wrong at the SC boundary, but it is still not an SC disposition.
- **Invariant #3 (canary-capped shadow) holds and was verified end-to-end** (`authority.js:31,33,66-67`): a tool-assisted verdict flows through mechanism `llm-agent`/`llm-rubric:<id>`, both of which `authorityFor` caps to shadow; nothing in the tool path rewrites the mechanism. **No defect below can elevate a verdict above shadow** — every defect degrades *coverage* or could mislead a *shadow* judgment.
- **Invariant #2 (read-only / fresh-clone) is the one with real cracks.** The mutating tools correctly refuse without `ctx.freshClone`, but **three "read-only" tools (`ocr_image_text`, `compare_named_regions`, and the coordinate path of `query_ax_node`) read/mutate the SHARED base page**, and under `llmToolConcurrency=4` that is a cross-subject perturbation hazard.
- **Two tools are UNSOUND for their stated purpose.** `observe_state_after_activation` does not implement the inserted-vs-toggled distinction it exists to provide, and `request_hi_res_crop` captures the *wrong region* for any below-the-fold target.
- **WCAG-compliance gaps are real but bounded:** the contrast `passes` boundary-rounding violation (1.4.1/1.4.11), `observe_state_after_activation` vs 4.1.3's "live region must pre-exist," `compare_named_regions` using CIE76 where the spec mandates ΔE2000, and `resolve_destination` not surfacing the ACT `instantRedirect` distinction for 2.4.4.

**Both round-1 must-fixes landed and are regression-guarded** (Section 3). **The round-2 detectors are sound by construction** — they are built *after* `reconcile()` and stamped `authoritative:false/shadow:true`, so they are structurally unable to false-clear or false-barrier.

---

## 3. Must-fix verification (round 1)

Both round-1 must-fixes **CONFIRMED LANDED** in live code and regression-guarded:

| Must-fix | Status | Evidence |
|---|---|---|
| **#1 — `axName:''` end-to-end guard** (empty in-tree name preserved as `''`, not coerced to `null`) | ✅ CONFIRMED | `coerceAxName` returns `nameValue != null ? String(nameValue) : null` (`a11y-eval.js:314-316`), wired at `eval-page.js:515`. Verified end-to-end under live Chrome: `collection-signals.test.js` (4/4 pass) asserts an empty `<button>` yields `inTree:true, axName:''` and decorative `<img alt="">` yields `inTree:false`. Re-introducing `\|\| null` would fail this integration test, not just the helper unit test (which also pins `coerceAxName(0) === '0'`). |
| **#2 — per-rule `ALLOWLIST_SCS` filter (obsolete 4.1.1 leak)** | ✅ CONFIRMED | `ALLOWLIST_SCS = {4.1.2, 2.4.4, 1.3.1, 1.4.1}` (`axe-surface.js:48`); `surfacedScsFor()` filters `isSurfaced(sc) \|\| (ruleAllowed && ALLOWLIST_SCS.has(sc))` (`axe-surface.js:91-98`). `checker-findings.test.js` #10 (22/22 pass) feeds a `button-name` rule tagged `['wcag411','wcag412']` and asserts the output SC set is exactly `['4.1.2']` — no 4.1.1 leak. The guard is correctly defensive (no bundled allow-listed rule currently carries `wcag411`). |

---

## 4. Findings by severity (CONFIRMED only)

False-alarms cleared are excluded here (see Section 7).

| Severity | Capability | Type | Title | Recommendation (short) |
|---|---|---|---|---|
| **critical** | `observe_state_after_activation` | spec-deviation | Inserted-vs-toggled NOT distinguished; `visibilityCause` absent — the one job the tool exists for | Capture before-DOM node identity / MutationObserver; emit `visibilityCause` (inserted/display/visibility/aria-hidden) per newly-visible node |
| **critical** | `request_hi_res_crop` | correctness-bug | Viewport-relative clip + default `captureBeyondViewport:true` captures the WRONG (blank) region for any below-the-fold target | Make the clip page-absolute (`+scrollY/+scrollX`) or screenshot the element handle; add a below-fold non-blank regression test; fix the 4 sibling tools sharing the pattern |
| **high** | `query_ax_node` | correctness-bug | `nameFrom` is fabricated — emits the engine's candidate name-source SLOTS, not the contributing source | Keep only non-superseded sources with a present non-empty `value`; unit-test contents-named vs labelledby-named |
| **high** | `query_ax_node` | correctness-bug | `requiredStatesPresent` reports the AX-synthesized default as present; `requiredStatesMissing` (the 4e8ab6/F68 signal) never computed | Read live `aria-*` to split author-present from synthesized; compute `requiredStatesMissing` per role's ARIA required set; honor 4e8ab6 option/tab exemption |
| **high** | `set_state_and_capture` | soundness-violation | `hover` `stateReached` not fail-closed — the after-frame cursor sprite forces `pixelsChanged:true` for ANY element | Park pointer to (10000,10000) before BOTH frames (reuse vision-capture discipline), or drive via `CSS.forcePseudoState(['hover'])`; require a real style/box delta |
| **high** | `resolve_part_color` | correctness-bug | Divergence flag diffs the rendered pixel against `cs.color` (foreground), not the non-text part's actual property (border/outline/fill/stroke) | Surface `sourceProperty` and diff against the matching property; prioritize the missed-divergence (fill/stroke false-clear) direction |
| **medium** | `observe_state_after_activation` | soundness-violation | `anyNewTextInLiveRegion` false-positives when the live region is created together with its message | Compare host's live-region ancestor against before-DOM; expose `liveRegionPreExisted`; never collapse injected-with-message into "announced" |
| **medium** | arch (multi-turn judge) | soundness-violation | Coordinate-tool pixels map against an 800×600 page while frozen crops are 1280×900 — (x,y) lands on the wrong element | `setViewport(1280×900)` on base page + every `freshClone` from a shared constant; or echo `viewportWidth` and refuse on mismatch |
| **medium** | `probe_screen_reader_after_action` | soundness-violation | "Live-region queue" returns the FULL spoken-phrase log, mixing in change-of-context (focus-move) phrases 4.1.3 excludes | Filter to `polite:`/`assertive:`-prefixed phrases, or return structured `[{text,ariaLive,role,fromNodeXpath}]` distinguishing focus from live |
| **medium** | `ocr_image_text` / `compare_named_regions` / arch | soundness-violation | Read-only OCR/region tools `scrollIntoView` on the SHARED base page — perturb concurrent coordinate readers | Run on a `freshClone`, or drop `scrollIntoView` + `captureBeyondViewport:true` with a document-relative clip |
| **medium** | `query_ax_node` | spec-deviation | Coordinate path silently drops aria-labelledby/describedby IDREF resolution (the headline F68 value is xpath-only) | Resolve IDREFs from `backendNodeId` on the coordinate path, or return `unresolved-on-coordinate-path` (never `null`) |
| **medium** | `query_ax_node` | soundness-violation | Coordinate (x,y) resolves against the shared page's CURRENT scroll, which peer read-only tools mutate — violates "same frozen snapshot" | Reset to captured scroll before `getNodeForLocation`, or verify the resolved box contains (x,y); stop peers leaving the page scrolled |
| **medium** | `query_ax_node` | correctness-bug | `isAriaHidden` false-negative for ancestor-hidden case (only checks `ariaHiddenElement`, not `ariaHiddenSubtree`) | Treat both `ariaHiddenElement` and `ariaHiddenSubtree` as hidden |
| **medium** | `observe_state_after_activation` | correctness-bug | `[aria-live]` selector matches `aria-live="off"` (does not announce); also omits `role=alertdialog` | Match the detector's exact selector; exclude `aria-live="off"` |
| **medium** | `observe_state_after_activation` | correctness-bug | Visibility test ignores ancestor `display:none` — a toggled reveal is mis-counted as already-visible (false negative) | Use `el.checkVisibility({checkVisibilityCSS,checkOpacity})` or an ancestor walk |
| **medium** | `observe_state_after_activation` | spec-deviation | `focusMovedToChange` (relational) absent — model can't tell focus-into-new-content from focus-elsewhere | Add `focusMovedToChange:boolean` (after.active resolves to a newlyVisible host) |
| **medium** | `observe_state_after_activation` | robustness | No safety/perceivability gate on the activated control (spec requires `isPerceivable`/`isSafe` refusal) | Port the detector's `isPerceivable`+`isSafe` gate; return `{refused,reason}` |
| **medium** | `probe_screen_reader_after_action` | robustness | Un-hide / fresh-container-insert is invisible to the VSR but reported identically to a genuine no-announcement | Document empty queue as INCONCLUSIVE for those variants; pair with `observe_state_after_activation` `visibilityCause`; fix mislabeled fixture comment |
| **medium** | `probe_screen_reader_after_action` | robustness | `emptyQueue:true` coalesced onto instrument-FAILURE returns — conflates "VSR broke" with "nothing voiced" | Return `{error,probeFailed:true}` and omit/null `emptyQueue` on error paths (match `ocr_image_text`/`compute_contrast` convention) |
| **medium** | `measure_geometry_live` | spec-deviation | No viewport-width emulation — the advertised 1.4.10 non-320 use is unbuildable | Add optional `viewportWidth` arg on `ctx.freshClone()` + `setViewport`; else drop the non-320 claim |
| **medium** | `measure_geometry_live` | correctness-bug | `overlapFraction` normalized to the TARGET box, not the obscured "other" — understates 1.4.13 occlusion | Return both `fractionOfTarget` AND `fractionOfOther` |
| **medium** | `measure_geometry_live` | correctness-bug | `gapPx` is a Euclidean corner distance, not the axis gap the 1.4.13 Hoverable dead-zone test needs | Return `gapX`/`gapY` + `overlapsOrAdjacent`; drop the hypot scalar |
| **medium** | `measure_geometry_live` | spec-deviation | No `occludedElements[]` enumeration, no whitespace/decorative exception (1.4.13 Dismissible incomplete) | Add an `occludedElements[]` hit-test mode; surface raw boxes, let the model apply the decorative exception |
| **medium** | `measure_geometry_live` | spec-deviation | Missing `stateUsed` echo (and echoed target xpath/role) required by the soundness constraint | Echo `targetXpath`/role + `stateUsed` (e.g. `as-loaded(shared-page)`) |
| **medium** | `compute_contrast_ratio` | wcag-compliance-gap | `toFixed(2)` rounding makes `passes` report PASS for genuine sub-threshold ratios — violates the WCAG "do not round" note | Compute `passes` on the UNROUNDED ratio; keep rounded value for display; fix the mirrored `verify-finding.js:53,162` sites (NOT `exp-runners.js:18`) |
| **medium** | `render_with_overrides` | robustness | Unresolvable `targetXpath` silently falls back to a full-viewport screenshot instead of erroring | Return `{error:'target not found or zero-size'}`; reserve full-viewport for the no-target case |
| **medium** | `resolve_part_color` | spec-deviation | Omits almost the entire spec'd contract (cascade reuse, `sourceProperty`, pseudo/SVG, opacity/gradient/filter flags, bbox gate, translucency refusal) | Either implement the spec'd return shape, or amend §4.11 + the tool description to state the reduced contract honestly |
| **medium** | `resolve_destination` | security | Redirect guard fires AFTER the cross-origin GET is issued — one-hop SSRF/tracking request is not actually prevented | `setRequestInterception(true)` + abort foreign-origin navigation requests pre-flight; keep the post-goto check as defense-in-depth |
| **medium** | `resolve_destination` | spec-deviation | No `instantRedirect`/`redirectDelayMs`; the INTERSTITIAL (pre-redirect) page is fingerprinted for non-instant redirects | Capture redirect timing; expose `instantRedirect`/`redirectDelayMs`; settle the fingerprint after an instant redirect lands |
| **high** | `compare_named_regions` | spec-deviation | Uses ΔE76 (CIE76) where the spec mandates ΔE2000 — formulas disagree at the `perceptiblyDistinct` ΔE>11 threshold | Implement CIEDE2000 from the existing Lab output; re-pick the threshold; name the field/note consistently with the formula |
| **medium** | `compare_named_regions` | correctness-bug | Computes the arithmetic MEAN and labels it "dominant color" — lossy/misleading for multi-color regions | Compute a true dominant (modal bucket + coverage) or rename `meanColor` + add a variance field; add a multi-color test |
| **medium** | `compare_named_regions` | spec-deviation | Takes a NEW live screenshot instead of reading back the already-captured frozen crop | Read from the frozen bundle crop, or amend §4.12 + stamp a live-recapture flag |
| **medium** | `ocr_image_text` | spec-deviation | Ready-line `engine:"PP-OCRv6"` is a hardcoded literal (silent downgrade latent under pin drift) | Read the resolved version from the engine instance; fail startup loudly if PP-OCRv6 cannot load |
| **medium** | `ocr_image_text` | spec-deviation | `engine`/`engineVersion` never surfaced to the model or `evidenceRefs` | Capture from the ready line; thread through `recognize()` into the return + `evidenceRefs` |
| **medium** | `ocr_image_text` | spec-deviation | No bbox validation against the frozen viewport for the explicit x/y/w/h path (steerable surface) | Clamp the explicit rect to viewport/subject bounds; set a `clampedToViewport`/`outOfRegion` flag |
| **low** | `query_ax_node` | robustness | Dead `resolveNode` call + broken/dead `resolveXpath` helper (`page.$x` removed in Puppeteer 24.40.0) | Delete the no-op `resolveNode`; remove/rewrite `resolveXpath` to a supported API |
| **low** | `set_state_and_capture` | robustness | `placeholder-shown` reports `stateReached:true` on a field with no placeholder (load-bearing `textVisible` correctly false) | Gate `stateReached` on a non-empty `placeholder`; report `textVisible` from `el.placeholder` for inputs |
| **low** | `measure_geometry_live` | spec-deviation | Overflow/culprit fields are raw + exemption-free (the "forbidden 320 re-derive" framing was REFUTED) | Gate overflow fields behind a supplied `viewportWidth`; document as raw, exemption-free |
| **low** | `measure_geometry_live` | correctness-bug | Overflow culprit reference edge omits `clientLeft`/`scrollLeft` — mis-fires under a left border | Compute content-right as `b.left + el.clientLeft + el.clientWidth`; account for `scrollLeft` |
| **low** | `measure_geometry_live` | robustness | Ambiguity marking only covers <6px boxes, not non-unique selector / unresolved occluding layer | Count matches via `ORDERED_NODE_SNAPSHOT_TYPE`; hit-test z-order for the occluding-layer case |
| **low** | `measure_geometry_live` | robustness | `otherXpath`-not-found returns an `overlap:{error}` sub-object alongside `found:true` (mixed shape) | Use `overlap:{available:false,reason}`; never emit phantom numeric fields |
| **low** | `request_hi_res_crop` | spec-deviation | Clone runs at default 800×600, not the collector's 1280×900 — re-raster is a different responsive layout | Pin the clone viewport to the collector dims from a shared constant; drop the "SAME layout" wording until pinned |
| **low** | `request_hi_res_crop` | robustness | Silent `setViewport` failure leaves DSF=1 but reports `scaleUsed:s` (overstates rasterization) | Read back effective `devicePixelRatio`; report actual scale or `{error:'device-scale-not-applied'}` |
| **low** | `render_with_overrides` | spec-deviation | Stale design-doc row over-claims 1.4.5 (DOWNGRADED from HIGH — shipped tool ships 1.4.1/forced-colors only; 1.4.5 served elsewhere) | Doc-hygiene only: update the stale `LLM-INTERACTIVE-TOOLS.md` rows; do NOT add a resize/box-delta transform |
| **low** | `render_with_overrides` | robustness | Element clip not clamped to the viewport (unlike `set_state_and_capture`) | Clamp to viewport, or pass explicit `captureBeyondViewport:true` with a comment |
| **low** | `compute_contrast_ratio` | spec-deviation | Spec advertises a pixel-flat path / 1.4.11 fill limb the CSSOM-only code never delivers (shipped code's own description is accurate) | Align §4.10 with the shipped behavior (text used-colour pair only); route 1.4.11 part-colour to `resolve_part_color` |
| **low** | `compute_contrast_ratio` | robustness | Opaque wide-gamut colours (`oklch()`, `color(srgb …)`) refused as unparseable; a space-separated rgb() NaN-leak is latent | Resolve to sRGB before parsing; harden `parseRGB` to return null on NaN |
| **low** | `probe_screen_reader_after_action` | spec-deviation | For 3.3.1/3.3.3 an empty queue is not a barrier (error may be in the AX tree / accname / accdesc) | Note in the result that an empty queue does not bear on the AX-tree limb |
| **low** | `resolve_part_color` | robustness | Coordinate consistency holds only at DSF=1 (undocumented/unenforced); edge-clamp off-by-up-to-2 | Assert/record active DSF; compute the centre from the actual clip origin |
| **low** | `resolve_destination` | spec-deviation | Compare-sibling-set mode (the load-bearing fd3a94 capability) not implemented — single-link only | Optionally add `linkXpaths[]` + byte-equality booleans; else document that the model must compare across calls |
| **low** | `resolve_destination` | robustness | file:// refusal payload returns the always-`'null'` origin instead of a directory hint (guard itself correct) | Include `dir(target)` in the file:// refusal payload |
| **low** | `compare_named_regions` | spec-deviation | Omits the spec-mandated `luminanceDelta` field | Add per-pair `luminanceDelta` from the Lab `L` values |
| **low** | `compare_named_regions` | robustness | `perceptiblyDistinct` threshold ΔE>11 not anchored to a documented bound for the formula in use | After switching to ΔE2000, set a cited threshold or drop the boolean |
| **low** | `ocr_image_text` | robustness | No OCR language config — non-Latin pages silently under-read, weakening "empty ≠ no-text" | Pass detected `lang`, or document Latin-only + flag low confidence as INCONCLUSIVE |
| **low** | `ocr_image_text` | spec-deviation | Confidence is per-LINE, not per-glyph as specified | Relabel as per-line, or expose char-level scores; flag sub-threshold lines |
| **low** | arch (multi-turn judge) | robustness | Whole-run timeout re-armed per retry — total wall-clock up to (maxRetries+1)×runTimeoutMs (DOWNGRADED; no leak, backstops hold) | Hoist a single deadline before the retry loop; set each attempt's timer to remaining budget |
| **low** | arch (multi-turn judge) | robustness | `resolveXpath` dead code with a brittle `await page.$x` guard | Delete + unexport, or fix the guard to `typeof page.$x === 'function'` |
| **low** | ROUND2_DETECTORS | robustness | `dangling-IDREF` over-fires on a PARTIALLY-resolving aria-labelledby (precision, shadow-only) | Emit the 4.1.2 signal only when ALL tokens are missing; downgrade partial to review-tier |
| **low** | ROUND2_DETECTORS | robustness | `group-label` fires on any nameless multi-control fieldset, incl. individually-labeled fields (precision, shadow-only) | Narrow to predominantly radio/checkbox groups; downgrade the general case to review-tier |
| **low** | PARALLELISM | spec-deviation | "byte-identical to serial" framing false under run-budget pressure at concurrency>1 (DOWNGRADED; soundness intact — divergence always in the conservative deferred direction) | Scope the determinism claim to concurrency-1 / no-pressure; add a pressure+parallel test |
| **nit** | `ocr_image_text` | spec-deviation | No "not-capturable" signal for the 3.3.1 native-validation-bubble case | Drop 3.3.1 from the served-SC list, or add a not-capturable branch |
| **nit** | ROUND2_DETECTORS | robustness | `keyboard-orphan` can fire on a roleless event-delegation container with `cursor:pointer` (review-tier + shadow — acceptable) | None required; optionally exclude elements containing their own interactive descendants |

---

## 5. WCAG / technique / ACT compliance

Focused, per-SC: does the tool/detector actually satisfy what the SC + its techniques + the ACT rule require?

### 4.1.3 Status Messages — `observe_state_after_activation` + `probe_screen_reader_after_action` — **GAP**
- `status-messages.html` requires that a status message **be in a live region that already exists** to be reliably announced ("A live region must already exist in the DOM before its text changes to be reliably announced"). `observe_state_after_activation` captures `before.inLive` (`cdp-tools.js:107`) but **never compares it**, so `anyNewTextInLiveRegion` returns `true` for a region injected *together with* its message — a false "announced" signal on the common React/Vue pattern. **Confirmed.**
- The tool also **does not implement the inserted-vs-toggled `visibilityCause`** it was built to provide (the insertion-only blind spot of the static detector), so it adds no signal the deterministic sweep lacks.
- `probe_screen_reader_after_action` is **genuinely live** (verified: a `role=status` text-append voiced `polite: …`), but it returns the **full spoken-phrase log including focus/change-of-context phrases** that `status-messages.html:32` explicitly puts out of 4.1.3 scope ("changes of context … are not within the scope") — a false-clear channel for the model. The un-hide / fresh-container-insert variants return `emptyQueue:true` indistinguishably from a genuine no-announcement; an empty queue must be treated as INCONCLUSIVE for those.

### 4.1.2 Name, Role, Value — `query_ax_node` — **GAP**
- `nameFrom` is **fabricated** (emits the engine's candidate name-source slots, not the contributing source), defeating the F111 name-vs-label and the 2.4.4 filename-fallback uses.
- **ACT 4e8ab6** (Failed Examples 1-5): a `role=checkbox` with no `aria-checked` is a *failure*, but the tool reports `requiredStatesPresent:['checked']` (the AX-synthesized default) and **never computes `requiredStatesMissing`** — the exact F68 signal. The implicit-default exemption is role-specific (option/tab `aria-selected` only); the tool's hardcoded 4-state, role-agnostic set is wrong.
- `isAriaHidden` is a **false-negative for the canonical ancestor-hidden 6cfa84 case** (only checks `ariaHiddenElement`, not `ariaHiddenSubtree`).

### 1.4.1 Use of Color / 1.4.11 Non-text Contrast — `compute_contrast_ratio` — **GAP (boundary rounding)**
- The relative-luminance math is **WCAG-correct** (canonical coefficients, correct piecewise linearization; the legacy 0.03928 vs 0.04045 cutoff has **zero practical effect** — verified max Δ 0.000000, no 8-bit channel in the window).
- But `A.contrastRatio` rounds via `toFixed(2)` (`a11y-eval.js:19`) and `passes` is computed on the **rounded** value (`cdp-tools.js:385`), so `rgb(0,0,0)` over `rgb(89,89,89)` (true 2.99797, a real FAIL) reports `{contrastRatio:3, passes:true}` — directly contradicting `non-text-contrast.html:27` ("2.999:1 would not meet the 3:1 threshold"). An exhaustive gray-pair scan reproduced **36 false-PASS at 3:1 and 42 at 4.5:1**. The mirrored bug is at `verify-finding.js:53,162` (NOT `exp-runners.js:18`, which is full-precision).

### 1.4.13 Content on Hover or Focus — `measure_geometry_live` — **GAP (incomplete occlusion model)**
- `overlapFraction` is normalized to the target box, not the obscured other (a 50×20 label 100%-covered reports 0.011); `gapPx` is a hypotenuse, not the axis gap the Hoverable dead-zone test needs; no `occludedElements[]`, no whitespace/decorative exception, no `stateUsed` echo; and no viewport-width emulation for the 1.4.10 non-320 case the docstring advertises.

### 1.4.5 Images of Text — `render_with_overrides` — **NO GAP (doc-hygiene only)**
- The reviewer's flagship HIGH was **REFUTED/downgraded**: the shipped tool description (`cdp-tools.js:567`) advertises **only 1.4.1 + forced-colors**, not 1.4.5. 1.4.5 is served by the `images-of-text-v0` vision rubric + `request_hi_res_crop` + `ocr_image_text`, which is WCAG-valid (the SC intent is the baked-text-vs-real-text *judgment*, not a resize/box-delta mechanism — a weak discriminator). The only residual is a **stale planning-doc row** over-claiming 1.4.5.

### 2.4.4 Link Purpose (In Context) — `resolve_destination` — **GAP**
- **ACT fd3a94** Expectation note: resolving links "includes potential redirects, **if the redirects happen instantly**." The tool reports **neither `instantRedirect` nor `redirectDelayMs`**, and for a non-instant redirect (the Failed Example 8 shape, `content=30`) it fingerprints the **interstitial** page (`title:'Redirecting'`) with no flag — a misleading destination. fd3a94 is fundamentally a *set* test ("two or more elements … the full set of link elements that share the same … name"); the **compare-sibling-set mode is unimplemented**.

### 1.4.5 / 1.1.1 — `ocr_image_text` — minor gaps
- No language config (non-Latin under-read); per-line not per-glyph confidence; `engine`/`engineVersion` dropped before the model. The no-verdict + error⇒INCONCLUSIVE rails are sound.

### F13 / 1.1.1 — `compare_named_regions` — **GAP (formula)**
- Computes **ΔE76** where §4.12 mandates **ΔE2000** three times; the two straddle the `perceptiblyDistinct` ΔE>11 boundary on the cited pair (mid-blue vs mid-purple: ΔE76=19.6 → distinct, ΔE2000=9.8 → not). The F13 alt-omission judgment itself is correctly left to the model.

### Round-2 detector SC attributions — **COMPLIANT**
- Verified against the corpus: F82 → 3.3.2, H71 fieldset/legend → 3.3.2 group-label, keyboard-orphan → 2.1.1 (F54/F59), `NAME_REQ_SC` maps image→1.1.1 / heading→1.3.1 / interactive roles→4.1.2, obsolete 4.1.1 dropped. All defensible.

---

## 6. Soundness audit (the three rails)

### Rail #1 — Objective return, never a verdict — **HOLDS everywhere**
Every tool returns a measurement; none emits pass/fail/equivalent/barrier. Verified across `query_ax_node` (flags only, name STRING not re-emitted), `resolve_part_color` (raw colours + boolean divergence + INCONCLUSIVE note), `compute_contrast_ratio` (ratio + a disclaimed `passes`), `resolve_destination` (raw fingerprint, explicit "never returns equivalent/same/different" + test assertion), `ocr_image_text` (raw text/lines, "NEVER a verdict" note + test), `compare_named_regions` (numeric ΔE + disclaimed boolean + test). The one weak spot — `compute_contrast_ratio.passes` — is wrong at the boundary but is still a **mechanical compare, not an SC disposition**.

### Rail #2 — Read-only / fresh-clone — **CRACKS (the real soundness exposure)**
- **Mutating tools are correctly isolated.** `observe_state_after_activation`, `set_state_and_capture`, `request_hi_res_crop`, `render_with_overrides`, `resolve_destination` all refuse without `ctx.freshClone` and run on the clone (with `resolve_destination` further using an incognito context). `freshClone` reproduces fresh-load state (not mutated subject state), consistent with the spec.
- **Three "read-only" tools mutate or read the SHARED base page.** `ocr_image_text` (`cdp-tools.js:528`) and `compare_named_regions` (`:492`) call `scrollIntoView` on the shared page; `query_ax_node`'s coordinate path resolves `(x,y)` against the shared page's current scroll. Under `llmToolConcurrency=4`, a peer subject's scroll can move the content another subject is screenshotting / coordinate-resolving. `measure_geometry_live`'s own header even asserts shared-page concurrency safety — which these break. **This is the genuine residual soundness exposure**, bounded only by the fact that every affected verdict is shadow/canary-capped.
- **Coordinate frame mismatch.** Tool-session/clone pages run at the Puppeteer default 800×600 while the frozen crops the model reasons over are 1280×900 — so coordinate-keyed tools resolve the model's screenshot pixels against a differently-reflowed page (spec line 116 violated).
- **One-hop network leak.** `resolve_destination`'s same-origin guard runs *after* the cross-origin GET is issued (reproduced: foreign origin received the request) — the post-hoc guard correctly refuses to return the content, but the outbound request already fired.

### Rail #3 — Shadow / canary-capped — **HOLDS (verified end-to-end)**
A tool-assisted verdict flows through `runAdjudication`/`runRubricJudgments` under mechanism `llm-agent`/`llm-rubric:<id>`; `authority.js` `isLlmMechanism` (`:33`) matches both, and `authorityFor` caps any LLM mechanism to `{state:'shadow', mayPublish:false}` (`:66-67`), with `MAX_LLM_STATE='canary'` (`:31`). Nothing in `cdp-tools.js`, the SDK transport, or the orchestrator wiring rewrites the mechanism/source/authority. The round-2 detectors are built **after `reconcile()`** (`build-v3.js:327` vs `:381-483`) and stamped `authoritative:false/shadow:true`, so they are **structurally unable to false-clear or false-barrier** any obligation. The activation gate is **double-opt-in OFF by default** (`V3_LLM=1` AND `V3_LLM_TOOLS=1`); the loop is bounded (SDK `maxTurns=3` + per-attempt `AbortController` + per-turn stall timeout); clone cleanup has per-call `finally` close + `reapStale` + a post-all sweep + `browser.close`.

**No tool leaks a verdict.** The LLM *can* be misled by a wrong objective datum (fabricated `nameFrom`, mis-mapped coordinates, a no-op hover reading as `stateReached:true`, a focus phrase read as a status announcement) into a wrong *shadow* judgment — but never into an authoritative one.

---

## 7. Cleared false alarms (due diligence recorded)

Checked and found **CORRECT** — no action:

- **`query_ax_node`**: `role.value + headingLevel` correctly distinguish a real `<h2>` from a styled `<p>` (the 1.3.1 focus item); `roleSource` is non-probative surface, not a correctness failure.
- **`set_state_and_capture`**: the `checked` guard avoids the `HTMLInputElement`-prototype trap (explicit `INPUT`+type test, not `'checked' in el`); fresh-clone isolation verified; ARIA/expanded paths gate reach on a *real* state change. The `color` omission from the style-delta allowlist is **spec-faithful** (after-frame pixels are authoritative); pseudo-element indicators are an accepted documentation nit.
- **`probe_screen_reader_after_action`**: the VSR is **genuinely live** in a headless clone (re-verified end-to-end).
- **`measure_geometry_live`**: read-only on the shared page is genuinely concurrency-safe (no scroll/screenshot/mutation). The "re-derives the FORBIDDEN default-320 overflow" claim was **REFUTED** (the shared judge page loads at the ambient default viewport, not the deterministic probe's 320×256).
- **`request_hi_res_crop`**: device-scale re-raster (not page zoom), scale reporting, full-element coverage (no sub-region narrowing), fresh-clone isolation, `[1,4]` clamp — all correct.
- **`render_with_overrides`**: cross-session emulation **does** affect the screenshot, captured after the transform settles; closed enum, fresh-clone isolation, pixels-not-ratio return, grayscale→achromatopsia mapping — all sound (1.4.5 over-claim is doc-only).
- **`compute_contrast_ratio`**: relative-luminance formula WCAG-correct; 0.03928-vs-0.04045 has zero practical effect.
- **`resolve_part_color`**: `divergent>40` threshold, never-a-ratio/verdict, both-values-returned, no baked-in SC threshold — all upheld.
- **`resolve_destination`**: same-origin-only, incognito isolation, GET-only, context closed in `finally`, file:// same-dir guard (traversal correctly refused), never returns same/equivalent.
- **`compare_named_regions`**: read-only (no clone needed), never-a-verdict (test-asserted), division-safe region clamping, no raw per-pixel stream.
- **`ocr_image_text`**: process isolation real (spawn no shell; only a base64 PNG crosses the boundary; no path/command derived from page content); failure⇒distinct `{error}`⇒INCONCLUSIVE with an explicit "empty ≠ no-text" note; never a verdict.
- **arch**: tool-assisted verdict stays `source:llm`/canary/shadow/PROVISIONAL-only; loop bounded + timed out; activation gate OFF by default; `freshClone` reproduces fresh-load state.
- **ROUND2_DETECTORS**: both must-fixes landed; detectors cannot false-clear/false-barrier (build-order invariant); SC attributions corpus-verified; axe breadth adds no noisy DECIDED rule (advisory rules correctly review-tier; 1.4.3 deliberately not surfaced).
- **OCR_SIDECAR**: process isolation + failure⇒unavailable (not silent empty) + never-a-verdict — re-verified sound.
- **PARALLELISM**: per-experiment page/DOM/CDP isolation holds (all CDP is page-scoped, zero browser-wide emulation); `withDeadline` has no timer leak / double-resolve; loops bounded; the `reapStale` race belongs to the (inert) LLM lane, not the experiment lane.

---

## 8. Prioritized fix list

**P0 — soundness regressions that defeat the tool's stated purpose (fix before any corpus run):**
1. `observe_state_after_activation`: implement node-identity / MutationObserver and emit `visibilityCause` (the inserted-vs-toggled distinction the tool exists for); fix `anyNewTextInLiveRegion` to compare against the before-DOM (`liveRegionPreExisted`).
2. `request_hi_res_crop`: fix the viewport-relative clip (page-absolute coords or element-handle screenshot) so below-the-fold targets are not blank; apply to the 4 sibling tools (`set_state_and_capture`, `render_with_overrides`, `compare_named_regions`, `ocr_image_text`); add a below-fold non-blank regression test.
3. `set_state_and_capture`: make `hover` fail-closed — park the pointer to (10000,10000) before both frames (or `CSS.forcePseudoState`), require a real style/box delta.

**P1 — data-correctness defects that mislead the shadow judge:**
4. `query_ax_node`: fix `nameFrom` (contributing sources only) and `requiredStatesMissing` (per-role ARIA set, honor 4e8ab6); fix `isAriaHidden` (`ariaHiddenSubtree`); resolve IDREFs on the coordinate path.
5. `resolve_part_color`: diff against the part's actual property via `sourceProperty`, not `cs.color`.
6. `compute_contrast_ratio`: compute `passes` on the unrounded ratio (also `verify-finding.js:53,162`).
7. arch: pin tool-session + every `freshClone` to 1280×900 from a shared constant (fixes the coordinate-frame mismatch).
8. `probe_screen_reader_after_action`: filter the queue to `polite:`/`assertive:` phrases (drop focus/context-change); don't set `emptyQueue:true` on error paths.

**P2 — shared-page concurrency + spec/contract conformance:**
9. Run `ocr_image_text` + `compare_named_regions` on a `freshClone` (or `captureBeyondViewport` with a document-relative clip) so they stop scrolling the shared page; fix the same on `query_ax_node`'s coordinate path.
10. `compare_named_regions`: switch ΔE76→ΔE2000; add `luminanceDelta`; read the frozen crop or flag the live recapture.
11. `resolve_destination`: pre-flight abort of foreign-origin navigation; surface `instantRedirect`/`redirectDelayMs` and settle after an instant redirect.
12. `measure_geometry_live`: add `fractionOfOther`, `gapX`/`gapY`, `occludedElements[]`, `stateUsed`, and viewport emulation for the 1.4.10 use.
13. `render_with_overrides`: error on an unresolvable `targetXpath` instead of full-viewport fallback.
14. `ocr_image_text`: surface `engine`/`engineVersion` (read the resolved version); clamp+flag the explicit rect.

**P3 — precision, robustness, and doc hygiene:**
15. Round-2 detectors: narrow `dangling-IDREF` (all-tokens-missing) and `group-label` (radio/checkbox-predominant) precision.
16. arch: hoist a single retry deadline; delete dead `resolveXpath`/`resolveNode`.
17. Doc-hygiene: update the stale 1.4.5 `render_with_overrides` rows; align §4.10/§4.11/§4.12 with shipped behavior; scope the PARALLELISM "byte-identical" claim to concurrency-1.
18. `ocr_image_text`: language config or document Latin-only + flag low confidence.
