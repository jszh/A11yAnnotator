# case-10 — paired accessibility-tree hard negative for case-03

## Pair and category
Full counterpart of **case-03**. Batch `gena11y-fp-50-v2`; category `accessibility-tree-boundary`.

## Exact repair
Replace only the mouse-only whole-row navigation with native address links to the same four listing destinations. The hint is minimally updated from “Click a row” to “Select an address” so it does not contradict the repaired operation; table data and presentation are retained.

## Selector and mechanism
`tbody tr.listing td > a.addr[href]` — each action now exposes a link name, link role, destination, focus stop, and native Enter activation without falsifying the row's table role.

## Expected outcome
**passed** — SC 1.3.1.

## Why tools may miss
The clickable-looking addresses and table remain visually near-identical. Correct disposition depends on the effective accessibility-tree role and native keyboard behavior.

## Citation
**Reference:** `wcag-techniques/failures/F42.html`
> Check if the programmatically determined role of the element is "link".
