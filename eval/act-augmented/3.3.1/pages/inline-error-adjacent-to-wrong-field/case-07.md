# case-07 — paired PASS control for case-01

## Paired source

This is the counterfactual repaired counterpart of `case-01` in `inline-error-adjacent-to-wrong-field`. The page context, content, controls, and distractors are retained; only the documented SC failure is repaired.

## Scenario

The CVV error is moved from the valid card-number field to the invalid two-digit CVV and is programmatically associated with that input.

## Exact repair

Removed the false card-number styling, moved the message under CVV, and added aria-invalid/aria-describedby to the CVV.

## Expected ACT-style outcome

**passed** for SC 3.3.1. The relevant status/error remains present where applicable, but it is now correctly identified, associated, timed, or announced.

## Pair integrity check

The source remains an expected failure. This repaired page differs only at the decision-boundary mechanism described above; it is intended to catch evaluators that memorize the source page’s surrounding template.

## Citation

> Each test target either has no form field error indicators , or at least one of the form field error indicators allows the identification of the related test target, through text , or through non-text content , or through presentation .

— act-rules/extracted/36b590.md
