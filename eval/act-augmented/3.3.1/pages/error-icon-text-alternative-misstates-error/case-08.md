# case-08 — paired PASS control for case-01

## Paired source

This is the counterfactual repaired counterpart of `case-01` in `error-icon-text-alternative-misstates-error`. The page context, content, controls, and distractors are retained; only the documented SC failure is repaired.

## Scenario

The sole error icon now has a specific alternative describing the malformed email rather than the generic word “error”.

## Exact repair

Changed the icon alt to “Email address must contain an @ symbol.”

## Expected ACT-style outcome

**passed** for SC 3.3.1. The relevant status/error remains present where applicable, but it is now correctly identified, associated, timed, or announced.

## Pair integrity check

The source remains an expected failure. This repaired page differs only at the decision-boundary mechanism described above; it is intended to catch evaluators that memorize the source page’s surrounding template.

## Citation

> This SC requires that users be provided with information about the nature of the error, including the identity of the item in error.

— wcag-understanding/error-identification.html
