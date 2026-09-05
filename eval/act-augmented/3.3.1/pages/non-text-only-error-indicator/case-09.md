# case-09 — paired PASS repair of case-03

## Source and exact repair
The Pennine form, invalid postcode, red presentation, and surrounding fields remain. Specific text is added at `#postcode-error`, with `aria-invalid` and `aria-describedby` on the postcode.

## Expected outcome
**passed.** Colour and the decorative visual treatment are no longer the only error cues.

## Why tools may still over-report
The strong red styling remains intentionally prominent. A vision-led evaluator must not mistake the presence of an error state for a missing textual identification.

## Citation
`wcag-understanding/error-identification.html`:
> "This success criterion does not mean that color or text styles cannot be used to indicate errors. It simply requires that errors also be identified using text."
