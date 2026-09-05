# case-07 — paired counterfactual PASS for case-01

## Pair and scenario
This page is the passing counterpart of **case-01** in the same aspect. The restaurant ordering menu retains the same ARIA menu, roving tabindex, and arrow/Home/End behavior as case-01.

## Exact repair
Remove only the keydown case that intercepts Tab and Shift+Tab.

All other realistic content, presentation, controls, and page structure from case-01 are retained.

## Element / selector
`ul#orderMenu[role="menu"]`

## Expected ACT-style outcome
**passed** — SC 2.1.2. Arrow navigation remains internal while native Tab navigation can move focus away from the composite widget.

## Why this is a hard negative
The ARIA structure and arrow behavior match the failure; only an actual Tab traversal reveals the repaired boundary. It is deliberately paired with case-01, so a detector must distinguish the repaired semantic or behavioral boundary rather than rely on the page topic or visual template.

## Citation
**Reference:** wcag-understanding/no-keyboard-trap.html
> Keyboard focus is not considered trapped when the user can navigate away from a component using only a keyboard interface, and if it only requires unmodified arrow or Tab keys or other "standard exit methods".
