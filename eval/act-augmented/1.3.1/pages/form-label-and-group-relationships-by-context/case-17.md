# case-17 — RTL date group named and described through external IDREFs

## Pair and category

Paired PASS for **case-05**. Batch `initial-79-actlike-v2`; category `external-reference`.

## Exact repair

Name and describe the split date group using the existing Arabic question and hint as IDREF targets.

## Primary selector

`.field[role="group"]`

## Accessibility mechanism

The Arabic group name and format instruction live outside all three extracted input elements but resolve in the accessibility tree.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required relationship or purpose. A target-only extractor can omit the decisive evidence, which is the intended specificity stressor.

## Citation

**Reference:** wcag-techniques/aria/ARIA17.html

> Social security number fields which are nine digits long and broken up into three segments can be grouped using role="group".
