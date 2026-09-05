# case-07 — paired counterfactual PASS for case-01

## Pair and scenario
This page is the passing counterpart of **case-01** in the same aspect. The Meridian Review article retains the same title, byline, dateline, abstract, and genuine section headings as case-01.

## Exact repair
Replace only the byline h3 and dateline h4 with styled paragraph elements.

All other realistic content, presentation, controls, and page structure from case-01 are retained.

## Element / selector
`p.byline`

## Expected ACT-style outcome
**passed** — SC 1.3.1. Author and publication metadata no longer fabricate sections, while real h2 sections remain headings.

## Why this is a hard negative
All typography is retained; the pass depends on distinguishing metadata from section headings. It is deliberately paired with case-01, so a detector must distinguish the repaired semantic or behavioral boundary rather than rely on the page topic or visual template.

## Citation
**Reference:** wcag-techniques/failures/F43.html
> However, the h3 and h4 elements between the title and the abstract are used only for visual effect — to control the fonts used to display the authors' names and the date.
