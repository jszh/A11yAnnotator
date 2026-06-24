# case-01 — Toggle switch rendered ON but aria-checked="false" (bank notification settings)

## Scenario
A Meridian Bank online-banking "Security Alerts & Notifications" preferences screen. Three custom
`role="switch"` toggles control sign-in alerts, large-transaction alerts, and marketing offers. The
first switch, "Sign-in alerts," is rendered unmistakably **ON**: green track, thumb pushed to the
right (the page applies the `is-on` class). Its exposed state, however, is hard-coded
`aria-checked="false"`. The other two switches are off both visually and programmatically. So a
sighted user sees sign-in alerts enabled while a screen-reader / braille / voice-control user is told
the switch is **off**.

## Attribute tuple
- **content-domain:** online banking / fintech account settings
- **UI-component/pattern:** custom `role="switch"` toggle (APG Switch pattern)
- **host-language construct:** `<button role="switch">` with CSS-class-driven visual state (`.is-on`)
- **locale/i18n:** en
- **failure-mechanism:** exposed state value contradicts the rendered state (value-correctness, not presence)

## Developer persona
A junior front-end developer building the settings page under deadline. They copied a switch snippet
from a Stack Overflow answer that hard-codes `aria-checked="false"` as the markup default, and wired
the "currently enabled" preferences by adding the `is-on` visual class server-side from the saved user
record. They never synced the initial `aria-checked` to that saved value — the click handler flips both
correctly, so manual testing "looked fine," but the **initial render** ships ON-with-false. No screen
reader was ever used to check the loaded state.

## Element / selector carrying the issue
`button[aria-label="Sign-in alerts"].switch.is-on` (the first switch). Visual state: `.is-on`
(green + thumb right). Exposed state: `aria-checked="false"`.

## Exact accessibility mechanism (what AT experiences, why it fails)
SC 4.1.2 requires that states "can be programmatically set" **and** that "notification of changes to
these items is available to assistive technologies." A screen reader announces this control as "Sign-in
alerts, switch, **off**." A braille display renders it off. A voice-control user who says "turn on
sign-in alerts" believes it is already off and toggles it — turning the alert **off**. The AT user is
given a value that is the exact opposite of the truth, so the state is not truthfully reflected. The
attribute is present and valid (`false` is a permitted boolean for `aria-checked`), so this is a
value-correctness failure, not a missing-state failure.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The switch has `role="switch"`, a non-empty accessible name ("Sign-in alerts"), and `aria-checked` set
to a syntactically valid, permitted boolean. ACT 4e8ab6 (required states present), 5c01ea (state
permitted on role), and 6a7281 (state has a valid value) all **pass**; axe/WAVE/Lighthouse report
nothing. None of these rules render the widget and compare the green/thumb-right ON appearance against
`aria-checked="false"`. That visual-vs-attribute comparison — recognizing the control *looks* on while
*announcing* off — requires a human or vision model reading the rendered state.

## Citation
> **WCAG 2.2 Understanding 4.1.2 (Intent), `wcag-understanding/name-role-value.html`:**
> "The intent of this success criterion is to ensure that Assistive Technologies (AT) can gather
> appropriate information about, activate (or set) and keep up to date on the status of user interface
> controls in the content."

> **WCAG 2.2 Understanding 4.1.2 (Intent), `wcag-understanding/name-role-value.html`:**
> "Other examples of user interface control states are whether or not a checkbox or radio button has
> been selected, or whether a collapsible tree view or accordion is expanded or collapsed."

(The ON switch that announces "off" fails the "keep up to date on the status" requirement: AT cannot
gather the true status of the control.)
