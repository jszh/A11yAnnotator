# case-09 — paired accessibility-tree hard negative for case-03

## Pair and category
Full counterpart of **case-03**. Batch `gena11y-fp-50-v2`; category `accessibility-tree-boundary`.

## Exact repair
Replace only the six ingredient `h5` elements with one semantic `ul.ingredients` containing six `li` elements, styled to retain the source presentation. This both removes the six false headings and accurately exposes the relationship the ingredient series already has; genuine recipe headings and all content remain unchanged.

## Selector and mechanism
`ul.ingredients > li` — ingredient lines no longer create six false heading nodes and now expose their actual list relationship in the accessibility tree.

## Expected outcome
**passed** — SC 1.3.1 for the targeted false-heading mechanism.

## Why tools may miss
The typography is unchanged, so a visual-only judgment can continue to infer headings while a source-only heuristic may not determine that these quantities do not title sections.

## Citation
**Reference:** `wcag-techniques/failures/F43.html`
> structural markup is used to achieve a presentational effect, but indicates relationships that do not exist in the content.
