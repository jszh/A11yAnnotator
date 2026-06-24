# case-02 — Privacy switch: aria-checked hard-wired, only a CSS class toggles

## Scenario
A healthcare patient portal ("Lakeside Health") has `role="switch"` privacy toggles ("Allow emergency providers to view my records", "Share de-identified data for research"). Clicking flips the green/ON visual by toggling a `.on` CSS class, but the click handler never reassigns `aria-checked`, so the exposed state is frozen at whatever was hard-coded in the HTML.

## Attribute tuple
- **content-domain:** healthcare / patient portal privacy settings
- **UI-component / pattern:** custom `switch` (APG switch / toggle)
- **host-language construct:** `<button role="switch" aria-checked>` with a CSS `.on` class for the visual
- **locale / i18n:** en-US
- **failure-mechanism:** state conveyed only visually; `aria-checked` never updated on activation (notify limb broken in both directions)

## Developer persona
An agency contractor "optimized" the switches by driving the green ON state with a CSS class because it "animated more smoothly than toggling aria-checked." They left the original `aria-checked` literals in the markup, assuming the class and the attribute were equivalent.

## Element / selector carrying the issue
`#sw-emerg` and `#sw-research` (`button[role="switch"]`). The first ships `aria-checked="true"`, the second `aria-checked="false"`; both are frozen.

## Exact accessibility mechanism (what AT experiences, why it fails)
- Role (`switch`), name (`aria-labelledby`), and a valid **initial** `aria-checked` are all present, so AT announces a correct state on load.
- A user toggles a switch (mouse or, since it's a real `<button>`, keyboard Space/Enter triggers the same `click` handler): the green visual flips but `aria-checked` does **not** change.
- AT therefore reports the wrong state permanently: the "emergency providers" switch announces "on" even after the user turns it off; the "research" switch announces "off" even after the user turns it on. For a privacy control this is materially harmful — the AT user cannot verify their own sharing settings.
- The user-settable state's change is never **notified** to AT; the programmatic value and the visible value diverge after the very first interaction.

Verified with Puppeteer: clicking `#sw-research` sets the visual class `.on=true` while `aria-checked` stays `false`.

## Expected ACT-style outcome
**failed** (SC 4.1.2 — change to a user-settable state is not notified to AT; programmatic state does not track the actual state).

## Why automated tools miss it
On the static snapshot each switch has a valid role, a valid name, and a valid `aria-checked` value (`true`/`false`) — passing 4e8ab6 and 6a7281. The defect is a runtime divergence between the visual `.on` class and the `aria-checked` attribute that only appears after activation. No static scanner clicks the switch, re-reads `aria-checked`, and compares it to the rendered state, so none can detect that the toggle's announced state stops matching reality. This needs a human (or AT) to operate the control and notice the state never updates.

## Citation
> "Other examples of user interface control states are whether or not a checkbox or radio button has been selected, or whether a collapsible tree view or accordion is expanded or collapsed."
— wcag-understanding/name-role-value.html (Intent — control states must be kept up to date)

> "When custom controls are created, it is up to the control's author to ensure that the control is correctly exposed to users via the platform's accessibility API. If this is not done, then assistive technologies will not be able to understand what the control is or how to operate it..."
— wcag-techniques/failures/F15.html (Description)
