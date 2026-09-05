# case-12 — Pull-quote image named by an external blockquote

## Pair and category

Paired PASS for **case-02**. Batch `initial-79-context-v3`; category `context-extraction`.

## Exact repair

Keep the generic decorative-graphic alternative and add the complete quotation and attribution as visible referenced text.

## Primary selector

`img.pullquote[aria-labelledby]`

## Accessibility mechanism

The image’s computed name contains the full Gibson quotation and attribution, while the blockquote is not present in GenA11y’s visual-element extraction.

## GenA11y payload contract

The exact `extract_visual_elements` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** wcag-techniques/general/G94.html

> When non-text content contains words that are important to understanding the content, the alt text should include those words.
