# case-13 — Hotel quick links explicitly named by external hotel headings

## Pair and category

Paired PASS for **case-01**. Batch `initial-79-actlike-v2`; category `external-reference`.

## Exact repair

Give every short action link a self-first aria-labelledby reference to the matching existing hotel heading.

## Primary selector

`.resource-bar a[aria-labelledby]`

## Accessibility mechanism

The heading is outside the quick-links list, but the accessible name explicitly includes the correct hotel.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required relationship or purpose. A target-only extractor can omit the decisive evidence, which is the intended specificity stressor.

## Citation

**Reference:** WCAG Technique H80 (wcag-techniques/html/H80.html)

> Find the heading element that precedes the link
