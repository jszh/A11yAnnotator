# case-16 — Product thumbnails named by external product headings

## Pair and category

Paired PASS for **case-02**. Batch `context-extraction-26-v4`; category `context-extraction`.

## Exact repair

Keep every CMS slug alt while overriding it with the corresponding visible product heading through aria-labelledby.

## Primary selector

`a.thumb img[aria-labelledby]`

## Accessibility mechanism

Each thumbnail receives the full item, colour, and size name from a sibling card heading omitted from the image and parent-anchor extraction.

## GenA11y payload contract

The exact `extract_visual_elements` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description. External IDs are intentionally opaque.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** eval/act-augmented/1.1.1/pages/alt-not-an-alternative-filename-placeholder/case-02.md

> programming references that do not convey the information or function of the non-text content such as "picture 1", "picture 2" or "0001", "0002" or "Intro#1", "Intro#2".
