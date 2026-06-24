# case-03 — PASS counter-example: dialog markup placed immediately after its trigger

## Scenario
A coffee-roaster wholesale page (Tideline). A "Get the wholesale price list" button reveals a small
non-modal dialog asking for a work email. Unlike case-01/02, the dialog markup is placed **inline,
immediately after the trigger button**, so the panel's interactive elements are the very next things
in source order. The toggle script only flips visibility — and that is correct here, because no focus
move is needed for the forward Tab to enter the dialog. This is the **boundary PASS** sharpening the
aspect: same visibility-only toggle, but DOM adjacency makes the focus order correct.

## Attribute tuple
- **content-domain:** e-commerce / wholesale B2B coffee
- **UI-component/pattern:** disclosure-style non-modal `role="dialog"` placed adjacent to its trigger
- **host-language construct:** vanilla JS `classList.toggle`; dialog node is the trigger's next sibling region
- **locale/i18n:** en
- **failure-mechanism:** none — this is the WCAG Understanding's PASS pattern (interactive elements inserted in focus order immediately after the button); included as a contrast boundary

## Developer persona
A careful developer who read the WCAG *Understanding Focus Order* non-modal example before building.
They deliberately inlined the dialog right after the button "so the tab order just works without
JavaScript focus hacks," and added `btn.focus()` on dismiss so focus returns to the trigger. They
chose simplicity over a centered overlay precisely to keep the navigation order intact.

## Element / selector carrying the issue
`#openSignup` (trigger) and `#signupPanel` (the `role="dialog"` that is the trigger's immediately
following sibling). There is **no** issue — the adjacency is the point.

## Exact accessibility mechanism (what AT experiences, why it passes)
A keyboard user Tabs to "Get the wholesale price list" and presses Enter. The panel appears directly
below. Because the panel's `#wsEmail` field, "Send price list", and "Cancel" buttons are the next
nodes in source order, the very next Tab moves focus into the email field — F85 step 1's second check
is **true** (moving focus forward once puts focus in the dialog), so the failure condition does not
apply even though no script set focus. On dismiss (Cancel/Send), `btn.focus()` returns focus to the
trigger, satisfying F85 step 2. The focus order goes trigger → dialog fields → following content,
exactly the Understanding's non-modal example. Meaning and operability are preserved.

## Expected ACT-style outcome
**passed**

## Why automated tools miss it
This is the inverse demonstration: automated tools also can't *confirm* this page passes for the
right reason. Statically, case-03 and case-01 both contain a `role="dialog"` with a labelled email
field and a visibility toggle — axe/WAVE/Lighthouse return the same "no issues" on both. Only by
activating the trigger and observing that the next Tab lands inside the panel (here) versus skipping
to unrelated page content (case-01) can a human tell the passing case from the failing one. The PASS
verdict depends on DOM adjacency + observed tab order, which static analysis does not evaluate.

## Citation
> **WCAG 2.2 Understanding Focus Order, Examples of Focus Order:**
> "A web page implements non-modal dialogs. When the trigger button is activated, a dialog opens. The interactive elements in the dialog are inserted in the focus order immediately after the button. When the dialog is open, the focus order goes from the button to the elements of the dialog, then to the interactive element following the button. When the dialog is closed, the focus order goes from the button to the following element."

(Verbatim from `wcag-understanding/focus-order.html`. This page implements exactly that pattern:
adjacency makes the dialog next in focus order, and dismissal returns focus to the trigger.)

> **WCAG Technique F85, Tests — Procedure, step 1 (second bullet):**
> "If not, check whether moving the focus forward once in the sequential navigation order puts focus in the menu or dialog."

(Verbatim from `wcag-techniques/failures/F85.html`. Here that check is TRUE, so F85 does not apply.)
