# case-08 — paired PASS control for case-02

## Paired source

This is the counterfactual repaired counterpart of `case-02` in `inline-error-adjacent-to-wrong-field`. The page context, content, controls, and distractors are retained; only the documented SC failure is repaired.

## Scenario

The error beneath the last-name field now describes that same empty field and is referenced from it.

## Exact repair

Made Last name the actual empty input and changed/associated the inline message to “Last name is required.”

## Expected ACT-style outcome

**passed** for SC 3.3.1. The relevant status/error remains present where applicable, but it is now correctly identified, associated, timed, or announced.

## Pair integrity check

The source remains an expected failure. This repaired page differs only at the decision-boundary mechanism described above; it is intended to catch evaluators that memorize the source page’s surrounding template.

## Citation

> This SC requires that users be provided with information about the nature of the error, including the identity of the item in error.

— wcag-understanding/error-identification.html
