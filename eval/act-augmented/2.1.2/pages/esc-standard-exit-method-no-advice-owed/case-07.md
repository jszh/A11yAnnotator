# case-07 — paired counterfactual PASS for case-02

## Pair and scenario
This page is the passing counterpart of **case-02** in the same aspect. The Trailhead quick-view modal retains the same controls, Tab containment, and absence of escape advice as case-02.

## Exact repair
Change only the Escape branch from swallowing the key to invoking the existing close() function.

All other realistic content, presentation, controls, and page structure from case-02 are retained.

## Element / selector
`#qv`

## Expected ACT-style outcome
**passed** — SC 2.1.2. Escape is a standard exit method and releases focus to the trigger, so no special advice is required.

## Why this is a hard negative
The static modal markup and visible text are unchanged; pressing Escape is necessary to distinguish this pass. It is deliberately paired with case-02, so a detector must distinguish the repaired semantic or behavioral boundary rather than rely on the page topic or visual template.

## Citation
**Reference:** wcag-understanding/no-keyboard-trap.html
> If untrapping focus requires a different method (rather than unmodified arrow keys, the Tab key, or other "standard exit methods"), content can still pass this criterion provided that the user is advised how they can untrap focus using their keyboard interface.
