# Required fields keep red borders and gain explicit labels

- Expected: `passed`
- Category: Residual-cue tunnel vision
- Source pair: `case-02.html` in this aspect
- Exact repair: Kept the red left borders, added visible “(required)” text to all four affected labels, and added the native `required` state to their controls. As a confound-only repair, the source's inert upload `div` was replaced with a real, labelled `input type="file"`; it remains explicitly optional and has no `required` state.
- Primary selector: `.field--required input[required]`

## Why this passes

Requiredness is communicated persistently in label text and programmatically on each field; red is only reinforcement.

## Accessibility-tree / visual evidence

Each affected control has `required=true`, and each associated label includes the word “required.” The optional résumé upload is a keyboard-focusable file input named “Résumé (optional)” with `required=false`.

## Why automated tools may miss the boundary

A color-first judgment can flag the unchanged border without checking label text and native form state across every target.

## Citation

- Document: `wcag-techniques/failures/F81.html`
- Verbatim quote: “To indicate that the phone number field is required, the label "Phone Number" is displayed in a color different from the color used for optional fields, without any other indication that "Phone Number" is a required field.”
