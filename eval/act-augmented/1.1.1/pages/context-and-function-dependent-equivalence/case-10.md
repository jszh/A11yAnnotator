# Print icon named by its external caption

- Expected: `passed`
- Category: Context extraction
- Source pair: case-04.html in this aspect
- Exact repair: Gave the existing visible Print caption an id and referenced it from the printer image with aria-labelledby; the caption stays aria-hidden as a direct child so the button name is not duplicated.
- Primary selector: `button.iconbtn img[aria-labelledby]`

## Why this passes

The image’s computed name and the enclosing control’s purpose are both “Print”, even though the literal alt value still resembles an object description.

## Accessibility-tree / visual evidence

The referenced #cx-010 node contributes “Print” to the image name under the accessible-name referenced-node rule.

## Citation

- Document: `wcag-understanding/non-text-content.html`
- Verbatim quote: “For non-text content that is a control or accepts user input, such as images used as submit buttons, image maps or complex animations, a name is provided to describe the purpose of the non-text content so that the person at least knows what the non-text content is and why it is there.”


## GenA11y payload contract

The exact `extract_visual_elements` payload omits the normalized text of every non-self IDREF used by `button.iconbtn img[aria-labelledby]`, while Chromium exposes that text in the target name or description. The external IDs are intentionally opaque.

**Validated batch:** `initial-79-context-v3`
