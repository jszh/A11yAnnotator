# Harness 3.0 — The 8 Experiments: design, soundness, pitfalls

Synthesized from four parallel design passes. Each experiment follows the `focus-visual-retry`
TEMPLATE (hydration settle → real input → independent channels → channel-agreement gate →
INCONCLUSIVE on any disagreement/uncertainty). All ship **shadow** (authority default); a clear
publishes only on a mechanism's *decidable sub-domain*, gated by a "universe-closing" obligation that
is false whenever the WCAG universal is open — so hard cases auto-PARTIAL instead of false-clearing.

## Soundness summary

| # | Experiment id | SC | claim-family | Clearable? | Why / universe-closing obligation |
|---|---|---|---|---|---|
| C3 | `text-contrast-pixel` | 1.4.3 | text-contrast | **CLEAR** (closed-scope) | flat opaque fg over flat opaque bg ⇒ contrast is a finite decidable ratio. `backdropIsSolidUniform` closes it: image/gradient ⇒ can't clear. |
| C5 | `keyboard-trap-escape` | 2.1.2 | no-keyboard-trap *(new)* | **CLEAR** (per-component) | the escape-mechanism set is finite {Tab, Shift+Tab, Esc}; reach region by real keyboard, prove one mechanism leaves without escaping to chrome. |
| C6 | `field-label-probe` | 3.3.2 | field-label *(new)* | **CLEAR** (closed-scope, AT-dep) | label sub-claim only: non-placeholder programmatic name AND a co-located visible label. Format-instruction sufficiency is out of scope (never cleared). |
| C4 | `keyboard-activation` | 2.1.1 | keyboard-operable | **CLEAR** (single-mode only) | `singleModeControl ∧ modeInventoryClosed` collapses "all functionality" to {focus, activate}; composites/sliders auto-PARTIAL. |
| C1 | `ax-state-diff` | 4.1.2 | name-role-value | **CLEAR** (closed-state, AT-dep) | `statesInventoryClosed`: clearable only for a role's finite ARIA-prescribed state set; CDP AX tree vs DOM channel must agree. Notifications NOT in scope. |
| C9 | `hover-content-tri` | 1.4.13 | hover-content *(new)* | **BARRIER-ONLY** | open trigger set (JS/portal tooltips) + Persistent needs unbounded dwell ⇒ universal undecidable. A proven property failure is a sound barrier. |
| C8 | `reflow-overflow-probe` | 1.4.10 | reflow-no-hscroll *(new, page-level)* | **BARRIER-ONLY** | "no 2D scroll" is decidable but "no loss of info/function" (truncation, display:none, clip) is open-world. |
| C7 | `focus-obscured-barrier` | 2.4.11 | focus-not-obscured *(new)* | **BARRIER-ONLY** | obscuration across the continuous scroll range + dynamic overlays is unbounded; observe a barrier at one state, never clear. |

