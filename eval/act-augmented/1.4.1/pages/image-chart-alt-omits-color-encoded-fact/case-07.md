# Donation pie keeps colored wedges with complete textual values

- Expected: `passed`
- Category: Redundant graphic or visual cue
- Source pair: `case-02.html` in this aspect
- Exact repair: Kept every wedge and swatch color, adding each program's percentage and amount to the visible legend, the complete mapping to the SVG name, and the dominant-program fact to the caption.
- Primary selector: `svg.pie[role="img"]`

## Why this passes

All category-to-share bindings and the headline conclusion are explicitly available in text. Color remains a redundant way to scan the unchanged pie.

## Accessibility-tree / visual evidence

The image name states all five percentages; the visible list states each program, percentage, and amount; the caption names Direct food aid as largest.

## Why automated tools may miss the boundary

The colored wedges and swatches are unchanged, so correctness requires comparing their information with three complete text channels.

## Citation

- Document: `wcag-techniques/general/G14.html`
- Verbatim quote: “Check that the information conveyed is also available in text and that the text is not conditional content.”
