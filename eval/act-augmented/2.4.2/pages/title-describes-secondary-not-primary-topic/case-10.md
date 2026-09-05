# case-10 — paired contextual-purpose hard negative for case-04

## Pair and category
Full counterpart of **case-04**. Batch `gena11y-fp-50-v2`; category `contextual-purpose`.

## Exact repair
Change only the maintenance-banner title to `Resetting your password — Cendre Help`, matching the dominant help article.

## Selector and mechanism
`head > title` — the current location is identifiable without reading page content.

## Expected outcome
**passed** — SC 2.4.2.

## Why tools may miss
The maintenance message remains prominent, but is secondary. The evaluator must distinguish primary article purpose from visible peripheral content.

## Citation
**Reference:** `wcag-understanding/page-titled.html`
> Titles identify the current location without requiring users to read or interpret page content.
