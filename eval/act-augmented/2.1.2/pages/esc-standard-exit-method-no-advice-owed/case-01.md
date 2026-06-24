# case-01 — Modal that releases focus on Esc with NO advice text (PASS a checker would flag)

## Scenario
A government public-library member-services page ("Renew library card", Marula County). Activating
"Renew card now" opens a modal dialog. While open, focus is intentionally contained: Tab and
Shift+Tab cycle the dialog's controls (card number, term, Cancel, Confirm) and never leave the
dialog. There is **no on-screen text** instructing how to leave, and the close control is labelled
"Cancel", not "Press Esc". Pressing **Esc** dismisses the dialog and returns focus to the
triggering button.

## Attribute tuple
- **Content domain:** government / civic services portal (public library account)
- **UI component / pattern:** modal dialog (`role="dialog"` `aria-modal="true"`) with Tab focus containment
- **Host-language construct:** hand-rolled dialog + keydown Tab-trap + `Escape` close handler
- **Locale / i18n:** en
- **Failure mechanism:** NONE — this is the conditional-pass boundary; the exit is a standard method (Esc), so no advice is owed (deliberate PASS that a naive checker false-positives)

## Developer persona
A civic-tech contractor building the library's new account portal followed the WAI-ARIA dialog
pattern: contain focus, close on Esc, restore focus to the trigger. They did exactly the right
thing and saw no reason to add "press Esc to close" text — Esc is universally understood as the way
out of a dialog. An automated-scan vendor later flagged the page as a "keyboard trap with no
documented exit", and the contractor had to defend that the page is correct.

## Element / selector carrying the issue
`#dialog` (`div[role=dialog][aria-modal=true]`). The relevant behavior is the `keydown` listener on
`#dialog`: it traps Tab and closes on `Escape`. There is deliberately no advice element.

## Exact accessibility mechanism
A keyboard/AT user tabs into the dialog and finds Tab cycles within it (correct modal behavior).
They press **Esc** — a standard exit method — and focus is released back to `#openBtn`. Because the
exit uses unmodified standard means, the SC's advice clause is not triggered: **no instruction is
required**. Screen-reader users hear the dialog announced (role + name via `aria-labelledby`) and
can leave with Esc as they expect. The page is conformant. The "trap" a checker perceives (focus
cycle, no documented exit) is exactly the false-positive this aspect targets: distinguishing it
from a real trap requires a human to (a) judge that Esc qualifies as standard for this platform and
(b) press Esc to confirm focus actually leaves.

## Expected ACT-style outcome
**passed** (SC 2.1.2). Focus can be moved away using a standard exit method (Esc); because the
method is standard, no advice is owed, and none is required for conformance.

## Why automated tools miss it
axe-core, WAVE, and Lighthouse cannot press Esc, so they cannot observe that focus is released.
A tool that heuristically flagged "focus cycle present + no 'press Esc' / 'close' instruction text"
would report a trap here — a false positive — because it cannot evaluate whether the (unwritten)
escape key is a standard method or verify that it fires. The judgment "Esc is a standard exit
method, therefore no advice is owed" is explicitly left by the spec to authors and auditors.

## Citation
**Reference:** WCAG 2.2 Understanding — No Keyboard Trap (`wcag-understanding/no-keyboard-trap.html`)
> "Keyboard focus is not considered trapped when the user can navigate away from a component using only a keyboard interface, and if it only requires unmodified arrow or Tab keys or other \"standard exit methods\". This specification does not define what constitutes a \"standard exit method\" – this is dependent on the user's hardware, user agent, and operating system, and as such will require some interpretation from authors and auditors. Generally, in most environments with a physical keyboard, pressing the Esc key is a commonly used \"standard exit method\", but other platform-specific methods may be available."

**Reference:** WCAG 2.2 Understanding — No Keyboard Trap, modal-dialog example (`wcag-understanding/no-keyboard-trap.html`)
> "When the dialog is open, focus is trapped within the dialog – tabbing from the last control in the dialog takes focus to the first control in the dialog ... The dialog is dismissed by activating the \"Cancel\" button, the \"OK\" button, or the Esc key."
