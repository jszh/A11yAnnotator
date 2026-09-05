# case-08 — paired counterfactual PASS for case-02

## Pair and scenario
This page is the passing counterpart of **case-02** in the same aspect. The university LMS retains the same weekly course schedule and navigation as case-02.

## Exact repair
Replace only the tab-aligned pre block with a semantic schedule table using scoped time and weekday headers.

All other realistic content, presentation, controls, and page structure from case-02 are retained.

## Element / selector
`table.schedule-data`

## Expected ACT-style outcome
**passed** — SC 1.3.1. Every class session now exposes its time/day intersection programmatically.

## Why this is a hard negative
The monospaced grid appearance remains, so a detector must inspect actual relationships. It is deliberately paired with case-02, so a detector must distinguish the repaired semantic or behavioral boundary rather than rely on the page topic or visual template.

## Citation
**Reference:** wcag-techniques/failures/F48.html
> This document describes a failure caused by use of the HTML pre element to markup tabular information. The pre element preserves only visual formatting. If the pre element is used to markup tabular information, the visually implied logical relationships between the table cells and the headers are lost if the user cannot see the screen or if the visual presentation changes significantly.
