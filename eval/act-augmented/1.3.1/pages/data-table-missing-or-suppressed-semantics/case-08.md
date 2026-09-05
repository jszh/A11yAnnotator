# case-08 — paired counterfactual PASS for case-02

## Pair and scenario
This page is the passing counterpart of **case-02** in the same aspect. The finance-intranet expense grid retains the spreadsheet styling, cost centres, months, and figures from case-02.

## Exact repair
Convert only xl-hdr and xl-rowlbl cells to th with scope=col and scope=row respectively.

All other realistic content, presentation, controls, and page structure from case-02 are retained.

## Element / selector
`table.xl`

## Expected ACT-style outcome
**passed** — SC 1.3.1. The financial values now expose both cost-centre and period relationships to assistive technology.

## Why this is a hard negative
The original spreadsheet-like appearance remains, forcing evaluation of the repaired cell semantics. It is deliberately paired with case-02, so a detector must distinguish the repaired semantic or behavioral boundary rather than rely on the page topic or visual template.

## Citation
**Reference:** wcag-understanding/info-and-relationships.html
> items that share a common characteristic are organized into a table where the relationship of cells sharing the same row or column and the relationship of each cell to its row and/or column header are necessary for understanding
