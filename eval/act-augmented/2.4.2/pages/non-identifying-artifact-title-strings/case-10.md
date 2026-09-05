# case-10 — paired contextual-purpose hard negative for case-02

## Pair and category
Full counterpart of **case-02**. Batch `gena11y-fp-50-v2`; category `contextual-purpose`.

## Exact repair
Change only `<title>Vite + React</title>` to `<title>New Engineer Onboarding Checklist — Acme HR</title>`.

## Selector and mechanism
`head > title` — the title now identifies both the SPA view and product context.

## Expected outcome
**passed** — SC 2.4.2.

## Why tools may miss
Both titles are nonempty and syntactically valid; correctness requires comparing the title's meaning with the preserved onboarding view.

## Citation
**Reference:** `wcag-understanding/page-titled.html`
> In Single Page Applications ... the title of the page should also be changed dynamically to reflect the content or topic of the current view.
