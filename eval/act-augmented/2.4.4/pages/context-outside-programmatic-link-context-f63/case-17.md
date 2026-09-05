# case-17 — Replay links described by external definition terms

## Pair and category

Paired PASS for **case-03**. Batch `context-extraction-26-v4`; category `context-extraction`.

## Exact repair

Keep the visible Listen labels and associate each with its existing definition term through aria-describedby.

## Primary selector

`dl.media a.listen[aria-describedby]`

## Accessibility mechanism

The AX descriptions identify each recording, while GenA11y serializes only the DD parent and omits its DT.

## GenA11y payload contract

The exact `extract_links` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description. External IDs are intentionally opaque.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** refs/trusted-tester/sc-2.4.4-link-purpose.md

> "Programmatically determined link context" is **limited** to same sentence/paragraph/list-item/table-cell or associated table header — not arbitrary nearby text.
