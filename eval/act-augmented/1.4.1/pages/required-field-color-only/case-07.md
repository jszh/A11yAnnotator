# Required fields retain red and gain visible words

- Expected: `passed`
- Category: Decorative/redundant visual cue
- Source pair: case-01.html in this aspect
- Exact repair: Kept every required label red, added visible “(required)” text to those labels, added native required attributes, and updated the instruction to refer to the word.
- Primary selector: `label.req[for="first"] span`

## Why this passes

Required status is conveyed by meaningful visible text and native form semantics, so red is redundant.

## Accessibility-tree / visual evidence

The four required labels visibly contain “(required)”; their controls expose required=true.

## Citation

- Document: `wcag-techniques/failures/F81.html`
- Verbatim quote: “To indicate that the phone number field is required, the label "Phone Number" is displayed in a color different from the color used for optional fields, without any other indication that "Phone Number" is a required field. A person with color vision deficiency or low vision may not be able to identify that "Phone Number" is a required field.”
