# case-08 — paired contextual-purpose hard negative for case-02

## Pair and category
Full counterpart of **case-02**. Batch `gena11y-fp-50-v2`; category `contextual-purpose`.

## Exact repair
Change only the generic `Checkout` title to `Payment — Step 3 of 4 | Loomwell Home Checkout`.

## Selector and mechanism
`head > title` — the title identifies the current payment step and distinguishes it from Cart, Shipping, and Review siblings.

## Expected outcome
**passed** — SC 2.4.2.

## Why tools may miss
Both variants have a valid title and the same checkout shell. Semantic comparison with the visible step indicator is required.

## Citation
**Reference:** `wcag-techniques/failures/F25.html`
> A site generated using templates includes the same title for each page on the site. So the title cannot be used to distinguish among the pages.
