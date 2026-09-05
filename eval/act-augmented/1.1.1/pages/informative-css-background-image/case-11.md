# Chili backgrounds redundant with textual spice levels

- Expected: `passed`
- Category: Decorative/redundant graphic
- Source pair: case-04.html in this aspect
- Exact repair: Kept the dynamically painted chili backgrounds and inserted a visually hidden spice-level phrase in every matching heat span.
- Primary selector: `span.heat[data-heat="3"] .sr-only`

## Why this passes

The chili count is repeated as text for every dish, including level and scale, so the CSS graphic is no longer the only carrier of spice information.

## Accessibility-tree / visual evidence

Dish names include “Spice level: Mild, 1 of 3”, “Medium, 2 of 3”, or “Hot, 3 of 3” in accessible text.

## Citation

- Document: `wcag-techniques/failures/F3.html`
- Verbatim quote: “In the following code, the background image declaration is created in a client script:”

