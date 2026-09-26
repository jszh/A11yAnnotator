# Expert-study false positives: root cause and harness improvement plan (2026-09-25)

**Scope.** Every case in the P2–P5 expert study (study state `2026-09-09T0917Z`, the latest labels) where at least one expert rated the harness finding a false positive: **50 cases, 68 FP responses**. The scored run is `saved-elements-stratified774-gemini37-flash-high-20260820-combined-repaired`. `scripts/v3` has had only minor changes since then (410f7d8f, 5add266e, 86d6b4fb), and none touch the mechanisms below, so every cause here still applies to HEAD `fe5ffbb6`.

**Method.** For each case I joined the archived judgment, ledger row, checker/instrument record and LLM trace (per-case dossiers). I then reloaded the saved page through the study server with the study's query (`offline`, `noscript`) and inspected it myself: CDP accessibility node and name sources, composed shadow tree, computed style, real Tab/Shift-Tab/arrow keys, real pointer hover and click with navigation blocked, a 640px viewport for the zoom cases, composited pixel sampling, and axe re-runs. Every harness mechanism named below was confirmed in source. The Sept 15 audit's evidence was **not** reused as a verdict. Where I disagree with it, the table says so.

Scratch evidence (probe scripts, screenshots, per-case JSON) is in the session scratchpad. The reproducing scripts are small and are described inline where they matter.

## Verdicts

| Verdict | Cases | FP responses | Meaning |
|---|---:|---:|---|
| **Harness FP**: the barrier does not exist on the tested page | 27 | 43 | A harness defect to fix |
| **Harness should have abstained** | 4 | 4 | The widget is inert in the saved page for pointer *and* keyboard users |
| **Harness right**: the expert FP vote is a labelling miss | 11 | 12 | A real defect exists on the element (2 with the wrong stated rationale) |
| **Interpretation / unresolved** | 8 | 9 | Depends on a normative threshold or on the SC it is filed under |
| **Total** | **50** | **68** | |

So about **63% of FP responses (43/68) are real harness FPs**. About 18% are expert misses, and the rest are abstention or interpretation cases.

The expert labels also err in the other direction: **15 expert TP votes** endorse findings I judge to be harness FPs or unsupported barriers (P2: C063, C131, C181, C202, C222, C253, C255; P5: C635, C639, C658, C667, C675, C680, C683, C709). The expert ground truth is noisy in both directions. The paper's precision figure is therefore not simply too low; a label-quality caveat applies to it as a whole.

### Where I differ from the 2026-09-15 audit

- **C649 (Newegg bell): harness right, not an FP.** A real pointer click opens the notifications panel (`display:none → block`). Forty Tab presses never reach it, the parent `div` has an `onclick` handler, and it has no role and no tabindex. It is a mouse-only control with no role, which is a genuine 4.1.2/2.1.1 barrier. The harness flagged it for a prohibited `aria-label`, which is the wrong reason for the right answer.
- **C631 (ESPN): a reproduced capture artifact, not an unknown historical state.** See §3.1.
- **C164/C203/C635 (Rotten Tomatoes): mechanism reproduced.** With image requests aborted, axe reports 31 unnamed poster-tile links, including these three. With images loaded they pass. See §4.
- **C063/C131/C255/C680:** reclassified from "state-dependent" to "harness should have abstained". The harness has enough information to know this.
- **C675:** reclassified from unresolved to an SC-applicability FP (a dialog opening is not a status message).
- **C686/C699:** the nested focus stops are real (23 and 13 consecutive nested stops in a real Tab walk), but filing them under 2.4.3 is debatable, so I moved them from "upheld" to "interpretation".

## Root causes of the 27 real FPs (+4 abstentions)

### 1. ARIA authoring validity is promoted to a WCAG 4.1.2 barrier (7 cases, largest single cause)

**C202, C212, C221, C265, C268, C639, C667.** Each is `aria-label` on a generic element that is not a UI component, and no information is lost. Examples:

- C265/C268: a tick icon beside visible "Verified buyer" text.
- C202: a Visa `span` wrapping `<img alt="Visa">`.
- C221: `aria-label="About"` on a div whose text is "About".
- C639: a count inside `ul[role=button]`. That button is named "Emoji Reactions", and its children are presentational anyway.

The promotion happens on two routes:

