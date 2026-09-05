# case-07 — paired PASS control for case-01

## Paired source

This is the counterfactual repaired counterpart of `case-01` in `removal-of-status-conveys-meaning-silently`. The page context, content, controls, and distractors are retained; only the documented SC failure is repaired.

## Scenario

Completion replaces “Searching…” with an explicit result count in the same status region instead of silently clearing it.

## Exact repair

Changed the completion update from an empty string to “Search complete. 8 matches found.”

## Expected ACT-style outcome

**passed** for SC 4.1.3. The relevant status/error remains present where applicable, but it is now correctly identified, associated, timed, or announced.

## Pair integrity check

The source remains an expected failure. This repaired page differs only at the decision-boundary mechanism described above; it is intended to catch evaluators that memorize the source page’s surrounding template.

## Citation

> In situations where status text is entirely removed, its absence may itself convey information about the status. The most obvious example of this is where a message is displayed that the system is "busy" or "waiting". For a sighted user, when this text disappears, it is normally an indication that the state is now available. However non-sighted users would be unaware of this change, unless the end of the waiting state results in a change of context for the user. Where updating the visible message (e.g., to "system available") is not feasible, the use of a non-visible status message, such as "system available", ensures equivalent status information is provided.

— wcag-understanding/status-messages.html
