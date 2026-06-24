# case-02 — Stacked area chart: four series told apart only by fill color, swatch-only legend

## Scenario
A FinOps dashboard shows a stacked area chart of Q3 cloud spend across four services —
Compute, Storage, Networking, Database. The four stacked bands are filled with four
different solid colors and nothing else. The legend below pairs each service name with a
solid colored square. There is no hatch/dot/dash pattern on any band, no direct in-chart
label on the bands, and no number keying a band to the legend. To know which band is
"Storage," the reader must perceive its fill hue and match it to the legend square.

## Attribute tuple
- **content-domain:** enterprise SaaS / cloud cost analytics
- **UI-component/pattern:** multi-series stacked area chart with a swatch legend
- **host-language construct:** inline `<svg>` with four `<path fill="#…">` series bands
- **locale/i18n:** en-US
- **failure-mechanism:** series categories distinguished by fill hue only; legend is color-keyed; no pattern/label (G111 not met)

## Developer persona
A platform engineer wired the dashboard with a charting library's default theme. The
library renders stacked areas as solid color fills and a color-swatch legend out of the
box, and the "accessibility" checklist item was satisfied by adding an `aria-label`
summary to the SVG. Dark-theme + saturated brand palette looked sharp in the demo; nobody
toggled the OS grayscale filter or considered red-green confusion between Storage (red)
and Networking (teal).

## Element / selector carrying the issue
The four series paths and the color-only legend:
`svg path[fill="#42a5f5"]` (Compute), `svg path[fill="#ef5350"]` (Storage),
`svg path[fill="#26a69a"]` (Networking), `svg path[fill="#7e57c2"]` (Database), plus
`.legend .dot` (the color-only swatches).

## Exact accessibility mechanism
A user with red-green color-vision deficiency cannot reliably separate the Storage (red)
band from the Networking (teal) band, and in grayscale all four bands reduce to similar
mid-tone greys. Because the only cue that distinguishes one series from another — and the
only cue linking a band to its legend name — is fill hue, that user cannot answer "which
service is the biggest driver" or "how much is Storage" from the graphic. No redundant
visual encoding (pattern, texture, direct label, or value annotation) carries the series
identity. This is the bar/area-chart case G111 addresses with "a different solid color and
a different pattern … The legend uses the same colors and patterns."

## Expected ACT-style outcome
**failed** — SC 1.4.1 (Use of Color, Level A). Series categories in a non-text graphic are
distinguished by color alone; G111 (color + pattern) is not satisfied and no in-graphic
label substitutes.

## Why automated tools miss it
There is no missing-attribute or contrast violation to catch: the SVG has a descriptive
`aria-label`, the title element is present, the legend text is real, and each fill color
exceeds 3:1 against the plot background. axe-core, WAVE, and Lighthouse pass the page. They
cannot render the stacked chart, identify that four distinct categories are encoded only by
fill hue, notice the legend is keyed by color squares with no pattern, and conclude that
the distinction disappears under CVD/grayscale. That determination requires visual
rendering plus semantic reasoning about how the chart conveys series identity.

## Citation
> **Reference:** WCAG Technique G111 "Using color and pattern"
> (`wcag-techniques/general/G111.html`)
>
> **Quote (verbatim):** "A real estate site provides a bar chart of average housing prices
> in several regions of the United States. The bar for each region is displayed with a
> different solid color and a different pattern. The legend uses the same colors and
> patterns to identify each bar."
>
> **Reference:** WCAG Understanding 1.4.1 "Use of Color"
> (`wcag-understanding/use-of-color.html`)
>
> **Quote (verbatim):** "If the information is conveyed through color differences in an
> image (or other non-text format), the color may not be seen by users with color
> deficiencies."
