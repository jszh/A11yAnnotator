# case-15 — News photograph named by its external visible caption

## Pair and category

Paired PASS for **case-01**. Batch `context-extraction-26-v4`; category `context-extraction`.

## Exact repair

Keep the photograph and replace the filename alternative through an aria-labelledby reference to its expanded visible caption.

## Primary selector

`article figure img[aria-labelledby="cx-048"]`

## Accessibility mechanism

Chromium names the photograph from the visible protest caption, while GenA11y extracts only the image markup and opaque IDREF.

## GenA11y payload contract

The exact `extract_visual_elements` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description. External IDs are intentionally opaque.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** eval/act-augmented/1.1.1/pages/alt-not-an-alternative-filename-placeholder/case-01.md

> filenames that are not valid text alternatives in their own right such as "Oct.jpg" or "Chart.jpg" or "sales\oct\top3.jpg"
