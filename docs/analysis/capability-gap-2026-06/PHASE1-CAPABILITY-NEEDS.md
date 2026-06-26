# Phase 1 — Capability needs to cover all 150 act-augmented aspects (within our 22 SCs)

Method: 6 independent agents mapped each aspect (by slug + WCAG 2.2 Understanding/Techniques + Trusted Tester
v5.1.3 + EN 301 549) to its required capability and assessed coverage against the harness. **The held-out
act-augmented PAGES were NOT opened** — only the slug taxonomy + our code. Per-cluster detail:
`gaps-{color,structure,name-link,keyboard,forms-status,hover-reflow}.md`.

**Aggregate: 150 aspects → COVERED 38 · PARTIAL 56 · GAP 56.** ~75% need a capability addition or wiring.

A correction surfaced: the inventory's "no table/list facts" was STALE — `collect-tables.js` + `collect-lists.js`
already provide table-relationship + list-structure facts (those aspects are COVERED). Net gaps below exclude them.

## The minimal capability set (clustered; one capability → many aspects)

### TIER 1 — architectural, highest leverage (the recurring "can't drive/observe dynamics" gap)

**C1 · Interaction-driven evidence capture & diff** — *the single largest cluster (~18 aspects across 5 SCs).*
Today `STATE_TRANSITIONS` is SC-keyed and frozen (2.4.7→focus, 1.4.13→hover, 3.3.x→submit). There is no general
primitive to drive an arbitrary subject into hover/focus/active/checked/disabled/Esc and capture **before/after
AX-tree + pixels + timing**, then diff. Covers: state-dependent text contrast (1.4.3), color-only cues in hover/
focus/error/status states (1.4.1 ×3, 1.4.11 state-indicator), stale/recomputed **name** & **state/value** after
activation (4.1.2 ×3–4), value-settability, 4.1.3 announce-timing, hover persistence-timing.

**C2 · Reveal-state producer** (= DEFERRED-TODO item D, but here scoped to OUR SCs). Activate disclosures / tabs /
menus / modals / **roving-tabindex composite widgets**, emit the revealed subjects, and drive **arrow-key** +
focus-walk. Covers: 2.4.3 reveal-then-check focus order (F85 ×2), 2.1.2 arrow-key composite-widget trap +
modal-containment, 2.1.1 composite operability, 1.4.13 focus-triggered reveal, 3.3.2 focus-revealed instruction.
~9 aspects. *The arrow-key driver and the reveal producer are the two missing primitives the keyboard agent flagged.*

**C3 · Full-page / tiled structure vision** (= DEFERRED-TODO item G). The four structure rubrics declare
`visionEvidence:[viewport]` → blind below the fold. Covers below-fold section/heading/list/relationship judgment
for 1.3.1, 1.3.2, 2.4.6, 2.4.10. ~6 aspects (and de-risks several PARTIALs).

### TIER 2 — bounded deterministic runners / fact bundles

**C4 · Non-text contrast runner (1.4.11)** — 1.4.11 has **NO deterministic runner at all** (oracle notes this).
Deterministic contrast of UI-component boundaries / state indicators / focus indicators / graphical objects vs the
**adjacent** surface (extend the text-contrast-pixel pattern + resolve_part_color). Covers ~5–6 of 7 1.4.11 aspects.

**C5 · Form constraint + message-binding facts (3.3.1/3.3.2/3.3.3)** — `form-error-probe` is per-field/barrier-only
and never **binds the error/suggestion to THE failing field** nor passes the **violated constraint** to the rubric.
Collect field constraints (required/pattern/min-max/type) + bind each error/suggestion message to its field + page
error-summary set. Covers error-vs-constraint match, error-field-binding, instruction-vs-constraint, suggestion-
correctness, suggestion-reachability (~7 aspects).

**C6 · Reflow culprit-classifier + two-width diff (1.4.10)** — the probe measures 320px only and its `isExempt`
**inverts G225** (treats a carousel's `overflow:auto` ancestor as a legit 2-D affordance → false PASS). Add a
wide-vs-320 baseline diff (F102 disappearing content; G224 indentation) + overflow-culprit classification
(C33 unbreakable string vs 2-D content vs sticky/fixed consuming the viewport vs G225 stranded panel). ~5 aspects + a BUG fix.

### TIER 3 — wiring (tool exists, not required) + small signals

**C7 · Make deterministic color/OCR/render/destination evidence REQUIRED (not LLM-discretionary)** — several CDP
tools exist but are tools-enabled/optional, so the (often inert) LLM lane is the only consumer: `render_with_overrides`
CVD/grayscale for 1.4.1 color-coded graphics; `ocr_image_text` for 1.4.5 / 1.1.1 image-of-text-vs-alt; `resolve_destination`
(make required + cross-origin) for the 2.4.4 same-name/icon/functional cluster; `compute_contrast`/`resolve_part_color`
feeding C4. ~8 aspects across SCs become deterministic or rubric-required.

**C8 · Targeted small signals** — `long-description-resolver` (resolve describedby/figcaption/`<details>`/adjacent-table
TEXT for 1.1.1 long-desc — today only a presence boolean); `glyph-substitution-detect` (icon-font/homoglyph/pseudo-
element text lookalikes, 1.1.1); `iframe-content-summary` (4.1.2 iframe-name descriptiveness); `multipart-field-grouping`
(4.1.2 compound control); `positive-tabindex-F44` (2.4.3, trivially collectable, unsurfaced); `pointer-only-handler`
via `addEventListener` not just inline `on*` (2.1.1). ~6 aspects.

### DEFER (out of single-page scope or very niche — note, don't build now)
- `cross-page-title-comparison` (2.4.2 stale/distinguishing-in-set) — needs a page SET; single-page boundary.
- `ascii-column-detection` (1.3.1/1.3.2 `<pre>`/whitespace faux tables) — niche plain-text.
- `keystroke-timing-sweep` (2.1.1) — near-extinct surface.
- `dom-vs-visual reading order beyond within-column` (1.3.2 linearization/bidi/responsive) — real but high-effort
  + high false-positive risk (order-check is deliberately cross-column-blind for soundness); revisit after C3.

## Prioritization for prototyping (leverage × tractability × determinism)
1. **C4 non-text-contrast runner** — bounded, deterministic, an entire SC under-served, verifiable without the LLM. **START HERE.**
2. **C1 interaction-driven capture** — highest aspect count; the core dynamic gap.
3. **C2 reveal-state producer** — unlocks keyboard/focus + feeds C1; coordinate with the external dev's paused reveal work.
4. **C5 form constraint/binding**, **C6 reflow classifier (+G225 bug)** — bounded deterministic.
5. **C7 wiring**, **C8 small signals** — cheap, incremental.
6. **C3 full-page vision** — high value but cross-cuts capture pipeline; do after C1.

Each capability ships with its own ≥10 positive / ≥10 negative adversarial test cases per aspect (independently
generated + validated), prototyped and iterated to robustness BEFORE the held-out act-augmented set is used to validate.
