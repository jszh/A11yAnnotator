# case-18 — Product-card links named by remote product details

## Pair and category

Paired PASS for **case-05**. Batch `context-extraction-26-v4`; category `context-extraction`.

## Exact repair

Keep each View label and combine it with the existing product name and description outside its action container.

## Primary selector

`.card .action a[aria-labelledby]`

## Accessibility mechanism

Product identity and distinguishing features appear in AX names but not in GenA11y’s action-parent snippets.

## GenA11y payload contract

The exact `extract_links` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description. External IDs are intentionally opaque.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** wcag-techniques/failures/F63.html

> This describes a failure condition when the context needed for understanding the purpose of a link is located in content that is not programmatically determined link context.
