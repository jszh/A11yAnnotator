# case-12 — paired PASS repair of case-06

## Scenario and source pair

The complete Vantage expense claim, £139 meal line, £75 policy, and yellow attention highlight are preserved from the failed source.

**Paired failed source:** `case-06.html`

**Balance batch:** `gena11y-fp-50-v2`

**Hard-negative type:** `accessibility-evidence-omitted`

## Exact counterfactual repair

Added a visibly rendered error description inside the highlighted fieldset, marked the meal amount invalid, and associated the field with that description. The original yellow highlight remains as a redundant visual cue rather than the sole error carrier.

## Primary selector

`#a2`

## Accessibility mechanism

Both the rendered page and accessibility tree expose “Line 2 meal amount £139 exceeds the £75 per-meal cap,” and the invalid amount resolves that sentence through `aria-describedby`. The yellow fieldset is now supplementary.

## Expected ACT-style outcome

**passed** — SC 3.3.1

## Why this is a hard negative

The source’s yellow attention treatment remains visually prominent, but it is no longer the only evidence. Correct evaluation requires reading the newly rendered sentence, checking that it accurately explains the £139 versus £75 breach, and resolving its association to the amount field rather than stopping at the residual color cue.

## Citation

> **wcag-understanding/error-identification.html:**
> “This SC requires that users be provided with information about the nature of the error, including the identity of the item in error.”
