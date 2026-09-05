# case-09 — paired counterfactual for case-04

## Pair and scenario
The Route 14 timetable keeps the same caption, stop rows, bus columns, scoped headers, values, and styling as case-04.

This page is paired with **case-04** in the same aspect and retains its realistic page content, visual design, controls, and surrounding structure.

## Exact repair
Remove only `role="presentation"` from the genuine timetable. Its native table, row, column-header, row-header, and cell relationships are therefore retained in the accessibility tree.

## Element / selector
`table.tt:not([role])`

## Expected ACT-style outcome
**passed** — SC 1.3.1. The genuine timetable’s row and column relationships remain programmatically determinable.

## Why this is a hard negative
A DOM-only comparison sees the same caption, th, scope, and cells in both pages. Correct classification requires applying presentational-role conflict and inspecting the effective accessibility tree.

## Citation
**Reference:** refs/trusted-tester/sc-1.3.1-info-and-relationships.md
> A data table with `role="presentation"` will not convey table semantics and **fails** this test.
