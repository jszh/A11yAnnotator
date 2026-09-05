# case-07 — paired counterfactual PASS for case-01

## Pair and scenario
This page is the passing counterpart of **case-01** in the same aspect. The Northwind pricing page keeps the same visual hierarchy and copy as case-01.

## Exact repair
Replace only the visually heading-styled paragraphs with matching h1/h2/h3 elements while retaining their classes and rendering.

All other realistic content, presentation, controls, and page structure from case-01 are retained.

## Element / selector
`h2.section-title`

## Expected ACT-style outcome
**passed** — SC 1.3.1. Every visual heading now exposes the corresponding programmatic heading level.

## Why this is a hard negative
Visual styling is effectively identical, so only inspection of the accessibility semantics distinguishes the pass. It is deliberately paired with case-01, so a detector must distinguish the repaired semantic or behavioral boundary rather than rely on the page topic or visual template.

## Citation
**Reference:** wcag-techniques/failures/F2.html
> The author intended to make a heading but didn't want the look of the default HTML heading. So they used CSS to style the P element to look like a heading and they called it a heading. But they failed to use the proper HTML heading element. Therefore, the Assistive Technology could not distinguish it as a heading.
