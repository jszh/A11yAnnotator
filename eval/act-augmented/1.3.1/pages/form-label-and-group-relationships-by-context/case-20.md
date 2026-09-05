# case-20 — Required inputs named through their visible labels and external marker

## Pair and category

Paired PASS for **case-03**. Batch `initial-79-actlike-v2`; category `external-reference`.

## Exact repair

Add visible required text, native required state, and self-specific external aria-labelledby references for every required control.

## Primary selector

`input[required][aria-labelledby]`

## Accessibility mechanism

The complete name is computed from label elements outside the extracted input nodes, while the shared marker is visible and programmatic.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required relationship or purpose. A target-only extractor can omit the decisive evidence, which is the intended specificity stressor.

## Citation

**Reference:** refs/trusted-tester/sc-1.3.1-info-and-relationships.md

> ANDI Output includes all relevant instructions and cues for the form element, including when fields are required
