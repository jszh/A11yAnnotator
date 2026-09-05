# case-09 — paired PASS repair of case-03

## Source and exact repair
The complete Riverkeeper page, amount, maximum, visible icon, invalid state, and association remain. Only the icon's accessible name changes from the asset token `error_outline` to the exact error: `$25,000 exceeds the $10,000 online maximum`. Both pair members also carry the identical non-target `aria-label="Gift amount in US dollars"` on the amount input, solely to prevent an unrelated unlabeled-control confound.

## Expected outcome
**passed.** The referenced graphic's computed accessible name identifies both field and cause.

## Why tools may still over-report
The rendered CSS pseudo-element remains `!` while the icon's DOM node is empty; a source-snippet evaluator that ignores the computed accessibility tree or referenced note can miss the meaningful accessible name.

## Citation
`wcag-techniques/general/G84.html`:
> "A text description of the problem should be provided."
