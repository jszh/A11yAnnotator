# case-05 — Star rating slider: chosen rating never updates aria-valuenow

## Scenario
A restaurant review form ("Trattoria Bianca") uses a star-rating control. Five star `<button>`s are wrapped in a parent given `role="slider"` (with the stars `aria-hidden`, so AT sees only the slider) and a correct initial value (`aria-valuenow="3"`, `aria-valuetext="3 out of 5 stars"`). Clicking a star fills the visual stars and rewrites a visible hint, but the slider's `aria-valuenow`/`aria-valuetext` are never updated, and there is no keyboard handler.

## Attribute tuple
- **content-domain:** restaurant / customer-review form
- **UI-component / pattern:** rating stars exposed as an APG `slider`
- **host-language construct:** `div[role="slider"]` wrapping `aria-hidden` star `<button>`s; visual fill via a `.filled` class
- **locale / i18n:** en-US
- **failure-mechanism:** value-setter updates the visible fill + hint text only; `aria-valuenow` frozen; no keydown (set + notify limbs both broken)

## Developer persona
A restaurant owner installed an off-the-shelf WordPress review-widget. The plugin author wrapped the stars in a slider role and `aria-hidden`'d the individual stars (a sensible pattern) and set a correct initial `aria-valuenow`, but the jQuery click handler only toggles the `.filled` class and updates a visible "Currently selected" hint — it never writes back to the slider's `aria-valuenow`, and no Arrow-key handler was added.

## Element / selector carrying the issue
`#rating` (`div[role="slider"]`). The inner `.star` buttons are `aria-hidden="true"` / `tabindex="-1"`, so the slider is the only exposed control and its value is frozen at 3.

## Exact accessibility mechanism (what AT experiences, why it fails)
- On load AT announces "Overall rating, 1 to 5 stars, slider, 3 out of 5 stars" — role, name, and initial value valid.
- A keyboard/AT user focuses the slider and presses Arrow keys: nothing happens (no `keydown` handler) — the rating is not **settable** via AT.
- A mouse user clicks the 5th star: all five stars fill and the hint reads "5 stars — Excellent", but `aria-valuenow` stays `3` and `aria-valuetext` still says "3 out of 5 stars". The chosen rating is never conveyed to AT.
- The value the user set is neither programmatically settable via AT nor notified when changed — F15 "do so incompletely".

Verified with Puppeteer: after clicking the 5th star, five stars are `.filled` and the hint reads "5 stars — Excellent", while `#rating` `aria-valuenow` = `3`; after `ArrowLeft` on the focused slider `aria-valuenow` is still `3`.

## Expected ACT-style outcome
**failed** (SC 4.1.2 — the rating value cannot be set via AT and its change is not notified).

## Why automated tools miss it
The static snapshot is valid: `role="slider"`, an accessible name (`aria-label`), and in-range `aria-valuemin/max/now` with `aria-valuetext` — passing 674b10, 4e8ab6, 6a7281. The `aria-hidden` stars are non-interactive to AT, so there is no focusable-inside-aria-hidden conflict either. No automated rule clicks a star (or presses an Arrow key) and then re-reads the slider's `aria-valuenow`, so none can see that the exposed value never reflects the user's choice. Detecting it requires operating the control and observing the AT-visible value.

## Citation
> "The intent of this success criterion is to ensure that Assistive Technologies (AT) can gather appropriate information about, activate (or set) and keep up to date on the status of user interface controls in the content."
— wcag-understanding/name-role-value.html (Intent — AT must be able to set and keep up to date)

> "states, properties, and values that can be set by the user can be programmatically set; and **notification of changes** to these items is available to user agents, including assistive technologies."
— refs/trusted-tester/sc-4.1.2-name-role-value.md (WCAG SC 4.1.2 text)
