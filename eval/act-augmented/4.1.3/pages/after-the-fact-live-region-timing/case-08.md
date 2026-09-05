# case-08 — paired PASS control for case-03

## Paired source

This is the counterfactual repaired counterpart of `case-03` in `after-the-fact-live-region-timing`. The page context, content, controls, and distractors are retained; only the documented SC failure is repaired.

## Scenario

The catalogue results container is a polite atomic live region from initial page load, before search results are inserted.

## Exact repair

Added live-region semantics to the initially empty #results container and removed the after-the-fact marker.

## Expected ACT-style outcome

**passed** for SC 4.1.3. The relevant status/error remains present where applicable, but it is now correctly identified, associated, timed, or announced.

## Pair integrity check

The source remains an expected failure. This repaired page differs only at the decision-boundary mechanism described above; it is intended to catch evaluators that memorize the source page’s surrounding template.

## Citation

> After a user presses a Search button, the page content is updated to include the results of the search, which are displayed in a section below the Search button. The change to content also includes the message "5 results returned" near the top of this new content. This text is given an appropriate role for a status message. A screen reader announces, "Five results returned".

— wcag-understanding/status-messages.html
