# LLM Interactive Tools for the v3 Accessibility Judge

_2026-06-17_

## 1. Premise

The v3 LLM judge today is a **single-shot, stateless, passive** judge (claude-opus-4-8, vision-capable). It has **no tools, no function-calling, no multi-turn loop, and no live page access**. The harness routes it an obligation it could not decide deterministically (auto-PARTIAL / uncertain) together with a **FROZEN evidence bundle** assembled *before* the call:

- **Screenshots (pre-captured):** element-crop (±2px), surrounding-region (±24px), full viewport, viewport-320 (reflow), and state-before / state-after PAIRS for **one** pre-chosen transition (focus via CDP, hover via real pointer move, or submit-invalid). Same clip both states.
- **Pre-computed signals (text):** contrastRatio + WCAG threshold (when fg/bg are known), targetSize/box, largeText flag, focusRing decision, keyboard-operability signal, and a **one-element** VSR transcript excerpt ({phrase, name, role, states, axName}).
- **Rubric text** for the SC.

It returns `{verdict, confidence, summary, reasoning, evidenceRefs}` and the result is **SHADOW / non-authoritative** — capped at `canary` by `authority.js` (`MAX_LLM_STATE='canary'`), never reconciled, never promoted.

What it **cannot** do is exactly what a human auditor does when a verdict is uncertain: re-screenshot at higher resolution, eyedrop a pixel, measure a box live, move the cursor and press Esc, Tab through the page, drive the screen reader after an action, resize/zoom, toggle a media feature, fill and submit a form on demand, or follow a link. The architecture to add that repertoire exists but is unbuilt (add Anthropic `tools` + a multi-turn tool loop + thread the live browser/CDP + VSR into the agent).

**Goal of this report:** give the judge the *same interactive repertoire a human auditor uses* — tools it invokes DURING inspection to gather the one decisive datum the frozen bundle cannot contain — while keeping every verdict shadow / non-authoritative.

**Source corpora:** [`wcag-understanding/`](../../wcag-understanding), [`wcag-techniques/`](../../wcag-techniques), [`act-rules/`](../../act-rules), the keyboard-trap / dialog-navigation papers in [`refs/`](../../refs), and [`docs/analysis/coverage/COVERAGE-PROGRESS.md`](coverage/COVERAGE-PROGRESS.md).

---

## 2. How to read this report

### Timing classification

Every tool / need is tagged by **when the decision of *what datum to gather* is made**:

- **during-inspection** — the LLM must decide, mid-reasoning, *which* datum to gather (where to sample, what to activate, which sub-region to enlarge, what to ask the SR). It cannot be fully pre-computed because the choice depends on what the LLM sees. **This is the focus.**
- **preprocessing-sufficient** — fully computable up front and just handed over; no LLM choice. If the harness can compute it once per page/element, it belongs in the FROZEN bundle, not in a tool.
- **either** — could be pre-computed, but is cheaper / sharper as an on-demand tool once the LLM has identified the contested element.

A recurring finding of the audit: **many proposed "tools" are actually preprocessing in disguise.** Reading order, the full tab sequence, target-size geometry, focus-ring geometry, the 320px overflow culprit, viewport-meta, and per-node AX provenance are all *static properties of the page* — they have no "depends on what the LLM sees" character and should be widened into the bundle rather than exposed as tools.

### Soundness principle

An LLM that drives tools toward a verdict can rationalize. Every tool here is bound by:

1. **Objective return, never an interpretation.** Tools return a measurement / observation (RGBA, a ratio, a box, a transcript line, a before/after delta). They never return `pass/fail`, `equivalent`, `barrier`, or an SC disposition. The judgment stays in the LLM's (shadow) reasoning so the objective datum and the verdict are separable and auditable.
2. **Read-only by default.** Pure reads (CSSOM, AX tree, geometry, pixels) take no live screenshot of a mutated page.
3. **Mutating actions run on a FRESH page.** Any activation / submit / state-toggle / viewport-emulation runs on a reload-isolated clone so it cannot corrupt the frozen bundle or a later subject's evidence (the harness already does this for invalid-submit in `vision-capture.js`).
4. **Bounded turns.** A small per-obligation call cap (typically ≤2–3) so the model cannot fish across regions / states / pairs until one flips the verdict.
5. **Verdict stays shadow.** Tool use widens what the model can SEE; it never changes the `canary` authority cap on what it CONCLUDES.

---

## 3. The catalog (headline)

Canonical tools, leading with the genuinely **during-inspection** ones, ordered by SC coverage. Verdicts come from the audited catalog: **KEEP-BUT-CONSTRAIN** (build it, with the listed guards), **RECLASSIFY-PREPROCESSING** (the value is real but belongs in the frozen bundle, not a tool), and **MERGE-OR-DROP**.

| Tool | Timing | Mechanism | SCs served | Audit verdict | One-line purpose |
|---|---|---|---|---|---|
| `observe_state_after_activation` | during-inspection | CDP Input activate (fresh page) + MutationObserver/nav diff + screenshot | 4.1.3, 2.4.10, 2.4.2, 1.4.10, 1.1.1-carousel | KEEP-BUT-CONSTRAIN | Activate an LLM-named control, return the objective before/after delta (incl. *how* content became visible) |
| `query_ax_node` | either (during-inspection on coordinate path) | CDP `getNodeForLocation` + `getPartialAXTree` + IDREF resolve | 1.3.1, 4.1.2, 2.4.4 | KEEP-BUT-CONSTRAIN | Resolve a pixel/xpath to live AX node: role, name **provenance**, IDREF resolve status, required states |
| `set_state_and_capture` | during-inspection | CDP `forcePseudoState`/focus/real-hover/property-set (fresh page for mutating) + same-clip recapture | 1.4.11, 1.4.1, 1.4.3 | KEEP-BUT-CONSTRAIN | Drive a control into an LLM-named state NOT in the frozen table; recapture same clip + style delta |
| `render_with_overrides` | either (during-inspection for 1.4.1, 1.4.5) | CDP `setEmulatedVisionDeficiency` / `setEmulatedMedia` / `setDeviceMetricsOverride` / injected UA sheet | 1.4.1, 1.4.5 (+ 4 reclassified) | KEEP-BUT-CONSTRAIN | Re-render under one fixed transform (grayscale/CVD/CSS-off/resize/zoom) + layout/pixel diff |
| `probe_screen_reader_after_action` | either | Fresh VSR clone + `act()` + `spokenPhraseLog` delta | 4.1.3 (+ 3.3.1/3.3.3 submit slice) | KEEP-BUT-CONSTRAIN | Drive the SR after an action, return the verbatim live-region announcement queue |
| `measure_geometry_live` | during-inspection | CDP `getBoxModel`/`getBoundingClientRect`/`scrollWidth`/`elementsFromPoint` (read-only, fresh emulation) | 1.4.13, 1.4.10 (partial), 2.4.3 (partial) | KEEP-BUT-CONSTRAIN | Overlap/occlusion/overflow geometry at an LLM-chosen element/state/width not pre-captured |
| `resolve_destination` | either | Isolated incognito GET + redirect-settle + title/h1/main read | 2.4.4 | KEEP-BUT-CONSTRAIN | Follow a same-origin link, return a raw destination fingerprint (and sibling-set comparison) |
| `request_hi_res_crop` | during-inspection | CDP `captureScreenshot` at higher `deviceScaleFactor` (NOT page zoom) | 1.1.1, 1.4.5 | KEEP-BUT-CONSTRAIN | Re-raster an element / LLM-named sub-region at 2–4× device-scale to read fine glyphs |
| `ocr_image_text` | either | CDP region screenshot + fixed versioned OCR engine | 1.4.5, 1.1.1, 3.3.1 | KEEP-BUT-CONSTRAIN | Transcribe baked-in image text (raw string + per-glyph confidence), no equivalence call |
| `compute_contrast_ratio` | during-inspection | CSSOM used-color (preferred) or flat-opaque pixel read + WCAG formula | 1.4.1, 1.4.11 (flat only) | KEEP-BUT-CONSTRAIN | WCAG ratio for an LLM-CHOSEN pair (G183 text-vs-surrounding); refuses non-uniform surfaces |
| `resolve_part_color` | during-inspection | CDP `getNodeForLocation` + `getComputedStyleForNode` (pseudo/SVG) + cascade walk | 1.4.11, 1.4.1 | KEEP-BUT-CONSTRAIN | Used-color of an LLM-pointed NON-TEXT part (border/pseudo/stroke/ring) + rendered-pixel cross-check |
| `compare_named_regions` | during-inspection | Canvas readback over the already-captured crop, harness-resolved named sub-rects | 1.1.1 | MERGE-OR-DROP | deltaE2000 + perceptibly-distinct between LLM-named image sub-regions (color-encoded info, F13) |
| `probe_focus_reachability` | during-inspection (residue of preprocessing) | Reuse `kbd-graph` `probeActive`/`collectTabOrder` on a fresh page | 2.1.1, 4.1.2 | RECLASSIFY-PREPROCESSING | Is THIS specific element in the native Tab ring; does tabbing land inside an `aria-hidden` subtree |
| `serialize_region_order` | preprocessing-sufficient | Slice the already-collected VSR transcript | 1.3.1, 2.4.4, 1.1.1 | RECLASSIFY-PREPROCESSING | Ordered SR node stream + structure flags for a region (NO geometric-order diff — `order-check` owns that) |
| `read_dom_facts` | preprocessing-sufficient | Extend `collect.json` element facts (CDP DOM/Network/style/Unicode) | 1.1.1, 2.1.1, 1.4.3, 1.3.2, 3.3.1, 1.4.10, 2.4.6 | RECLASSIFY-PREPROCESSING | Image state, listener inventory, disabled/inert, raw codepoints, visibility, viewport-meta |

