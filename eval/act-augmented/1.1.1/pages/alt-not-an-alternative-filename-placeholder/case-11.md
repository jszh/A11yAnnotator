# Protest photograph has an equivalent alternative

- Expected: `passed`
- Category: Accessibility evidence omitted
- Source pair: `case-01.html` in this aspect
- Exact repair: Replaced only the raw camera filename in `alt` with a concise description of the crowd, protest signs, and City Hall.
- Primary selector: `article figure img[alt^="Crowd carrying"]`

## Why this passes

The alternative now identifies the story-critical scene and the legible protest messages. The photograph, caption, article, and all other context are unchanged.

## Accessibility-tree / visual evidence

The image's computed name is “Crowd carrying FAIR FARES and NO HIKE signs marches past City Hall,” matching the rendered scene.

## Why automated tools may miss the boundary

Both the failed source and this repair contain a non-empty `alt`; distinguishing them requires comparing the text with the pixels.

## Citation

- Document: `wcag-techniques/failures/F30.html`
- Verbatim quote: “If the text in the "text alternative" cannot be used in place of the non-text content without losing information or function then it fails because it is not, in fact, an alternative to the non-text content.”
