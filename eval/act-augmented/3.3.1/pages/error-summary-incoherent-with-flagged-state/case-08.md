# case-08 — paired PASS control for case-01

## Paired source

This is the counterfactual repaired counterpart of `case-01` in `error-summary-incoherent-with-flagged-state`. The page context, content, controls, and distractors are retained; only the documented SC failure is repaired.

## Scenario

The summary now lists the one genuinely invalid telephone field and links to it; the valid name and email are no longer falsely reported.

## Exact repair

Changed the count from two to one and replaced both stale links with the real telephone error link.

## Expected ACT-style outcome

**passed** for SC 3.3.1. The relevant status/error remains present where applicable, but it is now correctly identified, associated, timed, or announced.

## Pair integrity check

The source remains an expected failure. This repaired page differs only at the decision-boundary mechanism described above; it is intended to catch evaluators that memorize the source page’s surrounding template.

## Citation

> This SC requires that users be provided with information about the nature of the error, including the identity of the item in error.

— wcag-understanding/error-identification.html
