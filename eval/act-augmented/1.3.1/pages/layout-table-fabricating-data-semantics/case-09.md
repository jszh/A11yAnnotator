# case-09 — paired counterfactual for case-05

## Pair and scenario
The Helmsman operations dashboard keeps the same six independent metric cards, values, trend cues, app chrome, and actual board layout from case-05: two populated wrapper columns, each stacking three widgets vertically.

This page is paired with **case-05** in the same aspect and retains its realistic page content, visual design, controls, and surrounding structure.

## Exact repair
Remove only the fabricated ARIA table/row/header/cell role system. Use a labelled `section` for the board while leaving its two populated wrapper columns and each independent widget unchanged.

## Element / selector
`section.board[aria-labelledby="metrics-heading"]`

## Expected ACT-style outcome
**passed** — SC 1.3.1. The two stacks of independent cards no longer fabricate data-table relationships.

## Why this is a hard negative
ARIA structure validators accept the failed source because its ownership chain is internally legal. This pair tests the semantic applicability decision: a visually aligned grid is not necessarily tabular data.

## Citation
**Reference:** refs/trusted-tester/sc-1.3.1-info-and-relationships.md
> BOTH: the layout does NOT use `role="table"`/associated ARIA table attributes AND does NOT include table structure/relationship elements or attributes (e.g., `<th>`, `scope="row"`).
