# case-01 — Pastel pie chart, four adjoining low-contrast wedges, NO labels/values/legend/table

## Scenario
A SaaS analytics product ("MetricFlow") renders a "Browser market share — Q2 2026" pie chart
as inline SVG. Four wedges (Chrome 48%, Safari 31%, Edge 14%, Firefox 7%) are drawn in the
dashboard's "Pastel" theme. There are **no percentage labels, no values, no legend, and no data
table** anywhere on the page — the wedge slices are the only representation of the data. The
adjoining wedge colours differ from each other by only ~1.1–1.3:1, and no wedge contrasts with
its neighbour (or with the white page) by 3:1. To read the chart at all, a viewer must perceive
where one slice ends and the next begins; for a person with moderately low vision those wedge
boundaries blur together and the proportions become unreadable.

## Attribute tuple
- **content-domain:** SaaS analytics dashboard
- **UI-component/pattern:** inline-SVG pie chart (no legend, no labels)
- **host-language construct:** `<svg role="img" aria-label="…">` with four `<path>` wedges
- **locale/i18n:** en-US
- **failure-mechanism:** G209 boundary rule violated — adjoining colour segments below 3:1 with
  no 3:1 separating border; the slice boundaries are the graphical objects required for
  understanding and there is no equivalent text to exempt them.

## Developer persona
A front-end engineer wired the chart to the company's charting wrapper and picked the built-in
"Pastel" palette because it matched the marketing site. He gave the `<svg>` a tidy
`role="img"` + `aria-label` to "make it accessible," and axe-core reported zero violations, so
he shipped it. He never considered that the pastel wedges sit ~1.2:1 apart, nor that with no
labels or table the slice edges *are* the data.

## Element / selector carrying the issue
`svg.pie` and specifically the four `<path>` wedges (`svg.pie path`). The discriminating signal
is the `fill` of each adjoining wedge (`#6FA8DC`, `#93C47D`, `#E0A0A0`, `#E8C8E0`) and the
absence of any 3:1 boundary stroke between them. No `<text>` label, no legend, no `<table>`
exists.

## Exact accessibility mechanism (what AT experiences, why it fails)
A screen-reader user hears only "Pie chart of browser market share for Q2 2026, image" — the
`aria-label` describes the *topic* but conveys none of the four values, so the data is lost to
AT entirely. A **sighted user with low vision** is the criterion's target: the wedges are
visually present but adjoining slices differ by ~1.2:1, so the boundaries that separate Chrome
from Safari from Edge from Firefox are imperceptible — the chart collapses into one indistinct
disc and the proportions cannot be read. Per the Understanding pie-chart example and G209, the
slice boundaries are "the graphical objects conveying essential information" and must reach 3:1
(or carry a 3:1 border); here they do neither, and no labels+values exist to exempt them →
**fail**.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The SVG is well-formed and carries `role="img"` with a non-empty `aria-label`, so axe-core,
WAVE and Lighthouse register a "labelled graphic" and move on. None of them parse an SVG into
its constituent wedges, compute wedge-to-wedge boundary contrast, or reason that — because the
page has no labels, values, legend, or data table — those wedge edges are the **sole** carrier
of the data and are therefore "required for understanding." The identical pixels would be **Not
Applicable** the moment visible labels+values were added (see case-02). Deciding whether the
boundaries are required, and whether equivalent text exists, is a semantic reading-the-chart
judgment that no contrast scanner performs.

## Citation
> **WCAG 2.2 Understanding, Non-text Contrast — Pie Charts example (Fail):**
> "The pie chart has labels for each slice (so passes 1.4.1 Use of Color), but in order to
> understand the proportions of the slices you must discern the edges of the slices (the
> graphical objects conveying essential information), and the contrast between the slices is not
> 3:1 or greater."

(Verbatim from `wcag-understanding/non-text-contrast.html`. This page is a stricter variant of
that failing example: it has *no* labels at all, so the slice boundaries are unambiguously the
only data, and adjoining wedges sit ~1.2:1 apart — well below 3:1.)

> **WCAG Techniques, G209 — "Provide sufficient contrast at the boundaries between adjoining
> colors":**
> "If adjoining colors have less than 3:1 color contrast ratio difference add a border with at
> least a 3:1 color contrast with each color."

(Verbatim from `wcag-techniques/general/G209.html`. The wedges here are adjoining colours below
3:1 and have no separating border, which is exactly the condition G209 exists to remedy.)
