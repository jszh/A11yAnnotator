# case-07 — paired PASS control for case-01

## Paired source

This is the counterfactual repaired counterpart of `case-01` in `wrong-live-region-politeness-for-urgency`. The page context, content, controls, and distractors are retained; only the documented SC failure is repaired.

## Scenario

The non-urgent preferences-saved confirmation is now exposed through a polite live region.

## Exact repair

Changed aria-live from off to polite while retaining atomic announcement of the complete message.

## Expected ACT-style outcome

**passed** for SC 4.1.3. The relevant status/error remains present where applicable, but it is now correctly identified, associated, timed, or announced.

## Pair integrity check

The source remains an expected failure. This repaired page differs only at the decision-boundary mechanism described above; it is intended to catch evaluators that memorize the source page’s surrounding template.

## Citation

> The absence of all of these techniques predicts a failure for the status message be announced to the user.

— WCAG Techniques — F103 'Failure of Success Criterion 4.1.3 due to providing status messages that cannot be programmatically determined through role or properties' (wcag-techniques/failures/F103.html)
