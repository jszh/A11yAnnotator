# case-06 — BOUNDARY/PASS: styled `<div>` controls that EXPOSE the role they PRESENT

## Scenario
The **Riverbank Trust** donation page has an amount chooser — pill controls
`$25 / $50 / $100 / Other` — that look exactly like the styled `<div>` "buttons" in the
failing cases (rounded, filled-when-selected, pointer cursor, hover state), and a "Continue"
action that is also a styled box rather than a native `<button>`. The difference is that every
emulated control here carries the **correct** programmatic semantics for what it presents: the
amount pills are `role="radio"` inside a `role="radiogroup"` (the right model for "pick one
amount") with `aria-checked` tracking selection and full arrow/Space keyboard operation, and
"Continue" is a `role="button"` with `tabindex="0"` and an Enter/Space handler. This case exists
to mark the line that separates an F42 failure from a valid custom control.

## Attribute tuple
- **content-domain:** nonprofit / donation flow
- **UI-component / pattern:** preset-amount radio chooser + primary "Continue" button
- **host-language construct:** `<div role="radiogroup">` with `<div role="radio" aria-checked>` children, and `<div role="button" tabindex="0">`
- **locale / i18n:** en-US
- **failure-mechanism:** **none** — the exposed role matches the presented role; included as the passing boundary that sharpens the aspect

## Developer persona
A front-end developer who reached for the same styled-`<div>` building blocks as the failing
cases (the design system ships pill components, not native form controls) but actually learned
the ARIA patterns. They modelled "pick one amount" as a radio group, wired `aria-checked` and
roving tabindex with arrow-key navigation, and gave "Continue" `role="button"` plus a keyboard
handler. The visual result is indistinguishable from a `<div>`-soup version — which is exactly
why this case is a useful contrast.

## Element / selector carrying the issue
- `.amounts[role="radiogroup"] > .amt[role="radio"]` and `.continue[role="button"]` — custom
  controls built from `<div>`s that **correctly** expose the role and state they present. No
  element here fails; the controls are the *passing counterpart* to cases 01–05.

## Exact accessibility mechanism (what AT experiences)
A sighted user sees a one-of-four amount selector with `$50` highlighted and a Continue button.
A screen-reader user hears **"Donation amount, radio group … $50, radio button, selected, 2 of
4"** as they arrow through the pills, and **"Continue, button"** on the action — because each
control's exposed role and state match what it presents. The relationships that the styling
conveys (this is a single-select group; this one is chosen; this is a button) are all
programmatically determinable, so SC 1.3.1 is satisfied for these controls.

## Expected ACT-style outcome
**passed** — SC 1.3.1 Info and Relationships: the emulated controls expose roles (and a
selected state) that match their visual/behavioural presentation, so the control relationships
are programmatically determinable. This is **not** an F42 failure — F42 fails only when the
programmatically determined role is generic, absent, or wrong. (Native `<button>`/`<input
type="radio">` remain best practice per ARIA's "use native elements first," but correctly-roled
custom controls do convey the relationship and do not fail 1.3.1.)

## Why automated tools miss it
This is the inverse lesson: an attribute-driven scanner *can* see that `role="radio"`,
`aria-checked`, and `role="button"` are present and valid, and would (correctly) raise nothing.
But a scanner equally raises nothing on the failing cases 01–05, where the same `<div>`s carry
*no* role — so the tool cannot tell the pass case from the fail cases. The discriminating
judgment is whether the exposed role *matches the presented control*, which requires a human to
look at the rendered pill/button and compare it to the exposed semantics. The page is included
so the aspect is graded on that role↔presentation match rather than on the presence of `<div>`.

## Citation
**Reference:** WCAG Techniques — *F42: Failure of Success Criteria 1.3.1, 2.1.1, 2.1.3, or
4.1.2 when emulating links* (`wcag-techniques/failures/F42.html`).

> "It is possible to use the ARIA `role` attribute to identify an anonymous element as link
> control for assistive technologies. However, best practice for ARIA calls for making use of
> native elements whenever possible, so the use of the `role` attribute to identify anonymous
> elements as links is not recommended."

**Supporting reference:** WCAG 2.2 Understanding — *Info and Relationships* (Intent)
(`wcag-understanding/info-and-relationships.html`).

> "When such relationships are perceivable to one set of users, those relationships can be made
> to be perceivable to all."
