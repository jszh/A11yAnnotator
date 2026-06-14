# Evaluation notes — Amazon Sign-In

## Problems / Observations

- **Focus-order anomaly (el15 email input):** The global tab walk (count=8) starts at the Continue button (`input[type=submit]`), completely skipping the email input on the first Tab from page load. The local tab walk for el15 confirms `stopsToReach=8` — the driver had to cycle through all other 8 focusable elements before the email input became the active focus target. The DOM order places the email input before the submit button, so this is a genuine focus-order inversion, not a collection artefact. Logged as 2.4.3 REPRODUCED on both el15 and el16.

- **Spurious assertive announcement on email focus:** When the email input is finally focused (after the full wrap), the vsrAnnouncement is `"assertive: Invalid email address"`. This is caused by pre-loaded `role=alert` regions in the DOM whose text content (`"Invalid email address"`, `"Invalid mobile number"`, `"Enter your mobile number or email"`) is already present but hidden with `display:none`. When focus arrives on the input, something triggers one of these regions to fire assertively without a user submit action. This creates a misleading, disruptive announcement. Logged as 4.1.3 REPRODUCED on el15.

- **No `aria-invalid` / `aria-describedby` on email field:** After submit probe, `ariaInvalidSet=false` and the email field has no `aria-describedby`. The alert regions exist but are not programmatically associated with the field. `nativeValidationOnly=true` for the form. Logged as 3.3.1 REPRODUCED.

- **`role=button` on navigating link (el4 'Need help?'):** The `<a href>` element has `role="button"` but activating it navigates to an external URL in a new tab. This is a semantic mismatch — AT users expect Space key to activate a button without page navigation. Logged as 4.1.2 REPRODUCED.

- **No landmark regions:** The page has zero `main`, `nav`, `header`, or `footer` elements. All content falls outside landmarks. axe fires `landmark-one-main` (moderate) and `region`. Logged as 1.3.1 REPRODUCED.

- **Reflow failure at 320px:** `scrollW=368 > clientW=320`; overflowing elements are general layout containers (`auth-workflow`, `auth-pagelet-contain`, `a-box-inner`). Not an exempt element. Logged as 1.4.10 REPRODUCED.

- **Amazon logo link unreachable by keyboard (el1):** `tabindex="-1"` intentionally removes the logo link from the tab sequence. Logged as 2.1.1 REPRODUCED. (This may be an intentional design choice to reduce noise, but it fails the SC.)

- **H4 'Passkey error' is `display:none`:** The heading structure shows H1 → H4 in the DOM, which would be a level-4 skip. However, the H4 is `display:none` and not part of the visible/accessible outline. Not logged as a heading-structure violation; noted here for transparency.

- **Copyright span `reachedBySR=false`:** The `drive.json` SR walk for el14 did not reach the copyright span within its window before wrapping. The element appears as a neighbour in other elements' SR walks and is visible text — likely just past the walk window limit, not a real accessibility gap.

- **`continue-announce` aria-labelledby on Continue button:** The submit button uses `aria-labelledby="continue-announce"` which resolves to "Continue" — correct and passes name computation. No issue.

- **Email field `required=false`, `aria-required=null`:** The field is functionally required (cannot proceed without it) but neither `required` nor `aria-required` is set. This is a minor 3.3.2 gap (not separately logged as it is subsumed in the 3.3.1 finding, but noted here).
