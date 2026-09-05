# case-12 — API-key icon actions named by an external visible action key

## Pair and category

Paired PASS for **case-04**. Batch `context-extraction-26-v4`; category `context-extraction`.

## Exact repair

Keep the six row-action icons and add a visible action key outside the table, referenced by each link.

## Primary selector

`table a.iconbtn[aria-labelledby]`

## Accessibility mechanism

Every AX name identifies edit/revoke plus the key label; the outermost-table payload omits the action-key text.

## GenA11y payload contract

The exact `extract_links` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description. External IDs are intentionally opaque.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** wcag-techniques/failures/F89.html

> This failure condition occurs when a link contains only non-text content, such as an image, and that link cannot be identified by an accessible name.
