# case-16 — Two permit questions repaired with fieldset and legend

## Pair and category

Paired PASS for **case-04**. Batch `initial-79-actlike-v2`; category `context-extraction`.

## Exact repair

Wrap each Yes/No set in a fieldset whose legend is the existing visible question.

## Primary selector

`form fieldset`

## Accessibility mechanism

The group name is supplied by ancestor structure and remains absent from the individual Yes and No input fragments.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required relationship or purpose. A target-only extractor can omit the decisive evidence, which is the intended specificity stressor.

## Citation

**Reference:** refs/trusted-tester/sc-1.3.1-info-and-relationships.md

> At minimum, radio buttons and checkboxes should be programmatically associated with their question and response.
