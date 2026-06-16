# Harness 3.2 — Hardcoded Judgments & Constants vs. WCAG 2.2 (audit)

Scope: every committed `scripts/v3/lib/**` module + the shared `scripts/lib/a11y-eval.js` + the 16
`scripts/v3/llm-rubrics/*.md`, cross-checked against the project's own authority (`categories.json`,
sourced from the WCAG 2.2 *Understanding* "In Brief" texts), the WCAG 2.2 normative SC text, and the
two method papers in `refs/` (BAGEL, CHI'23; the dialog-keyboard-trap paper, ICSE'23).

Method: primary-source reading of the verdict path (instruments → catalog/registry/completeness →
authority → metrics → obligations/disposition → LLM lane). For each hardcoded number or rule I asked:
(a) what does it mean operationally, (b) does WCAG fix this value, and (c) does it gate a published
verdict, and in which direction.

**Round 3 (2026-06): every finding below was then verified empirically** — six lanes built ~45 HTML/SVG
fixtures and ran the *real* runner code against WCAG 2.2 + the two papers, judged by hand and screenshot
(see [§H](#h-empirical-verification-round-3-2026-06)). The empirical pass *confirmed* the constants but
*upgraded* four findings and *corrected* two things the static read got wrong (B3's scope, B4's error
direction). Measured numbers are folded inline; "(measured)" marks an empirically observed value.

Bottom line: **the WCAG-normative constants are correct (re-verified exact to floating point).** The
unsupported material is (1) a handful of *invented heuristic thresholds* with no WCAG basis that shape
findings — three of which were shown to produce **reproducible** false clears / false barriers — and
(2) *policy/statistical tolerances* whose specific values are chosen, not derived. Most of the unsupported
logic is structurally contained to **non-authoritative** lanes (shadow / review / `calibrated:false`
provisional), which is the single most important mitigating fact in this codebase — and the empirical run
confirmed none of the gaps reach the authoritative ledger.

---

## A. WCAG-normative constants — verified CORRECT (no action)

| Constant | Location | WCAG basis | Verdict |
|---|---|---|---|
| Large text = `≥24px` OR `≥18.66px & weight≥700`; thresholds `3.0` / `4.5` | [exp-runners.js:154](scripts/v3/lib/exp-runners.js#L154-L155), [a11y-eval.js:33](scripts/lib/a11y-eval.js#L33-L41) | 1.4.3 (18pt/14pt-bold; 4.5:1 / 3:1) | ✅ exact; code even documents fixing a prior over-lenient band |
| Target min `24` px; spacing circle radius `12` (24px dia.), circle↔rect + circle↔circle intersection | [a11y-eval.js:53](scripts/lib/a11y-eval.js#L53-L120) | 2.5.8 (AA) incl. the normative Spacing exception | ✅ faithful geometry; cites the Understanding doc |
| Target enhanced `44×44` | [target-size-enhanced-v0.md](scripts/v3/llm-rubrics/target-size-enhanced-v0.md) | 2.5.5 (AAA) | ✅ |
| Reflow viewport `320×256` | [exp-runners.js:528](scripts/v3/lib/exp-runners.js#L528) | 1.4.10 (320 CSS px vertical / 256 horizontal) | ✅ |
| "Entirely obscured" (partial visibility passes); 2.4.12 kept distinct | [exp-runners.js:551](scripts/v3/lib/exp-runners.js#L551-L701), [focus-not-obscured-v0.md](scripts/v3/llm-rubrics/focus-not-obscured-v0.md) | 2.4.11 (Minimum) | ✅ correct min/enhanced split |
| Verdict maps (`N/A`→INCONCLUSIVE abstention, never INAPPLICABLE); AT-dependence set; clearability classes | [v3-schema.js:25](scripts/v3/lib/v3-schema.js#L25-L36), [registry.js:19](scripts/v3/lib/registry.js#L19) | applicability vs. observation separation | ✅ sound, conservative |

The contrast rubric **explicitly refuses** to invent a ratio from pixels ("Do NOT … assert a 4.5:1 / 3:1
threshold from the image") — correct, since vision can't read exact ratios. The deterministic runner owns
the computable flat-backdrop case; the rubric judges only perceptual readability. Good division.

**Empirically re-verified (§H, L6) — every constant above is exact to floating point:** the 2.5.8 circle
flips at edge-gap **12.0** / centre-distance **24.0**; large-text at **24.0px** and **18.666666666666664px**
bold (weight 699 fails, 700 passes); reflow viewport is exactly **320×256** with the barrier flipping at
`scrollWidth` **323** (`SLOP=2`); 2.4.11 `entirelyObscured` flips between a **0.03px** strip (clear) and
**0.02px** (barrier, `EPS=0.02`), correctly clearing the 90%-covered partial case; the placeholder is excluded
from the accessible name in every case. **Two low-severity, non-authoritative follow-ups surfaced:** (1) the
`field-label-probe` `nearbyVisibleText` channel ([exp-runners.js:327](scripts/v3/lib/exp-runners.js#L327-L333))
treats *any* sibling text in the field's parent (a submit button, marketing copy) as a satisfying instruction,
so it **under-reports** a real 3.3.2 barrier on a placeholder-only unlabelled field — but it can never
false-*clear* (`programmaticNamePresent` stays false; the runner is barrier-only). (2) Worked examples for the
2.5.8 "centre-distance alone is insufficient" point must use a thin large neighbour (e.g. `rect (18,0,200,4)`,
centre gap 108px, circle still intersects → correct fail), not a tall one whose edge sits >12px away.

---

## B. Invented heuristic thresholds — NOT supported by WCAG (the substantive findings)

These are the decisions a reviewer should treat as **arbitrary**: WCAG fixes no value here, and the chosen
numbers/rules are the harness's own, unvalidated against the (on-hold) gold set.

### B1. "Gross backward jump" for reading/focus order — `JUMP = max(3, round(0.25 × n))`, `rowBand = 12px`  — **CONFIRMED · severity HIGH (recall hole)**
[order-check.js:64](scripts/v3/lib/order-check.js#L64) · [order-check.js:68](scripts/v3/lib/order-check.js#L68) · [order-check.js:36](scripts/v3/lib/order-check.js#L36)
- **Meaning:** within a visual column, a navigation step that lands many visual positions earlier than its
  predecessor is flagged as a 1.3.2 (reading order) / 2.4.3 (focus order) divergence. `rowBand=12px` decides
  "same row."
- **Off-by-one (measured):** the flag uses a **strict `>`** (`(prevRank − r) > JUMP`, [order-check.js:68](scripts/v3/lib/order-check.js#L68)),
  so the real detection threshold is **delta ≥ max(4, round(0.25n)+1)** — one position stricter than the
  `≥ JUMP` the prose first implied.
- **Why unsupported:** WCAG 1.3.2 / 2.4.3 have **no numeric definition** of a meaningful-sequence violation.
  The code cites BAGEL (CHI'23); a **full-text search of the paper for `0.25 / 25% / visual position / rank /
  12px / floor` returns zero hits** (measured). BAGEL's nav-order method is *purely topological* — DBSCAN
  "FuncSet" clustering (§4.2.1) + a Keyboard-Focus-Flow-Graph rule ("more than one incoming Tab *or*
  Shift+Tab edge entering a FuncSet", §5.1.1; Precision 85% / Recall 49%, Table 1). The harness shares **none**
  of that; the `0.25n` / floor-of-3 / 12px are the harness's own picks with no backing in the cited paper.
- **Proven recall hole (measured, exhaustive):**
  - **Dead zone n ≤ 4:** a single column of ≤4 items can **never** be flagged — max achievable delta is
    n−1 ≤ 3 = JUMP and `3 > 3` is false. Exhaustive: **0/6 permutations at n=3, 0/24 at n=4** flag, *including
    full reversals*.
  - **Every adjacent transposition misses** (delta=1) at any n — e.g. a 6-item nav menu with two neighbours
    tab-swapped → **0 findings**.
  - **Detection-fraction floor:** a step must skip **>25% of its column and ≥4 absolute positions** to be
    caught (measured: n=6→0.667, n=8→0.500, n=12→0.333, n=20→0.300; at n=5 only 24/120 ≈ 20% of disordered
    single-column orders flag). The one class it *does* catch is a large hoist (e.g. a footer CSS-moved to the
    visual top), and the two claimed false-positive guards **hold** (main+sidebar and 3×3 card grid → 0
    findings, measured).
- **Containment:** these become `instrumentFindings` only — **shadow, never authoritative**.
- **Reused by** the keyboard tab-order check ([kbd-graph.js:69](scripts/v3/lib/kbd-graph.js#L69)), so the
  same invented threshold drives both SCs. **Fix:** replace the floor-of-3 strict-`>` with a within-column
  `delta ≥ 1` check, or adopt BAGEL's FuncSet-entry-multiplicity test, to recover the missed small-defect class.

### B2. 1.4.3 pixel-uniformity tolerances — `range ≤ 12`, `glyphPixels ≥ 8`, `sentDelta ≤ 40`, `pixelAgrees ≤ 16`  — **CONFIRMED · severity HIGH (false clear reproduced)**
[exp-runners.js:233](scripts/v3/lib/exp-runners.js#L233) · [:222](scripts/v3/lib/exp-runners.js#L222) · [:272](scripts/v3/lib/exp-runners.js#L272)
- **Meaning:** the rendered-backdrop channel calls a backdrop "uniform" iff ≥8 glyph pixels were located
  and their max RGB spread ≤12; a backdrop pixel is one whose two-sentinel delta ≤40; the CSS-resolved
  backdrop must agree with the rendered one within ±16 per channel.
- **Why unsupported:** these are the tolerances that decide whether 1.4.3 may **CLEAR** (the safety
  direction). WCAG fixes none of them; they're engineering choices not yet validated against gold.
- **Reproduced FALSE CLEAR (measured, with screenshot):** because the ratio is computed against
  `a.bgColor` (the CSS center-sample base) while `pixelAgrees ≤ 16` tolerates a full 16/channel disagreement
  with the *rendered* backdrop, a non-`background-color` painter (SVG/canvas) between the resolved base and
  the glyphs lets a real fail clear. Fixture: white text, body `rgb(118,118,118)`, an SVG rect
  `rgb(134,134,134)` painted behind the glyphs (gap = 16). The runner returns **`thresholdMet:true`, ratio
  `4.542`** — but the **true rendered contrast is `3.641:1`** (white-on-134), a genuine 1.4.3 failure. The
  large-text variant clears at `3.033` while truly failing. The boundary is exact: a 17/channel gap (SVG
  `135`) correctly **rejects** (INCONCLUSIVE). Threshold flips also verified exact: ratio at **4.5**
  (gray118=4.542 clears / gray119=4.478 fails, no rounding), large-text at **24px** and **18.66px-bold**,
  the range gate at **≤12** (rendered range 10 uniform / 18 rejects).
- **Containment:** clearing 1.4.3 is closed-scope and requires *both* channels to agree — but the exploit
  satisfies both, so containment does **not** stop this one. It is gated behind shadow authority (not
  authoritative today), but it is a real defect in the dangerous direction, not a hypothetical. **Fix:** when
  the `pixelAgrees` gap > 0, recompute the ratio against the rendered backdrop mean (already measured in
  `analyzeBackdrop` as `r/g/b`) instead of `a.bgColor`.

### B3. 4.1.3 "status message" rule — over-broad on lazy-inserted content, *and* under-covered  — **NUANCED (re-scoped) · severity HIGH**
[status-detector.js:91](scripts/v3/lib/status-detector.js#L91-L104) · [:24](scripts/v3/lib/status-detector.js#L24)
- **Correction to the static read (measured):** the detector does **not** flag "*any* newly-appearing
  visible text." It only sees text arriving via **DOM node insertion or `characterData` change**; a
  disclosure/accordion or tab that toggles `hidden`/`display` on *pre-rendered* nodes produces `addedCount=0`
  and is **never evaluated**. So it has no real status-vs-primary-content semantics — it just happens to miss
  the toggle case by accident.
- **False positives (measured):** legitimate **lazy-*inserted* primary content** is flagged — a disclosure
  body and a tab panel that insert their text on click each produce **1 spurious 4.1.3 finding**, because
  [status-detector.js:91](scripts/v3/lib/status-detector.js#L91-L104) applies no disclosure/tab relationship
  check (no `aria-expanded`/`aria-controls` or `role=tabpanel` exclusion). This is the dominant SPA
  lazy-render pattern, so the false-positive surface is real.
- **False negatives (measured):** `maxTriggers=12` silently truncates — a genuine un-announced status on the
  15th button is missed at default (0 findings; found only at `maxTriggers≥15`), with no record of the
  truncation. The pass-1 selector `button,[role=button],input[type=button]` misses **3/3** non-button
  triggers (a link, a checkbox, a `role=tab` div) that each emit a real un-announced status.
- **Why unsupported:** WCAG 4.1.3 applies only to **status messages**, and the `12 / 300 / 3` caps have no
  basis. True positive (un-announced status) and the live-region pass were both correct (measured).
- **Containment:** non-authoritative shadow signal. **Fix:** skip when the trigger has `aria-expanded`
  toggling true with the inserted node inside its `aria-controls` target (or the node is `role=tabpanel`);
  widen the selector; record cap truncation so missed triggers aren't invisible.

### B4. 3.3.1 "error surface" heuristics — `reddish()` + English keyword lists  — **CONFIRMED · direction CORRECTED · severity HIGH**
[exp-runners.js:392](scripts/v3/lib/exp-runners.js#L392) (`reddish`: `r>120 && r>1.4×g && r>1.4×b`) ·
[:393](scripts/v3/lib/exp-runners.js#L393-L395) (`ERR_CLASS` / `ERR_TEXT` / `OK_TEXT` word lists)
- **Meaning:** decides whether an after-submit DOM change "is an error identification." Red-ish text color,
  a class matching `error|invalid|warn|…`, or text matching `error|required|must|please|…` ⇒ identified;
  `thank|success|saved|…` ⇒ not an error surface.
- **Why unsupported:** WCAG 3.3.1 says nothing about color, class names, or English keywords. Error
  identification is **language-agnostic and text-based; color is explicitly not sufficient** (also 1.4.1).
  The `1.4×` red ratio (flips exact at r=121 and the g/b 1.4× boundary, measured) and the **18-stem ASCII**
  `ERR_TEXT` list are invented.
- **Direction corrected by measurement — the dominant error is a false BARRIER, not a false negative.** The
  English-only `ERR_TEXT` produces **false barriers on conformant non-English identifications**: Spanish
  ("El correo es obligatorio."), German ("E-Mail ist erforderlich."), and Japanese plain-`<div>` messages —
  all genuine in-text identifications — each return **`errorNotIdentified=true`** (measured, re-verified by
  hand), because none of `ERR_TEXT`/`ERR_CLASS`/`reddish()`/live-region/aria-ref fire. An unworded-English
  icon+text variant fails the same way (4/5 conformant cases false-barriered in the lane). It *also* yields
  **2 false clears**: a red field-name echo cleared by `reddish()` alone (a color-only cue that fails 3.3.1),
  and a success-worded string on a real error cleared because `ERR_TEXT` overrides the `OK_TEXT && !ERR_TEXT`
  exclusion.
- **This reverses the original containment note:** it does *not* err toward false-negatives — on any
  localized or unworded page it **manufactures false barriers**.
- **Fix:** a newly-appearing, field-associated message on invalid submit should be **INCONCLUSIVE** (defer to
  the LLM/vision lane), never `errorNotIdentified=true`; and drop `reddish()` + the `ERR_TEXT`-wins
  precedence from the identification decision entirely (color is not a valid 3.3.1 signal).

---

## C. Policy / statistical tolerances — arbitrary specific values (not WCAG)

These are legitimate design knobs, but the **specific values** are chosen, not derived, and they gate
promotion.

| Knob | Value | Location | Note |
|---|---|---|---|
| False-clear bound `clearTarget` | `0.02` ⇒ required N = **149** | [metrics.js:208](scripts/v3/lib/metrics.js#L208-L210) | `149 = ⌈ln0.05 / ln0.98⌉` is correct math; the **2%** target is the arbitrary input. |
| False-barrier tolerance | `0.10` | [metrics.js:159](scripts/v3/lib/metrics.js#L159) | "10% review-noise acceptable" is a pick. |
| Decision-coverage floor | `0.5` | [metrics.js:159](scripts/v3/lib/metrics.js#L159) | 50% is a pick. |
| Confidence | `0.95` | [metrics.js:42](scripts/v3/lib/metrics.js#L42) | conventional, but still a choice. |
| Provisional confidence tie-break | `{high:3, medium:2, low:1}` | [obligations.js:33](scripts/v3/lib/obligations.js#L33) | ordering is arbitrary (only relative order matters). |

**C-note (most important here): `provisionalMode` defaults to `'ungated'`.**
[build-v3.js:287](scripts/v3/lib/build-v3.js#L287) · [:279](scripts/v3/lib/build-v3.js#L279-L321)
In the default mode, a non-abstaining LLM verdict **fills an auto-PARTIAL obligation as a published
PROVISIONAL row bypassing the registry and the 149-bound**, with `calibrated:false`. The strict
2%/coverage gating only runs in `'gated'` mode, and even there the real canary promotion is meant to be
earned offline over the whole corpus gold — which is **on hold / inert** per project state. So by default
the harness emits uncalibrated LLM clears/barriers. It is *honestly labeled* (`calibrated:false`, never
folded into the authoritative `cleared`/`barriersObserved` counts), which is the saving grace — but a
consumer who reads PROVISIONAL rows as findings is reading uncalibrated single-pass judgments.

---

## D. Engineering tolerances / proxies — defensible, but worth knowing

Acknowledged approximations; none claim WCAG backing, and each is contained.

- **1.4.13 persistence proxy = 1600ms dwell** [exp-runners.js:1069](scripts/v3/lib/exp-runners.js#L1069):
  cannot prove *indefinite* persistence (a tooltip vanishing at 5s passes). The registry correctly makes
  1.4.13 **never-clearable** ([registry.js:99](scripts/v3/lib/registry.js#L99)), so this only limits the
  barrier direction.
- **Trap escape budgets (split by measurement):** `kbd-graph`'s `focusableCount+3`
  ([kbd-graph.js:169](scripts/v3/lib/kbd-graph.js#L169)) **does not mis-decide** — clean to N=50, no false
  trap or false clear, and `detectKeyboardTraps` correctly confirmed a role-less class-based trap and cleared
  an APG modal (measured); the original "under-budget risks a false clear" concern is unfounded for this path.
  But the **runner's** fixed `BUDGET=12` ([exp-runners.js:749](scripts/v3/lib/exp-runners.js#L749)) flips a
  valid **CLEAR → INCONCLUSIVE at exactly N=13** focusables when forward exit needs >12 Tabs (measured;
  `trapProven` also requires `cycledBackToStart`, so it never false-*traps*). `REACH_SAFETY_CAP=2000`
  ([kbd-graph.js:11](scripts/v3/lib/kbd-graph.js#L11)) is a pure anti-pathology cap.
- **Runner role-only region anchor — real false CLEAR of a keyboard trap (medium).**
  The `keyboard-trap-escape` runner anchors the region with a **role-only** selector
  ([exp-runners.js:733](scripts/v3/lib/exp-runners.js#L733): `…closest('[role="dialog"],dialog,…') || el`)
  with **no class fallback** — unlike `kbd-graph`'s `TRAP_REGION_SEL`, which includes `[class*=modal i]`
  ([kbd-graph.js:83](scripts/v3/lib/kbd-graph.js#L83)). Measured: a hard keyboard trap built as a role-less
  `<div class="modal">` is **falsely cleared** (`escapeProvenForWidget:true`) because `region` collapses to
  the focusable element itself, so the first Tab "leaves the region"; the byte-identical `role="dialog"`
  version is correctly `trapProven`. **Fix:** `region = el.closest(TRAP_REGION_SEL) || el` in the runner too.
- **Float/geometry tolerances:** `EPS=0.02` ([exp-runners.js:577](scripts/v3/lib/exp-runners.js#L577)),
  reflow `SLOP=2px` ([:485](scripts/v3/lib/exp-runners.js#L485)), `inkClip` min 2px
  ([:192](scripts/v3/lib/exp-runners.js#L192)) — sound, documented as floating-point noise absorbers.
- **Default confidence `'low'`** when the agent omits/garbles it ([llm-adjudicator.js:267](scripts/v3/lib/llm-adjudicator.js#L267)) — conservative.
- **Blank-frame / media-error detectors** (`meanLuma≤16`, `stdLuma≤6`, `darkFraction≥0.985`)
  [a11y-eval.js:160](scripts/lib/a11y-eval.js#L160) — vision-hygiene tolerances, not verdicts.

---

## E. Scope & applicability decisions worth flagging

- **LLM lane covers SCs outside the declared 9 categories.** `categories.json` defines cat_1–cat_9
  (≈20 SCs). The oracle + rubrics additionally enumerate **2.5.3** (Label in Name), **2.5.5 / 2.5.8**
  (Target Size), and the **2.4.12** distinction — none of which appear in the category taxonomy.
  [applicability-oracle.js:38](scripts/v3/lib/applicability-oracle.js#L38-L41). Not a WCAG error (all are
  real 2.2 SCs), but it's scope creep beyond the project's own stated category set, folded under a
  `reflow-and-pointer-affordances` skill name.
- **Applicability is an explicitly PARTIAL Phase-0 seed.** [applicability-oracle.js:8](scripts/v3/lib/applicability-oracle.js#L8-L12)
  Absence of a claim-family branch is a coverage gap, surfaced via `outOfScopeElements` (never a silent
  conformance pass). This is the right design, but it means "0 obligations" ≠ "evaluated."
- **1.4.3 runner omits the logotype / incidental-text exemptions** (only `disabled` + `aria-hidden` are
  treated as exempt, [exp-runners.js:167](scripts/v3/lib/exp-runners.js#L167)). A styled-text logo could
  draw a false barrier. Low impact (logos are usually images, not text nodes).
- **Dead constants:** `C4_SIMPLE` / `C4_SIMPLE_TAG` ([exp-runners.js:815](scripts/v3/lib/exp-runners.js#L815-L816))
  appear unused. Hygiene only.

---

## F. Soundness containment (why most of B–C is lower-risk than it looks)

The architecture is built so that unproven judgment cannot reach an authoritative verdict:

1. **Default-shadow authority** ([authority.js:40](scripts/v3/lib/authority.js#L40-L51)): every mechanism,
   incl. every LLM rubric, publishes shadow unless explicitly promoted; nothing is promoted in the
   committed registry. LLM mechanisms are hard-capped at `canary` and can **never** be authoritative.
2. **Default-closed clearability** ([registry.js:23](scripts/v3/lib/registry.js#L23-L130)): a clearing
   direction needs an explicit closed-scope completeness predicate; everything else cannot clear.
3. **Barrier-dominates + un-filled ⇒ auto-PARTIAL** ([obligations.js:39](scripts/v3/lib/obligations.js#L39-L83)):
   no silent pass; conflicting provisional fills resolve fail-closed.
4. The invented heuristics in **B1/B3** and the VSR `name-text-mismatch` (a 2.5.3-flavoured check) are
   emitted as `instrumentFindings` / `review:true` — explicitly non-authoritative.

So the realistic exposure is: (i) **PROVISIONAL rows in the default `ungated` mode** carry uncalibrated
LLM judgments (C-note), and (ii) the **shadow instrument signals** (B1–B4) over- *and* under-flag — now
**measured, not hypothetical**: a reproduced false clear (B2), false barriers on localized pages (B4), a
proven recall dead-zone (B1), and false positives on lazy-render disclosures (B3). The Round-3 run confirmed
**none of these reach the authoritative ledger** (every confirmed gap stays shadow / barrier-only /
`calibrated:false`) — but all are surfaced to consumers and rest on unvalidated constants.

---

## G. Recommendations (in priority order)

1. **Calibrate or quarantine the heuristic thresholds (B1–B4).** Either gate them behind the gold set
   before exposing their findings, or tag each finding with `calibrated:false` the way the provisional
   lane already does. The order-divergence `0.25n`, the contrast `≤12/≤16`, the 4.1.3 "any new text," and
   the 3.3.1 keyword/red heuristics are the four to validate first.
2. **Make `provisionalMode` default explicit at the call site**, or flip the default to `'gated'` for any
   non-research consumer, so "default run" does not publish uncalibrated PROVISIONAL clears/barriers.
3. **Record the policy tolerances (2% / 10% / 50%) as named, justified parameters** (a short rationale +
   provenance), since 149 and the gates derive from them.
4. **Internationalize or flag** the English-only error/success word lists (B4) and the VSR word-overlap
   check before any non-English corpus run.
5. **Reconcile scope:** either add 2.5.3 / 2.5.5 / 2.5.8 to `categories.json` or document why the LLM lane
   evaluates SCs outside the declared taxonomy.
6. **Fix the two confirmed runner-direction defects:** (a) B2 — compute the 1.4.3 ratio against the *rendered*
   backdrop mean when `pixelAgrees` gap > 0; (b) give `keyboard-trap-escape` the same `TRAP_REGION_SEL`
   class fallback `kbd-graph` uses, and derive `BUDGET` from the in-region focusable count. Both are
   reproducible today (§H).
7. **Scope the paper citations honestly:** the header comments cite BAGEL and LOTUS, but BAGEL backs none of
   the order-check constants (purely topological method) and only **1 of LOTUS's 4** dialog-failure classes
   is implemented (Non-Dismissable / 2.1.2). Re-label as "inspired by," and note that Non-Init-In,
   Non-Init-Out, and Non-Containment are out of scope.

---

## H. Empirical verification (Round 3, 2026-06)

Six lanes built **~45 HTML/SVG fixtures** under `/tmp/a11y-verify/` and ran the **real runner code**
(`order-check.js`, `exp-runners.js`, `status-detector.js`, `kbd-graph.js`, `a11y-eval.js`) against WCAG 2.2
normative text and the two cited papers, judging each verdict **by hand + screenshot** (the project's
"don't ship the green test" discipline), not via the existing suite. The most consequential reversing claims
(B2 false clear, B4 direction, the L5 runner false-clear) were then **independently re-driven a second time**
to confirm. Headline measured results:

| Finding | Static verdict | **Empirical verdict** | Decisive measured number | WCAG / paper |
|---|---|---|---|---|
| **B1** order-check `JUMP` | arbitrary, shadow | **CONFIRMED + worse** | strict `>` ⇒ threshold delta ≥ max(4, ⌈0.25n⌉+1); **n≤4 dead zone (0/24 perms)**; all adjacent swaps missed; catch needs >25% column skip | 1.3.2 / 2.4.3 (no positional threshold); BAGEL §4.2.1/5.1.1 — **0 keyword hits** |
| **B2** contrast tolerances | risk of false clear | **CONFIRMED — false clear reproduced** | runner CLEARS reporting **4.542:1** while true rendered contrast **3.641:1**; `pixelAgrees` boundary exact at 16/17 | 1.4.3 (4.5:1 against the *rendered* backdrop) |
| **B3** 4.1.3 status rule | over-broad | **NUANCED (re-scoped)** | insertion-only (blind to `hidden` toggles); **2 false positives** on lazy-insert disclosure/tab; **12-cap + button-only selector** miss ≥4 real barriers | 4.1.3 (status messages only) |
| **B4** 3.3.1 heuristics | errs to false-negative | **CONFIRMED — direction FLIPPED** | **es/de/ja conformant in-text ids all false-BARRIERED**; 2 false clears (color-only + success-worded) | 3.3.1 (language-agnostic; color insufficient) |
| **BAGEL** fidelity | overstated cite | **CONFIRMED** | full-text search for `0.25/25%/visual position/rank/12px/floor` → **0 hits**; method is DBSCAN+KFFG (P85/R49) | BAGEL CHI'23 |
| **LOTUS** fidelity | "implements LOTUS" | **NUANCED — 1 of 4 classes** | only Non-Dismissable/2.1.2; Non-Init-In/Out + Non-Containment **absent** (grep-confirmed); runner role-only anchor **false-clears a role-less trap** | LOTUS ICSE'23, Alg 1–3 |
| **§A constants** | ✅ correct | **CONFIRMED exact** | 12.0 / 24.0 / 24px / 18.666666666666664px / 320×256 / scrollWidth 323 / EPS 0.02 all flip exactly | 2.5.8 / 1.4.3 / 1.4.10 / 2.4.11 / 3.3.2 |

**What the static read got wrong (corrected above):** B3's "flags *any* new text" (it is insertion-only and
blind to visibility toggles — but false-positives on lazy *inserts*); B4's "errs toward false-negatives" (it
actually manufactures **false barriers** on localized pages); and the Section-D trap-budget bullet
(conflated two budgets and missed the runner's role-only false-clear). **What it got right:** B2's warned-of
false clear is real and reproduced, and all §A constants are exact.

Raw fixtures and transcripts: `/tmp/a11y-verify/L1…L6/` (incl. `L2/SHOT_falseclear_normal.png`, the
exhaustive n=3/4 permutation sweeps, and the multilingual 3.3.1 forms). The reproduction drivers I re-ran by
hand are `/tmp/a11y-verify/MY-b2-recheck.js` and `MY-b4-recheck.js`.
