# case-10 — paired PASS repair of case-04

## Source and exact repair
The Meridian reset flow, reused password, confirmation, and red visual state remain. The exact reuse error is added in text and programmatically associated with the invalid password field.

## Expected outcome
**passed.** The user is told what was rejected and how to correct it.

## Why tools may still over-report
The same red field and glyph-like presentation remain. The pass depends on recognizing the referenced prose as the authoritative error description.

## Citation
`wcag-understanding/error-identification.html`:
> "This success criterion does not mean that color or text styles cannot be used to indicate errors. It simply requires that errors also be identified using text."
