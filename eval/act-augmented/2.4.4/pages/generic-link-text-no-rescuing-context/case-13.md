# case-13 — Read-more link named by an external article heading

## Pair and category

Paired PASS for **case-01**. Batch `initial-79-context-v3`; category `context-extraction`.

## Exact repair

Keep “Read more” visible and reference the existing article heading after the link’s own ID.

## Primary selector

`p.more-row > a[aria-labelledby]`

## Accessibility mechanism

The resulting name is “Read more Harbor Commission Approves Long-Delayed Ferry Terminal”; the heading is outside the extracted link paragraph.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required relationship or purpose. A target-only extractor can omit the decisive evidence, which is the intended specificity stressor.

## Citation

**Reference:** WCAG Techniques F63 (wcag-techniques/failures/F63.html)

> A news service lists the first few sentences of an article in a paragraph. The next paragraph contains the link "Read More...". Because the link is not in the same paragraph as the lead sentence, the user cannot easily discover what the link will let the user read more about.

## GenA11y payload contract

The exact `extract_links` payload omits the normalized text of every non-self IDREF used by `p.more-row > a[aria-labelledby]`, while Chromium exposes that text in the target name or description. The external IDs are intentionally opaque.
