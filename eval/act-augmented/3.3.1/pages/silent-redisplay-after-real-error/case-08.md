# case-08 — paired PASS control for case-03

## Paired source

This is the counterfactual repaired counterpart of `case-03` in `silent-redisplay-after-real-error`. The page context, content, controls, and distractors are retained; only the documented SC failure is repaired.

## Scenario

The rejected sign-in now exposes a specific visible alert and associates it with the invalid password field while preserving the original portal context.

## Exact repair

Added an error alert identifying the password failure, plus aria-invalid and aria-describedby on the password field.

## Expected ACT-style outcome

**passed** for SC 3.3.1. The relevant status/error remains present where applicable, but it is now correctly identified, associated, timed, or announced.

## Pair integrity check

The source remains an expected failure. This repaired page differs only at the decision-boundary mechanism described above; it is intended to catch evaluators that memorize the source page’s surrounding template.

## Citation

> This is a **trigger-and-observe** test — the tester must actively *cause* an error
> (submit invalid input) and then check whether the resulting error is conveyed in text. It is not a static
> inspection.

— refs/trusted-tester/sc-3.3.1-error-identification.md
