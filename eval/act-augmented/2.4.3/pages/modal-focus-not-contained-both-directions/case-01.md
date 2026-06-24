# case-01 — Bank "Confirm transfer" modal: forward Tab trapped, Shift+Tab from first control escapes to "Log out" behind the backdrop (FAIL)

## Scenario
"Northbridge Bank" online-banking Pay & Transfer page. A "Confirm transfer" modal renders
over a dim backdrop as a centered card with an amount `<input>`, a "Send on" `<select>`,
a Cancel button, and a Confirm button. A hand-rolled focus trap keeps **forward** Tab
inside the dialog (Tab on the Confirm button wraps to the amount field). But the developer
only implemented the forward wrap — there is no `Shift+Tab` branch. Pressing **Shift+Tab
while focus is on the first control (the amount field)** falls through to the browser's
default backward order and lands on the page header's **"Log out"** link, which sits
behind the dim backdrop. Forward containment looks flawless; backward containment silently
leaks the user out of the open modal onto a destructive control they cannot see has focus.

## Attribute tuple
- **content-domain:** online banking / fintech dashboard
- **UI-component/pattern:** APG "dialog (modal)" — hand-rolled `role=dialog aria-modal=true` overlay
- **host-language construct:** `keydown` Tab-wrap handler that implements only the forward (`!e.shiftKey`) branch
- **locale/i18n:** en-US
- **failure-mechanism:** asymmetric containment — forward Tab is trapped, backward Shift+Tab from the first control escapes behind the (non-inert) backdrop

## Developer persona
A junior front-end engineer on the payments team was asked to "trap focus in the confirm
dialog so people don't tab out by accident." They pasted the top-voted Stack Overflow
focus-trap snippet, but that snippet's accepted answer only showed the forward case
(`if (activeElement === last) first.focus()`); the Shift+Tab branch was buried in a
lower-voted comment they skipped. They renamed the variables, confirmed by mouse and by a
few forward Tab presses that focus "stayed in the box," and shipped. They never pressed
Shift+Tab from the first field, and they never made `<main>`/the header inert.

## Element / selector carrying the issue
`#modal` (the `role=dialog aria-modal=true` card). The defect is the `keydown` listener on
`#modal` that contains only the `!e.shiftKey && activeElement === last` forward wrap and no
backward branch; the escape target is `#logout-link` in the page header. The background
(`<header>`, `<main>`) was never set to `inert` / `aria-hidden`, so the leaked focus is on
genuinely operable content behind the backdrop.

## Exact accessibility mechanism
A keyboard or switch user opens the modal; initial focus is correctly placed on the amount
field (`#amt`). Forward Tab cycles amount → when → Cancel → Confirm → (wraps) → amount,
so forward feels fully contained. The user then presses **Shift+Tab** to step back to
re-check the amount — but focus is already on the first control, and because the handler
has no backward branch, the browser moves focus to the previous focusable element in DOM
order: the **"Log out"** link in the header behind the backdrop. The screen-reader user is
now reading page chrome that is visually dimmed and supposedly unavailable; the sighted
magnifier user sees the focus ring vanish off the card entirely. `aria-modal="true"`
promised the rest of the page was inert, but nothing enforced it. Per TT 4.F step 3,
keyboard focus navigating **both forward and backward** must remain within the modal until
it closes — backward does not, so operability of the modal is destroyed (the user can land
on, and activate, "Log out" mid-transfer). Verdict: **FAILED**.

## Expected ACT-style outcome
**failed** — SC 2.4.3 Focus Order (Level A), modal-dialog-containment limb (TT 4.F step 3).
Focus navigating backward does not remain within the open modal dialog; Shift+Tab from the
first control escapes to content behind the backdrop.

## Why automated tools miss it
Statically the page is clean: `role="dialog"`, `aria-modal="true"`, an `aria-labelledby`
resolving to the visible `<h2>` title, a `<label>` for every field, accessible names on
both buttons, and no contrast issues — axe-core, WAVE, and Lighthouse all pass it.
`aria-modal="true"` is treated by scanners as a declaration, not something they verify by
driving the keyboard. Detecting this requires two human actions a tool never performs:
(1) pressing **Shift+Tab specifically from the first control** and observing focus land on
the header link behind the backdrop, and (2) judging that a modal must contain focus in
**both** directions, so a forward-only trap is a failure even though forward looks perfect.
No static checker simulates bidirectional Tab, and none can infer from the `keydown` source
that the Shift+Tab branch is missing while the forward branch is present.

## Citation
> **Reference:** Trusted Tester v5.1.3 — Test 4.F Focus Order, "How to Test" step 3
> (`refs/trusted-tester/sc-2.4.3-focus-order.md`)
>
> **Quote (verbatim):** "For **modal dialog boxes**, keyboard focus navigating both forward
> and backward should remain within the modal dialog box until it is closed."
>
> **Quote (verbatim, Understanding SC 2.4.3 — "Examples of Focus Order"):**
> (`wcag-understanding/focus-order.html`)
> "A web page implements modal dialogs. When the trigger button is activated, a dialog opens
> and focus is set within the dialog. As long as the dialog is open, all web page content
> outside the dialog becomes inert and cannot receive focus".
