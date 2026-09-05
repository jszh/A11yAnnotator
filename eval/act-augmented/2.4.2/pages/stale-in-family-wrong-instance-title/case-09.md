# case-09 — paired contextual-purpose hard negative for case-02

## Pair and category
Full counterpart of **case-02**. Batch `gena11y-fp-50-v2`; category `contextual-purpose`.

## Exact repair
Change only the stale year in the title from 2025 to 2026. All 2026 event details and the 2025 retrospective remain.

## Selector and mechanism
`head > title` — `Annual Hope Gala 2026 | Riverside Children's Fund` now distinguishes the current event instance.

## Expected outcome
**passed** — SC 2.4.2.

## Why tools may miss
Both years legitimately occur in body copy. A detector must identify which date governs the current event and which is only retrospective evidence.

## Citation
**Reference:** `wcag-techniques/general/G88.html`
> A website that permits editions from different dates to be viewed titles its web page, "National News, Front Page, Oct 17, 2005".
