# case-04 — Wizard "Continue" genuinely disabled until valid (legitimate exemption, PASS)

## Scenario
A two-step checkout wizard (Maple & Birch). "Continue to payment" is genuinely disabled via the
native `disabled` attribute until the shipping form validates. While disabled it is greyed
(`#9b9b9b` on `#ededed` ≈ 2.4:1); once both fields are valid, JS removes `disabled`, the fill
flips to a high-contrast brand color (white on `#7a4a1e` ≈ 7.4:1), and it passes on its own.
Because the resting control is TRULY not available for interaction, the inactive-UI exemption
legitimately applies and the page PASSES. This is the honest counterpart to case-01/02/03 — same
sub-2.5:1 grey button, opposite verdict, because behavior differs.

## Attribute tuple
- **Content domain:** E-commerce — multi-step checkout
- **UI component / pattern:** wizard "Next/Continue" gated by form validation (the canonical Understanding example)
- **Host-language construct:** native `<button type="submit" disabled>` toggled via the real `disabled` property
- **Locale / i18n:** en
- **Failure mechanism:** NONE — this is the correctly-exempt boundary case included to sharpen the aspect

## Developer persona
A careful checkout engineer who followed WCAG Understanding's own example to the letter: keep the
submit disabled until required fields are complete, using the real `disabled` attribute (not a CSS
class), and raise the contrast the moment it becomes operable. The dim resting color is acceptable
precisely because the control cannot be activated in that state.

## Element / selector carrying the issue
`#next.next[disabled]` — the "Continue to payment" button in its resting state. Genuinely inert
(native `disabled`), so its low-contrast label is exempt. Every other text node on the page (field
labels, the enabled "Back to cart" link, helper copy, and the brand-colored enabled button) meets
4.5:1.

## Exact accessibility mechanism
While `disabled` is set, the button is removed from the tab order, cannot be focused or activated,
and AT announces "Continue to payment, dimmed/unavailable." It is the textbook "submit button at
the bottom of a form that is visible but cannot be activated until all the required fields are
completed." Per Understanding, such an inactive component is not required to meet contrast, so the
≈2.4:1 resting label is in spec. Upon validation the `disabled` property is cleared, the control
becomes operable, and its color is simultaneously raised to ≈7.4:1 — so it also meets contrast in
its active state. No state of the page presents operable text below 4.5:1.

## Expected ACT-style outcome
**passed** (SC 1.4.3). All operable text meets contrast; the only sub-4.5:1 text belongs to a
genuinely inactive control and is exempt.

## Why automated tools miss it
This is the false-positive trap, not a missed failure: a naive tool that flags *every* grey
button would WRONGLY report this exempt control, while a tool that exempts *every* grey button
would wrongly clear the faux-disabled failures in case-01/02/03. Getting this case right requires
confirming the control is genuinely inactive (real `disabled`, not focusable, no reachable
handler) — a behavioral determination. Including a correctly-handled exempt case forces the judge
to use operability, not color, as the decision rule.

## Citation
**Reference:** WCAG 2.2 Understanding Contrast (Minimum) (`wcag-understanding/contrast-minimum.html`)
> "An example would be a submit button at the bottom of a form that is visible but cannot be activated until all the required fields in the form are completed."

**Reference:** WCAG 2.2 Understanding Contrast (Minimum) (`wcag-understanding/contrast-minimum.html`)
> "User Interface Components that are not available for user interaction (e.g., a disabled control in HTML) are not required to meet contrast requirements."
