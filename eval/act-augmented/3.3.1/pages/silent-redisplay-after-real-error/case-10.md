# case-10 — paired PASS repair of case-02

## Source and exact repair
The Folio checkout, order, and retained card values from case-02 remain. The false success banner is replaced by one distant alert that accurately identifies both rejected fields; each field references it with `aria-describedby`.

## Expected outcome
**passed.** The unsuccessful submission and both errors are identified in text.

## Why tools may still over-report
Each target input's own `outerHTML` contains no message. Correct judgment requires resolving a shared, earlier IDREF target and reconciling its two statements with the retained values.

## Citation
`wcag-understanding/error-identification.html`:
> "In the case of an unsuccessful form submission, it is not sufficient to only re-display the form without providing any hint that the submission failed. The error must be indicated in text."
