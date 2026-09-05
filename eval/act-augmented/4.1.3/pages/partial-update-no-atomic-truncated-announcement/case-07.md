# case-07 — paired PASS control for case-01

## Paired source

This is the counterfactual repaired counterpart of `case-01` in `partial-update-no-atomic-truncated-announcement`. The page context, content, controls, and distractors are retained; only the documented SC failure is repaired.

## Scenario

The refill count still updates only its numeral, but the enclosing status is atomic so the complete “refills remaining” phrase is announced.

## Exact repair

Changed aria-atomic from false to true.

## Expected ACT-style outcome

**passed** for SC 4.1.3. The relevant status/error remains present where applicable, but it is now correctly identified, associated, timed, or announced.

## Pair integrity check

The source remains an expected failure. This repaired page differs only at the decision-boundary mechanism described above; it is intended to catch evaluators that memorize the source page’s surrounding template.

## Citation

> However, where only the number in this string was coded as an updated chunk of content, the resulting experience for screen reader users could be to only hear "three", which may not be sufficient information to provide context for the user. In such situations, marking the entire "3 items" string as the status text would normally be a better solution. See Sufficient Techniques for more discussion, including the use of aria-atomic.

— WCAG 2.2 Understanding 4.1.3 — Modification of status text
