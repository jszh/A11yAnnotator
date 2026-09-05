# case-07 — paired counterfactual PASS for case-01

## Pair and scenario
This page is the passing counterpart of **case-01** in the same aspect. The garden-centre carousel retains the same five cards between header and footer navigation as case-01.

## Exact repair
Remove only the last card’s Tab handler that wrapped focus to the first card.

All other realistic content, presentation, controls, and page structure from case-01 are retained.

## Element / selector
`#lastCard`

## Expected ACT-style outcome
**passed** — SC 2.1.2. Forward Tab from the final carousel control now exits naturally to the footer links.

## Why this is a hard negative
The same substantive focus region remains; testing the boundary after its final control is required. It is deliberately paired with case-01, so a detector must distinguish the repaired semantic or behavioral boundary rather than rely on the page topic or visual template.

## Citation
**Reference:** wcag-techniques/general/G21.html
> Ensuring that the keyboard function for advancing focus within content (commonly the tab key) exits the subset of the content after it reaches the final navigation location.
