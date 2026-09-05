# case-19 — Chevron link named by an external product heading

## Pair and category

Paired PASS for **case-05**. Batch `context-extraction-26-v4`; category `context-extraction`.

## Exact repair

Keep the chevron and add a visible Aurora product heading outside its link paragraph, referenced by the link.

## Primary selector

`.spotlight:nth-of-type(2) a.chev[aria-labelledby]`

## Accessibility mechanism

The computed purpose is Aurora Bluetooth speaker details, but the link-parent extraction contains only the chevron and opaque IDREF.

## GenA11y payload contract

The exact `extract_links` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description. External IDs are intentionally opaque.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** ACT Rule fd3a94 applicability (act-rules/extracted/fd3a94.md)

> the elements are inheriting semantic link nodes
