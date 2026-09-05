# case-16 — Metro map described by an external structured interchange guide

## Pair and category

Paired PASS for **case-04**. Batch `context-extraction-26-v4`; category `context-extraction`.

## Exact repair

Keep the raster network map and replace its incomplete prose with a complete visible structured interchange guide.

## Primary selector

`img#metroMap[aria-describedby="cx-054"]`

## Accessibility mechanism

The AX description exposes line termini and all four interchange pairs from a remote guide, while the extracted raster-image markup contains only the opaque IDREF.

## GenA11y payload contract

The exact `extract_visual_elements` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description. External IDs are intentionally opaque.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** WCAG Techniques — G73 (wcag-techniques/general/G73.html)

> check that the long description conveys the same information as the non-text content
