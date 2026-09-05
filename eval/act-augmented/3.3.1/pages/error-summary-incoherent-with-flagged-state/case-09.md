# case-09 — paired PASS repair of case-01

## Source and exact repair
The Northvale form and all three retained values remain. The stale two-item summary is replaced with one entry naming and linking to the sole invalid Telephone field; its count, membership, target, and inline wording now agree.

## Expected outcome
**passed.** The summary and field-level description identify exactly the real error.

## Why tools may still over-report
The full error-heavy page remains. A correct verdict requires set reconciliation between summary links and invalid fields, rather than reacting to the presence of a red alert.

## Citation
`wcag-understanding/error-identification.html`:
> "This SC requires that users be provided with information about the nature of the error, including the identity of the item in error."
