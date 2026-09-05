# Weather backgrounds redundant with visible condition words

- Expected: `passed`
- Category: Decorative/redundant graphic
- Source pair: case-05.html in this aspect
- Exact repair: Retained all dynamically applied weather-icon backgrounds and added visible Rain, Cloudy, or Sunny text beside the current and hourly conditions.
- Primary selector: `#nowGlyph + div .condition`

## Why this passes

The same condition conveyed by each background icon is now available as ordinary visible text, including when backgrounds are unavailable.

## Accessibility-tree / visual evidence

The current condition and each of the five hourly conditions have an adjacent visible condition word.

## Citation

- Document: `wcag-techniques/failures/F3.html`
- Verbatim quote: “Text alternatives are necessary for people who cannot see images that convey information that is required to understand the content of the page.”

