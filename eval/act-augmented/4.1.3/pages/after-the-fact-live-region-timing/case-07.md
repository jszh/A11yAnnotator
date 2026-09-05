# case-07 — paired PASS control for case-01

## Paired source

This is the counterfactual repaired counterpart of `case-01` in `after-the-fact-live-region-timing`. The page context, content, controls, and distractors are retained; only the documented SC failure is repaired.

## Scenario

The recycling confirmation writes into a live region that exists empty at page load rather than mounting a role=status node already containing text.

## Exact repair

Made #result-area the persistent empty status region and changed the handler to update its textContent.

## Expected ACT-style outcome

**passed** for SC 4.1.3. The relevant status/error remains present where applicable, but it is now correctly identified, associated, timed, or announced.

## Pair integrity check

The source remains an expected failure. This repaired page differs only at the decision-boundary mechanism described above; it is intended to catch evaluators that memorize the source page’s surrounding template.

## Citation

> The absence of all of these techniques predicts a failure for the status message be announced to the user. Additionally, if the role or property is not set before the dynamic content is added, this also predicts a failure.

— wcag-techniques/failures/F103.html
