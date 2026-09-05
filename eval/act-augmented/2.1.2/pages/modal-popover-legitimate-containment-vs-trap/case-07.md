# case-07 — paired counterfactual PASS for case-01

## Pair and scenario
This page is the passing counterpart of **case-01** in the same aspect. The pharmacy refill dialog retains the same modal containment, fields, and Tab cycle as case-01.

## Exact repair
Add only a keyboard-reachable Close refill dialog button to the existing focus cycle and wire it to dialog.close().

All other realistic content, presentation, controls, and page structure from case-01 are retained.

## Element / selector
`#dismiss`

## Expected ACT-style outcome
**passed** — SC 2.1.2. Focus may remain contained while the dialog is open because a standard keyboard-operable dismiss is reachable.

## Why this is a hard negative
A focus-cycle observer still sees containment; it must verify that the reachable dismiss actually releases the user. It is deliberately paired with case-01, so a detector must distinguish the repaired semantic or behavioral boundary rather than rely on the page topic or visual template.

## Citation
**Reference:** wcag-understanding/no-keyboard-trap.html
> There may be times when it's appropriate for a web page to restrict focus to a subsection of the content – for example, when the user is inside a modal dialog or popover. This does not fail the requirements of this criterion, as long as the user knows how to "untrap" the focus and leave that component.
