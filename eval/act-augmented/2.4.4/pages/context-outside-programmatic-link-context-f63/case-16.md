# case-16 — Email document buttons named by an external ready-document summary

## Pair and category

Paired PASS for **case-02**. Batch `context-extraction-26-v4`; category `context-extraction`.

## Exact repair

Keep the two View buttons and add a visible document summary outside the layout table, referenced by each button.

## Primary selector

`td.cta-cell > a[aria-labelledby]`

## Accessibility mechanism

The AX names distinguish the statement and tax form, while the table extraction omits the external summary IDs.

## GenA11y payload contract

The exact `extract_links` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description. External IDs are intentionally opaque.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** wcag-techniques/failures/F63.html

> An audio site provides links to where its player can be downloaded. The information about what would be downloaded by the link is in the preceding row of the layout table, which is not programmatically determined context for the link.
