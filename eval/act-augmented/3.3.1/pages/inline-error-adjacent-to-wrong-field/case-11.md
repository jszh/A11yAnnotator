# case-11 — paired PASS repair of case-05

## Scenario and source pair

The complete blood-pressure form, normal systolic value 118, invalid diastolic value 135, and inline message are preserved from the failed source.

**Paired failed source:** `case-05.html`

**Balance batch:** `gena11y-fp-50-v2`

**Hard-negative type:** `error-identification`

## Exact counterfactual repair

Moved only the invalid styling and error message to the diastolic control and linked that control to the message with `aria-describedby` and `aria-invalid=true`.

## Primary selector

`#dia`

## Accessibility mechanism

The text “Diastolic must be between 40 and 120 mmHg” now appears with and programmatically describes the actual invalid diastolic field; systolic is no longer falsely flagged.

## Expected ACT-style outcome

**passed** — SC 3.3.1

## Why this is a hard negative

The same two-column visual layout, values, and error sentence remain. A position-based evaluator can cling to the source’s left-column error pattern unless it checks the corrected field association.

## Citation

> **wcag-understanding/error-identification.html:**
> “This SC requires that users be provided with information about the nature of the error, including the identity of the item in error.”
