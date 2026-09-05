# case-17 — Spanish call links named by external telephone context

## Pair and category

Paired PASS for **case-05**. Batch `context-extraction-26-v4`; category `context-extraction`.

## Exact repair

Keep both Llámanos labels and combine them with the visible phone numbers from the preceding service paragraphs.

## Primary selector

`p.acciones a.tel-link[aria-labelledby]`

## Accessibility mechanism

The AX names distinguish the health-centre and emergency numbers, but those referenced numbers sit outside the extracted actions paragraph.

## GenA11y payload contract

The exact `extract_links` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description. External IDs are intentionally opaque.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** wcag-techniques/failures/F63.html

> This describes a failure condition when the context needed for understanding the purpose of a link is located in content that is not programmatically determined link context.
