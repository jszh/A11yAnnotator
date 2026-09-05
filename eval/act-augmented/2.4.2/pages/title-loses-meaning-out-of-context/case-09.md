# case-09 — paired contextual-purpose hard negative for case-03

## Pair and category
Full counterpart of **case-03**. Batch `gena11y-fp-50-v2`; category `contextual-purpose`.

## Exact repair
Change only `GET /users` to `List users (GET /v3/users) — Helios Identity API v3`.

## Selector and mechanism
`head > title` — operation, versioned endpoint, API product, and purpose remain meaningful in a tab or history list.

## Expected outcome
**passed** — SC 2.4.2.

## Why tools may miss
The failed title already looked technical and plausible. Correctness requires resolving the terse endpoint against product/version context and page purpose.

## Citation
**Reference:** `wcag-techniques/general/G88.html`
> Make sense when read out of context, for example by a screen reader or in a site map or list of search results
