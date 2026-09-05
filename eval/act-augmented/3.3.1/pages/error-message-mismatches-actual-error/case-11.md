# case-11 — paired PASS repair of case-05

## Source and exact repair
This retains case-05's hotel, durable future dates (`2099-08-01` to `2099-09-25`), 30-night policy, field state, and layout. Only the false “check-out must be after check-in” message is replaced with the actual error: the 55-night stay exceeds the stated 30-night maximum. The same durability-only date constants are used in both pair members so no unrelated past-date error can emerge.

## Expected outcome
**passed.** The item and actual constraint violation are identified in associated text.

## Why tools may still over-report
The dates and invalid styling are unchanged. Correctness requires calculating their interval, reconciling it with the policy, and resolving both `aria-describedby` references.

## Citation
`wcag-understanding/error-identification.html`:
> "This SC requires that users be provided with information about the nature of the error, including the identity of the item in error."
