# Metro routes retain color and gain patterns and direct labels

- Expected: `passed`
- Category: Decorative/redundant visual cue
- Source pair: case-01.html in this aspect
- Exact repair: Kept the green, red, and blue routes; added solid/dashed/dotted line patterns, direct route labels on the map, and matching textual pattern labels in the legend.
- Primary selector: `polyline.route-harborline`

## Why this passes

Each route remains identifiable when color is removed because line pattern and nearby text convey the same distinction.

## Accessibility-tree / visual evidence

The routes have solid, 18/10 dashed, and 2/12 dotted strokes and are directly labeled with route name and pattern.

## Citation

- Document: `wcag-techniques/general/G111.html`
- Verbatim quote: “An on-line map of a transportation system displays each route in a different color. The stops on each route are marked with a distinctive icon such as a diamond, square, or circle to help differentiate each route.”

