# case-11 — Cedar Falls Tribune — Local News

## Pair and category

Paired PASS for **case-01**. Batch `initial-79-actlike-v2`; category `act-rule-scope-boundary`.

## Exact repair

Replace only <title>Summer Sale — 20% Off Annual Subscriptions | Cedar Falls Tribune</title> with <title>Cedar Falls Tribune — Local News</title>.

## Primary selector

`head > title`

## Accessibility mechanism

Homepage title identifies the news publication rather than a secondary subscription promotion.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required relationship or purpose. A target-only extractor can omit the decisive evidence, which is the intended specificity stressor.

## Citation

**Reference:** wcag-techniques/failures/F25.html

> This describes a failure condition when the web page has a title, but the title does not identify the contents or purpose of the web page.
