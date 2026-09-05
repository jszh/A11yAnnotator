# case-14 — Survey group repaired with fieldset and legend

## Pair and category

Paired PASS for **case-02**. Batch `initial-79-actlike-v2`; category `context-extraction`.

## Exact repair

Wrap the first radio set in a fieldset and turn the existing visible question into its legend.

## Primary selector

`fieldset:first-of-type`

## Accessibility mechanism

The group relationship is carried by the ancestor fieldset/legend, not by any individual radio snippet.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required relationship or purpose. A target-only extractor can omit the decisive evidence, which is the intended specificity stressor.

## Citation

**Reference:** refs/trusted-tester/sc-1.3.1-info-and-relationships.md

> At minimum, radio buttons and checkboxes should be programmatically associated with their question and response.
