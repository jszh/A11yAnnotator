# case-12 — Payment — Loomwell Checkout

## Pair and category

Paired PASS for **case-02**. Batch `initial-79-actlike-v2`; category `act-rule-scope-boundary`.

## Exact repair

Replace only <title>Checkout</title> with <title>Payment — Loomwell Checkout</title>.

## Primary selector

`head > title`

## Accessibility mechanism

Checkout title distinguishes the payment step from the other steps.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required relationship or purpose. A target-only extractor can omit the decisive evidence, which is the intended specificity stressor.

## Citation

**Reference:** wcag-techniques/failures/F25.html

> A site generated using templates includes the same title for each page on the site. So the title cannot be used to distinguish among the pages.
