# case-06 — Delivery-speed radio group: value IS settable and notified (PASS boundary)

## Scenario
An e-commerce checkout ("Northfield Outfitters") offers a delivery-speed chooser built as a custom `role="radiogroup"` of `role="radio"` divs (Standard / Express / Overnight). This is the *same family* of custom control as the failing pages, but it correctly satisfies the 4.1.2 set + notify limb: selecting an option (mouse OR keyboard) reassigns `aria-checked` on every radio, implements the APG roving-tabindex + Arrow-key pattern, and drives a non-color tick (✓) off the same `aria-checked` attribute.

## Attribute tuple
- **content-domain:** e-commerce checkout (shipping options)
- **UI-component / pattern:** custom radio group / segmented control (APG radio)
- **host-language construct:** `div[role="radiogroup"]` with `div[role="radio"][aria-checked][tabindex]` children; roving tabindex
- **locale / i18n:** en-US
- **failure-mechanism:** none — included as the PASS boundary that differs from the failing cases only in that its handler updates the exposed value

## Developer persona
A frontend developer who actually read the WAI-ARIA APG radio-group pattern: they wire `aria-checked` reassignment, roving `tabindex`, Arrow/Space/Enter handling, and tie the visible tick to the programmatic state so the two can never diverge.

## Element / selector carrying the issue
None (boundary/PASS). The relevant elements are the three `.opt[role="radio"]` controls and their `aria-checked` attributes, which are correctly maintained.

## Exact accessibility mechanism (what AT experiences, why it passes)
- Role (`radiogroup` / `radio`), name (group `aria-label` + each option's visible text), and initial value (`aria-checked="true"` on Standard, `"false"` on the others) are all valid.
- A keyboard/AT user focuses the group and presses ArrowDown: focus and `aria-checked="true"` move to Express; the previously selected radio becomes `aria-checked="false"`. The value is fully **settable** via AT.
- Clicking an option does the same. The change is **notified** because `aria-checked` is reassigned on every radio on every selection.
- The non-color ✓ is rendered from `aria-checked` (CSS `[aria-checked="true"] .tick`), so the visible selected state and the programmatic state are guaranteed to agree — no divergence is possible.

Verified with Puppeteer: initial `aria-checked` = [true, false, false]; after ArrowDown from the selected option = [false, true, false]; after clicking the 3rd option = [false, false, true].

## Expected ACT-style outcome
**passed** (SC 4.1.2 — value is programmatically determinable, settable by the user via AT, and changes are notified).

## Why automated tools miss it
Not applicable in the failure sense — this case **passes**. It is included to sharpen the aspect: automated tools would (correctly) report no 4.1.2 violation here, just as they (incorrectly, for the SC) report no violation on the failing cases — because the *only* difference between this PASS and the FAILs is runtime behavior (whether the handler reassigns the exposed value), which static scanners do not exercise. A correct human/AT judgment requires operating the control; doing so distinguishes this passing control from its visually identical failing siblings.

## Citation
> "When standard controls from accessible technologies are used, this process is straightforward. If the user interface elements are used according to specification the conditions of this provision will be met."
— wcag-understanding/name-role-value.html (Intent — correctly implemented controls satisfy the SC)

> "states, properties, and values that can be set by the user can be programmatically set; and **notification of changes** to these items is available to user agents, including assistive technologies."
— refs/trusted-tester/sc-4.1.2-name-role-value.md (WCAG SC 4.1.2 text — the limb this page satisfies)
