# case-15 — Document links named by their external continuation text

## Pair and category

Paired PASS for **case-01**. Batch `context-extraction-26-v4`; category `context-extraction`.

## Exact repair

Keep both link labels and make each following continuation paragraph its programmatic purpose context.

## Primary selector

`p.more > a[aria-labelledby]`

## Accessibility mechanism

Each computed name includes the specific fee-schedule or bus-route document text that GenA11y omits from the link parent.

## GenA11y payload contract

The exact `extract_links` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description. External IDs are intentionally opaque.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** wcag-understanding/link-purpose-in-context.html

> If the description follows the link, there can be confusion and difficulty for screen reader users who are reading through the page in order (top to bottom).
