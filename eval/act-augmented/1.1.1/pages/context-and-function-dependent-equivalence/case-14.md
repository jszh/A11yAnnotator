# case-14 — Linked newspaper thumbnail named by external publication text

## Pair and category

Paired PASS for **case-01**. Batch `initial-79-context-v3`; category `context-extraction`.

## Exact repair

Keep the unchanged Riverside front-page image and expose its publication name visibly outside the link, referenced by the image.

## Primary selector

`.card:first-child a img[aria-labelledby]`

## Accessibility mechanism

The linked image computes to “The Riverside Courier”, but GenA11y’s image and parent-anchor extractions omit the following visible publication label.

## GenA11y payload contract

The exact `extract_visual_elements` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** wcag-understanding/non-text-content.html

> A thumbnail image of the front page of a newspaper links to the home page of the "Smallville Times". The text alternative says "Smallville Times".
