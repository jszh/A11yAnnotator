# case-12 — paired external-reference hard negative for case-04

## Pair and category
Full counterpart of **case-04**. Batch `gena11y-fp-50-v2`; category `external-reference`.

## Exact repair
Keep both questions, help text, Yes/No controls, layout, and labels. Add IDs to each external question/help pair and make its existing options container a named `role="group"` using `aria-labelledby` and `aria-describedby`.

## Selector and mechanism
`.opts[role="group"][aria-labelledby][aria-describedby]` — each repeated Yes/No set now exposes the question and clarification it answers.

## Expected outcome
**passed** — SC 1.3.1.

## Why tools may miss
An isolated radio remains named only “Yes” or “No”; the decisive evidence lives in two external IDREF targets and must be resolved as a group relationship.

## Citation
**Reference:** `refs/trusted-tester/sc-1.3.1-info-and-relationships.md`
> At minimum, radio buttons and checkboxes should be programmatically associated with their question and response.
