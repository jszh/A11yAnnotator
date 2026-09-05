# case-07 — paired counterfactual PASS for case-01

## Pair and scenario
This page is the passing counterpart of **case-01** in the same aspect. The task-board help page retains the same titled embedded quick tour and the controls following it from case-01.

## Exact repair
Remove only the frame script that suppresses Tab and re-focuses its button; the paired main page points to case-07-frame.html.

All other realistic content, presentation, controls, and page structure from case-01 are retained.

## Element / selector
`iframe[title="Quick tour: pinning your first board"]`

## Expected ACT-style outcome
**passed** — SC 2.1.2. Native Tab now leaves the embedded application and reaches the following parent-page control.

## Why this is a hard negative
Static iframe structure is unchanged; only real cross-frame keyboard traversal proves the pass. It is deliberately paired with case-01, so a detector must distinguish the repaired semantic or behavioral boundary rather than rely on the page topic or visual template.

## Citation
**Reference:** wcag-techniques/failures/F10.html
> Applies when content creates a situation where the user can enter the content using the keyboard, but cannot exit the content using the keyboard.
