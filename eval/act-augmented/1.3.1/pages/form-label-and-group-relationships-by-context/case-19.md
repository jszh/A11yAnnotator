# case-19 — Required relationships use visible text and a shared external instruction

## Pair and category

Paired PASS for **case-03**. Batch `initial-79-actlike-v2`; category `external-reference`.

## Exact repair

Make the required cue textual, add native required state, and associate the shared visible instruction with every required input.

## Primary selector

`input[required][aria-describedby="required-note"]`

## Accessibility mechanism

Each required input resolves the instruction through aria-describedby outside its extracted element; visible “(required)” text makes color redundant.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required relationship or purpose. A target-only extractor can omit the decisive evidence, which is the intended specificity stressor.

## Citation

**Reference:** refs/trusted-tester/sc-1.3.1-info-and-relationships.md

> ANDI Output includes all relevant instructions and cues for the form element, including when fields are required
