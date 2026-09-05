# case-17 — Restaurant detail links named by an external purpose key

## Pair and category

Paired PASS for **case-03**. Batch `context-extraction-26-v4`; category `context-extraction`.

## Exact repair

Keep all three Details labels and add a visible purpose key outside the list, referenced by each link.

## Primary selector

`.col:last-child ul a[aria-labelledby]`

## Accessibility mechanism

Menu, private-events, and gift-card purposes resolve in AX names but the outermost-list extraction omits the purpose key.

## GenA11y payload contract

The exact `extract_links` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description. External IDs are intentionally opaque.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** Trusted Tester v5.1.3 SC 2.4.4 (refs/trusted-tester/sc-2.4.4-link-purpose.md)

> "Programmatically determined link context" is limited to same sentence/paragraph/list-item/table-cell or associated table header — not arbitrary nearby text.
