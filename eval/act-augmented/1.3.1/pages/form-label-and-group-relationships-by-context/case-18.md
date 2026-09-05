# case-18 — RTL date group repaired with fieldset and legend

## Pair and category

Paired PASS for **case-05**. Batch `initial-79-actlike-v2`; category `context-extraction`.

## Exact repair

Replace the date wrapper with a fieldset and the existing visible question with a legend.

## Primary selector

`fieldset.field`

## Accessibility mechanism

The accessible group name is conveyed by ancestor fieldset/legend structure rather than repeated on each date input.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required relationship or purpose. A target-only extractor can omit the decisive evidence, which is the intended specificity stressor.

## Citation

**Reference:** wcag-techniques/aria/ARIA17.html

> Social security number fields which are nine digits long and broken up into three segments can be grouped using role="group".