## Channel design (the false-verdict antidote, per experiment)
- **C3:** computed contrast (a11y-eval `contrastRatio`) vs rendered-pixel corroboration; alpha-composite fg+bg + ancestor opacity; two reads must agree (no color animation). Gradient/image backdrop ⇒ can't clear; best-pixel-passes-some-fail ⇒ INCONCLUSIVE.
- **C5:** real Tab/Shift+Tab/Esc; `focusStaysInDocument` (no URL-bar/iframe escape); modal that closes on Esc is NOT a trap; one-way trap ⇒ INCONCLUSIVE.
- **C6:** AccName (excludes placeholder) vs visible-label detection (sr-only ⇒ no clear); label `for` must target THIS field; dangling `aria-labelledby` ⇒ barrier.
- **C4:** real key vs synthetic (`realKeyDistinctFromSynthetic`); observed effect = AX delta OR pixel OR focus move; roving items reached via container; nav-away caps at activation evidence.
- **C1:** DOM aria channel vs FRESH CDP AX snapshot (never echo DOM for both); pruned/ignored node ⇒ INCONCLUSIVE; nav-away ⇒ INCONCLUSIVE.
- **C9:** whole-document appearance diff (portal-aware); path-move for Hoverable (bridge gaps); auto-hide timeout ⇒ Persistent barrier; native `title` exempt.
- **C8:** `documentElement.scrollWidth>clientWidth` at 320×256; exempt tables/maps/own-scrollers; `overflow:hidden` clip-hiding ⇒ INCONCLUSIVE (can't clear).
- **C7:** `elementsFromPoint` paint order (not z-index); 9-point grid for ENTIRELY-covered; re-test after `scrollIntoView` (revealed-on-focus exception); transparent/`pointer-events:none` overlay ⇒ no barrier.

## New families (applicability-oracle FAMILIES)
`no-keyboard-trap`→2.1.2/keyboard-operability · `field-label`→3.3.2/forms-instructions-errors ·
`hover-content`→1.4.13/color-and-visual-text · `reflow-no-hscroll`→1.4.10/reflow (page-level) ·
`focus-not-obscured`→2.4.11/focus-management. (text-contrast, keyboard-operable, name-role-value already exist.)

## Registry decisions
Clearable (add completeness + closed/exception): **1.4.3, 2.1.2, 3.3.2, 2.1.1, 4.1.2** (the last two clearable only via a universe-closing obligation in the completeness set). Barrier-only / stays open-scope-never-clearable: **1.4.13, 1.4.10, 2.4.11**. 4.1.2 & 3.3.2 are AT-dependent ⇒ `accessibilitySupportDependent:true` (clear needs a declared AT baseline). 2.1.2 added to `KEYBOARD_INTERACTION_SCS`.

## Page-level obligation (C8)
1.4.10 is page-scoped. The oracle emits a synthetic obligation `xpath:/page-level::reflow` from
`collect.page.reflowApplicable` (outside the per-element loop), so the per-element enumerator still
owns it and `aggregateElementSkill` buckets it under the `reflow` skill. It can only barrier/PARTIAL.

## Implementation order (each = wiring + runner + fixture + adversarial test-repair + doc)
Clearable first (they exercise the completeness machinery hardest): C3 → C5 → C6 → C4 → C1.
Then barrier-only: C9, C8, C7. Everything stays shadow; promotion remains gated on gold + the
adversarial fixture suite per [v3-gold/README.md](v3-gold/README.md).

## Status: IMPLEMENTED & VERIFIED on real Chrome
All eight runners are built ([exp-runners.js](../scripts/v3/lib/exp-runners.js), dispatched from
[run-experiments.js](../scripts/v3/lib/run-experiments.js)), wired through the catalog/registry/oracle/
completeness machinery (all four validators clean), with a generic catalog-driven
[proposer](../scripts/v3/lib/proposer.js). Each has a deterministic fixture bundling its
clear/barrier/inconclusive **and adversarial** cases, and a real-Chrome regression test in
[experiments.test.js](../scripts/v3/tests/experiments.test.js). Verified verdicts:

| Experiment | Fixture | Cases proven correct |
|---|---|---|
| C3 1.4.3 | `fx-v3-c3-contrast.html` | clear (21:1, large-bold 3:1); barrier (grey, **rgba-composited**); inconclusive (**gradient**, **colour-animation**) |
| C6 3.3.2 | `fx-v3-c6-fields.html` | clear (assoc. visible label); barrier (placeholder-only, unassociated, **dangling labelledby**); inconclusive (**sr-only**, **title-only**) |
| C5 2.1.2 | `fx-v3-c5-{modal,trap}.html` | clear (modal closes on **Esc**); barrier (true cycle, no escape) |
| C4 2.1.1 | `fx-v3-c4-keyboard.html` | clear (native button Enter+Space); barrier (div-button no handler, **synthetic-only**) |
| C1 4.1.2 | `fx-v3-c1-ax.html` | clear (aria-expanded reflected in CDP AX); barrier (**no accessible name**) |
| C8 1.4.10 | `fx-v3-c8-{overflow,table}.html` | barrier (900px @ 320); inconclusive (**2D-exempt table**) |
| C7 2.4.11 | `fx-v3-c7-{consent,sticky}.html` | barrier (full consent overlay); inconclusive (**revealed after scroll**) |
| C9 1.4.13 | `fx-v3-c9-autohide.html` | barrier (**auto-hide ⇒ Persistent fails**) |

Soundness preserved: clearable SCs publish a clear ONLY when their universe-closing obligation holds
(`backdropIsSolidUniform` / `escapeProvenForWidget` / `programmaticNamePresent`+`visibleLabelText` /
`singleModeControl` / `statesInventoryClosed`); 4.1.2 & 3.3.2 clears additionally require an AT
baseline. All eight remain **shadow** by default — no authoritative publication until promotion.

