# case-07 — paired PASS control for case-05

## Paired source

This is the counterfactual repaired counterpart of `case-05` in `is-it-a-status-message-scope-boundary`. The page context, content, controls, and distractors are retained; only the documented SC failure is repaired.

## Scenario

The no-focus-change job-filter result summary is now a polite atomic status region, so result-count changes are announced.

## Exact repair

Added role=status, aria-live=polite, and aria-atomic=true to #summary.

## Expected ACT-style outcome

**passed** for SC 4.1.3. The relevant status/error remains present where applicable, but it is now correctly identified, associated, timed, or announced.

## Pair integrity check

The source remains an expected failure. This repaired page differs only at the decision-boundary mechanism described above; it is intended to catch evaluators that memorize the source page’s surrounding template.

## Citation

> the list of results obtained from a search are not considered a status update and thus are not covered by this success criterion. However, brief text messages displayed about the completion or status of the search, such as "Searching...", "18 results returned" or "No results returned" would be status updates if they do not take focus or cause a page refresh.

— wcag-understanding/status-messages.html
