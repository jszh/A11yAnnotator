# case-07 — paired counterfactual PASS for case-01

## Pair and scenario
This page is the passing counterpart of **case-01** in the same aspect. The school cafeteria page retains the same weekday-by-meal menu and surrounding school context as case-01.

## Exact repair
Replace only the whitespace-aligned menu paragraph with a semantic table using scoped day and meal headers.

All other realistic content, presentation, controls, and page structure from case-01 are retained.

## Element / selector
`table.menu-data`

## Expected ACT-style outcome
**passed** — SC 1.3.1. Each food item now has determinable day and meal relationships.

## Why this is a hard negative
The same dense menu remains visible, but its relationships no longer depend on spaces. It is deliberately paired with case-01, so a detector must distinguish the repaired semantic or behavioral boundary rather than rely on the page topic or visual template.

## Citation
**Reference:** wcag-techniques/failures/F34.html
> The objective of this technique is to describe how using white space characters, such as space, tab, line break, or carriage return, to format tables in text content is a failure to use structure properly. When tables are created in this manner there is no way to indicate that a cell is intended to be a header cell, no way to associate the table header cells with the table data cells, or to navigate directly to a particular cell in a table.
