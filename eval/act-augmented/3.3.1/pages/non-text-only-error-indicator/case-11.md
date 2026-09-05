# case-11 — paired PASS repair of case-02

## Scenario and source pair

The complete patient-intake form, impossible date 31/02/1991, and red warning icon are preserved from the failed source.

**Paired failed source:** `case-02.html`

**Balance batch:** `gena11y-fp-50-v2`

**Hard-negative type:** `error-identification`

## Exact counterfactual repair

Added one visible specific error sentence beside the existing icon and associated it with the date field while marking the field invalid. No value or icon was removed.

## Primary selector

`#dob`

## Accessibility mechanism

The error is now identified in text as “Date of birth is not a valid calendar date,” and the date input exposes that description programmatically in addition to the visual icon.

## Expected ACT-style outcome

**passed** — SC 3.3.1

## Why this is a hard negative

The original red triangular indicator remains visually dominant. An evaluator focused on the residual icon can miss the nearby text and resolved description relationship.

## Citation

> **wcag-understanding/error-identification.html:**
> “This SC requires that users be provided with information about the nature of the error, including the identity of the item in error.”
