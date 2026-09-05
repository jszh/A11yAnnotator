# case-15 — Sensor resources named by remote variant headings

## Pair and category

Paired PASS for **case-05**. Batch `initial-79-context-v3`; category `context-extraction`.

## Exact repair

Combine each resource link’s own text with its visually corresponding S2 variant heading.

## Primary selector

`.links-block a[aria-labelledby]`

## Accessibility mechanism

The grid headings are outside each links-block parent, so Standard or Pro appears in the computed link name but nowhere in GenA11y’s extracted parent context.

## GenA11y payload contract

The exact `extract_links` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** WCAG Technique F63 (wcag-techniques/failures/F63.html)

> This describes a failure condition when the context needed for understanding the purpose of a link is located in content that is not programmatically determined link context.
