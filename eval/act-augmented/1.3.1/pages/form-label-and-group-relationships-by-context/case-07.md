# case-07 — paired counterfactual PASS for case-01

## Pair and scenario
This page is the passing counterpart of **case-01** in the same aspect. The vineyard reservation form retains the same four labels, inputs, CSS grid, and explicit for/id relationships as case-01.

## Exact repair
Swap only the four input grid placements so each control appears directly beneath the visible label that already names it programmatically.

All other realistic content, presentation, controls, and page structure from case-01 are retained.

## Element / selector
`form .grid input`

## Expected ACT-style outcome
**passed** — SC 1.3.1. Visual proximity and programmatic label associations now agree for every field.

## Why this is a hard negative
The underlying label wiring was always valid; the pass requires checking that the repaired visual context no longer contradicts it. It is deliberately paired with case-01, so a detector must distinguish the repaired semantic or behavioral boundary rather than rely on the page topic or visual template.

## Citation
**Reference:** refs/trusted-tester/sc-1.3.1-info-and-relationships.md
> The combination of the accessible name, accessible description, and other programmatic associations (e.g., table column and/or row associations) describes each input field and includes all relevant instructions and cues (textual and graphical).
