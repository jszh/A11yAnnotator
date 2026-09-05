# case-15 — Transit diagram named by a complete external advisory

## Pair and category

Paired PASS for **case-05**. Batch `initial-79-context-v3`; category `context-extraction`.

## Exact repair

Keep the empty alt and add complete visible service-change text referenced by the diagram.

## Primary selector

`.diagram img[aria-labelledby]`

## Accessibility mechanism

The computed image name identifies the B suspension, Q reroute, skipped stops, and shuttle; GenA11y’s isolated image payload contains only the IDREF, not those words.

## GenA11y payload contract

The exact `extract_visual_elements` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** wcag-techniques/failures/F39.html

> A text alternative for an image should convey the meaning of the image. When an image is used for decoration, spacing or other purpose that is not part of the meaningful content in the page then the image has no meaning and should be ignored by assistive technologies.
