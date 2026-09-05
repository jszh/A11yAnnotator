# case-16 — Read-more link named by the external story heading

## Pair and category

Paired PASS for **case-01**. Batch `context-extraction-26-v4`; category `context-extraction`.

## Exact repair

Keep the visible Read more text and combine it with the existing article heading through aria-labelledby.

## Primary selector

`p.more-row > a[aria-labelledby]`

## Accessibility mechanism

The computed purpose is Read more — Harbor Commission Approves Long-Delayed Ferry Terminal; the heading is outside the extracted link parent.

## GenA11y payload contract

The exact `extract_links` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description. External IDs are intentionally opaque.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** WCAG Techniques F63 (wcag-techniques/failures/F63.html)

> A news service lists the first few sentences of an article in a paragraph. The next paragraph contains the link "Read More...". Because the link is not in the same paragraph as the lead sentence, the user cannot easily discover what the link will let the user read more about.
