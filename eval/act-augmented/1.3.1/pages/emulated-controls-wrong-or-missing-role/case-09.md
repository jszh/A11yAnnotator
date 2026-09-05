# case-09 — paired counterfactual for case-05

## Pair and scenario
The Plumeline funnel report keeps the same div-based visual tabs, panels, click activation, focus treatment, and KPI content as case-05.

This page is paired with **case-05** in the same aspect and retains its realistic page content, visual design, controls, and surrounding structure.

## Exact repair
Add `tablist`, `tab`, and `tabpanel` roles; connect each tab and panel with `aria-controls`/`aria-labelledby`; maintain `aria-selected`, hidden state, and roving tabindex during click and keyboard activation. The DOM elements remain styled divs.

## Element / selector
`.tabs[role="tablist"] > .tab[role="tab"]`

## Expected ACT-style outcome
**passed** — SC 1.3.1. The control roles, selected state, ownership, and panel relationships are programmatically determinable throughout interaction.

## Why this is a hard negative
This is not converted to easy native buttons. It remains a custom composite whose pass depends on the complete accessibility-tree contract and synchronized runtime behavior.

## Citation
**Reference:** wcag-techniques/failures/F42.html
> This example uses script to make a div element behave like a link. Although the author has provided complete keyboard access and separated the event handlers from the markup to enable repurposing of the content, the div element will not be recognized as a link by assistive technology.
