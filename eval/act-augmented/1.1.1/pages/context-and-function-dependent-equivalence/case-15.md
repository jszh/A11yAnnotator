# case-15 — Flag links named by external visible language labels

## Pair and category

Paired PASS for **case-05**. Batch `initial-79-context-v3`; category `context-extraction`.

## Exact repair

Keep the three flag-description alternatives and add visible language names after their links, referenced by each image.

## Primary selector

`.langswitch a:not([hreflang="en"]) img[aria-labelledby]`

## Accessibility mechanism

Japanese, German, and Brazilian Portuguese become the computed link purposes, while the text nodes supplying those purposes sit outside each extracted image and anchor.

## GenA11y payload contract

The exact `extract_visual_elements` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** wcag-understanding/non-text-content.html

> An image of the world that is used on a travel site as a link to the International Travel section has the text alternative "International Travel". The same image is used as a link on a university website with the text alternative "International Campuses".
