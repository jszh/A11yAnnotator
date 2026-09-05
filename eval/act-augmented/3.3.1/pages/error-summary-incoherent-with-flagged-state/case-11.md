# case-11 — paired PASS repair of case-03

## Scenario and source pair

The complete patient-registration form and its three genuinely invalid fields are preserved from the failed source.

**Paired failed source:** `case-03.html`

**Balance batch:** `gena11y-fp-50-v2`

**Hard-negative type:** `error-identification`

## Exact counterfactual repair

Replaced only the inaccurate one-error summary with a three-item list linking to Date of birth, Mobile number, and Postcode. The already-correct inline messages and invalid states are unchanged.

## Primary selector

`.summary[role="alert"]`

## Accessibility mechanism

The summary count and membership now exactly match the three fields identified in error, and each item names and targets the corresponding control.

## Expected ACT-style outcome

**passed** — SC 3.3.1

## Why this is a hard negative

The dense form and all three red inline states remain. A model must reconcile the summary against field state and not repeat the source’s stale “1 error” assessment.

## Citation

> **wcag-understanding/error-identification.html:**
> “This SC requires that users be provided with information about the nature of the error, including the identity of the item in error.”
