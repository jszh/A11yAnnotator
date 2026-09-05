# case-10 — paired counterfactual for case-05

## Pair and scenario
The emergency EpiPen procedure keeps the same safety warning, six ordered steps, custom number chips, and article styling as case-05.

This page is paired with **case-05** in the same aspect and retains its realistic page content, visual design, controls, and surrounding structure.

## Exact repair
Remove only `role="presentation"` from the real ordered list. The CSS counter remains the visual number treatment while the native list and listitem relationships remain exposed.

## Element / selector
`ol.steps:not([role])`

## Expected ACT-style outcome
**passed** — SC 1.3.1. The procedure’s sequence and item membership are programmatically determinable.

## Why this is a hard negative
A visual heuristic sees the same generated counters in source and repair. The meaningful difference is whether the ordered-list relationship survives into the accessibility tree.

## Citation
**Reference:** wcag-techniques/failures/F92.html
> The WAI-ARIA role of presentation on the other hand, is intended to suppress semantic information of content from the accessibility API and prevent user agents from conveying that information to the user. Use of role="presentation" for content which should convey semantic information may prevent the user from understanding that content.
