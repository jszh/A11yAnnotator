# case-07 — paired counterfactual PASS for case-01

## Pair and scenario
This page is the passing counterpart of **case-01** in the same aspect. The county portal keeps its legacy table-based page layout and all page regions from case-01.

## Exact repair
Remove the false th/scope relationship and mark the layout table role=presentation; the masthead becomes a plain td.

All other realistic content, presentation, controls, and page structure from case-01 are retained.

## Element / selector
`table.portal[role="presentation"]`

## Expected ACT-style outcome
**passed** — SC 1.3.1. The legacy grid no longer fabricates data-table header relationships while its visual layout remains intact.

## Why this is a hard negative
This is a boundary pass where a legacy layout table is neutralized rather than mistaken for a data table. It is deliberately paired with case-01, so a detector must distinguish the repaired semantic or behavioral boundary rather than rely on the page topic or visual template.

## Citation
**Reference:** wcag-techniques/failures/F46.html
> The objective of this technique is to describe a failure that occurs when a table used only for layout includes either th elements, a summary attribute, or a caption element. This is a failure because it uses structural (or semantic) markup only for presentation. The intent of the HTML table elements is to present data.
