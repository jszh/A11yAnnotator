# case-01 — Identically faint "Pay now" (FAIL) beside disabled "Enroll in AutoPay" (NA)

## Scenario
The final step of an auto-insurance quote/checkout wizard. Two buttons sit side by side with
pixel-identical "ghost" styling: a 2px `#c9c9c9` border (≈1.66:1 on the white page) and faint
grey labels. `#pay-now` is a live `<button type="submit">` that really submits and is the only
way to complete the purchase. `#autopay` ("Enroll in AutoPay") carries the native `disabled`
attribute and is inert until the first payment clears. The contrast tool sees two identical faint
buttons; the SC verdict differs entirely depending on which one is operable.

## Attribute tuple
- **Content domain:** insurance quote wizard / fintech checkout
- **UI component / pattern:** paired form action buttons (active submit + disabled secondary), "ghost" outline style
- **Host-language construct:** native `<button type="submit">` vs `<button disabled>`; border-only control boundary
- **Locale / i18n:** en
- **Failure mechanism:** inactive-UI exemption mis-applied — active control's identifying border is below 3:1, but it is indistinguishable in appearance from a genuinely-exempt disabled twin

## Developer persona
A fintech front-end dev adopted a minimalist "ghost button" design system where every button is
a thin outline. The brand grey (`#c9c9c9`) looked elegant in Figma against a light-grey canvas,
but on the production white page it drops to ~1.66:1. The dev re-used the identical `.ghost-btn`
class for both the live submit and the disabled secondary button "so they line up," never
realizing that one is exempt from contrast and the other is not.

## Element / selector carrying the issue
`#pay-now.ghost-btn` — its 2px `#c9c9c9` border is the only visual indication that a control is
present (the faint label alone does not establish a hit area). The exempt twin is
`#autopay.ghost-btn[disabled]`.

## Exact accessibility mechanism
For 1.4.11, "any visual information provided that is necessary for a user to identify that a
control is present" must reach 3:1 against adjacent colors — UNLESS the control is inactive. A
low-vision user scanning this page sees two near-invisible rectangles. `#pay-now` is an active UI
component: it has no `disabled`/`aria-disabled`, it is focusable, and its submit handler fires.
Its identifying border (≈1.66:1) is therefore in scope and FAILS. `#autopay` is natively
`disabled` — removed from the tab order, not operable — so it is an inactive component and is
explicitly exempt (NA). The correct verdict for the surface is "failed," driven by the operable
button, not by the matching pixels of the disabled one.

## Expected ACT-style outcome
**failed** (SC 1.4.11). The active `#pay-now` control's identifying border is below 3:1; the
disabled twin is exempt and does not rescue the page.

## Why automated tools miss it
A contrast scanner operates on rendered pixels and computed styles. Both buttons resolve to the
identical `#c9c9c9` border on white, so the tool's only options are to flag both or skip both.
Many scanners (axe-core included) skip elements inside a `disabled` subtree, which would suppress
the disabled button — but they have no positive rule that says "this OTHER faint button is active
and therefore its sub-3:1 border is a real failure." Distinguishing the exempt button from the
failing one requires recognizing operability (does it submit? is it in the tab order?), a
behavioral and semantic judgement, not a measurement.

## Citation
**Reference:** WCAG 2.2 Understanding Non-text Contrast (`wcag-understanding/non-text-contrast.html`)
> "User Interface Components that are not available for user interaction (e.g., a disabled control in HTML) are not required to meet contrast requirements. An inactive user interface component is visible but not currently operable. An example would be a submit button at the bottom of a form that is visible but cannot be activated until all the required fields in the form are completed."

**Reference:** WCAG 2.2 Understanding Non-text Contrast (`wcag-understanding/non-text-contrast.html`)
> "Having a visual boundary indicating the hit area is only required when there is no other visual way to identify the presence of the control – and in those cases, the boundary must have sufficient non-text contrast in order to pass this success criterion."
