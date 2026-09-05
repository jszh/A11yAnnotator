# case-08 — paired counterfactual for case-02

## Pair and scenario
The coffee survey keeps the same two questions, radio options, labels, and card layout as case-02. The first question remains a separate visual node immediately before its options.

This page is paired with **case-02** in the same aspect and retains its realistic page content, visual design, controls, and surrounding structure.

## Exact repair
Give the existing question node `id="hear-question"` and wrap only its four radios in `role="radiogroup" aria-labelledby="hear-question"`. The valid IDREF crosses nodes without duplicating or hiding the visible question.

## Element / selector
`.hear-options[role="radiogroup"][aria-labelledby="hear-question"]`

## Expected ACT-style outcome
**passed** — SC 1.3.1. The external visible question is programmatically associated with exactly the radio options it governs.

## Why this is a hard negative
The question is deliberately not a legend and is not nested inside the radio wrapper. A reviewer must resolve the IDREF across nodes and verify that the referenced text and group boundary match the rendered relationship.

## Citation
**Reference:** refs/trusted-tester/sc-1.3.1-info-and-relationships.md
> At minimum, radio buttons and checkboxes should be programmatically associated with their question and response.
