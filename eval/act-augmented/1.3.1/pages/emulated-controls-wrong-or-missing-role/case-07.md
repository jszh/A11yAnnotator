# case-07 — paired counterfactual PASS for case-01

## Pair and scenario
This page is the passing counterpart of **case-01** in the same aspect. The Ledger Review pagination retains the same articles, page numbers, and client-side navigation behavior as case-01.

## Exact repair
Replace only the clickable span.pglink elements with real anchors carrying href destinations.

All other realistic content, presentation, controls, and page structure from case-01 are retained.

## Element / selector
`nav.pager a.pglink`

## Expected ACT-style outcome
**passed** — SC 1.3.1. Every pagination action now exposes link semantics and native keyboard operation.

## Why this is a hard negative
The controls look and behave the same with a pointer; keyboard and accessibility semantics distinguish the pass. It is deliberately paired with case-01, so a detector must distinguish the repaired semantic or behavioral boundary rather than rely on the page topic or visual template.

## Citation
**Reference:** wcag-techniques/failures/F42.html
> This failure occurs when JavaScript event handlers are attached to elements to emulate links. A link created in this manner cannot be tabbed to from the keyboard and does not gain keyboard focus like other controls and/or links. If scripting events are used to emulate links, user agents including assistive technology may not be able to identify the links in the content as links.
