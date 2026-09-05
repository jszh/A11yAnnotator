# case-14 — Details links repaired by visible list-item context

## Pair and category

Paired PASS for **case-03**. Batch `initial-79-actlike-v2`; category `context-extraction`.

## Exact repair

Add a visible purpose label in each list item and combine it with the unchanged “Details” link text.

## Primary selector

`footer li > a[aria-labelledby]`

## Accessibility mechanism

Each complete purpose depends on its containing list item and external IDREF rather than the anchor string alone.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required relationship or purpose. A target-only extractor can omit the decisive evidence, which is the intended specificity stressor.

## Citation

**Reference:** Trusted Tester v5.1.3 SC 2.4.4 (refs/trusted-tester/sc-2.4.4-link-purpose.md)

> "Programmatically determined link context" is limited to same sentence/paragraph/list-item/table-cell or associated table header — not arbitrary nearby text.
