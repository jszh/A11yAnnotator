# Authenticator QR code with externally referenced label and equivalent key

- Expected: `passed`
- Category: Context extraction
- Source pair: case-06.html in this aspect
- Exact repair: Changed the QR SVG from presentation to image, referenced the visible QR label with aria-labelledby, referenced the visible manual setup instruction with aria-describedby, and supplied the same setup operation as a typed key.
- Primary selector: `svg[role="img"][aria-labelledby][aria-describedby]`

## Why this passes

The meaningful QR code is represented in the accessibility tree with a purpose-based name, and users who cannot scan it receive an equivalent manual setup path.

## Accessibility-tree / visual evidence

The SVG resolves to the label “Authenticator setup QR code” and description containing the manual setup key.

## Citation

- Document: `wcag-understanding/non-text-content.html`
- Verbatim quote: “For non-text content that is a control or accepts user input, such as images used as submit buttons, image maps or complex animations, a name is provided to describe the purpose of the non-text content so that the person at least knows what the non-text content is and why it is there.”


## GenA11y payload contract

The exact `extract_visual_elements` payload omits the normalized text of every non-self IDREF used by `svg[role="img"][aria-labelledby][aria-describedby]`, while Chromium exposes that text in the target name or description. The external IDs are intentionally opaque.

**Validated batch:** `initial-79-context-v3`