### Where the user's three examples land

- **Color picker / eyedropper** → split into **`compute_contrast_ratio`** (the WCAG ratio for the *pair the LLM chooses* — G183 text-vs-surrounding, or a 1.4.11 indicator-vs-adjacent fill) and **`resolve_part_color`** (the UA used-color of an LLM-pointed non-text part, cross-checked against the rendered pixel). Both **refuse** non-uniform / gradient / anti-aliased / semi-transparent surfaces and return `inconclusive` rather than a precise-looking-but-unsound worst-pixel number — those cases are deliberately routed to the perceptual rubrics (`contrast-over-complex-backdrop-v0.md`, `non-text-contrast-v0.md`) that *forbid* a numeric ratio. A raw per-pixel eyedropper that hands back RGB the model narrates into a fabricated ratio is the explicit rationalization channel and is rejected. For image color-*encoding* (F13), the eyedropper survives only as **`compare_named_regions`**, returning a derived deltaE over harness-resolved named sub-rects, not raw pixels.
- **Move the cursor / drive the keyboard** → split across **`observe_state_after_activation`** (one activation → objective before/after delta), **`set_state_and_capture`** (drive a control into a named state and recapture), **`measure_geometry_live`** (the hover/focus popup geometry that only exists in the after-state), and **`probe_focus_reachability`** (targeted "is THIS element in the Tab ring"). The full forward+backward tab order and the trap suite are **already preprocessing** (`kbd-graph.js`, run up front) — the keyboard *trap* escape test is destructive and stays in the offline detector, never an LLM-driven tool.
- **Drive the screen reader** → **`probe_screen_reader_after_action`**. The *only* genuinely during-inspection SR datum is the **post-action live-region announcement** (4.1.3, and the announced-after-submit slice of 3.3.1/3.3.3); a static node's announced name/role/value is already in the full forward transcript and should be handed over whole (preprocessing), not re-queried.

---

## 4. Tool detail

### 4.1 `observe_state_after_activation` — KEEP-BUT-CONSTRAIN (during-inspection)

**Action / objective return.** On an LLM-named control + LLM-named expected outcome, performs **ONE** activation (click / Enter / Space / programmatic submit) and returns the before/after delta: `{activeElementChanged, focusEnteredNewContent, urlChanged, navigated, newWindow, ariaStateDelta[], domMutations[], newlyVisibleNodes[{xpath,text,visibilityCause:'inserted'|'display'|'visibility'|'aria-hidden'}], inLiveRegion, focusMovedToChange, screenshotBefore, screenshotAfter}`. It reports *what* changed and *how* it became visible — crucially the insertion-vs-attribute-toggle distinction the status detector's insertion-only sweep is blind to — **never whether it is conformant.**

**Mechanism.** CDP resolve xpath → snapshot (AX-state map + innerText set + activeElement + URL) → CDP Input pointer/keyboard activation (or `form.requestSubmit`) wrapped in MutationObserver + framenavigated/targetcreated listeners → settle → re-snapshot + diff + screenshot. Reuses `status-detector.js` (beforeText snapshot + disclosure/live-region classification) and `exp-runners.js` (`realKeyboardReach` + framenavigated guard + link preventDefault). **Every navigating/mutating activation runs on a FRESH throwaway page.**

**SCs served (why):**
- **4.1.3 Status Messages** — *only* on the gap `status-detector.js` documents as `coverageMode:'insertion-only'` (a status revealed by toggling hidden/display/aria-hidden on a pre-rendered node, `addedCount=0`) and the triggers the safe sweep excludes. The LLM picks the semantic trigger ("the Save control") the static enumerator can't name; the tool returns `visibilityCause` + `inLiveRegion` + `focusMovedToChange`. **Must NOT re-drive the safe+perceivable buttons the sweep already covers.**
- **2.4.10 Section Headings** — reveal dynamically-injected sections (activate a tab/disclosure/lazy-load) so headings can be re-enumerated; the LLM must choose which control plausibly hides a section.
- **2.4.2 Page Titled** — SPA route/view switch, then re-read `document.title`; only meaningful for an in-app nav control that changes the view without a full load.
- **1.4.10 Reflow** — at 320px, activate a hamburger/"More"/disclosure and diff newly-revealed content to settle F102 (content reachable only via a control).
- **1.1.1 Non-text (carousel/scripted swap)** — advance a carousel and return the new `<img>` src + computed accessible name as raw data; the alt-correctness judgment stays with the rubric.

**Example invocations.**
- 4.1.3 (insertion-only gap only): "activate the 'Apply coupon' control; report whether the result banner became visible by insertion or by un-hiding a pre-rendered node, whether it is in a live region, and whether focus moved to it."
- 2.4.10: "expand the 'Shipping details' disclosure and return the `newlyVisibleNodes` inventory so headings can be re-enumerated."
- 1.1.1: "advance this carousel one panel and return the new `<img>` src plus its computed accessible name."

