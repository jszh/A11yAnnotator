# case-08 — paired PASS control for case-03

## Paired source

This is the counterfactual repaired counterpart of `case-03` in `wrong-live-region-politeness-for-urgency`. The page context, content, controls, and distractors are retained; only the documented SC failure is repaired.

## Scenario

The blocking 30-second session-expiry warning is now assertive so it interrupts in time for the claimant to act.

## Exact repair

Changed the urgent session region from aria-live=polite to aria-live=assertive.

## Expected ACT-style outcome

**passed** for SC 4.1.3. The relevant status/error remains present where applicable, but it is now correctly identified, associated, timed, or announced.

## Pair integrity check

The source remains an expected failure. This repaired page differs only at the decision-boundary mechanism described above; it is intended to catch evaluators that memorize the source page’s surrounding template.

## Citation

> The intent of this success criterion is to make users aware of important changes in content that are not given focus, and to do so in a way that doesn't unnecessarily interrupt their work.

— WCAG 2.2 Understanding SC 4.1.3 Status Messages — Intent (wcag-understanding/status-messages.html)
