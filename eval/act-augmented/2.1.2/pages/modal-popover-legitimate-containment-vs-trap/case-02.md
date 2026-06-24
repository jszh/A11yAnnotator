# case-02 — DMV renewal modal: focus trapped BUT Close in cycle + working Esc (PASS)

## Scenario
"State of Ardennes DMV" vehicle-registration renewal. Clicking "Start renewal" opens a
`role="dialog" aria-modal="true"` overlay that confirms vehicle details. Focus is moved
into the dialog and Tab cycling is restricted to the dialog's controls (odometer input,
email input, Cancel, Continue, and the header "Close" ✕). This focus restriction is the
**legitimate containment carve-out**, because the user always has a keyboard exit: a
wired, functional `Escape` handler closes the dialog and restores focus to the triggering
button, and the focus cycle explicitly *includes* the focusable Close ✕ and Cancel
controls. This is the conformant modal the ACT corpus never models — structurally it is
indistinguishable from a trap; only keyboard-driving certifies it passes.

## Attribute tuple
- **content-domain:** government / civic services portal (DMV)
- **UI-component/pattern:** APG "dialog (modal)" — confirmation dialog with header Close + footer Cancel/Continue
- **host-language construct:** `role="dialog" aria-modal="true"` overlay + JS `Escape`/`Tab` handler + focus restore
- **locale/i18n:** en-US
- **failure-mechanism:** NONE — boundary PASS variant; focus restriction includes a working Esc and a Close control inside the cycle

## Developer persona
A careful state-agency contractor built this from the WAI-ARIA Authoring Practices "Modal
Dialog" pattern. They deliberately captured `lastFocused` before opening, moved initial
focus into the dialog, wired `Escape` as a documented standard exit, ensured the Close ✕
and Cancel are real `<button>`s so they sit in the natural tab order and inside the wrap
cycle, and restored focus to the opener on close. They keyboard-tested it: Tab reaches
every control including Close, Esc dismisses, and focus returns to "Start renewal."

## Element / selector carrying the issue
`#dialog` (`role="dialog" aria-modal="true"`). The conformance-deciding details: the
`Escape` branch in the `keydown` handler (`closeDialog()`), and `focusables()` returning
`#close-x` and `#cancel` as part of the wrap cycle. Focus is restored to `#open-renew`.

## Exact accessibility mechanism
A keyboard user activates "Start renewal"; focus moves to the odometer field. Tabbing:
odometer → email → Cancel → Continue → Close ✕ → (wraps) → odometer. The Close control is
reachable in the cycle. Pressing **Esc at any point closes the dialog** and returns focus
to the "Start renewal" button, so the user resumes exactly where they were on the page. A
screen-reader user hears the dialog name ("Confirm vehicle details") on entry, can reach
"Close dialog" (its `aria-label`), and the on-screen hint also documents the Esc method.
There is no point at which the keyboard user is stuck: focus is *contained* (correct modal
behaviour per TT Test 4.C) but always *escapable* (Esc + reachable Close). Per the
Understanding, restricting focus to a modal "does not fail the requirements of this
criterion, as long as the user knows how to 'untrap' the focus and leave." Verdict: **PASSED**.

## Expected ACT-style outcome
**passed** — SC 2.1.2 No Keyboard Trap (Level A), legitimate-containment limb. Focus is
restricted to a modal, but a standard keyboard exit (Esc) is wired and functional and the
focus cycle includes a keyboard-operable Close, so focus can be moved away with the keyboard.

## Why automated tools miss it
Automated tools cannot confirm a *pass* here any more than they can detect the *fail* in
case-01: the two pages carry the same static signature (`role="dialog"`, a focus cycle, a
Close control present in the DOM). axe/WAVE/Lighthouse never press Esc, so they cannot
verify the exit actually fires; they never Tab the cycle, so they cannot verify Close is
inside it; and they cannot reason about the modal carve-out that makes focus restriction
permissible. Certifying this PASS — and distinguishing it from the visually identical trap
— requires a human to drive the keyboard and confirm the dismiss path works.

## Citation
> **Reference:** WCAG 2.2 Understanding SC 2.1.2 No Keyboard Trap — "Examples" (modal dialog box)
> (`wcag-understanding/no-keyboard-trap.html`)
>
> **Quote (verbatim):** "A web application opens a dialog box. At the bottom of the dialog
> are two buttons, "Cancel" and "OK". When the dialog is open, focus is trapped within the
> dialog – tabbing from the last control in the dialog takes focus to the first control in
> the dialog ... The dialog is dismissed by activating the "Cancel" button, the "OK" button,
> or the Esc key."
>
> **Quote (verbatim, Intent):** "Generally, in most environments with a physical keyboard,
> pressing the Esc key is a commonly used "standard exit method", but other platform-specific
> methods may be available."
