# case-16 — Email links named by an external visible contact directory

## Pair and category

Paired PASS for **case-03**. Batch `context-extraction-26-v4`; category `context-extraction`.

## Exact repair

Keep both Email us labels and add a visible contact directory outside their paragraph, referenced by each link.

## Primary selector

`.card p:first-child a[aria-labelledby]`

## Accessibility mechanism

Sales enquiries and production support resolve in AX names, while GenA11y’s paragraph extraction omits the remote directory.

## GenA11y payload contract

The exact `extract_links` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description. External IDs are intentionally opaque.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** act-rules/extracted/fd3a94.md

> This rule assumes that reading the URL, such as from the status bar when the link is focused, is not considered part of the context, and therefore, it does not disambiguate links.
