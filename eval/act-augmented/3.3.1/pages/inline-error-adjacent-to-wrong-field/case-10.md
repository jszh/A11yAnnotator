# case-10 — paired PASS repair of case-04

## Source and exact repair
The Arabic RTL address form and values from case-04 remain. The valid five-digit postal code is no longer flagged; the empty City field now carries the accurate Arabic message “City is required; enter the city name,” with an explicit description reference.

## Expected outcome
**passed.** The actual empty item is identified and described in text.

## Why tools may still over-report
RTL layout and the preserved two-column grid can make visual proximity misleading. The decisive relationship is the resolved `aria-describedby`, not source order or column position.

## Citation
`wcag-understanding/error-identification.html`:
> "This SC requires that users be provided with information about the nature of the error, including the identity of the item in error."
