# case-13 — Survey group named by an external visible question

## Pair and category

Paired PASS for **case-02**. Batch `initial-79-actlike-v2`; category `external-reference`.

## Exact repair

Wrap the first radio set in a radiogroup named by the existing visible question through aria-labelledby.

## Primary selector

`[role="radiogroup"][aria-labelledby="hear-question"]`

## Accessibility mechanism

Each radio keeps its own label, while the group name resolves through #hear-question outside every extracted input element.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required relationship or purpose. A target-only extractor can omit the decisive evidence, which is the intended specificity stressor.

## Citation

**Reference:** refs/trusted-tester/sc-1.3.1-info-and-relationships.md

> At minimum, radio buttons and checkboxes should be programmatically associated with their question and response.
