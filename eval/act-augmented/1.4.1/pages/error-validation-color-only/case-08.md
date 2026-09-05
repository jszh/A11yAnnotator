# Password error retains red and gains inline text

- Expected: `passed`
- Category: Decorative/redundant visual cue
- Source pair: case-01.html in this aspect
- Exact repair: Kept the red invalid border, added visible “Password is required.” text, and tied it to the input with aria-invalid and aria-describedby.
- Primary selector: `#password[aria-invalid="true"]`

## Why this passes

The erroneous field and error type are conveyed through text and programmatic state as well as color.

## Accessibility-tree / visual evidence

The password input exposes invalid=true and description “Password is required.”.

## Citation

- Document: `wcag-techniques/failures/F81.html`
- Verbatim quote: “A user submits an online form and leaves a required field blank, resulting in an error. The form field that caused the error is indicated by red text only, without an additional non-color indication that the field caused an error.”

