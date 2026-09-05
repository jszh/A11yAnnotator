# case-08 — paired PASS control for case-01

## Paired source

This is the counterfactual repaired counterpart of `case-01` in `non-text-only-error-indicator`. The page context, content, controls, and distractors are retained; only the documented SC failure is repaired.

## Scenario

The over-capacity seat request retains its visual styling but now also has a specific textual error associated with the field.

## Exact repair

Added aria-invalid, aria-describedby, and visible text stating that no more than five places can be reserved.

## Expected ACT-style outcome

**passed** for SC 3.3.1. The relevant status/error remains present where applicable, but it is now correctly identified, associated, timed, or announced.

## Pair integrity check

The source remains an expected failure. This repaired page differs only at the decision-boundary mechanism described above; it is intended to catch evaluators that memorize the source page’s surrounding template.

## Citation

> it is not sufficient to only re-display the form without providing any hint that the submission failed. The error must be indicated in text.

— eval/act-augmented/3.3.1/pages/non-text-only-error-indicator/case-01.md
