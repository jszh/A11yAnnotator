# case-12 — Duplicate order-form links named by external destination headings

## Pair and category

Paired PASS for **case-01**. Batch `initial-79-actlike-v2`; category `external-reference`.

## Exact repair

Keep both visible “order form” labels and reference the matching destination section heading.

## Primary selector

`.lead a[aria-labelledby]`

## Accessibility mechanism

The links remain visually identical, while their computed names resolve to different external section headings.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required relationship or purpose. A target-only extractor can omit the decisive evidence, which is the intended specificity stressor.

## Citation

**Reference:** wcag-understanding/link-purpose-in-context.html

> It is a best practice for links with the same destination to have consistent text (and this is a requirement per Success Criterion 3.2.4 Consistent Identification for pages in a set). It is also a best practice for links with different purposes and destinations to have different link text.
