# Decorative tariff canvas has a complete data table

- Expected: `passed`
- Category: Accessibility evidence omitted
- Source pair: `case-02.html` in this aspect
- Exact repair: Kept the painted canvas and its presentational role, adding one visible semantic table containing all twelve prices and charges shown in the canvas.
- Primary selector: `section.panel table`

## Why this passes

Every tariff, row label, and value painted into the canvas is available as ordinary table text. The canvas can therefore remain ignored without losing information.

## Accessibility-tree / visual evidence

The tree exposes a captioned four-column table with four row headers and twelve matching values; the canvas remains absent as intended.

## Why automated tools may miss the boundary

A decorative-canvas heuristic cannot OCR the drawing and compare it with the adjacent table for complete equivalence.

## Citation

- Document: `wcag-techniques/general/G94.html`
- Verbatim quote: “The text alternative should be able to substitute for the non-text content. If the non-text content were removed from the page and substituted with the text, the page would still provide the same function and information.”
