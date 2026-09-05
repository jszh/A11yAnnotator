# case-08 — paired counterfactual for case-06

## Pair and scenario
The theatre booking page keeps the same 4×6 map, seat coordinates, checkbox behavior, labels, legend, and CSS placement as case-06.

This page is paired with **case-06** in the same aspect and retains its realistic page content, visual design, controls, and surrounding structure.

## Exact repair
Change only the source order of the 24 seat buttons from random scatter to column-major seat-number order: A1/B1/C1/D1, then A2/B2/C2/D2 through seat 6. CSS keeps every button in its original visual coordinate.

## Element / selector
`.map[role="group"] button.seat[role="checkbox"]`

## Expected ACT-style outcome
**passed** — SC 2.4.3. The column-major spatial order is a valid alternative that preserves the map’s meaning and operation.

## Why this is a hard negative
The focus ring does not follow the visually familiar A1→A6 row. The page tests whether a detector recognizes a coherent but less expected column order rather than requiring one preferred visual scan.

## Citation
**Reference:** wcag-understanding/focus-order.html
> Care should be taken so that the focus order makes sense to both of these sets of users and does not appear to either of them to jump around randomly.
