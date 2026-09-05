# case-09 — paired counterfactual for case-05

## Pair and scenario
The Arabic RTL patient form keeps the same three-part date-of-birth control, Day/Month/Year subfield names, external visible group question, example hint, and flex layout as case-05.

This page is paired with **case-05** in the same aspect and retains its realistic page content, visual design, controls, and surrounding structure.

## Exact repair
Give the visible question and example stable IDs, then add `role="group" aria-labelledby="dob-question" aria-describedby="dob-example"` to the existing `.dob` wrapper. No text is duplicated and the RTL DOM/visual order is unchanged.

## Element / selector
`.dob[role="group"][aria-labelledby="dob-question"][aria-describedby="dob-example"]`

## Expected ACT-style outcome
**passed** — SC 1.3.1. The three subfields are programmatically grouped under their external question and example.

## Why this is a hard negative
The relationship is distributed across three sibling nodes in an RTL form. DOM proximity alone is insufficient; the valid pass depends on the accessibility relationship created by both IDREFs.

## Citation
**Reference:** wcag-techniques/aria/ARIA17.html
> Social security number fields which are nine digits long and broken up into three segments can be grouped using role="group".
