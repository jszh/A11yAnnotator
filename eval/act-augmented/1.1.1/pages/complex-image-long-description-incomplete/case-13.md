# case-13 — Metro map described by external line and interchange details

## Pair and category

Paired PASS for **case-04**. Batch `context-extraction-26-v4`; category `context-extraction`.

## Exact repair

Keep the network map while completing its visible description with every interchange relationship.

## Primary selector

`img#metroMap[aria-describedby="cx-064"]`

## Accessibility mechanism

The AX description exposes all four line pairs and interchange stations, while the image payload contains only the opaque IDREF.

## GenA11y payload contract

The exact `extract_visual_elements` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description. External IDs are intentionally opaque.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** WCAG Techniques — G73 (wcag-techniques/general/G73.html)

> check that the long description conveys the same information as the non-text content
