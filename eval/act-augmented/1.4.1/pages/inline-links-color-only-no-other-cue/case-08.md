# Inline links retain color and gain persistent underlines

- Expected: `passed`
- Category: Decorative/redundant visual cue
- Source pair: case-01.html in this aspect
- Exact repair: Kept the original blue link color and added a persistent underline, thickness, and offset to every inline article link.
- Primary selector: `article a`

## Why this passes

All four links are distinguishable from surrounding prose by line decoration as well as color, including without color perception.

## Accessibility-tree / visual evidence

Computed style for each article link has a non-none text-decoration line.

## Citation

- Document: `wcag-techniques/failures/F73.html`
- Verbatim quote: “Removing the underline and leaving only the color difference for such links would be a failure because there would be no other visual indication (besides color) that it is a link.”

