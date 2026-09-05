# case-14 — Statement links named by labels in other table rows

## Pair and category

Paired PASS for **case-02**. Batch `initial-79-actlike-v2`; category `external-reference`.

## Exact repair

Keep “View” visible while using self-first aria-labelledby references to the existing document-label rows.

## Primary selector

`a.btn[aria-labelledby]`

## Accessibility mechanism

The document identity is outside each anchor and outside its table cell, but the IDREF produces a complete accessible name.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required relationship or purpose. A target-only extractor can omit the decisive evidence, which is the intended specificity stressor.

## Citation

**Reference:** wcag-techniques/failures/F63.html

> An audio site provides links to where its player can be downloaded. The information about what would be downloaded by the link is in the preceding row of the layout table, which is not programmatically determined context for the link.
