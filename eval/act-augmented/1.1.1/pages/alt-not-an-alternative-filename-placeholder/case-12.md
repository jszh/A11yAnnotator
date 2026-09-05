# Filename alt is overridden by complete figure labels

- Expected: `passed`
- Category: Context extraction
- Source pair: `case-04.html` in this aspect
- Exact repair: Kept all three literal `alt="Chart.jpg"` values, gave each complete figcaption an ID, and referenced it with `aria-labelledby` so it becomes the computed image name.
- Primary selector: `.charts img[aria-labelledby]`

## Why this passes

Accessible-name precedence replaces each filename token with the associated chart's full dataset and trend. All three rendered charts remain unchanged.

## Accessibility-tree / visual evidence

The three image names resolve respectively to quarterly revenue values, six monthly-user values, and the four regional percentages; none computes to “Chart.jpg.”

## Why automated tools may miss the boundary

A raw-attribute heuristic sees the suspicious filename but fails unless it computes the ARIA name and resolves each external ID reference.

## Citation

- Document: `wcag-techniques/general/G94.html`
- Verbatim quote: “The text alternative should be able to substitute for the non-text content.”

## GenA11y payload contract

The exact `extract_visual_elements` payload omits the normalized text of every non-self IDREF used by `.charts img[aria-labelledby]`, while Chromium exposes that text in the target name or description. The external IDs are intentionally opaque.

**Validated batch:** `initial-79-context-v3`
