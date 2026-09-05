# case-08 — paired counterfactual PASS for case-02

## Pair and scenario
This page is the passing counterpart of **case-02** in the same aspect. The Fernweh product page retains the same product options, cart update, toast, and styling as case-02.

## Exact repair
Replace only the clickable div.addcart with a native type=button element.

All other realistic content, presentation, controls, and page structure from case-02 are retained.

## Element / selector
`button.addcart`

## Expected ACT-style outcome
**passed** — SC 1.3.1. Add to cart now has a programmatic button role and native keyboard activation.

## Why this is a hard negative
The visually identical CTA tests whether the evaluator relies on appearance or recognizes native control semantics. It is deliberately paired with case-02, so a detector must distinguish the repaired semantic or behavioral boundary rather than rely on the page topic or visual template.

## Citation
**Reference:** wcag-techniques/failures/F42.html
> Scripted event handling is added to a span element so that it functions as a link when clicked with a mouse. Assistive technology does not recognize this element as a link.
