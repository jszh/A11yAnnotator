# Transit diagram redundant with complete visible advisory

- Expected: `passed`
- Category: Accessibility-tree/applicability boundary
- Source pair: case-05.html in this aspect
- Exact repair: Kept the diagram’s empty alt and replaced the vague advisory prose with complete visible text covering the B suspension endpoints, Q reroute and skipped stops, and replacement shuttle.
- Primary selector: `.diagram img[alt=""]`

## Why this passes

Every operational fact encoded by the diagram is now present in adjacent text, so the image is genuinely redundant and correctly outside the accessibility tree.

## Accessibility-tree / visual evidence

The image has no image node; the adjacent text exposes all three service changes to every user.

## Citation

- Document: `wcag-techniques/failures/F39.html`
- Verbatim quote: “A text alternative for an image should convey the meaning of the image. When an image is used for decoration, spacing or other purpose that is not part of the meaningful content in the page then the image has no meaning and should be ignored by assistive technologies.”