- [build-v3.js:350](../../scripts/v3/lib/build-v3.js#L350): `AXE_VALIDITY_NONBARRIER` omits `aria-prohibited-attr`, so the axe finding becomes a PROVISIONAL 4.1.2 barrier.
- [accessible-name-adequacy-v0.md:78-90](../../scripts/v3/llm-rubrics/accessible-name-adequacy-v0.md#L78-L90) tells the judge to report REPRODUCED "regardless of whether the name text reads well".

ACT's own rule page contradicts this mapping. For 5c01ea and kb1m8s, WCAG 4.1.2 is a **secondary** requirement: "This success criterion is less strict than this rule… Some of the failed examples satisfy this success criterion."

**Counterexample to keep:** C649 must stay a barrier, but because it is an interactive control with no role, not because of the attribute.

### 2. Deterministic collector and instrument proxies (10 cases)

| Cases | Defect (confirmed in code and live) | Location |
|---|---|---|
| C213, C222 | `enclosingBlockText` clones each ancestor block and **removes every link** before reading its text. On BuzzFeed the article title is itself a link in the same list item, so the disambiguating context is deleted. C213's context became "In the News 48 mins ago React 👍❤️…" with no title. The judge then trusted the signal, as the rubric instructs. Nested-list context (H81) is otherwise handled correctly. | [act-page-collect.js:631-641](../../scripts/v3/lib/act-page-collect.js#L631-L641) |
| C229, C237 | The colour-peer group's "non-colour axes" are font weight, style, decoration, font-size, border style and markers. **Box geometry is missing.** Zillow's active dot is 8×8 and the inactive dots are 6×6 or 4×4, yet the group is reported as colour-only and anchored on the active dot. The inactive-dot judges saw the size cue and cleared; the anchor judge was told there was none. | [collect-colour-peers.js:156-179](../../scripts/v3/lib/collect-colour-peers.js#L156-L179) |
| C248, C709, C683 | The zoom-clip probe accepts any descendant text node that isn't `display:none`, `visibility:hidden` or aria-hidden. Every "clipped" string here sits inside a `clip: rect(0\|1px)` sr-only span ("Previous photo", "EN \| EUR"). C683 also hits a guard bug: the target is 1×8px and the guard requires **both** dimensions to be under 4px (`&&`). Nothing visible is clipped at 640px. | [exp-runners.js:2665-2700](../../scripts/v3/lib/exp-runners.js#L2665-L2700) |
| C253 | The iframe escape budget is `innerFocusables + 3`, and `innerFocusables` counts only the immediate frame document. The Zillow ad nests iframes, and frame bodies are tab stops too. A real Tab walk leaves on the **9th** press, so the budget is too small and the result is read as a trap. | [kbd-graph.js:1789](../../scripts/v3/lib/kbd-graph.js#L1789), [:1869](../../scripts/v3/lib/kbd-graph.js#L1869) |
| C223 | "Flagged at rest": the peer-appearance baseline compares a clip-hidden 1×1 file input against 668×54 text fields, and the border difference is read as an error marker. The form is pristine, with no error displayed. | [collect-error-summary.js:383-404](../../scripts/v3/lib/collect-error-summary.js#L383-L404) |
| C620 | axe `object-alt` is promoted for a 1×1px offscreen `application/x-shockwave-flash` capability-test object. ACT's object rule applies only to image, audio and video objects. | build-v3 axe promotion |

### 3. Evidence did not show the rendered target (3 FPs + 2 wrong rationales)

1. **C631: the screenshot mode changes the page.** Harness crops call `page.screenshot({clip})`, and Puppeteer 24 defaults `captureBeyondViewport: true`, which resizes the viewport to the whole document. On ESPN that renders the content washed out. The same clip taken with `captureBeyondViewport:false` is crisp dark-on-white. The "extremely faint grey text" was a capture artifact.
   - A 56-page sweep comparing the same viewport-region clip in both modes found that ESPN differs in 37% of sampled pixels (against 1.7% frame-to-frame noise).
   - Rubric, GrazeMate and Nordstrom show smaller real differences.
   - Many other pages differ mainly because of running animations, a separate instability.
   - C642, on the same page, also got a washed-out crop. Its verdict survives only because the 11px metadata really is 2.44:1.
2. **C181: the focus crop is the element's own box plus 16px.** The Amazon link's box is 16px tall inside a 200px image card. Real Tab focus paints a 2px grey ring around the whole card (verified), and the crop, a band through the middle, misses it. See [vision-capture.js:582-585](../../scripts/v3/lib/vision-capture.js#L582-L585).
3. **C226: raster-text ownership and an unloaded image.** The Reebok image fails to load offline (`naturalWidth 0`), and "RUNNING" is an HTML `<p><span>` painted over the image box. The raw JPEG is a photo with no text. The judge attributed the overlay text to a broken image.
4. **C646 (interpretation, wrong evidence):** the rationale compares yellow against raw white and ignores the inactive bullets' `opacity: 0.2`. The composited ratios run from 2.6:1 to 8.4:1 (the target bullet is 8.4:1).

### 4. Checker findings promoted from a transient page state (5 cases)

- **C164, C203, C635:** each Rotten Tomatoes poster link gets its name only from the slotted `rt-img` alt. When the image errors, `rt-img` falls back without alt. Aborting image requests reproduces the archived result exactly: 31 poster-tile `link-name` violations, including these three. With images loaded they pass, even at 20× CPU throttling.
  - The campaign ran 64 pages and 16 browsers concurrently, so failed asset loads under load is the plausible cause. The harness records nothing about failed resources.
- **C272, C275 (Gymshark "Women"/"Men"):** axe passes today in every configuration I tried: scripts on and off, the same 1280×900 viewport, no aria-hidden ancestor, no open modal. The archived violation cannot be reproduced, and the cause is undetermined.
- **Also observed:** on the same page, one axe shadow target (`poster-tile[media-url=/m/project_hail_mary]`) was joined to a **header dropdown link** xpath. This is a wrong-element join in the axe-target→xpath resolution for shadow targets. It doesn't cause any of the 50 cases, but it can create FPs.

### 5. Shadow-DOM identity and SC applicability (2 cases)

- **C658:** `play-button` has an open shadow root containing a focusable native `<button>`. The judged claim ("no interactive role or keyboard focusability", under 1.3.1) is false. The real defect is that the inner button's name is **empty**, because the `aria-label` sits on the host. That is a 4.1.2 name defect, the same host-label pattern as C765, where the harness is correct.
- **C675:** the status detector fired on the heading of an Osano **cookie-preferences dialog** opened by an unnamed control. A dialog appearing is not a 4.1.3 status message (success/result, waiting, progress, errors). A dialog that doesn't take focus is a focus-management question.

### 6. Keyboard judgments on inert scripted widgets (4 cases; should abstain)

**C063, C131** (Zillow, served `noscript=1`), **C255** (Microsoft) and **C680** (Macy's): these are inactive `role=tab` elements with `tabindex=-1`. ArrowRight never moves focus, but pointer clicks don't select them either:

- The Zillow dots pass the click through to the property-card link.
- Microsoft's tab is a link to a `#tab-for-business` URL.
- On Macy's, focus moves but `aria-selected` never changes.

The widget is dead for everyone in the saved page, so no keyboard-specific loss is shown. The agent inferred a 2.1.1 barrier from `tabindex=-1` plus failed arrow keys. The harness already knows `spec.noscript`.

## Cases where the harness was right (expert labelling misses)

| Case | What is actually there |
|---|---|
| **C615** (P4 **and** P5 FP) | The icon visibly reads "WM" (Wealth Management), but the link's accessible name is **"68"**, from `alt="68"`. |
| C663, C668 | Company-card links wrapping an `<article>`. Chromium computes an **empty** name. |
| C765 | The shadow `<a href="/search">` is unnamed; `aria-label="Submit search"` is on the host and doesn't reach it. |
| C269 | The Reddit highlight card never hydrates its title slot in the saved page, so the link is unnamed in the tested state. |
| C163, C242 | Macy's visible label begins with the brand ("London Fog", "Michael Kors"), and the name omits it. A 2.5.3 failure. |
| C649 | A mouse-only notification control with no role (see above). The harness gave the wrong reason. |
| C642 | Metadata "6d • Bill Barnwell" is 2.44:1 at 11px. The harness's "whole card faint" rationale came from the washed-out capture. |
| C263 | The poster image is `src=none` in the saved page, so the link is unnamed in the tested state. |
| C657 | Posts are painted on top of each other and are illegible. The defect is real, but filing it under 1.4.3 is debatable. |

**Interpretation (8):** C207 (template title "Amazon.com: Keep shopping for"; both experts said FP, and I lean FP), C843 ("Read The Post" with only `article`/`section` ancestors), C153 (a promo flag as the "label" of an image link; the harness misquoted it as "Sale"), C647 (fade-out truncation), C646 (above), C654 (a generic carousel section with a broken `aria-labelledby`), and C686/C699 (real nested stops; is a duplicate stop a 2.4.3 failure?).

## Main problems, ranked by FPs removed per unit of risk

1. **Conformance-vs-barrier conflation:** ARIA legality mapped to WCAG (7), plus SC misapplication (C675, C658's claim). This is the largest bucket, and the cause is a single policy.
2. **Proxy measurements that don't check what is rendered:** zoom, colour-peer, error-proxy, frame budget, object promotion (9). These are all deterministic, cheap to fix, and each has a live counterexample.
3. **Evidence capture fidelity:** screenshot mode, focus-crop geometry, image load state and text ownership (3 FPs, 2 wrong rationales). Because this affects every vision judgment, its blast radius goes beyond these cases.
4. **Unverified transient state reaching publication:** checker findings from failed asset loads (5), and keyboard judgments on inert scripts (4).
5. **A collector bug hidden by an over-trusting rubric:** `enclosingBlockText` strips sibling links (2). The rubric correctly tells the judge to trust the signal, so the collector has to be right.

The main problems are **not** model misreading of adequate evidence. Of the 27 real FPs, at most C646 and C226 involve the model going beyond its evidence. Every other one traces to a deterministic rule, collector, capture or promotion decision.

## Harness improvement plan

Each item names its counterexamples (cases that must flip) and guards (cases that must not). Gate policy follows CLAUDE.md: items touching shared collectors, instruments or build-v3 are deterministic pipeline changes and need the **ACT 581 gate once at the batch boundary**. Rubric-text items need a fixed-evidence judge replay plus a targeted LLM slice. No item here requires re-running the full paid campaign.

### Batch A: deterministic proxies (one batch, then the 581 gate)

| # | Change | Must flip | Must not flip / guard |
|---|---|---|---|
| A1 | Zoom probe: a text node counts only if **its own rendered box** is perceivable. Walk ancestors up to the target and exclude `clip: rect(0…)`/`clip-path: inset(50%)`, boxes ≤1px on either axis, and the standard sr-only signature. Fix the guard to `clientWidth < 4 \|\| clientHeight < 4`. | C248, C709, C683 | ACT 59br37 zoom-clip fixtures (Round 2: 197/197) |
| A2 | Colour-peer axes: add the rendered box (w×h rounded to px), `border-radius`, a `transform` scale and the outline/box-shadow signature. Any difference means "non-colour cue present". | C229, C237 | 1.4.1 ACT and act-augmented colour-only fixtures (equal-size peers) |
| A3 | Frame escape: replace the count budget with **cycle detection**. Record the deep active-element path at each press; it is a trap only when focus revisits an inner stop without ever leaving. Keep a hard cap (e.g. 200) as abstain, not trap. | C253 | ACT a1b64e trap fixtures, DHS trap pages |
| A4 | Error proxy: exclude non-rendered controls (≤1px, clipped, `display:none`) from the appearance baseline. Compare only like field types. A pristine `:invalid` state is not "flagged". | C223 | 3.3.1 at-rest server-error fixtures (842aad09 cases) |
| A5 | `enclosingBlockText`: remove only the **target** link's own text, keeping other links' text in the block. Record `contextLinkText` separately so the rubric can see which parts came from sibling links. | C213, C222 | ACT/TT 2.4.4 "EPUB/PDF" format-link lists (sibling format words must not resolve purpose; rely on the rubric's specificity test) |
| A6 | axe `object-alt` promotion: require ACT applicability (image/audio/video MIME) and a rendered box of at least 2×2px on screen. | C620 | ACT 8fc3b6 cases |
| A7 | Status detector: exclude new text inside `role=dialog/alertdialog`, or inside the element whose `aria-expanded` the activation toggled. Route "dialog opened, focus did not move" to a 2.4.3 hint instead. | C675 | ACT 4.1.3 fixtures and the fedaabb8 status lane |

### Batch B: conformance vs barrier (policy change; needs your decision, see below)

- **B1.** Add `aria-prohibited-attr` to the non-barrier set **for WCAG publication**, and record it as an **ARIA-conformance finding** carrying its ACT rule id.
  - Promote it to a 4.1.2 barrier only when the element is a UI component (interactive role, focusable, or has pointer handlers), **or** when the ignored attribute is the only carrier of non-text meaning (an icon with no text alternative and no visible text).
  - Must flip: C202, C212, C221, C265, C268, C639, C667.
  - Must stay a barrier: C649, since it is a component with a handler and no role.
  - **ACT impact:** kb1m8s has 5 failed cases and 5c01ea has 2. They must still be scored "failed" through the ARIA-conformance lane, so the ACT scorer needs to read that lane for these rule ids. Run the full 581 gate.
- **B2.** Rewrite [accessible-name-adequacy-v0.md:78-90](../../scripts/v3/llm-rubrics/accessible-name-adequacy-v0.md#L78-L90) so an illegal attribute alone is not REPRODUCED. The judge must state what information an AT user loses. Validate with a fixed-evidence replay on the 7+1 cases plus the ACT slice.

### Batch C: evidence capture (vision-capture; shared, so 581 gate + LLM slice)

- **C1.** Pass `captureBeyondViewport: false` for every crop of an element already scrolled into view, and add a two-shot stability check (N ms apart; if the frames differ, mark `unstable-frame` and re-settle or abstain). Must flip: C631. Guard: rerun the 1.4.3/1.4.11 vision fixtures.
  - Also note that `cdp-tools.js:1339/1396` pass `true` explicitly for below-fold elements. Keep that behaviour, but scroll and use `false` where possible.
- **C2.** Focus crop: use the **ink box** (the union of the element and its descendants' boxes, expanded by outline width + offset + box-shadow spread) rather than the element's own box. Must flip: C181. Guard: 2.4.7 fixtures with no focus indicator.
- **C3.** Image evidence: before any 1.1.1/1.4.5 image judgment, record `complete && naturalWidth > 0`. If the image is not loaded, return PARTIAL with `asset-unloaded`. Pass an `overlayText` list (HTML text nodes whose boxes overlap the image) and tell the rubric that this text is **not** in the raster. Must flip: C226.

### Batch D: state verification before publication

- **D1.** Collection records failed subresources (`requestfailed` or image `error`) per page. Before promoting a checker violation, re-run axe on just the promoted nodes after images settle (`img.complete` everywhere in the subtree, or a bounded wait). If the rule no longer fires, keep it as a shadow signal only. Must flip: C164, C203, C635, and probably C272/C275. Guard: C263 and C765, whose empty names are real in the settled state.
- **D2.** Fix the axe-target→xpath join for shadow targets: resolve the full composed-selector chain and reject a match whose final element isn't the one axe named (the `project_hail_mary` mis-join).
- **D3.** Keyboard operability on scripted widgets: when `spec.noscript` is set, or when **pointer activation also produces no state change**, return PARTIAL with `widget-inert`. Report a barrier only on a demonstrated pointer-vs-keyboard asymmetry. Must flip: C063, C131, C255, C680. Guard: real 2.1.1 fixtures where the pointer works and the keyboard doesn't.
- **D4.** Control semantics: resolve the **composed** interactive descendant (open shadow root → native button/link) before judging role or focus, and judge the name on that inner node. C658 flips from a wrong 1.3.1 claim to a correct 4.1.2 empty-name finding. C765 should stay unchanged.

### Validation

1. Per item, run a targeted deterministic recheck on the saved pages for the must-flip and guard cases. This is free; `run-sampled-elements.js` accepts a selection file.
2. For B2 and C3, which change rubric text or evidence: run a fixed-evidence replay (`eval/checker-comparison/fp-experiments/`), then an LLM slice limited to the affected cases on the stratified-774 pages.
3. Run the ACT 581 gate once per batch (A, B, C, D), row-diffed against the current reference. Every delta needs a row-level justification.
4. Finally, rerun the stratified-774 campaign for the affected pages only and recompute the expert-study table. Report it against the ±3 FP noise band, and report the 11 label-miss cases separately rather than silently re-scoring them.

### Decisions needed from you

1. **Batch B policy:** should the published harness column (and paper precision) count ARIA-conformance findings as WCAG barriers? I recommend no, as ACT's secondary-requirement mapping supports. It is the biggest precision lever, but it changes what "harness flagged" means.
2. **The 11 expert misses and 15 expert TP votes on harness FPs:** re-adjudicate them with a third expert pass, or report them as a label-noise caveat? Either way, the original responses stay unaltered.
3. **SC attribution for overlap (C657) and nested stops (C686/C699):** keep them under 1.4.3/2.4.3, or re-route them to 1.4.8/1.3.1 and 4.1.2 (`nested-interactive`)?

## Implementation (2026-09-25, uncommitted on `round3-llm-evidence-lane` over `fe5ffbb6`)

Decision 1 was taken as recommended: ARIA-legality findings stay visible (checker signal, and the deterministic kb1m8s lane the ACT scorer reads is untouched) but publish as a 4.1.2 barrier only on a UI component. Decisions 2 and 3 (label re-adjudication, SC routing) are not harness code and were not acted on.

Each fix was checked on the real saved page(s) that produced the FP, and pinned by a fixture test with a counterexample that must stay a barrier: `tests/runners/expert-fp-2026-09-25.test.js`, `tests/checkers/expert-fp-axe-gate.test.js`, `tests/llm/expert-fp-image-provenance.test.js`.

| Item | Change | Verified on the real page |
|---|---|---|
| A1 | `runZoomClipProbe`: text inside a visually-hidden box (clip ≤1px, `clip-path: inset(50%)`, ≤1px overflow box) is not visible text; the size guard is now "either axis under 4px" | C248, C709, C683 → inapplicable |
| A2 | Colour-peer non-colour axes add box size (text-less peers only), border radius and transform scale | Zillow: 8 groups → 2 (the 6 dot groups gone) |
| A3 | Embedded-format trap: cycle detection over the deep focus position (frames, shadow roots) replaces the count budget; unreadable embeds fall back to the budget; cap → abstain | C253 → no trap |
| A4 | At-rest error proxy: the appearance/icon baseline is per field kind over rendered fields only; an icon inside a control (combobox chevron) is not a marker | C223 (and the Location combobox on the same form) → not flagged |
| A5 | `enclosingBlockText` keeps sibling links to the **same resource** (title + comments + thumbnail of one article); other links are still stripped | C213, C222 → context includes the article title |
| A6 | axe `object-alt` promotes only for image/audio/video objects that render | C620 → shadow only |
| A7 | Status detector: content inside an opened `dialog` is not a status message; `<style>/<script>` text is never "added text" | C675 → no finding (plus 2 CSS-text findings on the same page gone) |
| B1 | axe `aria-prohibited-attr` promotes only on a UI component (focusable, interactive role, or a pointer-cursor element with a click handler) | C265, C268, C202 → shadow; C649 → still a barrier |
| B2 | `accessible-name-adequacy-v0.md`: ARIA legality is a barrier only with a demonstrated user loss | LLM text change; needs a targeted slice |
| C1 | Vision crops pass `captureBeyondViewport:false` (clips are viewport-clamped) | ESPN crop crisp, as in the sweep |
| C2 | Focus crops use the ink box (element ∪ rendered descendants) | C181: the ring is inside the crop |
| C3 | `imgRender` fact (loaded? HTML text over the box) → `imageNotLoaded` / `htmlTextOverImage` signals | C226: loaded:false, overlay ["RUNNING"] |
| D1 | axe name-rule violations whose composed subtree holds a failed alt-bearing image are downgraded to needs-review (`asset-load-failed`) | Rotten Tomatoes with images aborted: C164/C203/C635 downgraded; C263 and C765 still violations |
| D2 | axe shadow targets resolve through the shadow chain to the light-DOM host (was a comma selector list) | fixture decoy link never matched |
| D3 | `pageScriptsDisabled` element fact → `scriptsDisabled` signal; keyboard skill requires a pointer-vs-keyboard asymmetry for roving-tabindex members | C063/C131 flagged; C255/C680 rely on the asymmetry instruction |
| D4 | Emulated-control shape looks inside open shadow roots for a native control | C658 → not an emulated control |

Not done: a two-shot animation-stability check for crops (C1's second half), and element-level names for controls **inside** shadow roots (C658's real empty-name defect is still not collected).

### ACT 581 gate (2026-09-26)

Tree: HEAD `fe5ffbb6` + the uncommitted fixes above (diff sha256 prefix `b5a8b07b40b2dc80` over `scripts/v3` + `skills`). Command: `run-v3-act-suite.js --subset --local --proposed --limit=0 --max-auto=100000`, output `eval/checker-comparison/upstream-evidence/v3-act-subset-expert-fp-gate`.

- **v3 counts identical to the reference** (`r5-gate-prop2` / `fx2-gate`): tp 13, fn 101, fp 1, tn 262, tnWithClear 9, clearOnFailed 0, outOfScope 195, error 0.
- **Row level vs `fx2-gate`** (the latest full-581 reference with `raw.json`): 0 v3 bucket deltas, 0 v3 observation deltas (sc, mechanism, outcome, target), 0 axe/union deltas.
- **QualWeb lane: 2 deltas** — c487ae `c1570fd3…` tp→fn and afw4f7 `ab4691ef…` tn→fp. Both reproduce on a single-rule recheck (`…-expert-fp-recheck-c487ae`, `…-recheck-afw4f7`), so they are not flakes, but `qwFlag` is computed only from QualWeb's own `ruleOutcomes` and no QualWeb code is in this diff; the lane already moved independently of v3 between earlier gates (106 tp at fx2, 0 at r5). Attributed to the QualWeb engine/environment, not these fixes.
- As with 410f7d8f, a zero-delta gate means no regression on the held-out ACT rows, not that the changes are inert: the fixes target real-page shapes (sr-only text in carousels, nested ad iframes, shadow DOM, failed assets, noscript captures) that the ACT fixtures do not exercise. Their effect has to be measured on the saved-page slice.
- Unit suite: the full suite has **not** completed on the changed tree (one attempt was killed by a session restart, a second stopped per instruction). Only the new targeted tests were run, and they pass. The one completed full run is the baseline on the untouched tree: 1505 pass / 1 fail (a 180 s frame-test timeout) / 1 skipped.

## Population-level check (2026-09-26): every published barrier, not just the 50 labelled cases

The 50-case audit explained individual verdicts but never asked how often each cause recurs, whether the obligation should exist at all, or whether its SC is in scope. This section does that over **all 1787 barrier rows** of the scored campaign (1751 PROVISIONAL + 36 CLAIM; 867 on sampled elements, 829 on checker/instrument-minted elements, 55 page-level). Every element was re-probed live on its saved page (1379 of 1388 resolve): rendered, AT exposure (CDP), sr-only/1px/far-off-screen, scrolled out of a scroller, reached by a **real Tab walk** (≤700 presses per page), roving-widget member, revealed on focus, image load state. Deterministic mechanisms were re-run with the fixed code at the correct viewport.

### Two new systemic defects

**1. Collection runs at Puppeteer's default 800×600 viewport, not 1280×900.** `collectActPage` never sets a viewport, and no caller does (saved-page runner, 585 annotated suite, Trusted Tester, fp-experiments — only `discover-low-count-candidates.js` sets one), while vision crops and CDP tools pin 1280×900 and the experts saw the desktop layout. Running the collector + axe at both widths on all 56 pages: **24/56 pages** get a different axe violation set; **51 archived axe-promoted barriers reproduce at 800 but not at 1280** (Gymshark's mobile-only quick-add buttons ×12 and desktop nav links ×8 — this is what C272/C275 were; Cloudflare ×5, BuzzFeed, Spirit, …); 178 sampled elements change box size (target-size input) and 36 change a11y-tree membership. It also hides real findings: at 1280 axe reports 41 `aria-hidden-focus` and 62 `listitem` violations the campaign never saw.

**2. Applicability is exposure-blind.** `familiesFor` mints obligations from focusable / has-text / role only; sampled elements bypass the collector's inclusion filter; `focusable` is true for `tabindex=-1`. Measured on barrier rows:

| Exposure problem | Barriers |
|---|---:|
| Keyboard check on a roving-widget member (`tabindex=-1` inside tablist/listbox/…; 43 of them Zillow carousel dots) | 51 |
| Visual check (focus/contrast/size/label) on an sr-only / 1px / far-off element | 39 |
| …of which the element is revealed on focus (skip links, shortcut panels) and was judged at rest | 18 |
| …of which a visible label proxy exists (e.g. Gymshark 1px size radios — that one is a **real** 2.4.7 barrier, found by luck) | 7 |
| Visual check on an element scrolled out of its carousel/scroller | 36 |
| Keyboard check on another `tabindex=-1` / never-Tab-reached element | 39 |

Carousel dots specifically: 69 sampled; Zillow's 60 are a roving tablist (only the active dot is a Tab stop) and drew 39 per-dot keyboard + 4 focus barriers; Wall Street Oasis / MORSE / Gymshark dots are genuine Tab stops (their findings are legitimately in scope).

### Scope

`categories.json` lists 22 SCs. Barriers were published on **2.5.5 (219), 2.5.3 (52), 2.4.11 (1), 1.4.12 (1), 2.2.2 (1)**. 2.5.5 is plainly out of scope; 2.5.3 is not in `categories.json` but the expert study included 2.5.3 cases — needs a decision.

### Recurrence of the 50-case mechanisms across the campaign

| Mechanism | Barriers | Verified result |
|---|---:|---|
| ARIA legality → 4.1.2, LLM rubric | 150 | 106 on non-interactive elements (FP under the new policy); 44 on custom-element hosts whose real defect is the inner control |
| ARIA legality → 4.1.2, axe promotion | 144 | 35 non-interactive; 109 on hosts (107 Rotten Tomatoes `rt-link`/`play-button`) — the inner-control name defect is caught separately by `link-name` |
| 1.4.4 zoom clip | 32 | 8 sr-only text (fixed); **13 more with no visible text clipped at all** (container overflow from images/padding — a second probe defect); ~7 clip only fully-scrolled-away scroller content; ~6 partially cut text (mixed: deliberate truncation vs real) |
| 4.1.3 status | 13 | 9 gone under the fixed detector; of 4 left, 3 are revealed menus/panels/disclosures lacking ARIA state (FP), 1 debatable |
| 2.1.2 embedded trap | 3 | Zillow: leaves at Tab 8 (FP); Newegg: a drawer Tab never enters (FP); ESPN: ad iframe gone, unverifiable |
| 1.4.1 colour | 13 | 5 gone (size cue); of 8 left: ~4 real (hue-only), 2 FP (strong lightness change, ~3.3:1 and ~7:1 — the collector has no luminance axis), 2 borderline |
| Link context / capture mode / unloaded image / shadow host / inline focus crop | 16 / 14 / 8 / 8 / 8 | recurrences of the fixed mechanisms (A5, C1, C3, D4, C2) |

### Totals (de-duplicated)

- **275** barrier rows are out of scope.
- Of the **1512 in-scope** rows: **282 (19%)** are high-confidence harness artefacts (measured: viewport, zoom, roving members, detectors that no longer fire, ARIA legality on non-interactive elements); **153 (10%)** point at the wrong target (custom-element host instead of its inner control); **74 (5%)** are wrongly framed checks whose true outcome is uncertain (visual checks on sr-only/scrolled elements, keyboard checks on unreached elements).

### Additional fixes this implies (not yet implemented)

- **V1** Pin `collectActPage` to 1280×900 (one place, covers every runner). Shared collector → ACT 581 gate.
- **V2** Exposure-gated applicability: record an exposure class per element and gate families by it — visual families need a rendered box, a visible proxy, or the revealed-on-focus state; keyboard families on roving members move to a single widget-level obligation; not-rendered / hidden elements get only hidden-specific checks.
- **V3** Scope filter: do not mint (or publish) obligations for SCs outside `categories.json`; decide 2.5.3.
- **V4** Zoom probe: require that a perceivable text rect actually extends past the clip box.
- **V5** Status detector: new content that brings ≥2 operable controls is revealed UI, not a status message.
- **V6** Region-trap probe: only test regions that Tab can enter.
- **V7** Colour peers: a state pair with ≥3:1 luminance difference is not colour-only.
- **V8** Custom-element hosts: attribute name/role findings to the inner shadow control (this also closes C658's real empty-name defect).

## V1–V8 implementation (2026-09-26, uncommitted, same tree as A–D)

Scope decision taken by the user: every SC outside `categories.json` (2.5.5, 2.5.8, 2.4.11, and the ACT-REST SCs 2.5.3, 1.3.3, 1.3.5, 1.4.4, 1.4.12, 2.2.1, 2.2.2, 2.4.1) is out of scope for now. Each fix was checked on the saved pages that produced the rows; numbers below are re-measured, not predicted.

| Item | Change | Measured |
|---|---|---|
| V1 | New `lib/viewport.js` `pinCollectorViewport`: replaces Puppeteer's 800×600 default (never a caller-set viewport) with 1280×900 at every page birth — `collectActPage`, the tab allocator (experiments, instruments, vision), `withLanePage`, broad-scope probes, and both ACT suites' collector tabs | collector now at 1280×900 (checked on the Rotten Tomatoes run); the 800-only axe set measured earlier no longer applies |
| V3 | New `lib/scope.js`. `collectActPage` (and `eval-page.js`) declare `collect.scope` = the 22 `categories.json` SCs (`opts.scope:'all'` / `V3_SCOPE=all` opts out). `generateCandidates` skips out-of-scope families (no experiment runs); `buildV3` drops out-of-scope obligations and their dispositions before any fill (no LLM call, no published row) and reports `summary.scopeDropped`. The ACT 581 / ACT-REST suites use inline collectors without `scope` ⇒ unfiltered (ACT-REST stays scorable as shadow) | 305 of the 1604 re-collected barrier rows are out of scope and are no longer minted |
| V4 | Zoom-clip probe: an overflow counts only if a rendered text line box is partly inside the clip box AND crosses its edge on the barrier axis | ACT 59br37 14/14 (recall 1.0, fp 0); saved pages: 18 of 25 applicable 1.4.4 barriers → pass (image/padding overflow, wholly off-screen slides, a toggle glyph), 7 remain (partially cut text) |
| V5 | Status detector: the reveal root (outermost inserted/visibility-flipped ancestor) is revealed UI — not a status — when it is/inside a menu/listbox/tree/grid, a ≥50%-viewport fixed overlay with ≥2 controls, or holds a form field, or ≥2 controls carrying ≥60% of its text (fragment links not counted) | Quora sign-in wall + 2 option menus → no finding; the "Undo" feedback message and Notion price change still reported; act-augmented 4.1.3 (56 pages): findings (8) and observations (91) identical to HEAD |
| V6 | Region-trap probe: region focusables must be able to hold focus (incl. `visibility`), ≥1 must be a Tab entry, and when the real Tab walk completed its ring a region none of whose entries it reached is not probed (`unreachableRegions`) | act-augmented 2.1.2 (55 pages): traps identical to HEAD (the 3 roving-grid traps a stricter first cut lost are kept); Newegg's hidden Osano drawer excluded |
| V7 | Colour peers: a group is dropped when every pair of distinct colour signatures differs ≥3:1 in luminance (text or effective background) | Klaviyo tabs and Southern Airways region tabs gone; Yahoo, Spirit, MORSE, Cloudflare (hue/tint-only) kept |
| V8 | Collector: a custom-element host with no own interactive semantics records its first rendered composed shadow control; CDP resolves that control's role/name and the host record adopts them (`delegatedToShadowControl`, host values kept as `hostAxName`/`hostCdpRole`); adjudicator signal `shadowInnerControl` | C658: host now `button`, name EMPTY ("Play Aftersun trailer" on the host does not reach it) ⇒ name-role-value instead of control-semantics; 189 barrier rows sit on such hosts |
| V2 | New `lib/collect-exposure.js` (last collection pass): rendered, srOnly, revealedOnFocus (polled ≤1 s), labelProxy, clippedOut{scrollReachable}, tabindexNegative, rovingMember/widgetEntryReachable. Oracle `exposureDrops` (re-declared independently in the coverage registry, Rule 16): not-rendered ⇒ no visual/focus/keyboard/hover family; sr-only not revealed ⇒ no contrast/colour/image-of-text/target family (focus visibility kept); roving member with a Tab entry ⇒ no per-member keyboard-operable; tabindex=-1 non-control ⇒ no keyboard/focus; aria-hidden unfocusable ⇒ no name/link/heading family. Adjudicator signals `revealedOnFocus`, `invisibleWhenFocused` (+ label proxy), `clippedOutOfView` (visual questions → PARTIAL) | in-scope barrier rows: 43 roving keyboard checks dropped (the Zillow tablist dots), 1 not-rendered focus check dropped; 13 invisible-when-focused, 4 revealed-on-focus, 11 clipped-out rows now carry signals; 0 coverage-registry errors on 55 pages; sr-only reveal classification agrees with the audit probe on 96/98 |

Also changed: `tests/runners/sensory-collector-wiring.test.js` passes `scope:'all'` (1.3.3 is an ACT-REST lane). Not re-verified here: the full unit suite (not run, per instruction) — tests that assert 800×600 geometry or out-of-scope obligations through `collectActPage` may need the same opt-out; the Trusted Tester runner now also drops out-of-scope SCs.

What V2 does not do: of the 53 in-scope keyboard-operable barrier rows whose element the real Tab walk never reached, 43 are roving members (dropped) and the other 10 are controls with tabindex=-1 — they keep the check, because a control removed from the Tab order is a real 2.1.1 candidate. Scrolled-out elements are not dropped — they are judged PARTIAL unless the crop shows them, because an off-screen slide does become visible.

### ACT 581 gate for V1–V8 (2026-09-26)

Tree: HEAD `fe5ffbb6` + A–D + V1–V8 (diff sha256 prefix `76d4ba55935a15e0` over `scripts/v3` + `skills` + the three new lib files). Command as above, output `eval/checker-comparison/upstream-evidence/v3-act-subset-v1v8-gate`.

- v3 counts identical to the A–D gate (`v3-act-subset-expert-fp-gate`): tp 13, fn 101, fp 1, tn 262, tnWithClear 9, clearOnFailed 0, outOfScope 195, error 0.
- Row level vs the A–D gate: 0 bucket deltas, 0 observation deltas, 0 axe deltas, 0 QualWeb deltas (qwFlag 106 in both), 0 errors.
- Coverage caveat: the 581 suite collects with its own inline collector (no `scope`, no exposure, no inner-control facts), so V2, V3 and V8 are not exercised by it; it does exercise V1 (its collector tab and every experiment/instrument tab now start at 1280×900), V5, V6 and V7. V4 was checked on ACT-REST 59br37 separately (14/14, `v3-act-rest-v4-59br37`), and V2/V3/V8 on the 56 saved pages (section above). As before, zero delta means no regression on the held-out rows, not that the changes are inert.