**Soundness constraints.** Raw measurement only (never an "announced/conformant" verdict). De-duplicate against the deterministic lanes: **drop 2.1.1** (already driven by `exp-runners.js`, and clearing is withdrawn at the registry — `open-scope-never-clearable`), **drop 3.3.1/3.3.3** (the invalid-submit pair is a pre-driven, reload-isolated STATE_TRANSITION in `vision-capture.js`; the rubric abstains if it's missing). Fresh throwaway page per activation; exactly ONE activation per call; per-obligation budget (`lib/budget.js`); refuse a control not in the a11y tree / not perceivable (`status-detector` `isPerceivable`). Persist the named target + named outcome + returned delta to the side `llmVision`/rationale artifact so a reviewer can confirm the model activated what it claimed. Verdict stays shadow / canary-capped; a tool-driven clear still passes through the strict PROVISIONAL gate (zero false, `labelledClears≥149`).

---

### 4.2 `query_ax_node` — KEEP-BUT-CONSTRAIN (either; during-inspection on the coordinate path)

**Action / objective return.** Read-only live AX introspection of a node the LLM targets by frozen-subject xpath OR by a pixel coordinate it picks from a screenshot. Returns `{resolvedXpath, box, role, roleSource, headingLevel, nameFrom[], labelledbyTargetIds[]+resolveStatus[], describedbyTargetIds[]+resolveStatus[], ariaStates{}, checked/expanded/selected/pressed/valuenow, requiredStatesPresent[], requiredStatesMissing[], focusable, isPresentationSuppressed, isAriaHidden, axNameMatchesBundle}`. Pure read; no DOM mutation, no focus/hover side effects. **The accessible-name STRING is not re-emitted as a second authority** — only `axNameMatchesBundle` flags drift against the frozen `axName`.

**Mechanism.** CDP `Accessibility.getPartialAXTree` (+ `getAXNodeAndAncestors` for provenance) keyed by the frozen subject's `data-v3-target` marker; for a coordinate target, `DOM.getNodeForLocation(x,y)` → backendNodeId → `getPartialAXTree`. IDREF resolution via `getElementById` per labelledby/describedby token. Same CDP plumbing already shipped in `exp-runners.js` and `vsr-collect.js`.

**SCs served (why):**
- **1.3.1 Info and Relationships** — the load-bearing **coordinate path**: the LLM sees a big-bold line in the crop that the deterministic candidate set never selected and resolves THAT pixel to test real-heading-with-level vs styled `<p>` (F2/F43) and `role=presentation` suppression (F92). `nameFrom[]` also pins which text became a control's name (F111).
- **4.1.2 Name, Role, Value** — `requiredStatesPresent/Missing` + per-IDREF `resolveStatus` catch the broken-aria-labelledby trap (F68) and missing required states (4e8ab6) — provenance the resolved `axName` cannot show.
- **2.4.4 Link Purpose** — `nameFrom[]` + contributing-source breakdown distinguishes an empty/image-only link and the filename-fallback name (c487ae/F89) from a genuinely descriptive name.

**Example invocations.**
- 1.3.1 (coordinate): "role + heading level of the node at (412,180) — real heading or styled `<p>`?"
- 4.1.2 (subject xpath): "`nameFrom[]` + labelledby IDREF resolveStatus for the current subject node."

**Soundness constraints.** Read-only. Raw facts only (IDREF resolveStatus as booleans/ids; required-states as presence lists — never "broken label"). **Single name authority** (do not re-emit the resolved name; the frozen CDP `axName` stays authoritative). Always echo `resolvedXpath` + box so a reviewer can confirm the LLM probed the node it claimed. Bounded (≤3 per subject). Coordinate probes must resolve against the SAME frozen page snapshot the screenshots came from (no re-render) so (x,y) still maps. **Pre-compute the subject-xpath path** (fold `nameFrom`/IDREF-resolveStatus/requiredStates/roleSource into the bundle); reserve the live tool for the coordinate / visually-discovered-node path the candidate generator never selected.

---

### 4.3 `set_state_and_capture` — KEEP-BUT-CONSTRAIN (during-inspection)

**Action / objective return.** Drives ONE element into a specific interaction state the LLM names — restricted to states NOT already in the harness's frozen `STATE_TRANSITIONS` table (checked / expanded / selected / open / placeholder-shown), OR a SECOND transition on an element that already got its one auto-planned transition — then re-captures the SAME clip before/after. Returns `{stateReached, textVisible, screenshots:{before,after}, computedStyleDelta (read-only getComputedStyle diff over a fixed allowlist: text-decoration / font-weight / font-style / font-size / outline / border / background-color presence — NO synthesized fg/bg pair), indicatorBox}`. `stateReached` and `textVisible` are **load-bearing**: when the requested state is not reproduced, return `'not-reproduced: <reason>'` and the harness must forbid reading a PASS from an unreached state.

**Mechanism.** Reuses `vision-capture.js` `captureStateVision`: CDP `DOM.performSearch(xpath)`→nodeId + `CSS.forcePseudoState` for pseudo-states; `el.focus({preventScroll})`; real `page.mouse.move` for `:hover` (fires CSS `:hover` AND JS `mouseenter`, which forcing alone does not); programmatic property-set + dispatched input/change events behind `preventDefault` for checked/expanded, **each on a fresh `page.reload()`**; same `clampClip`/`unionClip` + `parkPointer` + idle-blur hardening as the existing bridge. `computedStyleDelta` = two `getComputedStyle` reads of the SAME node — never a fabricated color pair.

**SCs served (why):**
- **1.4.11 Non-text Contrast** — the frozen `STATE_TRANSITIONS` table (`vision-capture.js:23`) has NO entry for checked/selected/open (only focus for 2.4.7/2.4.11, hover for 1.4.13, submit for forms). A custom checkbox/toggle/disclosure reaches the lane with only resting pixels; only the LLM, seeing the control, can name "force `:checked`" vs "force `aria-expanded=true`" to expose the state-specific indicator.
- **1.4.1 Use of Color** — distinguishing a non-color cue present AT REST from one appearing only in a state the table does not drive (a selected/checked affordance), beyond the single auto-planned focus or hover transition.
- **1.4.3 Contrast (Minimum)** — text that exists only in placeholder-shown / expanded-panel states (1.4.3 covers these) is absent from every frozen transition; `textVisible` confirms the text actually rendered rather than an empty after-frame reading as "no barrier."

**Example invocations.**
- 1.4.11: "force this custom checkbox to `:checked` and return the after-frame + outline/border/background style delta and `indicatorBox`; report `stateReached`."
- 1.4.3: "put this field into placeholder-shown and report `textVisible` + the placeholder text region for pixel-contrast judgment."

**Soundness constraints.** **DROP used-colors entirely** — unsound AND redundant: an element reaches this lane *precisely* because the backdrop could not be reduced to two flat colors, so a `getComputedStyle` used-color pair reports colors that ignore the gradient/image/overlay that caused the uncertainty (the ideal rationalization vector). The sound datum is the after-frame pixels. **Reclassify forced-colors to a preprocessing sibling** — a whole-page `setEmulatedMedia('forced-colors: active')` toggle has no per-element choice (and is genuinely missing from the pipeline today, worth ADDING). Make `stateReached`/`textVisible` fail-closed. Restrict to states OUTSIDE the frozen table, or a genuine SECOND transition on an already-consumed xpath. Read-only on style; reuse the existing adversarial hardening (pointer parked to (10000,10000) to kill cross-subject `:hover` leak; idle blur; `forcePseudoState` cleared after capture; handler-firing/irreversible toggles reload-isolated). Bounded (≤2 per (element,SC)). Verdict shadow / canary-capped / gold-scored.

---

### 4.4 `render_with_overrides` — KEEP-BUT-CONSTRAIN (either; during-inspection for 1.4.1, 1.4.5)

**Action / objective return.** Re-renders the page (or a chosen region) after applying ONE transform from a fixed, documented enum — grayscale, a named CVD simulation, author-CSS-disabled, user font/size override, 320px-reflow viewport, 256px, 400% zoom, forced-colors — and returns the transformed screenshot plus an objective layout/pixel diff: a pixel-diff score vs the untransformed clip, per-target `getBoundingClientRect` deltas, and a "glyphs reflowed/resized" boolean **gated on a box-dimension change, not raw pixel noise**. The LLM picks only WHICH transform; transform parameters are not LLM-tunable.

**Mechanism.** Reuses `vision-capture.js` (`clampClip`/measure-rect/screenshot) extended with CDP `Emulation.setEmulatedVisionDeficiency` (grayscale + CVD), `setEmulatedMedia` (forced-colors), `setDeviceMetricsOverride` (320/400%/256) and an injected override stylesheet (author CSS off / forced font/size/color) — **none of which exist in `exp-runners.js` or `run-experiments.js` today** (verified by grep). Diff = `pixelmatch` on two same-clip PNGs + `getBoundingClientRect` deltas in the same scroll frame. Each mutating transform runs on a fresh page load.

**SCs served (why):**
- **1.4.1 Use of Color** — **genuinely during-inspection**: the LLM must first SEE which distinction is color-carried (a required/optional legend, a red error border, a red "sale" price, a status dot) and choose WHERE to look after grayscale/CVD. A whole-page grayscale shot doesn't tell you which of N color cues is load-bearing. Canonical manual F73/F81 test; the strongest during-inspection case in the set.
- **1.4.5 Images of Text** — **non-redundant** with the static-crop `images-of-text-v0` rubric: the font-size override gives an orthogonal, more objective signal — a baked image's glyph boxes do NOT change on resize (box-delta ≈0); real HTML text reflows/resizes (box-delta > 0). The LLM picks WHICH glyph cluster it suspects is baked.

**Reclassified to preprocessing** (transform is fully SC-determined, no per-element choice): **1.3.1** (author-CSS-off; keep as a tool *only* if region-targeted), **1.3.2** (styles-removed reading-order render — identical for every subject), **1.4.10** (400%/256px variants; viewport-320 already shipped), **2.4.7** (forced-colors focus shot belongs in the existing CDP `:focus`/`:focus-visible` state-pair capture).

**Example invocations.**
- 1.4.1: "I see a required/optional legend distinguished only by red vs black text — grayscale this surrounding-region clip and return it plus the pixel-diff."
- 1.4.5: "scale the user font to 200% and report whether THIS heading's glyph boxes changed dimensions (real text) or stayed fixed (baked image)."

**Soundness constraints.** Raw measurement only (the result must read the same whether the page passes or fails). Fixed, non-LLM-tunable transform set (one enum value; no arbitrary CSS / color matrix / viewport / diff threshold). Read-only w.r.t. durable state (fresh page or inverse-CDP revert before any later crop). Bounded (≤3 calls per subject). The reflow boolean is gated on a measured box-delta over a FIXED threshold, not pixel-diff. Transform recorded in `evidenceRefs` and the PNG persisted to the side artifact so a hand-annotator can audit what the model saw. Verdict shadow. **Cost caveat:** this needs the multi-turn tool loop + threading the live page; the four preprocessing SCs do NOT need the loop, so it only pays off if 1.4.1's where-to-sample choice is the real target.

---

### 4.5 `probe_screen_reader_after_action` — KEEP-BUT-CONSTRAIN (either)

**Action / objective return.** Splits the original "ask_screen_reader" into its two real capabilities. **(A) PREPROCESSING (no LLM choice):** hand the LLM the *full* CDP-name-corrected VSR transcript (every node's announced `{role,name,value,states,phrase}` keyed by xpath), not a one-element excerpt. **(B) DURING-INSPECTION (narrowed):** given an LLM-chosen safe trigger, on a FRESH page clone the harness moves the VSR cursor to it, clears `spokenPhraseLog`, runs VSR `act()`, waits a harness-fixed settle window, and returns the verbatim live-region announcement queue `[{text, ariaLive, role, fromNodeXpath}]` or `emptyQueue:true`. No adequacy judgment.

**Mechanism.** (A) `collectVsrTranscript()` + `correctNamesViaCdp()` output, embedded whole. (B) Fresh browser context from the saved DOM snapshot + `ensureVsr()`; VSR cursor to trigger; `clearSpokenPhraseLog()`; `virtual.act()`; fixed `setTimeout(settleMs)`; `spokenPhraseLog()` delta filtered to live-region / `role=alert|status`. Reuses the exact Guidepup live-region path (verified in `node_modules/@guidepup/virtual-screen-reader`: `observeDOM` + politeness queue + `act()` + `spokenPhraseLog`/`clearSpokenPhraseLog`) that the frozen pre-action transcript structurally cannot contain.

**SCs served (why):**
- **4.1.3 Status Messages** — the only genuinely during-inspection SR use: whether the VSR actually VOICED an announcement after a trigger, for the residue `detectStatusMessages` cannot reach (its `coverageMode:'insertion-only'` gap + excluded triggers). The frozen pre-action transcript cannot hold a post-action announcement.
- **4.1.2 Name, Role, Value** — **reclassified to preprocessing (A):** the announced role/name/value for any STATIC operative node is already in the full forward transcript. A during-inspection re-query is warranted only for a node that exists ONLY after activation (covered by (B)).
- **3.3.1 / 3.3.3** — whether error/suggestion text is in the AX tree is preprocessing (full transcript); whether it is ANNOUNCED post-submit is the (B) fresh-clone queue. Submit is a mutating action → fresh clone, never in-place.
- **1.1.1** — **reclassified to preprocessing:** what the SR calls a static inline SVG/canvas is already its announced name in the full transcript.

**Example invocations.**
- 4.1.3 (B): "activate this `aria-expanded` toggle on a fresh clone and return the live-region announcement queue over the fixed settle window" — used when `detectStatusMessages` reports `coverageMode:insertion-only`.
- 4.1.2 (A): no tool call — the announced `{role,name,value}` is read directly from the full transcript in the bundle.

**Soundness constraints.** Read-only w.r.t. the inspection page (mutating `act()`/submit on a fresh clone only — mirrors `detectStatusMessages` running LAST in its own isolated `page.evaluate`). Raw observation only (verbatim `spokenPhraseLog` delta + politeness + `fromNode` xpath, or `emptyQueue:true`). **Harness owns the instrument parameters** (settle window, AT, `act()`) — the LLM only names WHICH trigger, removing the "tune the window until it announces" channel. Safety-filtered targets (`isSafe()`+`isPerceivable()` — no href/submit/reset/disabled/inline-nav/aria-hidden/display:none). Bounded probes, fresh state per probe. **No independent-corroboration claim:** VSR draws from the same Chromium AX source as CDP (per MEMORY: VSR is a harness instrument), so a returned announcement is not a source independent of the CDP signals already in the bundle — its uniquely-new datum is the post-action live-region VOICING, nothing more.

---

### 4.6 `measure_geometry_live` — KEEP-BUT-CONSTRAIN (during-inspection)

**Action / objective return.** On-demand, read-only layout measurement at an LLM-CHOSEN element/state/width the frozen bundle did not pre-capture: `{boundingBox, scrollWidth, clientWidth, overflowsHorizontally, rightEdgeExceedsViewport, overflowPx, overflowCulprit{xpath,role}, overlapAreaPx, overlapFraction, occludedElements[], gapPx, viewportWidthUsed, stateUsed, ambiguous, ambiguityReason}`. Measured numbers only; marks geometrically-ambiguous cases instead of inventing a value.

**Mechanism.** CDP `DOM.getBoxModel` / `Runtime.evaluate(getBoundingClientRect, scrollWidth, clientWidth)` + `getComputedStyle(overflow)` + rectangle-intersection math + `DOM.getNodeForLocation`/`elementsFromPoint` hit-testing. Viewport-width emulation via `setDeviceMetricsOverride` on a cloned page, restored after. Read-only DOM/AX queries only.

**SCs served (why):**
- **1.4.13 Content on Hover or Focus** — the popup only exists in state-after, and WHICH content it occludes (the "does not obscure" Dismissible branch) and the trigger-to-popup gap (hoverable path) depend on boxes that cannot be enumerated ahead of time because the popup's identity/position is what the LLM discovers in the screenshot. **The genuine during-inspection use.**
- **1.4.10 Reflow (partial)** — only when the LLM needs overflow geometry at a width OTHER than the single pre-captured 320px (e.g. a culprit at 256px), or for a sub-element the up-front overflow report did not break out. Default 320px page/line overflow + culprit + role is ALREADY pre-computed.
- **2.4.3 Focus Order (partial)** — the on-screen box of a focus stop the LLM identifies VISUALLY; marginal, since most focus-order boxes can be batch-pre-computed once the stop set is known.

**Example invocations.**
- 1.4.13: "in state-after, overlap area + fraction between this popup box and (a) its trigger and (b) every page-content box it covers; and the trigger→popup gap in px."
- 1.4.10: "at an emulated 256px width, does this specific text line's `scrollWidth` exceed its `clientWidth`, and which descendant is the overflow culprit?"

**Soundness constraints.** Read-only (CDP geometry + hit-testing only; no clicks/Tab/fill/nav/style mutation). Viewport-width emulation on a cloned/fresh page or restored in a `finally` (the bundle code already has this restore discipline). Raw measurement only — never `pass/fail`, `meets G195`, `barrier`. Mark ambiguity (degenerate box <6px, unresolved occluding layer, non-unique target) rather than fabricate. Target by stable selector, echo back `{xpath/role, viewportWidthUsed, stateUsed}`. Bounded (≤3) + budget-gated. **Forbidden from re-measuring geometry the bundle already pre-computes** — default-320 overflow+culprit, `evalTargetSize` (2.5.8 box+24px neighbor), `focusSpatialVerdict` (2.4.7/1.4.11 area/thickness/bbox/ring-fill) — re-measuring those risks two divergent numbers for the same thing. Fresh page for any state the bundle did not capture (re-establish hover/focus deterministically, record in `stateUsed`).

---

### 4.7 `resolve_destination` — KEEP-BUT-CONSTRAIN (either)

**Action / objective return.** Fetches a SAME-ORIGIN link's settled destination in an isolated read-only GET context. Two modes: (a) resolve ONE link the judge points at → `{finalUrl, httpStatus, title, h1, mainFirstParagraph, instantRedirect, redirectDelayMs}`; (b) compare a SET of sibling links the judge identifies as sharing an accessible name → the array of fingerprints plus a **literal per-field string-equality grid** (`finalUrlEqual`, `titleEqual`, `h1Equal`). **No same/equivalent/different verdict label** — only raw fields side by side.

**Mechanism.** CDP `browser.createBrowserContext()` (incognito) → `Page.navigate(href)` → wait for load + bounded redirect-settle → read title/first-h1/main-landmark first paragraph via `page.evaluate` → capture final URL + `Network.responseReceived` status → dispose the context. Mirrors the `{href,title,view}` fingerprint `drive-page.js` already records on an activated control, but on demand for a judge-chosen link.

**SCs served (why):**
- **2.4.4 Link Purpose (In Context)** — the decisive datum, do two SAME-NAMED links in the same context go to DIFFERENT destinations (ACT fd3a94), depends on a perceptual choice the LLM must make mid-reasoning: look at the surrounding-region crop + VSR transcript to recognize WHICH links are confusably identical, then resolve that pair. `link-purpose-v0.md` already hands the judge sibling links and tells it to return PARTIAL when "you cannot see the sibling links destinations to confirm they differ" — this tool converts that forced abstention into a gradeable verdict.

**Example invocations.**
- compare mode: "two links both named 'Download' in this card — resolve both hrefs and return `finalUrl`/`title`/`h1` side by side so I can see if they point to different resources (fd3a94)."
- single mode: "resolve this same-origin 'Read more' link and return its title + h1, so I can check whether the destination matches the generic name."

**Soundness constraints.** **Returns raw fingerprint only, never an interpretation** — the single most important correction: drop the proposed "equivalent" bucket; "equivalent" IS the 2.4.4 verdict the model is graded on, so computing it inside the tool lets the model launder its conclusion through an objective-looking field. Keep byte-equality booleans only; the judge does the "same purpose?" inference in the open. Read-only, non-mutating, fresh isolated incognito context per fetch (GET only; never POST/submit/click; never touch the audited session/cookies). **Same-origin only** (cross-origin/non-http(s) → `{refused:'cross-origin'}`) — following arbitrary external hrefs is unbounded SSRF/exfil/tracking surface and makes the run non-deterministic, breaking the saved-dataset contract (ground truth is hand-labeled AFTER the run). Depth 0, no crawl, hard per-obligation fetch cap (~4). Instant-redirect settle only (report `instantRedirect`+`redirectDelayMs` as data; no long meta-refresh/JS-timer waits). Bounded turns; drop malformed agent replies (matching `runAdjudication`/`runRubricJudgments`). Verdict stays canary-capped shadow; record the fetched fingerprint in the rationale artifact. **Drop the 2.4.2 lane** — bulk-fetching every nav link's `document.title` for Page-Titled uniqueness needs no LLM choice (preprocessing) and doesn't even match `page-title-v0.md`, which is a descriptiveness test, not a uniqueness one.

---

### 4.8 `request_hi_res_crop` — KEEP-BUT-CONSTRAIN (during-inspection)

**Action / objective return.** Re-renders a target element (or an LLM-named sub-region of it) at a higher device-scale factor and returns a fresh PNG, so fine rendered detail gets more device-pixels than the 1× element-crop. Two modes: **(a) FULL-ELEMENT (default)** — always covers the entire measured element bounds at scale N (N∈{2,3,4}, default 3), no narrowing; **(b) SUB-REGION** — the LLM supplies a fractional rect AND the full-element 1× crop stays in context, so a sub-region request can only ADD detail, never silently hide the disconfirming part. Always returns the actual scale used + CSS-pixel and device-pixel dimensions so the model knows whether higher scale yields genuinely new detail (vector/font/SVG/canvas) or is merely bilinear upsampling of an already-native raster (no new information).

**Mechanism.** CDP `Page.captureScreenshot` with `{ clip, captureBeyondViewport:true }` on a session whose `deviceScaleFactor` is set via `Emulation.setDeviceMetricsOverride`. **It must NOT use `setPageScaleFactor` / page zoom** — that reflows layout, can fire resize/IntersectionObserver/lazy-load handlers, and would silently corrupt every later crop/state-pair on the shared collector page. Higher device-scale renders the SAME layout at more raster samples (non-mutating). The collector page runs at `deviceScaleFactor=1` today (`vision-capture.js` viewport 1280×900), so a small image/wordmark/chart-label is rasterized 1:1 and the element-crop is too compressed to read — a real, currently-unrecoverable gap.

**SCs served (why):**
- **1.1.1 Non-text Content** — `alt-text-adequacy-v0` must compare the accessible name to what the image DEPICTS (e.g. alt "ERCIM logo" on a rendered W3C logo). When the wordmark is only ~40–60 device-px wide in the 1× crop the model can't read it and falls to PARTIAL; a 3× render of the LLM-chosen wordmark region makes the comparison possible.
- **1.4.5 Images of Text** — distinguishing a JPEG-of-a-paragraph from a decorative graphic, or reading a chart legend, needs legible glyphs the compressed native-scale crop lacks; the LLM picks WHICH sub-region carries the candidate text.

**Example invocations.**
- 1.1.1: "this logo crop is ~50px wide and the wordmark is unreadable; re-capture the whole element at 3× device-scale."
- 1.4.5: "capture the chart-legend sub-region `{x:0.6,y:0.05,w:0.4,h:0.3}` of this image at 3× to judge whether those are real text labels."

**Soundness constraints.** Read-only / non-mutating (device-scale screenshot on an isolated session; **forbid `setPageScaleFactor`/page zoom**; restore `deviceScaleFactor` after). Full-element bounds guaranteed in the default mode (the model can't crop away disconfirming evidence); sub-region only ADDS while the 1× full crop stays in context. Return objective geometry, not interpretation — the source dimensions tell the model (and a reviewer) whether higher scale adds real detail or is upsampled blur; **the rubric must keep PARTIAL available when the hi-res crop is still illegible** so an upscaled blur cannot be rationalized into "confirmed text." Bounded (≤2 hi-res requests, scale ≤4×) + budget-gated. Scale ceiling + degenerate guard (refuse when the element fails the existing visibility/size/off-viewport guards in `vision-capture.js`). Verdict shadow / canary-capped / gold-scored. **The during-inspection justification is the SUB-REGION selection + the adaptive trigger** (spend the capture only when the 1× crop is unreadable); a parameter-free "always 3× every crop" would be wasteful preprocessing.

---

### 4.9 `ocr_image_text` — KEEP-BUT-CONSTRAIN (either)

**Action / objective return.** Transcribes the pixels of an LLM-pointed image/region into the literal recognized string with per-glyph confidence and bounding boxes: `{text, perGlyphConfidence[], boxes[], engine, engineVersion}`. **Pure transcription, never an equivalence judgment** — the tool never returns `equivalent`, a verdict, a "cleaned" string, or any alt-text comparison; the LLM does the comparison itself.

**Mechanism.** Crop the LLM-indicated bbox from the live render via CDP node/region screenshot (no re-navigation, no state change) and run a fixed, versioned OCR engine over the crop. Crop coordinates validated against the frozen viewport so the tool cannot be steered to sample off-page or a different document state.

**SCs served (why):**
- **1.4.5 Images of Text** — supplies the exact characters baked into an image so the LLM can compare them against the accessible name / adjacent real text (the "also available as text" exception, C30 verification). The judge owns the equivalence call.
- **1.1.1 Non-text Content** — transcribes embedded text (chart labels, wordmarks, e.g. "19.3% APR") when the crop is too small/dense for the vision pass to read confidently.
- **3.3.1 Error Identification** — reads small-font error text the crop is easy to misread. **Capturability caveat:** native validation-bubble text is OS/chrome-rendered and frequently absent from a DOM screenshot — if the target lies outside renderable page pixels the tool must return `not-capturable`, not garbage; the authoritative source there is the DOM validation message.

**Example invocations.**
- 1.4.5: "OCR the region `{x,y,w,h}` of this banner and return the literal string + per-glyph confidences."
- 1.1.1: "transcribe the text inside this chart-legend image at `{bbox}`."

**Soundness constraints.** Read-only and non-navigating (CDP region/node screenshot of the CURRENT render; no URL/file fetch, no DOM/page/state mutation). Bbox validated against the frozen viewport bounds (reject/clamp+flag out-of-region coords so the LLM can't steer OCR to manufacture support). Raw transcription only (`{text, perGlyphConfidence[], boxes[], engine, engineVersion}` — no equivalence boolean, no normalized string). Fixed, versioned, deterministic engine (no LLM-internal OCR that could infer letters that aren't there); engine+version in `evidenceRefs`. Surface per-glyph confidence honestly; sub-threshold glyphs are unknown, not guessed. **Redundancy gate:** the bundle already ships an element-crop and the judge is vision-capable, so OCR is justified only as an on-demand sharpener for crops too small/dense/low-DPI for the vision pass — do not blanket-attach it to every 1.1.1/1.4.5 obligation. Bounded invocations. Verdict shadow.

---

### 4.10 `compute_contrast_ratio` — KEEP-BUT-CONSTRAIN (during-inspection)

**Action / objective return.** Given two LLM-chosen FLAT, OPAQUE color sources (a node's resolved used-color, a named point on a solid surface, or the G183 "surrounding text" pair), returns `{colorA, colorB, source:'cssom'|'pixel-flat', contrastRatio, threshold, passes:bool|null, inconclusive?:'non-uniform-surface'|'alpha-unresolved'|'glyph-fringe'}`. **It REFUSES (`inconclusive:'non-uniform-surface'`) on photo/gradient/anti-aliased/semi-transparent surfaces** instead of reporting a worst-pixel sweep — those are the cases the deterministic runner already abandons to the perceptual rubric.

**Mechanism.** `getComputedStyle`/CSSOM used-color resolution on the two chosen nodes (preferred), else a bounded read-only screenshot of each patch with a **uniformity (range≤12, the runner's `analyzeBackdrop` bar) + opacity check** before any luminance read; then the standard WCAG formula already implemented at `exp-runners.js:16-18`. The worst-case backdrop sweep is deliberately NOT exposed — it already runs deterministically in `runTextContrastPixel` and abstains by design on non-uniform surfaces.

**SCs served (why):**
- **1.4.1 Use of Color** — genuinely new + choice-dependent: the frozen bundle's contrast holds only the fg-vs-background pair, never the **G183 #1 pair** (colored text vs SURROUNDING text color), and axe surfaces only an F73 boolean. Which two text colors are "the link vs its prose" is a visual choice the LLM must make from the crop.
- **1.4.11 Non-text Contrast** — the indicator-vs-adjacent pair the LLM deems decisive (e.g. a toggle track vs an ADJACENT solid fill the runner did not sample), **only when BOTH sides are flat/opaque.** The gradient "least-contrasting point" (G207) variant must be DROPPED — that is the same unsound pixel-min the non-text rubric routes to perceptual judgment.

**Example invocations.**
- 1.4.1: "ratio between this in-text link's resolved text color and the surrounding paragraph's resolved text color, threshold 3:1" (CSSOM).
- 1.4.3 (REFUSED): "lowest ratio of this caption text over the hero photo" → `inconclusive:'non-uniform-surface'`, deferring to the perceptual rubric.

**Soundness constraints.** Read-only, no mutation (CSSOM + pixel reads only; never set color/visibility/styles — unlike the deterministic runner, which mutates glyph color to a sentinel and restores it). Return raw measurement, never a verdict (`passes` is a mechanical threshold compare, not an SC disposition). **Refuse non-uniform/anti-aliased/translucent surfaces — do NOT report a worst-pixel sweep** (the load-bearing constraint; a pixel-min ratio on a photo/gradient is precise-looking but unsound, and the rubrics explicitly forbid asserting a ratio there). Gate the pixel fallback on the uniformity+opacity check before any luminance read (stops the LLM cherry-picking a flat sub-patch to manufacture a result). Prefer CSSOM; flag `source:'pixel-flat'` vs `'cssom'`. Bounded turns. The 1.4.3 "scan the run over the hero image" and 1.4.11 gradient limbs are dropped — they overlap the deterministic runner that already abstains and reintroduce the rationalization channel.

---

### 4.11 `resolve_part_color` — KEEP-BUT-CONSTRAIN (during-inspection)

**Action / objective return.** Read-only. For an LLM-POINTED sub-element part (a specific border edge, a `::before`/`::after` pseudo, an SVG fill/stroke, the focus outline) at a screenshot point, returns the UA-resolved USED color of that part PLUS the rendered-pixel color sampled at the same point AND a divergence flag: `{part, sourceProperty, usedColorRGBA, renderedPixelRGBA, cssPixelDivergence, ancestorOpacityProduct, textShadow, backgroundCascade[], backgroundSource, isGradient, hasFilterBlendBackdrop}`. No verdict, no ratio. The accessible-name string is not re-emitted.

**Mechanism.** CDP `DOM.getNodeForLocation` at the LLM-supplied point + `CSS.getComputedStyleForNode` (incl. pseudo-element + SVG presentation-attribute styles) + an ancestor flat-tree cascade walk, reusing the exact compositing/cascade logic already in `exp-runners.js` `measureContrast` (`over()`, `elementsFromPoint` base-walk, opacity chain). `renderedPixelRGBA` is read from the already-captured frozen screenshot at that point (no new render).

**SCs served (why):**
- **1.4.11 Non-text Contrast** — the harness has **NO deterministic 1.4.11 runner** (verified: registry only has text-contrast-pixel for 1.4.3), so these elements reach a rubric with no pre-computed part color. WHICH part is the identifying boundary — a 1px input border vs the custom-checkbox `::before` vs an SVG stroke vs the focus ring — cannot be pre-enumerated; only the LLM, seeing the rendered control, can point at it.
- **1.4.1 Use of Color** — when two author-specified text runs differ only by color (link vs body), the LLM must pick WHICH two runs to compare for the G183 lightness test; returns the two used colors as raw values.

**Example invocations.**
- 1.4.11: "I see a thin border around this input; resolve the used color of THAT border edge at this point and the rendered pixel there, and flag if they diverge."
- 1.4.11: "used color of the focus ring visible in the state-after frame at this coordinate, plus the adjacent background it sits on."

**Soundness constraints.** Read-only and non-mutating — **never call `CSS.forcePseudoState`/focus/hover/resize**; focus-ring/hover parts are resolved against coordinates in the harness's already-captured state-after frames, and if a part only exists in an uncaptured state the tool returns `'part-not-in-captured-state'` rather than driving the page. **Always return BOTH the CSS-resolved `usedColorRGBA` AND the `renderedPixelRGBA` at the same point + a divergence flag** — mandatory because the harness's own audit (`exp-runners` V3R4-H1) proved the CSS-resolved color is what produces false clears (white text over a white SVG resolving the black body → false 21:1); a divergence over tolerance must surface as INCONCLUSIVE, never silently resolve to the computed value. **Gated to NON-TEXT parts and named sub-runs the runner did NOT resolve** (for whole-text-element 1.4.3 the bundle already carries `fgColor`/`bgColor`/`ratio`/`uncertainReason` — re-deriving it lets the model second-guess a sound ratio). Raw measurement only (RGBA + cascade + flags; never a ratio/threshold/pass-fail). Bounded (≤3) + each point must lie within the subject bounding box.

---

### 4.12 `compare_named_regions` — MERGE-OR-DROP (during-inspection; the only surviving limb of the proposed eyedropper)

**Action / objective return.** For an image/chart the model can see but whose sub-regions only IT can name, returns an OBJECTIVE color-distinction measurement between two-or-more LLM-named regions: per-region dominant sRGB plus a derived `{deltaE2000, luminanceDelta, perceptiblyDistinct:bool}`. The caller names ≥2 regions in plain spatial terms ("the leftmost bar", "the third slice"); the harness resolves each to a bounded sub-rect and returns the **derived** measure. **NOT a raw-pixel eyedropper, and NOT a contrast-ratio source for text.**

**Mechanism.** Canvas readback over the ALREADY-CAPTURED element-crop / surrounding-region in the frozen bundle (the same pixels the model is shown), bucketed per named sub-rect; deltaE2000 computed in the harness. No new screenshot, no live page, no LLM-chosen viewport coordinates — only LLM-chosen *named* regions, resolved by the harness.

**SCs served (why):**
- **1.1.1 Non-text Content** — when a chart/diagram encodes a distinction by color, only the model (seeing the image) can name which sub-regions to compare; the harness returns whether they are perceptibly distinct, grounding a "color-encoded distinction the alt omits" (F13) without the model inventing the measurement.

**Example invocations.**
- 1.1.1: "compare the leftmost bar and the third bar of this chart — are they perceptibly distinct?"
- 1.1.1: "compare the two legend swatches named 'profit' and 'loss' — return deltaE and distinct."

**Soundness constraints.** Return the DERIVED measurement only (per-region dominant color + deltaE2000 + `perceptiblyDistinct` bool), **never a stream of raw per-pixel RGB** the model narrates into a fabricated number. Read-only and non-mutating (operates over already-captured frozen crops; no new live screenshot). No arbitrary viewport coordinates (the model may only NAME regions; the harness resolves names to bounded sub-rects). **Forbidden as a text-contrast (1.4.3) or non-text-contrast (1.4.11) source** — those are routed to the perceptual rubric that bans numeric ratios from images; a worst-spot ratio, if wanted, must be PREPROCESSED via `verify-finding.js` `worstOverBackground` and handed in the bundle. Bounded turns / one call per obligation.

**Why the rest of the proposed eyedropper was dropped.** The proposed `sample_pixel_color` is mostly PRE-COMPUTABLE and partly aimed at the wrong question: (1) 1.4.3/1.4.11's "worst spot behind text over a gradient" already exists, fully algorithmic, in `scripts/verify-finding.js --pixel-contrast` (lines 136–185) — no LLM coordinate-choice is needed; it was simply never surfaced into the bundle (reclassify-preprocessing: wire `worstOverBackground` as a signal, don't add an interpretation-laden tool). (2) It contradicts a deliberate design decision: `contrast-over-complex-backdrop-v0.md` explicitly forbids numeric ratios from images because the dominant-bucket heuristic is unsound on the very photos/gradients/anti-aliased glyphs the tool claimed to serve. (3) The 1.4.1 justification targets the wrong question — `use-of-color-v0.md` makes 1.4.1 turn on the presence of a SECOND non-color cue, not hue-vs-lightness of two regions, so an eyedropper RGB is non-probative there.

---

### 4.13 `probe_focus_reachability` — RECLASSIFY-PREPROCESSING (narrow during-inspection residue)

**What it is.** Given an LLM-chosen TARGET element (the one it is looking at) and optionally a starting anchor, drives real Tab / Shift+Tab on a FRESH page render and reports `{targetReached, reachedAtIndex|null, direction, stopsBeforeTarget[{index,xpath,role,accName,tabIndex,inAriaHidden,isSameAsPrevious}], landedInAriaHiddenAt|null, wrapped, exhausted, focusableCountSeen}`. Scoped to the target and its enclosing composite — **NOT** a re-emission of the whole-page order (the bundle already has that).

**Why mostly preprocessing.** `scripts/v3/lib/kbd-graph.js` already provides `collectTabOrder()` (full forward AND backward sequence, no fixed cap, wraps on WeakSet revisit / double body-sentinel), `tabOrderFindings()` for 2.4.3 visual-order divergence, and a hardened trap suite (`detectKeyboardTraps`, `detectFocusRetentionTraps`, `detectFocusRejection`). These run up front in `run-instruments.js`, and `focus-order-meaning-v0.md` explicitly tells the judge "you do NOT crawl the page or drive the keyboard... the MECHANICAL facts are settled" and "a focus TRAP is a 2.1.2 concern owned by the trap detector — do not re-adjudicate." So the tool's 2.4.3/1.3.2 framings are pure preprocessing, and its 2.1.2 framing is both redundant AND a soundness regression (the Close-control escape activation is destructive and stays in the offline detector). The 2.4.7 ":focus-visible mode" justification is also handled in preprocessing (`vision-capture.js:222` forces `:focus` + `:focus-visible`). Trusted-vs-synthetic-key is a non-issue: Puppeteer `keyboard.press` already fires `:focus-visible`.

**The genuine residue (2.1.1, 4.1.2).** Confirming that a SPECIFIC element the LLM is staring at (a suspected custom control that may be click-but-not-Tab-reachable) is/isn't in sequential focus, and whether tabbing into a composite lands inside an `aria-hidden` subtree (6cfa84). The choice of WHICH target/subtree depends on what the LLM sees and isn't enumerable up front for every element.

**Soundness constraints.** Read-only (Tab/Shift+Tab only; no Enter/Space/Esc, no Close-control press, no submit, no link follow). Fresh page per invocation (never the live session the LLM has been poking). Raw measurement only (`reachedAtIndex`/`inAriaHidden`/`wrapped` — never a verdict). Bounded + self-terminating (`REACH_SAFETY_CAP` + WeakSet/sentinel wrap termination; ≤3 calls/obligation). Verdict stays shadow; the precomputed `collectTabOrder`/`detectKeyboardTraps` remain the authoritative-candidate keyboard signals. Target must resolve to an element in the precomputed candidate set (else explicit `unresolved`, not `not-reached`).

---

### 4.14 `serialize_region_order` — RECLASSIFY-PREPROCESSING

**What it is.** A read-only slice of the already-collected page transcript: the ordered screen-reader node stream for an LLM-named region/subtree (or the window between two nodes), each step carrying `{reading_order_index, role, level, name, states, text, isGroupBoundary, groupName, domIndex, rect}`, plus layout-table row-major cell expansion with headers. It does **NOT** emit a parallel raw geometric sort and does **NOT** mark divergence.

**Why preprocessing.** Reading order is a STATIC property of the page at load — there is no datum whose *value* depends on what the LLM sees, only WHICH region it wants, and the whole-page ordered transcript is already collected once per page by `vsr-collect.js` `collectVsrTranscript`. The proposed tool is a free slice/lookup over the frozen bundle. The real fix: the bundle ships only a single-element excerpt today (`transcriptByXpath`), so widen that to the ordered neighborhood + structure flags per candidate.

**The unsound half (dropped).** Its headline feature — emit a parallel raw geometric/visual order for the LLM to diff for divergence — duplicates and REGRESSES `order-check.js` (`visualOrderDivergence`), which was deliberately rewritten to be column-aware and container-excluding because a flat geometric rank false-positives on main+sidebar and card-grid layouts, and which quarantines every order finding as uncalibrated triage (`review:true, calibrated:false`). Letting the model run its own naive geometric diff is the mis-calibration hazard; `order-check` owns 1.3.2 divergence.

**Soundness constraints.** Read-only slice/lookup (no fresh VSR run, no DOM/AX re-query, no `getBoundingClientRect` re-read, no mutation). STRIP the parallel geometric-order list and ambiguity marking. Do NOT return a divergence verdict. Objective transcript fields only — no `isRedundantAltText`, no `inSameContext` boolean that pre-judges 2.4.4/1.1.1. Use the SAME realism-corrected names already in the transcript. Verdict shadow. Serves 1.3.1 / 2.4.4 / 1.1.1 as **context** (the linear order + structure), with 2.4.4/1.1.1 neighborhood slices pre-sliceable per candidate up front.

---

### 4.15 `read_dom_facts` — RECLASSIFY-PREPROCESSING (split into bundle enrichment + one narrow live read)

**What it is.** As proposed it is a 6-in-1 omnibus DOM read. Five of its six payloads are fully enumerable per node at collect time with NO LLM choice, so they belong in the FROZEN bundle (extend `collect.json` element facts), not in a tool: image request state / currentSrc / naturalDims / altSource (1.1.1); listener inventory (2.1.1 F54/F42); disabled / inert / operability (1.4.3 exemption); raw codepoints / whitespace (1.3.2 F32); computed visibility (2.4.6 off-screen heading); and the page-level viewport-meta `user-scalable`/`maximum-scale` (1.4.10 b4f0c3).

**Why not a tool.** The collector (`collect.json`, produced by `eval-page.js`) already carries alt/box/required/focusable/contrastSolid but NOT currentSrc, naturalDims, codepoints, listener inventory, computed visibility, or viewport-meta — so the value is real, but the correct fix is to extend the frozen bundle (cheaper, no extra turns, no rationalization surface). The single item with a during-inspection character — live `ValidityState` for 3.3.1 — is MIS-CLASSIFIED as a read: obtaining it requires entering a chosen invalid value, a **mutating submit-invalid action** that belongs to a separate action tool on a fresh page (the framing's own read-only rule forbids it here). The only legitimate live residue is a read-only computed-style/box re-read of one node the LLM just revealed by a transition (2.4.6/1.4.10 reveal cases) where the frozen snapshot is stale — and that presupposes a live-CDP lane that does not exist today (`runAdjudication` is a pure function over frozen artifacts; vision is one up-front load).

**Soundness constraints.** Read-only (never mutate/fire events/focus/scroll/enter values — remove `ValidityState`, delegate to a fresh-page submit-invalid action). Raw measurement only (codepoints/attributes/box verbatim; no "this alt is decorative"). **No operability claim from a listener registry** (it misses inline/delegated/synthetic handlers and can't tell a real handler from a no-op — label it "registered listeners, may be incomplete"; a real 2.1.1 verdict needs an actual key-press action tool). Prefer frozen; a live call is permitted only when the snapshot is demonstrably stale post-transition. Snapshot consistency (record fresh-load vs post-transition). Bounded + named target.

---

## 5. Per-SC view

For each in-scope SC: its uncertainty modes (brief) and the during-inspection tools that most unblock its uncertain verdicts. Tools shown in *italic* are reclassified-to-preprocessing (the need is real but handed over in the bundle).

| SC | Uncertainty modes (brief) | Most-needed during-inspection tools |
|---|---|---|
| **1.1.1 Non-text Content** | name "serves equivalent purpose"; text-in-image legibility (F71); color-encoded info the alt omits (F13); decorative truthfulness + redundancy elsewhere; image request/load state; dynamic alt staleness (F20) | `request_hi_res_crop`, `ocr_image_text`, `compare_named_regions`, `observe_state_after_activation` (carousel), `query_ax_node`; *`serialize_region_order`*, *`read_dom_facts`* |
| **1.3.1 Info & Relationships** | visual-vs-programmatic mismatch; table header association (F90/F91); role/level of a styled element (F2/F43/F92); label/group association; text-description escape hatch; whitespace columns (F33/F34) | `query_ax_node` (coordinate path); *`serialize_region_order`*, *`render_with_overrides`* (CSS-off, region-targeted) |
| **1.3.2 Meaningful Sequence** | visual-vs-DOM order divergence (F1/C27); CSS reordering; layout-table linearization (F49); whitespace spacing (F32/F33/F34); tabindex re-sequence | *`order-check` (preprocessing — owns divergence)*, *`serialize_region_order`* (linear order context), *`read_dom_facts`* (raw codepoints) |
| **1.4.1 Use of Color** | hue-vs-lightness ambiguity; neighbor-contrast pair not in bundle (G183); resting vs interactive cue (F73); required/error cue needs submit (F81); image color-coding | `render_with_overrides` (grayscale/CVD), `compute_contrast_ratio` (G183 pair), `resolve_part_color`, `set_state_and_capture`, `observe_state_after_activation` (submit) |
| **1.4.3 Contrast (Minimum)** | non-uniform background worst-pixel; computed-vs-rendered divergence; transparent bg cascade (F24); state-only text; exemptions; large-text threshold | `set_state_and_capture` (reveal state-only text); contrast worst-pixel is **preprocessing** (`verify-finding.js worstOverBackground`); flat pairs via `compute_contrast_ratio` |
| **1.4.5 Images of Text** | is-it-even-an-image-of-text; essential exception; customizable; also-as-text; can-CSS-achieve-it; switch control (C30) | `render_with_overrides` (font-size override: box-delta), `request_hi_res_crop`, `ocr_image_text`, `observe_state_after_activation` (switch) |
| **1.4.10 Reflow** | does content overflow at 320px; excepted-2D culprit; content disappears (F102); carousel panels (G225); zoom path; long strings (C33) | `observe_state_after_activation` (F102 reveal), `measure_geometry_live` (non-320 width / sub-element); 320px overflow+culprit is **preprocessing** |
| **1.4.11 Non-text Contrast** | which colors are adjacent; computed vs rendered; which cue identifies the control; state-specific indicators; focus geometry; gradient least-contrast; inactive/essential exemptions | `resolve_part_color`, `set_state_and_capture` (checked/selected/open states), `compute_contrast_ratio` (flat pairs only); focus geometry is **preprocessing** (`focusSpatialVerdict`) |
| **1.4.13 Content on Hover or Focus** | dismissible (trigger-then-Esc); hoverable (F95); persistent; obscure-vs-dismiss; focus-parity; UA-tooltip exemption | `measure_geometry_live` (occlusion + gap), `observe_state_after_activation` (Esc/wait/slide), `probe_screen_reader_after_action` |
| **2.1.1 Keyboard** | reachability vs focusable; operability not just focus; mouse-only handler (F54); focus stealing (F55); path-dependent exception; iframe tab order | `probe_focus_reachability` (residue); operability needs a key-press action; clearing is withdrawn at the registry; *`read_dom_facts`* (listener inventory) |
| **2.1.2 No Keyboard Trap** | trap is a property of a sequence; benign cycle vs trap; documented non-standard exit; focus invisible in screenshot; reverse-direction trap; plug-in/iframe | **Owned by the offline trap detector** (`detectKeyboardTraps`, calibration-bound; the Close-control escape is destructive and must NOT be an LLM tool) |
| **2.4.2 Page Titled** | descriptiveness vs page topic (c4a8a4); templated duplicate (F25/G88); SPA dynamic title; placeholder defaults; first/effective title | `observe_state_after_activation` (SPA view switch → re-read title); duplicate/uniqueness enumeration is **preprocessing**; `get_live_document_title` is **preprocessing** |
| **2.4.3 Focus Order** | full tab sequence not in bundle; visual-vs-tab order; dialog/menu focus mgmt (F85); double-focus stops; trap/dead-end; focus visibility | The ordered tab sequence is **preprocessing** (`collectTabOrder`); `activate_trigger_and_track_focus` / `dismiss_widget_and_track_return_focus` (F85) via `observe_state_after_activation`; `measure_geometry_live` (visually-identified stop box) |
| **2.4.4 Link Purpose (In Context)** | destination unknown; programmatic vs visual context (F63); identical-name divergence (fd3a94); image-only accname (F89); new-window warning | `resolve_destination`, `query_ax_node` (accname provenance); *`serialize_region_order`* (programmatic context) |
| **2.4.6 Headings & Labels** | described content not in crop (b49b2e); first-perceivable / flat-tree target; off-screen context flips verdict (cc0f0a); descriptiveness is relational; icon-as-label | *`read_dom_facts`* (visibility of an off-screen heading); `observe_state_after_activation` (reveal then re-read); enumerate peer headings/labels is **preprocessing** |
| **2.4.7 Focus Appearance** | indicator anywhere in viewport (oj04fd); JPEG/anti-alias noise; F55 non-persistence; F78 always-on outline; keyboard vs CDP focus mode; forced-colors; focus-order membership | Forced-colors recheck is **preprocessing**; focus pixel-diff + geometry are **preprocessing** (`focusSpatialVerdict`); reachability via `probe_focus_reachability` |
| **2.4.10 Section Headings** | page-level scope vs element crop; visual-section-without-heading (F2/H69); incomplete heading enumeration; off-screen/dynamic sections; role/level ambiguity | `observe_state_after_activation` (reveal dynamic sections → re-enumerate), `query_ax_node` (classify a leading line); heading outline + section inventory are **preprocessing** |
| **3.3.1 Error Identification** | error doesn't exist until provoked; per-field invalid value; validation timing; message visibility (36b590); reaches AT; field-message association; re-validation; data re-display | The invalid-submit pair is a **pre-driven STATE_TRANSITION**; `probe_screen_reader_after_action` (post-submit announcement); `read_field_constraints` is **preprocessing** |
| **3.3.2 Labels or Instructions** | visible-vs-programmatic; out-of-crop label; on-focus-only instruction; grouped fields (F82); format/required cue; placeholder-as-label; change-of-context (G13) | `set_state_and_capture` (focus-only instruction, placeholder persistence), `observe_state_after_activation` (G13 context change); label-source provenance via `query_ax_node`; locate-required-indicator is **preprocessing** |
| **3.3.3 Error Suggestion** | which invalidity kind; 3.3.1-vs-3.3.3 conflation; suggestion revealed only after interaction; correction possible/known; programmatically conveyed; off-screen | `observe_state_after_activation` (probe a recoverable near-miss on a fresh page), `probe_screen_reader_after_action` (suggestion announced post-submit); `list_allowed_values` is **preprocessing** |
| **4.1.2 Name, Role, Value** | value/state staleness after operation (F20); role-vs-appearance (F59/F42); name-vs-visible-label (F111); focus-state notification (F79); runtime-only roles; broken IDREF (F68); aria-hidden focusable (6cfa84) | `query_ax_node` (provenance, required states, IDREF resolve), `observe_state_after_activation` (operate → state changed?), `probe_focus_reachability` (6cfa84); the static announced name/role/value is **preprocessing** (full transcript) |
| **4.1.3 Status Messages** | did the SR actually announce; is it a status at all; did focus move; container present before injection; insertion-only blind spot; atomicity; removal-of-status; which trigger | `probe_screen_reader_after_action` (the decisive post-action announcement), `observe_state_after_activation` (insertion-only gap: `visibilityCause`/`inLiveRegion`/`focusMovedToChange`); the deterministic sweep result is **preprocessing** |

---

## 6. Preprocessing vs interactive split

The audit's strongest recurring correction: **do not build a tool where a handed fact suffices.** A need is *interactive* only if the decision of *what datum to gather* depends on what the LLM sees mid-reasoning.

### Better served BEFORE inspection (preprocessing)

| Need | SC(s) | Already in the harness? |
|---|---|---|
| Full forward+backward **tab order** + visual-order divergence + trap suite | 2.4.3, 1.3.2, 2.1.1, 2.1.2 | **Yes** — `kbd-graph.js` `collectTabOrder`/`tabOrderFindings` + `detectKeyboardTraps`/`detectFocusRetentionTraps`/`detectFocusRejection`, run up front in `run-instruments.js` |
| Ordered **SR transcript** + structure flags (role/level/name/states/boundary) | 1.3.1, 2.4.4, 1.1.1, 4.1.2 | **Partly** — one full forward pass exists (`vsr-collect.js`); bundle ships only a single-element excerpt — **widen it** |
| **Worst-pixel contrast** over a gradient/background-image | 1.4.3 | **Built but not surfaced** — `verify-finding.js --pixel-contrast` (lines 136–185) `worstOverBackground`; wire it as a signal |
| **Focus-indicator** pixel-diff + geometry (area/thickness/bbox/ring-fill) | 2.4.7, 1.4.11 | **Yes** — `focusSpatialVerdict` in `a11y-eval.js:221-241` |
| **Target-size** geometry (box + 24px neighbor) | 2.5.8 | **Yes** — `evalTargetSize` in `a11y-eval.js:75` |
| 320px **overflow + culprit + role** | 1.4.10 | **Yes** — handed to `reflow-no-hscroll-v0.md`; viewport-320 captured |
| **Forced-colors** whole-page re-render | 2.4.7, 1.4.1 | **No** — missing today; **add** as a preprocessing sibling (no per-element choice) |
| Image **request state / currentSrc / naturalDims / altSource**; listener inventory; disabled/inert; raw codepoints; computed visibility; viewport-meta | 1.1.1, 2.1.1, 1.4.3, 1.3.2, 2.4.6, 1.4.10 | **No** — `collect.json` lacks these; **extend** the element-fact schema (`eval-page.js`) |
| AX node provenance (`nameFrom`/IDREF resolve/required states) for the **selected subject** node | 4.1.2, 2.4.4, 1.3.1 | **Partly** — `cdpAxName` in the excerpt; fold the rest into the bundle |
| Invalid-submit before/after **state pair** | 3.3.1, 3.3.3 | **Yes** — pre-driven, reload-isolated STATE_TRANSITION in `vision-capture.js`; rubric abstains if absent |

### Genuinely interactive (the LLM's mid-reasoning choice is irreducible)

- **Which control to activate** and observe the objective delta — `observe_state_after_activation` (4.1.3 insertion-only gap, 2.4.10 / 2.4.2 / 1.4.10 reveal, 1.1.1 carousel).
- **Which pixel/node to resolve** when the deterministic candidate set never selected it — `query_ax_node` (1.3.1 styled-`<p>`-vs-heading), `probe_focus_reachability` (is THIS element in the Tab ring; 6cfa84).
- **Which state to drive a control into** that the frozen transition table never captured — `set_state_and_capture` (1.4.11 checked/selected/open, 1.4.3 placeholder/expanded text).
- **Where to look after a transform** — `render_with_overrides` (1.4.1 which of N color cues is load-bearing; 1.4.5 which glyph cluster is baked).
- **Whether the SR voices an announcement after a chosen action** — `probe_screen_reader_after_action` (4.1.3; post-submit slice of 3.3.1/3.3.3).
- **Which geometry to measure in a state that only exists after interaction** — `measure_geometry_live` (1.4.13 popup occlusion + gap).
- **Which sibling links to follow and compare** — `resolve_destination` (2.4.4 fd3a94).
- **Which compressed sub-region to re-raster or transcribe** — `request_hi_res_crop`, `ocr_image_text` (1.1.1, 1.4.5).
- **Which color pair / which image sub-regions to compare** — `compute_contrast_ratio` (1.4.1 G183), `resolve_part_color` (1.4.11 non-text part), `compare_named_regions` (1.1.1 F13).

---

## 7. Implementation note + roadmap

### Minimal architecture change

The lane is single-shot today. `makeRunAgent` (`llm-agent-adapter.js:55-64`) issues one user message with **no** Anthropic `tools` param; `runAdjudication` is a pure function over frozen artifacts; vision is captured in one up-front page load by `captureVisionForUrl` (`vision-capture.js`). To equip the judge:

1. **Add Anthropic `tools` + a multi-turn `tool_use`/`tool_result` loop** in the agent adapter (per the `claude-api` skill's tool-use reference), bounded by max turns, dropping any malformed agent reply (matching the existing `runAdjudication`/`runRubricJudgments` drop-malformed pattern).
2. **Thread the live browser/CDP page** (and a fresh-clone factory for mutating actions) into the agent call, so tools run client-side via CDP while Claude only chooses *which* tool and *what* target.
3. **Thread the VSR instrument** (Guidepup, already in `node_modules`) for the post-action announcement queue, on fresh clones.
4. **Keep the authority cap unchanged** — every tool-assisted verdict is still `source:'llm'`, capped at `canary` (`authority.js`), filled only as a PROVISIONAL row, never reconciled, gold-scored before any promotion.

Preprocessing items (§6) do **not** need the loop and should ship first — they are cheaper, carry no rationalization surface, and several are already built but unsurfaced.

### Priority order (SC-coverage × soundness)

Pick the first build by what unblocks the most uncertain verdicts with the least rationalization risk and the least new machinery.

**Tier 0 — preprocessing, no tool loop (do these first):**
- Wire `worstOverBackground` into the contrast signal (1.4.3).
- Widen the VSR excerpt to the ordered neighborhood + structure flags (1.3.1, 2.4.4, 1.1.1, 4.1.2).
- Extend `collect.json` element facts (image state, listeners, disabled/inert, codepoints, visibility, viewport-meta).
- Add the forced-colors whole-page re-render (2.4.7, 1.4.1).
- Fold AX provenance for the selected subject node into the bundle (4.1.2, 2.4.4).

**Tier 1 — build the tool loop, then these 3–4 (highest coverage × soundness):**
1. **`observe_state_after_activation`** — widest SC reach (4.1.3, 2.4.10, 2.4.2, 1.4.10, 1.1.1), directly fills the documented `insertion-only` 4.1.3 gap, and is fully bounded (one activation, fresh page, raw delta).
2. **`query_ax_node`** — unblocks the structural-mismatch core (1.3.1, 4.1.2, 2.4.4) on the coordinate path the candidate generator never reaches; read-only, low risk, reuses shipped CDP plumbing.
3. **`probe_screen_reader_after_action`** — the single decisive 4.1.3 datum (did the SR voice it) with the cleanest soundness story (harness owns the AT/settle window; fresh clone; raw queue).
4. **`set_state_and_capture`** — unblocks 1.4.11 (no deterministic runner exists) and the state-only-text limbs of 1.4.1/1.4.3, reusing the existing state bridge with `stateReached`/`textVisible` fail-closed.

**Tier 2 — narrower or higher-cost-to-build:** `render_with_overrides` (only pays off for 1.4.1's where-to-sample), `measure_geometry_live` (1.4.13), `resolve_destination` (2.4.4 same-origin, with the "equivalent" field killed), `request_hi_res_crop` / `ocr_image_text` (1.1.1/1.4.5 legibility sharpeners), `compute_contrast_ratio` / `resolve_part_color` / `compare_named_regions` (the constrained eyedropper trio — strictly flat/opaque or derived deltaE, refusing the unsound worst-pixel cases).

**Do NOT build as LLM-driven tools:** the keyboard-trap escape test (destructive; owned by the offline `detectKeyboardTraps`), the geometric-order divergence diff (owned by the calibrated `order-check`), and any worst-pixel contrast ratio over a non-uniform surface (deliberately routed to the perceptual rubrics).
