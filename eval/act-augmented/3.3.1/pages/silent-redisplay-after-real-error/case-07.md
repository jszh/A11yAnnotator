# case-07 — paired PASS control for case-02

## Paired source

This is the counterfactual repaired counterpart of `case-02` in `silent-redisplay-after-real-error`. The page context, content, controls, and distractors are retained; only the documented SC failure is repaired.

## Scenario

The rejected payment is redisplayed with a visible alert identifying the short card number and missing security code rather than a false success banner.

## Exact repair

Converted the success status into an error alert and named both actual input errors in text.

## Expected ACT-style outcome

**passed** for SC 3.3.1. The relevant status/error remains present where applicable, but it is now correctly identified, associated, timed, or announced.

## Pair integrity check

The source remains an expected failure. This repaired page differs only at the decision-boundary mechanism described above; it is intended to catch evaluators that memorize the source page’s surrounding template.

## Citation

> Fill out a form, deliberately enter user input that falls outside the required format or values

— wcag-techniques/general/G85.html
