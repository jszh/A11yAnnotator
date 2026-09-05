# case-08 — paired PASS control for case-01

## Paired source

This is the counterfactual repaired counterpart of `case-01` in `error-message-mismatches-actual-error`. The page context, content, controls, and distractors are retained; only the documented SC failure is repaired.

## Scenario

The retained phone number has 11 digits; the repaired message now identifies the actual length error and gives the 10-digit correction.

## Exact repair

Replaced the unrelated letters-and-parentheses boilerplate with “Mobile number must be exactly 10 digits. Remove the extra digit and try again.”

## Expected ACT-style outcome

**passed** for SC 3.3.1. The relevant status/error remains present where applicable, but it is now correctly identified, associated, timed, or announced.

## Pair integrity check

The source remains an expected failure. This repaired page differs only at the decision-boundary mechanism described above; it is intended to catch evaluators that memorize the source page’s surrounding template.

## Citation

> The intent of this success criterion is to ensure that users are aware that an error has occurred and can determine what is wrong.

— wcag-understanding/error-identification.html
