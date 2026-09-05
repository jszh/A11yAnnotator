# Colored cloud-spend bands gain direct labels

- Expected: `passed`
- Category: Residual-cue tunnel vision
- Source pair: `case-02.html` in this aspect
- Exact repair: Preserved all four colored area bands and added high-contrast service names directly inside their corresponding bands.
- Primary selector: `svg[role="img"] text.band-label`

## Why this passes

Compute, Storage, Networking, and Database can be mapped to bands by reading their direct labels; matching band hue to a legend swatch is no longer required.

## Accessibility-tree / visual evidence

Four persistent labels render inside the four bands, and the graphic's existing name plus ordinary legend text remain available.

## Why automated tools may miss the boundary

A palette heuristic still sees the identical blue, red, teal, and purple fills unless it inspects the rendered label geometry and semantic mapping.

## Citation

- Document: `wcag-techniques/general/G111.html`
- Verbatim quote: “A real estate site provides a bar chart of average housing prices in several regions of the United States. The bar for each region is displayed with a different solid color and a different pattern.”
