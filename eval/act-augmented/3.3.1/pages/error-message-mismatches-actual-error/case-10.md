# case-10 — paired PASS repair of case-03

## Source and exact repair
This preserves case-03's Lumen password value, checklist, invalid state, and workspace context. The sole decision-boundary repair replaces the false length message with `Password must contain at least one number`, exactly matching the only unmet checklist rule.

## Expected outcome
**passed.** `#pw-err` identifies the actual nature of the rejected value and is included in `#pw`'s computed description.

## Why tools may still over-report
The long password, red invalid styling, and unmet checklist remain. A subject-only extractor can see an invalid password field without resolving the distant description, or retain the source pair's superficially contradictory appearance.

## Citation
`wcag-understanding/error-identification.html`:
> "This SC requires that users be provided with information about the nature of the error, including the identity of the item in error."
