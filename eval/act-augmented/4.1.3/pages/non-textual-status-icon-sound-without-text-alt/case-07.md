# case-07 — paired PASS control for case-01

## Paired source

This is the counterfactual repaired counterpart of `case-01` in `non-textual-status-icon-sound-without-text-alt`. The page context, content, controls, and distractors are retained; only the documented SC failure is repaired.

## Scenario

The licence result retains its status icon but now updates an adjacent text node with a specific success or error message.

## Exact repair

Added #licenceStatusText and updated it alongside the icon for valid and invalid submissions.

## Expected ACT-style outcome

**passed** for SC 4.1.3. The relevant status/error remains present where applicable, but it is now correctly identified, associated, timed, or announced.

## Pair integrity check

The source remains an expected failure. This repaired page differs only at the decision-boundary mechanism described above; it is intended to catch evaluators that memorize the source page’s surrounding template.

## Citation

> Changes in content are not restricted to text changes. Where an icon or sound indicates a status message, this information will be surfaced by the screen reader through a combination of two things: 1) existing WCAG requirements governing text alternatives (under Success Criterion 1.1.1 Non-Text Content), and 2) the requirement of this current success criterion to supply an appropriate role.

— WCAG 2.2 Understanding 4.1.3 (Non-textual status content), wcag-understanding/status-messages.html
