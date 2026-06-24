# case-04 — Revenue chart: `role="img"` `aria-label` frozen on Q1 after switching to Q2

## Scenario
A SaaS analytics dashboard (NorthStar). A "Regional Revenue" bar chart is a
`div role="img"` whose `aria-label` is a long, careful description of the Q1 data
("West $1.20M, East $0.94M ... West leads; South trails"). A Q1/Q2 segmented control
repoints the drawn bars and value labels to Q2 figures, updates the visible `<figcaption>`,
and flips the buttons' `aria-pressed`. But the chart's `aria-label` — its accessible name /
text alternative — stays frozen on the Q1 description.

## Attribute tuple
- **content-domain:** SaaS analytics / finance dashboard
- **UI-component/pattern:** complex data graphic as `role="img"` with a long `aria-label`, driven by a segmented quarter selector
- **host-language construct:** `aria-label` on `role="img"`; inline SVG `<rect>`/`<text>` geometry mutated by script
- **locale/i18n:** en-US, USD currency
- **failure-mechanism:** F20 — chart updated to new quarter; text alternative still describes the old quarter (F20 Failure Example 1, near-verbatim)

## Developer persona
A data-viz contractor wrote the redraw routine. It updates bar geometry, value labels, the
visible `<figcaption>`, and the pressed state of the Q1/Q2 buttons. The contractor thought
of `aria-label` as a one-time "describe the chart" string set in the template — not as
state that must track the data — so the chart's NAME is permanently the Q1 description.

## Element / selector carrying the issue
`#chart[role="img"][aria-label]` — the `aria-label` is never regenerated; only the SVG
bars/labels and the `<figcaption>` change when `#q2` is pressed.

## Exact accessibility mechanism
A screen-reader user cannot see the bars; the `aria-label` is their entire access to the
chart's meaning. At load it correctly describes Q1. After switching to Q2 the rendered bars
show East leading at $1.31M, but AT still announces "Q1 revenue by region: West $1.20M ...
West leads; South trails." The text alternative now reports last quarter's numbers and the
wrong leading region. Note the numbers in the label are real and plausible — the failure is
that they are STALE, not missing or garbage, which is precisely F20's "sales chart updated
to October, alt still describes September."

Verified with Puppeteer: after clicking `#q2`, the value-label fingerprint changed
(`$0.94M`→`$1.31M` on East) while `#chart` `aria-label` stayed the Q1 string (changed=false).

## Expected ACT-style outcome
**failed** (4.1.2; F20 dual-scopes to 1.1.1, but the chart is repointed via an interactive
named control, keeping it in the 4.1.2 dynamic-component limb).

## Why automated tools miss it
The chart is `role="img"` with a long, descriptive, NON-EMPTY `aria-label` — exactly what
good practice recommends for a complex image — so axe/Lighthouse see a properly named graphic
and pass. The label even contains real figures, so it reads as a correct alternative.
Detecting the failure requires reading the bar heights/value labels NOW rendered and
reconciling them with the prose numbers in the frozen name; no scanner extracts data from
drawn `<rect>`s and diffs it against the name string.

## Citation
> **WCAG Technique F20, Examples — Failure Example 1:** "A Sales chart is updated to October
> results, but the text alternative still describes September results."
> — `wcag-techniques/failures/F20.html`
