# case-10 — paired PASS repair of case-02

## Source and exact repair
The complete Copper Pot form, including contact email, empty event date, venue textarea, and zero guests, remains. The impossible “City” summary entry alone is removed; the two remaining summary lines correspond exactly to the two invalid controls and their inline descriptions.

## Expected outcome
**passed.** Summary membership, invalid states, and inline descriptions reconcile.

## Why tools may still over-report
The venue text visually contains a place but is not invalid. Correct judgment requires matching the summary's set to controls rather than guessing from prose or red styling.

## Citation
`wcag-techniques/general/G83.html`:
> "Using server-side validation, the omission is detected and the form is re-displayed with a text description at the top informing which mandatory fields were omitted."
