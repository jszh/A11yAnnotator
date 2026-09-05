# Decorative linked thumbnail with a text-named destination

- Expected: `passed`
- Category: Accessibility-tree/applicability boundary
- Source pair: case-01.html in this aspect
- Exact repair: Changed only the first thumbnail alt to empty and inserted visually hidden destination text, “The Riverside Courier”, inside the same link.
- Primary selector: `a[href="https://www.riversidecourier.example/"] img[alt=""]`

## Why this passes

The image is now intentionally decorative and excluded from the accessibility tree, while the enclosing link receives the correct destination name from real text.

## Accessibility-tree / visual evidence

The target image has no image node; its enclosing link resolves to “The Riverside Courier”.

## Citation

- Document: `wcag-understanding/non-text-content.html`
- Verbatim quote: “A thumbnail image of the front page of a newspaper links to the home page of the "Smallville Times". The text alternative says "Smallville Times".”

