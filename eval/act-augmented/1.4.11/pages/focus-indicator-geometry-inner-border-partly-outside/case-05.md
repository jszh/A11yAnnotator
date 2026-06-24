# case-05 — Outer focus ring at the exact 3:1 threshold: #949494 (3.03, passes) vs #aaaaaa (2.32, fails) on white

## Scenario
A Pulse Analytics cohort-report panel with an icon-only toolbar (refresh, filter, columns,
export) on a white (`#fff`) toolbar surface. Every toolbar button uses the *same* outer grey
focus-ring style, but the colour comes from a design token that differs by one button. Three
buttons use grey `#949494` — the spec's canonical "`#949494` against white = 3:1" focus
indicator (3.033:1, passes). One button, **Export to CSV**, uses a slightly lighter grey
`#aaaaaa` (2.323:1, fails). The two greys are nearly indistinguishable and only ~0.7
contrast apart; the failing one sits just below the exact, unrounded 3:1 threshold.

## Attribute tuple
- **content-domain:** SaaS analytics dashboard (cohort-retention report)
- **UI-component/pattern:** icon-only `role="toolbar"` with SVG action buttons
- **host-language construct:** `:focus { box-shadow: 0 0 0 3px <grey> }` (outer ring), with
  one button overriding the grey token
- **locale/i18n:** en-US
- **failure-mechanism:** outer focus ring just below the 3:1 page-adjacency threshold
  (`#aaaaaa` on white = 2.32:1); the SC threshold is exact and values are not rounded

## Developer persona
A developer built a reusable `.tool` button with a grey focus ring set to the design
system's "neutral-500" (`#949494`), which the accessibility lead had blessed as exactly 3:1
on white. Later, building the export button as a one-off, he grabbed "neutral-400"
(`#aaaaaa`) from the palette by mistake — it looked the same on screen — and hard-coded the
ring there. The difference is imperceptible at a glance, so it survived review; only a
contrast measurement against the white toolbar reveals the export ring drops to 2.32:1.

## Element / selector carrying the issue
`#tool-export:focus` — `box-shadow: 0 0 0 3px #aaaaaa` against the white toolbar (FAIL,
2.32:1). Contrast against the passing siblings `.tool:focus` (`0 0 0 3px #949494` = 3.033:1),
which match the Understanding doc's canonical 3:1 focus indicator.

## Exact accessibility mechanism (what AT experiences, why it fails/passes)
A keyboard / low-vision user tabs across the toolbar. On Refresh, Filter and Columns the grey
ring is at **3.033:1** against the white surface — at the threshold, perceivable. On **Export
to CSV** the ring is **2.32:1**, below 3:1, so for a user with moderately low vision the
focused state on the export action is too faint to perceive reliably; they cannot confirm
which icon they are about to activate. Per the Understanding note, "2.999:1 would not meet the
3:1 threshold" — the values are compared exactly, not rounded, so `#aaaaaa` fails and
`#949494` passes. Both rings are genuinely rendered; the `:focus` rules fire.

## Expected ACT-style outcome
**failed** (the failing `#tool-export` is on the page; the `#949494` siblings are the passing
threshold reference)

## Why automated tools miss it
A focus ring is present and changes on focus for *every* button, so axe-core, WAVE and
Lighthouse focus-visible heuristics pass uniformly — they cannot tell the export button apart
from the others. None of them measures the contrast of an author-supplied focus **ring**
against the page/toolbar surface, and none polices the exact (unrounded) 3:1 boundary that
separates `#949494` (pass) from `#aaaaaa` (fail). The two greys are visually identical to a
casual eye, so manual spot-checks miss it too. Catching this needs a deliberate
ring-vs-surface contrast measurement applied at the exact threshold — judgement automation
does not apply to focus rings.

## Citation
> **WCAG 2.2 Understanding, Non-text Contrast — Intent note on thresholds:**
> "The 3:1 contrast ratios referenced in this success criterion is intended to be treated as
> threshold values. When comparing the computed contrast ratio to the success criterion
> ratio, the computed values should not be rounded (e.g. 2.999:1 would not meet the 3:1
> threshold)."

(Verbatim from `wcag-understanding/non-text-contrast.html`. The `#aaaaaa` ring computes
2.32:1 — below the un-rounded 3:1 threshold — so it fails, while `#949494` at 3.033:1 passes.)

> **WCAG 2.2 Understanding, Non-text Contrast (figure `figure-buttons-no-visual-indicator`):**
> "The same button, when focused, still has a sufficiently contrasting focus indicator (grey
> #949494 against white, with a contrast ratio of 3:1)."

(Verbatim from `wcag-understanding/non-text-contrast.html`. The passing toolbar buttons use
exactly this canonical `#949494`-on-white 3:1 focus ring; the export button's `#aaaaaa` drops
below it.)
