# case-13 — Four staff portraits named by external staff headings

## Pair and category

Paired PASS for **case-03**. Batch `initial-79-context-v3`; category `context-extraction`.

## Exact repair

Keep each generic photo placeholder while giving every portrait an aria-labelledby reference to its existing visible staff heading.

## Primary selector

`.team img[aria-labelledby]`

## Accessibility mechanism

The computed portrait names are Dr. Aaron Whitfield, Dr. Lena Park, Maya Okonjo, and Sofia Reyes; none of those headings is included in GenA11y’s visual-element payload.

## GenA11y payload contract

The exact `extract_visual_elements` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** eval/act-augmented/1.1.1/pages/alt-not-an-alternative-filename-placeholder/case-03.md

> placeholder text such as " " or "spacer" or "image" or "picture" etc that are put into the 'text alternative' location on images or pictures.
