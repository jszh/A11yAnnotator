# Exit-row graphics redundant with seat text

- Expected: `passed`
- Category: Decorative/redundant graphic
- Source pair: case-06.html in this aspect
- Exact repair: Preserved the CSS exit-row pictogram and added an exact `aria-label` naming the seat and “exit row” on each of the four affected buttons.
- Primary selector: `button.seat.exit[aria-label$="exit row"]`

## Why this passes

The pictogram’s safety/location meaning is repeated in each button’s accessible text, so the background image is not the sole source of information.

## Accessibility-tree / visual evidence

The affected button names resolve as “12A, exit row” through “12D, exit row”.

## Citation

- Document: `refs/trusted-tester/sc-1.1.1-non-text-content.md`
- Verbatim quote: “For each background image, determine whether important information provided by it is available without it.”
