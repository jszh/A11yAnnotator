# case-08 — paired PASS control for case-02

## Paired source

This is the counterfactual repaired counterpart of `case-02` in `announced-text-lacks-visual-context`. The page context, content, controls, and distractors are retained; only the documented SC failure is repaired.

## Scenario

Each autosave status now names the lead whose stage was saved instead of announcing the ambiguous word “Saved”.

## Exact repair

Build the live-region string from the row’s lead name plus “saved.”

## Expected ACT-style outcome

**passed** for SC 4.1.3. The relevant status/error remains present where applicable, but it is now correctly identified, associated, timed, or announced.

## Pair integrity check

The source remains an expected failure. This repaired page differs only at the decision-boundary mechanism described above; it is intended to catch evaluators that memorize the source page’s surrounding template.

## Citation

> There may be cases where the addition of visible text does not by itself convey sufficient information to the user of assistive technology. For example, the proximity of new content to other pieces of information on the screen may provide a visual context that is lacking in the text alone.

— wcag-understanding/status-messages.html
