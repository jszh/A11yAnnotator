# case-15 — Chevron link named by a remote visible product name

## Pair and category

Paired PASS for **case-05**. Batch `initial-79-context-v3`; category `context-extraction`.

## Exact repair

Add a visible Aurora product name before the isolated chevron paragraph and reference it after the link’s own ID.

## Primary selector

`.spotlight:nth-of-type(2) a.chev[aria-labelledby]`

## Accessibility mechanism

The chevron’s parent contains no product words; “Aurora Bluetooth speaker details” is computed from a remote sibling that GenA11y’s parent/sibling-of-link extraction does not reach.

## GenA11y payload contract

The exact `extract_links` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** ACT Rule fd3a94 applicability (act-rules/extracted/fd3a94.md)

> the elements are inheriting semantic link nodes
