# case-01 — Risk-tolerance slider: aria-valuenow never changes (mouse-drag only, no keydown)

## Scenario
A fintech onboarding wizard ("Meridian Wealth") asks the user to set an investment **risk tolerance** with a custom `role="slider"`. Dragging the handle visibly moves the fill/thumb and updates a visible readout ("80 — Aggressive"), but `aria-valuenow`/`aria-valuetext` are written once in the HTML and never reassigned, and there is no `keydown` handler at all.

## Attribute tuple
- **content-domain:** online banking / fintech onboarding wizard
- **UI-component / pattern:** custom `slider` (APG slider) built from a div
- **host-language construct:** absolutely-positioned div geometry driven by mouse events; `role="slider"` + `aria-valuemin/max/now/valuetext`
- **locale / i18n:** en-US
- **failure-mechanism:** value-setter wired to the mouse path only; exposed value frozen; no keyboard path (set limb + notify limb both broken)

## Developer persona
A junior developer grabbed a "draggable slider" CodePen snippet that only handled `mousedown`/`mousemove`. They added ARIA attributes to "make it accessible" by copying the APG markup, set a sensible initial `aria-valuenow="30"`, and shipped — never realizing the drag math updates the visible readout but not the ARIA value, and that no keyboard handler exists.

## Element / selector carrying the issue
`#riskSlider` (`div[role="slider"]`).

## Exact accessibility mechanism (what AT experiences, why it fails)
- On load, AT correctly announces "Risk tolerance, slider, 30, Conservative" — role, name, and **initial** value are all valid.
- A keyboard/AT user focuses the slider and presses Arrow keys: **nothing happens** (no `keydown` handler). The value is not programmatically **settable** via AT.
- A sighted mouse user drags to 80; the visible readout updates to "80 — Aggressive" but `aria-valuenow` stays `30`. The change is **never notified** to AT, so a screen reader still reports 30.
- Net: the slider's value can be neither set via AT nor read accurately after a change. This is F15's "do so incompletely": correct role/name/initial value, broken set+notify contract.

Verified with Puppeteer: after two `ArrowRight` presses `aria-valuenow` = `30`; after a mouse click near 80% the visible text reads "80 — Aggressive" while `aria-valuenow` is still `30`.

## Expected ACT-style outcome
**failed** (SC 4.1.2 — value cannot be programmatically set by the user via AT, and changes are not notified).

## Why automated tools miss it
axe/WAVE/Lighthouse inspect a single static DOM snapshot. At that snapshot the slider has a valid role (`slider`), a valid accessible name (via `aria-labelledby`), and valid, in-range `aria-valuemin/max/now` — so rules 674b10 (role valid), 4e8ab6 (required states present), and 6a7281 (state value valid) all pass. No static rule operates Arrow keys or drags the thumb and then re-reads `aria-valuenow`, so none can observe that the value is non-settable via keyboard and that mouse-driven changes are never reflected in the exposed value. Detecting it requires driving the control through the keyboard/AT path and observing whether the exposed value actually changes — behavioral judgment.

## Citation
> "states, properties, and values that can be set by the user can be programmatically set; and **notification of changes** to these items is available to user agents, including assistive technologies."
— refs/trusted-tester/sc-4.1.2-name-role-value.md (WCAG SC 4.1.2 text)

> "If custom controls are created, however, or interface elements are programmed (in code or script) to have a different role and/or function than usual, then additional measures need to be taken to ensure that the controls provide important and appropriate information to assistive technologies and allow themselves to be controlled by assistive technologies."
— wcag-understanding/name-role-value.html (Intent of Name, Role, Value)
