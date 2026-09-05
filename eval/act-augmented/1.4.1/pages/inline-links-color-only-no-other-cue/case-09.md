# Low-contrast glossary links retain color and gain underlines

- Expected: `passed`
- Category: Residual-cue tunnel vision
- Source pair: `case-02.html` in this aspect
- Exact repair: Kept the subtle gray link color and changed only `.xref` to render a persistent two-pixel underline with offset.
- Primary selector: `dd a.xref`

## Why this passes

Every inline cross-reference is identifiable by a non-color line decoration before interaction. The low color difference is no longer load-bearing.

## Accessibility-tree / visual evidence

Computed style for each target reports `text-decoration-line: underline`; neighboring prose remains un-underlined.

## Why automated tools may miss the boundary

A detector comparing foreground colors can ignore the decisive computed decoration and repeat the source verdict.

## Citation

- Document: `wcag-techniques/failures/F73.html`
- Verbatim quote: “Removing the underline and leaving only the color difference for such links would be a failure because there would be no other visual indication (besides color) that it is a link.”
