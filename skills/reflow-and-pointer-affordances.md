---
name: reflow-and-pointer-affordances
description: Judge reflow at a 320px viewport and target-size exceptions over signals the collector and deterministic runners already measured; defer where a runner disposed the obligation.
covers: cat_8 (primary)
wcag: 1.4.10 Reflow (AA, WCAG 2.1); 2.5.8 Target Size (Minimum) (AA, WCAG 2.2); 2.5.5 Target Size (Enhanced) (AAA, WCAG 2.1)
instruments: reflow runner (320x900 viewport), target-size runner, realism-corrected VSR, vision crops
behavioral: reflow=no (deterministic); target-size exceptions=judgment over handed crops
---


# reflow-and-pointer-affordances

## v3.2 division of labor
You do NOT investigate. You do NOT drive tools. There is no `--eval`, no `/ax-node`,
no "drive a submit", no "Reproduce" step list in v3.2. The collector and the
deterministic runners have already loaded the page at the 320px viewport, measured
overflow geometry, measured every target's CSS-pixel box and its neighbor spacing,
captured the realism-corrected VSR transcript, and cut the vision crops. They HAND
you those signals. Your job is to **judge meaning** over that handed evidence:
decide whether an overflow is a real 1.4.10 barrier or an exempt two-dimensional
widget, and whether an undersized target actually fails 2.5.8/2.5.5 or lands inside
a named exception.

**Defer to the runner.** Where a deterministic runner has already disposed an
obligation — clean reflow measured (`scrollW ≈ clientW`), or a target measured at or
above the threshold — that obligation is **closed**; do not re-open it with a meaning
argument. You only adjudicate the **auto-PARTIAL residue**: the cases the runner
flagged but could not itself dispose because they turn on *meaning* (is this overflow
an exempt data table? does this 24px-under control fall under the Inline or Spacing
exception?). That residue is the only thing you rule on.

## What you JUDGE
Two judgments, both scoped to evidence already handed to you over the 320px viewport
and the element crops:

1. **1.4.10 Reflow (AA, WCAG 2.1).** Given the handed overflow signal — what
   overflowed and by how much at 320px — decide whether it is a layout-level
   reflow failure or an **exempt** part. 1.4.10 *exempts* "parts of the content which
   require two-dimensional layout for usage or meaning": **data tables, maps,
   diagrams, code blocks, toolbars/spreadsheets**.
   - General layout overflowing (header, nav, product grid, article text) →
     **REPRODUCED** (1.4.10 fail).
   - Only an exempt element overflowing (a `<table>`, a map canvas) while the page
     chrome reflows to one column → **NOT REPRODUCED** (exempt). Don't fail a wide
     data table.

2. **2.5.8 Target Size (Minimum) (AA, WCAG 2.2) / 2.5.5 Target Size (Enhanced)
   (AAA, WCAG 2.1) — the EXCEPTIONS.** The runner already measured each target's box
   (the 2.5.8 minimum is **24 by 24 CSS pixels**; the 2.5.5 enhanced minimum is
   **44 by 44 CSS pixels**) and handed you the under-threshold list plus a crop of
   each. You judge only whether an under-threshold target lands inside a named
   exception:
   - **Spacing** — a 24px-diameter circle centered on the target overlaps no adjacent
     target's circle → exempt under 2.5.8.
   - **Equivalent** — another control on the same page does the same thing and meets
     the size → exempt.
   - **Inline** — the target is in a sentence or otherwise constrained by the line of
     text it sits in → exempt.
   - **User-agent control** — size determined by the user agent and not modified by
     the author → exempt.
   - **Essential** — the particular presentation is legally required or essential to
     the information → exempt.
   An under-threshold target that matches a handed exception crop → **NOT REPRODUCED**
   for that target. Under threshold with no applicable exception → **REPRODUCED**.

## Evidence you are handed
You receive, already collected — you do not gather it:
- **Precomputed a11y-eval signals.** Reflow geometry at the 320x900 viewport:
  `scrollW`, `clientW`, the boolean overflow, `bodyLen` (so you can confirm the page
  actually rendered before trusting any overflow number), and the list of which
  elements overflow. Target-size geometry: each target's measured CSS-pixel box, its
  neighbor spacing, and the under-threshold flag against 24px (2.5.8) and 44px (2.5.5).
- **The realism-corrected VSR transcript.** The screen-reader announcement as a real
  AT would surface it, already corrected for realism — read it for what the user is
  told; do not re-derive it.
- **The declared vision crops.** The 320px reflow screenshot (does the page *chrome*
  collapse to one column, or stay wide/clipped?) and one crop per under-threshold
  target (so you can see whether it is inline text, an icon button, a map control,
  etc.). Judge meaning over these crops; do not request new ones.

## WCAG soundness caveats (these STOP a false clear or a false barrier)
- **Confirm the page rendered first.** If `bodyLen` is 0, the 320px page did not
  render and the overflow number is meaningless — do not clear and do not fail on it;
  that is an instrument failure, not a reflow verdict.
- **The 1.4.10 exemption is narrow.** It covers only the part that *requires* two
  dimensions for usage or meaning. A wide table or map is exempt; the surrounding
  page chrome is NOT. If chrome and an exempt widget both overflow, the chrome
  overflow still makes it **REPRODUCED**.
- **A clean reflow measured by the runner is closed.** `scrollW ≈ clientW` is a
  deterministic NOT-REPRODUCED — do not manufacture a barrier from the crop alone.
- **Target-size exceptions are per-target, not per-page.** One exempt control does
  not exempt its neighbors; an undersized target with no applicable exception is
  still **REPRODUCED** even if other targets on the page are fine.
- **Don't promote 2.5.5 (AAA) into a 2.5.8 (AA) fail.** They are different thresholds
  (44px vs 24px) and different conformance levels; a target between 24px and 44px
  fails the AAA enhanced criterion but passes the AA minimum — keep the verdict
  attached to the correct criterion.
- **Spacing vs size are distinct.** A target under 24x24 can still pass 2.5.8 via the
  Spacing exception; do not fail on raw size when the handed neighbor-spacing signal
  satisfies the 24px-circle test.

## Output
Verdict: **REPRODUCED** / **NOT REPRODUCED** / **PARTIAL** / **N-A** — with the
criterion (1.4.10, 2.5.8, or 2.5.5) and the deciding handed signal or exception named.
