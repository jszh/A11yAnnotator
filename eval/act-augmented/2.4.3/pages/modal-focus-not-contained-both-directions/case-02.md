# case-02 — Box-office "Promo code" dialog: forward Tab from the last control leaks to an off-screen "Skip to footer" link instead of cycling (FAIL)

## Scenario
"Hexagon Arena" box-office seat-selection page. A jQuery-UI-style "Have a promo code?"
dialog opens over a dim overlay with a promo-code `<input>`, an email `<input>`, a Close
button, and an "Apply code" button. The developer did the well-known parts of dialog focus
management — move initial focus into the dialog on open, restore focus to the trigger on
close — but never added a Tab **wrap** on the last control. So pressing **Tab on the
"Apply code" button** does not cycle back to the promo-code field; it follows DOM order to
the very first focusable element on the page: a visually-hidden **"Skip to footer"**
skip-link that sits before the header. Focus exits the open modal onto invisible page
chrome. The skip-link itself is good practice; the bug is that the modal does not contain
forward focus at its trailing boundary.

## Attribute tuple
- **content-domain:** events / ticketing (arena box office)
- **UI-component/pattern:** APG "dialog (modal)" — jQuery-UI-style overlay dialog
- **host-language construct:** open/close focus management (move-in + restore) WITHOUT any Tab-wrap `keydown` handler
- **locale/i18n:** en-GB date formatting ("Sat 8 Nov")
- **failure-mechanism:** forward containment breaks at the last control — Tab follows natural DOM order to the page's first focusable element (an off-screen skip-link) outside the dialog

## Developer persona
An agency contractor themed a ticketing template and was handed a checklist that said
"dialogs must move focus in and restore focus out." They implemented exactly those two
behaviours and considered focus handling done — they did not know that containment (wrapping
Tab/Shift+Tab) is a separate requirement. The site already shipped a "Skip to footer"
skip-link as the first element in the DOM (added for an earlier audit), so when Tab runs off
the end of the dialog it lands there. The contractor tested with a mouse and one forward
Tab from the promo field, never reaching the last button, and signed it off.

## Element / selector carrying the issue
`#dialog` (the `role=dialog aria-modal=true` overlay). The defect is the **absence** of any
Tab-wrap on `#dlg-apply` (the last control): there is no `keydown` containment handler at
all. The escape target is `#skip-footer`, the first focusable element in DOM order. The
background `<header>`, `<main>`, and `<footer>` are not `inert`, so the leaked focus is on
operable content outside the modal.

## Exact accessibility mechanism
A keyboard user opens the dialog; focus is correctly placed on `#code`. Forward Tab moves
code → email → Close → Apply code. Pressing **Tab once more** (the natural next step to
"loop back and re-check the code") moves focus to the next focusable element in document
order — but since the dialog never wraps, that is `#skip-footer` at the top of the page,
which becomes visible-on-focus far away from the dimmed dialog. A screen-reader user hears
"Skip to footer, link" while the promo dialog is still open and `aria-modal="true"`; a
sighted keyboard user sees the focus ring teleport to the top-left corner outside the card.
TT 4.F step 3 requires that focus navigating **both forward and backward** remain within
the modal until it closes; here the **forward** direction leaks at the trailing edge, so the
modal's operability is broken (the user is now navigating the page behind a supposedly modal
overlay). Verdict: **FAILED**.

## Expected ACT-style outcome
**failed** — SC 2.4.3 Focus Order (Level A), modal-dialog-containment limb (TT 4.F step 3).
Forward focus from the dialog's last control escapes to page content (an off-screen
skip-link) instead of remaining within the open modal.

## Why automated tools miss it
Every static signal is healthy: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
pointing at the visible title, labelled inputs, named buttons, and a textbook
visible-on-focus skip-link (which scanners actively reward). Nothing is missing or malformed,
so axe-core, WAVE, and Lighthouse report no issue. The failure is the **lack** of a wrap, an
absence of behaviour — and absence of a containment handler is not something a linter flags.
Catching it requires a human to Tab all the way to the **last** dialog control and press Tab
once more, then recognise that focus landing on a page-level skip-link while a modal is open
violates bidirectional containment. No automated tool drives Tab to a widget's boundary or
reasons about modal containment, so the leak is invisible to them.

## Citation
> **Reference:** Trusted Tester v5.1.3 — Test 4.F Focus Order, "How to Test" step 3
> (`refs/trusted-tester/sc-2.4.3-focus-order.md`)
>
> **Quote (verbatim):** "For **modal dialog boxes**, keyboard focus navigating both forward
> and backward should remain within the modal dialog box until it is closed."
>
> **Quote (verbatim, Trusted Tester Test 4.F step 2.b):**
> (`refs/trusted-tester/sc-2.4.3-focus-order.md`)
> "It may be necessary to use the keyboard to **activate trigger controls that reveal hidden
> content** with focusable elements (menus, dialogs, modal dialog boxes, expandable tree
> list) to check the focus order to, from, and within the revealed content."
