# case-07 — paired PASS control for case-01

## Paired source

This is the counterfactual repaired counterpart of `case-01` in `announced-text-lacks-visual-context`. The page context, content, controls, and distractors are retained; only the documented SC failure is repaired.

## Scenario

The cart badge now announces a complete contextual phrase rather than an isolated number.

## Exact repair

Changed the status content and update function from a bare numeral to “N items in cart.”

## Expected ACT-style outcome

**passed** for SC 4.1.3. The relevant status/error remains present where applicable, but it is now correctly identified, associated, timed, or announced.

## Pair integrity check

The source remains an expected failure. This repaired page differs only at the decision-boundary mechanism described above; it is intended to catch evaluators that memorize the source page’s surrounding template.

## Citation

> where only the number in this string was coded as an updated chunk of content, the resulting experience for screen reader users could be to only hear "three", which may not be sufficient information to provide context for the user. In such situations, marking the entire "3 items" string as the status text would normally be a better solution. ... In this case it would also be a courtesy to add offscreen text such as "in shopping cart" to the message.

— wcag-understanding/status-messages.html
