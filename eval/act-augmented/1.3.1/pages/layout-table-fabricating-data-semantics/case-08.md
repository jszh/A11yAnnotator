# case-08 — paired counterfactual PASS for case-02

## Pair and scenario
This page is the passing counterpart of **case-02** in the same aspect. The Marlowe & Finch header keeps the same logo, search form, utility links, and legacy table layout as case-02.

## Exact repair
Remove only the misleading caption and set role=presentation on the site-header table.

All other realistic content, presentation, controls, and page structure from case-02 are retained.

## Element / selector
`table.siteheader[role="presentation"]`

## Expected ACT-style outcome
**passed** — SC 1.3.1. The header strip is exposed as page content rather than a named data table.

## Why this is a hard negative
The visual page is unchanged and the repaired presentational boundary is only programmatic. It is deliberately paired with case-02, so a detector must distinguish the repaired semantic or behavioral boundary rather than rely on the page topic or visual template.

## Citation
**Reference:** wcag-techniques/failures/F46.html
> Likewise, there is no need for an additional description of a table which is only used to layout content. Do not include a summary attribute and do not use the summary attribute to describe the table as, for instance, "layout table". When spoken, this information does not provide value and will only distract users navigating the content via a screen reader.
