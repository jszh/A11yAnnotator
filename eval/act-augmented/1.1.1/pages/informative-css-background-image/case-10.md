# Required markers redundant with semantic and textual requirements

- Expected: `passed`
- Category: Decorative/redundant graphic
- Source pair: case-03.html in this aspect
- Exact repair: Preserved every CSS asterisk, added the native required attribute to each affected control, and added visually hidden “required” text to the corresponding label.
- Primary selector: `#fname[required]`

## Why this passes

The background-image asterisks no longer carry unique information: required state is available both programmatically and in label text.

## Accessibility-tree / visual evidence

The first-name, last-name, email, and preferred-role controls expose required state and a label containing “required”.

## Citation

- Document: `wcag-techniques/failures/F3.html`
- Verbatim quote: “This failure would apply equally in a case where the background image was declared in the HTML style attribute, as well as in a case where the background image declaration was created dynamically in a client script (see example 3 below).”

