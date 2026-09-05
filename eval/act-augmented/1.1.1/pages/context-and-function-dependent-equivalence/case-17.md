# case-17 — Image-map areas named by an external room directory

## Pair and category

Paired PASS for **case-03**. Batch `context-extraction-26-v4`; category `context-extraction`.

## Exact repair

Keep the floor-plan hotspots and add a visible room directory whose entries label each area by destination.

## Primary selector

`map[name="wingmap"] area[aria-labelledby]`

## Accessibility mechanism

Every area computes to a room and service name from the external directory, but each extracted area contains only its opaque IDREF.

## GenA11y payload contract

The exact `extract_visual_elements` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description. External IDs are intentionally opaque.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** wcag-techniques/html/H24.html

> Check that the text alternative specified by the alt attribute serves the same purpose as the part of image map image referenced by the area element of the image map.
