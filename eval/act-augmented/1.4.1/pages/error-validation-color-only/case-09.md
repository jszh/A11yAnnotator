# Red validation labels retain color and gain field-specific errors

- Expected: `passed`
- Category: Residual-cue tunnel vision
- Source pair: `case-02.html` in this aspect
- Exact repair: Kept the red invalid-label styling and added a field-specific error message for every required control. Submit and input handling synchronize each control's label class, invalid state, resolved description relationship, error visibility, and the summary together.
- Primary selector: `#dob[aria-invalid="true"][aria-describedby="dob-error"]`

## Why this passes

Color is no longer the only way to locate or understand an error. Every empty required field carries a visible, specific, programmatically associated message; correcting a field clears all of its error state, and clearing any of the five required fields restores that state.

## Accessibility-tree / visual evidence

On initial load, the empty date and member fields expose their specific errors while the three populated required controls expose no error state. After all five are valid, every message and the summary are hidden. Clearing any required control gives it `aria-invalid=true`, resolves `aria-describedby` to its visible field-specific message, applies the red label class, and shows the summary; restoring its value reverses all five signals.

## Why automated tools may miss the boundary

The red classes remain, so a shallow visual comparison can miss that all load-bearing error information now exists in text and relationships.

## Citation

- Document: `wcag-techniques/failures/F81.html`
- Verbatim quote: “A user submits an online form and leaves a required field blank, resulting in an error. The form field that caused the error is indicated by red text only, without an additional non-color indication that the field caused an error.”
