# case-03 — Service-alert disclosure: panel opens but aria-expanded stays "false"

## Scenario
A municipal transit "Service Alerts" page ("Riverside Metro") lists route alerts in an accordion. Each header is `<button role="button" aria-expanded="false" aria-controls="...">`. Clicking opens the panel (display:block via an `.open` class on the wrapper) and rotates a chevron, but the handler only toggles the wrapper class — `aria-expanded` is never updated.

## Attribute tuple
- **content-domain:** municipal / public transit rider information
- **UI-component / pattern:** disclosure (show/hide) accordion
- **host-language construct:** `<button aria-expanded aria-controls>` + a `.open` class on the parent `.acc-item` driving `display`
- **locale / i18n:** en-US
- **failure-mechanism:** disclosure state (`aria-expanded`) baked into markup and never reassigned; reveal driven entirely by a CSS class (notify limb broken)

## Developer persona
A developer hand-ported a Vue single-file component (`<button :aria-expanded="open">`) into a static HTML export. In the conversion they baked the initial `"false"` literal into the attribute and wrote a vanilla toggle that flips a CSS class, forgetting that Vue's binding was what kept `aria-expanded` in sync.

## Element / selector carrying the issue
The three `.acc-header` buttons (`button[role="button"][aria-expanded]`). Each is permanently `aria-expanded="false"`.

## Exact accessibility mechanism (what AT experiences, why it fails)
- Role (`button`), name (the visible text "Route 12 — Downtown Loop", etc.), and a valid **initial** `aria-expanded="false"` are present, so the collapsed state is announced correctly on load.
- A user activates a header (mouse, or Space/Enter on the real `<button>`): the panel content becomes visible (`#p1` → `display:block`) and the chevron rotates, but `aria-expanded` stays `"false"`.
- AT announces "collapsed" for every section regardless of actual state. The user cannot tell which alerts are open, cannot perceive that their activation did anything at the control level, and gets no state feedback when collapsing again.
- The state the user sets (expanded/collapsed) is not **notified** to AT — the F15 "do so incompletely" pattern.

Verified with Puppeteer: clicking the first header sets `.open=true` and `#p1` `display:block` while `aria-expanded` remains `"false"`.

## Expected ACT-style outcome
**failed** (SC 4.1.2 — expanded/collapsed state change is not notified to AT).

## Why automated tools miss it
The static DOM has a valid `button` role, a non-empty accessible name, and a valid `aria-expanded` value — so name/role/value rules pass and there is no "missing aria-expanded" finding (the attribute is present). Automated tools cannot determine that the *value* should change on activation; recognizing the broken disclosure requires activating each header and checking whether `aria-expanded` flips to match the now-visible panel — a behavioral, interaction-driven check.

## Citation
> "A particularly important state of a user interface control is whether or not it has focus... Other examples of user interface control states are whether or not a checkbox or radio button has been selected, or whether a collapsible tree view or accordion is expanded or collapsed."
— wcag-understanding/name-role-value.html (Intent — expanded/collapsed is an example state that must stay current)

> "For technologies that support it, WAI-ARIA can be used to expose a custom control's role, name, value, states, and properties via the accessibility API for the technology."
— wcag-techniques/failures/F15.html (Description note)
