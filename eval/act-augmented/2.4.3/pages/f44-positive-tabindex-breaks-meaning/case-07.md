# case-07 — paired redundant-visual-cue hard negative for case-01

## Pair and category
Full counterpart of **case-01**. Batch `gena11y-fp-50-v2`; category `redundant-graphic-or-visual-cue`.

## Exact repair
Remove only the five positive `tabindex` attributes. Preserve the ordered list, visible numbered chips, module names, prerequisite copy, links, and DOM order.

## Selector and mechanism
`ol.modules a:not([tabindex])` — native focus order now follows Start, Modules 1–4. The visible ordinal chips reinforce rather than contradict that sequence.

## Expected outcome
**passed** — SC 2.4.3.

## Why tools may miss
The same strong number cues remain and may trigger stale suspicion. Only an actual focus traversal establishes that the programmatic order now agrees with them.

## Citation
**Reference:** `wcag-techniques/failures/F44.html`
> When the values of the tabindex attribute are assigned in a different order than the relationships and sequences in the content, the tab order no longer follows the relationships and sequences in the content.
