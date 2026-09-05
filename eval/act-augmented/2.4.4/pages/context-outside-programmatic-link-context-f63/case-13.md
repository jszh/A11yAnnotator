# case-13 — Document links named by following external descriptions

## Pair and category

Paired PASS for **case-01**. Batch `initial-79-context-v3`; category `context-extraction`.

## Exact repair

Keep the generic visible link text but name each link through itself and its existing following description.

## Primary selector

`p.more > a[aria-labelledby]`

## Accessibility mechanism

The accessible names resolve external IDREFs that are absent from an isolated anchor extraction.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required relationship or purpose. A target-only extractor can omit the decisive evidence, which is the intended specificity stressor.

## Citation

**Reference:** wcag-understanding/link-purpose-in-context.html

> If the description follows the link, there can be confusion and difficulty for screen reader users who are reading through the page in order (top to bottom).

## GenA11y payload contract

The exact `extract_links` payload omits the normalized text of every non-self IDREF used by `p.more > a[aria-labelledby]`, while Chromium exposes that text in the target name or description. The external IDs are intentionally opaque.
