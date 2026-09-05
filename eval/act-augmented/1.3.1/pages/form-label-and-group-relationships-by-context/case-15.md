# case-15 — Two radio groups named and described through external IDREFs

## Pair and category

Paired PASS for **case-04**. Batch `initial-79-actlike-v2`; category `external-reference`.

## Exact repair

Give both option containers radiogroup semantics and reference the existing question and help paragraphs.

## Primary selector

`.opts[role="radiogroup"]`

## Accessibility mechanism

Each group name and description resolves through external aria-labelledby and aria-describedby targets omitted from a bare radio extraction.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required relationship or purpose. A target-only extractor can omit the decisive evidence, which is the intended specificity stressor.

## Citation

**Reference:** refs/trusted-tester/sc-1.3.1-info-and-relationships.md

> At minimum, radio buttons and checkboxes should be programmatically associated with their question and response.
