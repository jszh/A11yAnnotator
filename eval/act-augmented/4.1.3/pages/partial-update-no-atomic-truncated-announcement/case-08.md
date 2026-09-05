# case-08 — paired PASS control for case-02

## Paired source

This is the counterfactual repaired counterpart of `case-02` in `partial-update-no-atomic-truncated-announcement`. The page context, content, controls, and distractors are retained; only the documented SC failure is repaired.

## Scenario

The result-count region is now atomic, so replacing only the number announces the whole “Showing N products” status.

## Exact repair

Added aria-atomic=true to the existing polite live region.

## Expected ACT-style outcome

**passed** for SC 4.1.3. The relevant status/error remains present where applicable, but it is now correctly identified, associated, timed, or announced.

## Pair integrity check

The source remains an expected failure. This repaired page differs only at the decision-boundary mechanism described above; it is intended to catch evaluators that memorize the source page’s surrounding template.

## Citation

> The role of status also has a default aria-atomic value of true, so that updates to the container marked with a role of status will result in the AT presenting the entire contents of the container to the user, including any author-defined labels (or additional nested elements). Such additional context can be critical where the status message text alone will not provide an equivalent to the visual experience.

— WCAG Techniques ARIA22 — Using role=status to present status messages
