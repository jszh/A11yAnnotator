# case-12 — paired PASS repair of case-06

## Source and exact repair
The Juniper checkout and retained `9021` ZIP from case-06 remain. The message no longer quotes a normalized value the user never entered; it accurately states that the retained value has four digits and five are required.

## Expected outcome
**passed.** `#zip-err` identifies the field's actual length error and is its programmatic description.

## Why tools may still over-report
The rejected short value and invalid appearance remain, while the decisive correction lives in a referenced sibling node that an element-only extraction may omit.

## Citation
`wcag-understanding/error-identification.html`:
> "This SC requires that users be provided with information about the nature of the error, including the identity of the item in error."
