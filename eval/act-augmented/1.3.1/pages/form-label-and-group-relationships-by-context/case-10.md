# case-10 — paired counterfactual for case-03

## Pair and scenario
The insurance driver form keeps the same red required labels, note, fields, and layout as case-03.

This page is paired with **case-03** in the same aspect and retains its realistic page content, visual design, controls, and surrounding structure.

## Exact repair
Retain the red cue but add a visible `(required)` token plus native `required`/`aria-required` state for each required field. Revise the existing note to identify the textual token first, give it an ID, and reference it from each required field with `aria-describedby`.

## Element / selector
`input[required][aria-required="true"][aria-describedby="required-note"]`

## Expected ACT-style outcome
**passed** — SC 1.3.1. Required status is available in visible text, native/ARIA state, and the associated instruction rather than through color alone.

## Why this is a hard negative
The page retains the source’s red-label presentation, but the cue is now redundant. Correct evaluation requires checking that the visible token, required state, and referenced instruction consistently identify exactly the intended fields.

## Citation
**Reference:** refs/trusted-tester/sc-1.3.1-info-and-relationships.md
> ANDI Output includes all relevant instructions and cues for the form element, including when fields are required
