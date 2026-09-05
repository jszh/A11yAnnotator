# case-15 — Bakery order-form links named by remote form headings

## Pair and category

Paired PASS for **case-01**. Batch `context-extraction-26-v4`; category `context-extraction`.

## Exact repair

Keep both order form labels and combine each with its destination form heading.

## Primary selector

`p.lead > a[aria-labelledby]`

## Accessibility mechanism

The AX names distinguish celebration-cake and weekly-bread forms; the link-parent extraction omits the remote destination headings.

## GenA11y payload contract

The exact `extract_links` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description. External IDs are intentionally opaque.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** wcag-understanding/link-purpose-in-context.html

> It is a best practice for links with the same destination to have consistent text (and this is a requirement per Success Criterion 3.2.4 Consistent Identification for pages in a set). It is also a best practice for links with different purposes and destinations to have different link text.
