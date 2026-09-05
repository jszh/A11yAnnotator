# case-09 — paired PASS control for case-02

## Paired source

This is the counterfactual repaired counterpart of `case-02` in `error-message-mismatches-actual-error`. The page context, content, controls, and distractors are retained. The documented SC failure is repaired, and the future-year constant is moved from 2027 to 2099 so this boundary case remains stable over time without changing the value’s semantic category.

## Scenario

The retained date, 03/14/2099, is durably in the future; the repaired message now identifies that actual date-of-birth constraint instead of claiming the valid format is wrong.

## Exact repair

Changed the message to “Date of birth must be in the past. Enter a date before today.” The source’s future-date value was advanced to 2099 without changing its semantic category, preventing calendar-driven fixture drift.

## Expected ACT-style outcome

**passed** for SC 3.3.1. The relevant status/error remains present where applicable, but it is now correctly identified, associated, timed, or announced.

## Pair integrity check

The source remains an expected failure. This repaired page differs only at the decision-boundary mechanism described above; it is intended to catch evaluators that memorize the source page’s surrounding template.

## Citation

> the user enters a birth date 2 years in the future;

— wcag-understanding/error-identification.html
