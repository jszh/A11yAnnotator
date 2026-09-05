# case-08 — Raw-URL link named by an external visible document title

## Pair and category

Paired PASS for **case-04**. Batch `initial-79-actlike-v2`; category `external-reference`.

## Exact repair

Name the document in the surrounding sentence and combine that external text with the unchanged raw URL through aria-labelledby.

## Primary selector

`a.rawlink[aria-labelledby]`

## Accessibility mechanism

The visible URL remains, but its accessible name also resolves the external “Q3 2024 earnings report” text omitted from an isolated-anchor extraction.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required relationship or purpose. A target-only extractor can omit the decisive evidence, which is the intended specificity stressor.

## Citation

**Reference:** WCAG Techniques G91 (wcag-techniques/general/G91.html)

> The objective of this technique is to describe the purpose of a link in the text of the link. ... The URI of the destination is generally not sufficiently descriptive.
