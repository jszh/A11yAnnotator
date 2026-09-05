# case-07 — paired counterfactual PASS for case-01

## Pair and scenario
This page is the passing counterpart of **case-01** in the same aspect. The Northwind plan comparison retains the same two-axis matrix and values as case-01.

## Exact repair
Change only the visual header cells to th: plan names use scope=col and feature names use scope=row.

All other realistic content, presentation, controls, and page structure from case-01 are retained.

## Element / selector
`table.compare`

## Expected ACT-style outcome
**passed** — SC 1.3.1. Every data value now has programmatically determinable row and column headers.

## Why this is a hard negative
The table looks unchanged; the pass depends on correct header relationships rather than visual bands. It is deliberately paired with case-01, so a detector must distinguish the repaired semantic or behavioral boundary rather than rely on the page topic or visual template.

## Citation
**Reference:** wcag-techniques/failures/F91.html
> This failure occurs when data tables do not use header elements (th) or other appropriate table mark-up (the scope attribute, headers and id or the ARIA columnheader and rowheader) roles to make the headers programmatically determinable from within table content. Making headers programmatically determinable is especially important when data cells are only intelligible together with header information.
