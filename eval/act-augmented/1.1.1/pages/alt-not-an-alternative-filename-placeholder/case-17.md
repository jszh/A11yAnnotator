# case-17 — Recipe photograph named by its external Spanish caption

## Pair and category

Paired PASS for **case-06**. Batch `context-extraction-26-v4`; category `context-extraction`.

## Exact repair

Keep the WhatsApp filename alt while overriding it with the visible Spanish dish caption.

## Primary selector

`article figure img[aria-labelledby="cx-053"]`

## Accessibility mechanism

The computed name identifies the finished red pozole and garnishes; the isolated image payload contains only an opaque reference.

## GenA11y payload contract

The exact `extract_visual_elements` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description. External IDs are intentionally opaque.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** eval/act-augmented/1.1.1/pages/alt-not-an-alternative-filename-placeholder/case-06.md

> filenames that are not valid text alternatives in their own right such as "Oct.jpg" or "Chart.jpg" or "sales\oct\top3.jpg"
