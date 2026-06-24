# case-04 — Newsletter overlay re-grabs focus to its first input on every `focusin` (Close/Submit can never hold focus)

## Scenario
An e-commerce storefront ("Fernweave") shows a newsletter signup overlay. A marketing-popup plugin's "focus management" is a single overlay-scoped `focusin` listener that re-focuses the email input whenever focus moves anywhere inside the modal — a crude focus-keeper with no exclusion for the Close (×) button, the "No thanks" decline link, or the Submit button. RESULT: a keyboard user can never Tab off the email field. Every attempt to reach Close, Decline, or Submit instantly rebounds focus to the email box, so the overlay can neither be dismissed nor submitted by keyboard, and the page behind it is unreachable.

## Attribute tuple
- **content-domain:** e-commerce / direct-to-consumer home-textiles shop
- **UI-component / pattern:** modal newsletter overlay (`role="dialog" aria-modal="true"`) with Close button, email field, submit, and decline link
- **host-language construct:** modal-scoped `addEventListener('focusin', …)` that defers (`setTimeout(…,0)`) and calls `first.focus()`
- **locale / i18n:** en-US
- **failure-mechanism:** F55 variant — focus-event handler re-focuses a single element (the first input) on every focus-in, so other in-modal controls cannot retain focus

## Developer persona
A store owner installed a third-party "exit-intent popup" marketing plugin. Its bundled focus-management script was written to "keep the signup field front and center" as a makeshift focus trap, but the author never special-cased the dismiss/submit controls. The shop owner pasted the plugin markup into their Shopify-style theme as-is.

## Element / selector carrying the issue
The intended-operable control that cannot hold focus is `#nlClose` (the "Close newsletter signup" `<button>`). The mechanism: `#nlModal` `focusin` listener → deferred `#nlEmail.focus()`. The decline link (`#nlDecline`) and submit button are equally affected.

## Exact accessibility mechanism (what AT experiences, why it fails)
- The Close button is a real `<button>` with `aria-label="Close newsletter signup"`; the email input, submit button, and decline link are all valid, named, focusable controls inside a correctly-marked `role="dialog" aria-modal="true"`.
- A keyboard user inside the overlay presses Tab to reach "Close" (or Shift+Tab, or Tab to "Get my 10% off" / "No thanks"). The browser focuses that control; the modal's `focusin` listener fires and, on the next microtask, calls `first.focus()`, snapping focus back to the email input.
- Because focus is *actively relocated to one specific element* rather than cycled within a ring, this is a 2.1.1 "focus cannot rest" failure, NOT a 2.1.2 keyboard trap: there is no Tab loop the user is circling; the dismiss/submit controls simply can never hold focus.
- Consequence: a keyboard-only user is stuck — they cannot close the overlay, cannot submit it, and cannot reach the product grid behind it. The Close handler is correct, but it can never be triggered because Space/Enter can't be pressed on a control that won't keep focus.

Verified with Puppeteer: focusing `#nlClose` ends with `document.activeElement.id === 'nlEmail'` (immediate focus succeeds, then deferred re-grab; `rests=false`, `landedOn=nlEmail`).

## Expected ACT-style outcome
**failed** (SC 2.1.1 — the overlay's dismiss/submit controls are reachable but focus is removed on receipt and re-granted to the email field, so they cannot be operated by keyboard).

## Why automated tools miss it
The static markup is a well-formed dialog: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, a named Close button, a labelled email input, real submit/decline controls. axe/WAVE/Lighthouse report no errors — there is nothing structurally wrong. The defect is the runtime `focusin` re-grab, which only manifests when focus actually moves between in-modal controls; the `setTimeout(…,0)` deferral means it wins the race against the browser's own focus assignment and is invisible to any static inline-`onfocus` heuristic. Tools also cannot distinguish this from a legitimate "move focus to first field on open" pattern without observing that it re-fires on *every* focus change. Discovery requires opening the overlay and tabbing toward Close/Submit while watching focus bounce back.

## Citation
> "Content that normally receives focus when the content is accessed by keyboard may have this focus removed by scripting."
— wcag-techniques/failures/F55.html (Description)

> "Check that when focus is placed on each element, focus remains there until user moves it."
— wcag-techniques/failures/F55.html (Tests — Procedure; the Close/Submit controls do not retain focus — the script moves it, not the user)

> "All functionality can be accessed and executed using the keyboard, AND ... All essential information can be accessed via keyboard."
— refs/trusted-tester/sc-2.1.1-keyboard.md (Test 4.A — Evaluate Results; dismissing/submitting the overlay cannot be executed by keyboard)
