# case-06 — Multi-step Edit-profile wizard whose final "Done" correctly returns focus to the originating "Edit profile" button (PASS)

## Scenario
A candidate profile page has an *Edit profile* button that opens a three-step modal wizard (Basics →
Availability → Summary). Each step moves focus to its first field; the final step replaces *Next* with a
*Done* button. When *Done* is pressed, the wizard commits the edited values back into the profile card,
closes, and returns focus to the *Edit profile* button that opened it — the same behavior as *Cancel* and
*Escape*. This is the affirmative PASS the aspect needs: a dialog dismissed by its terminal confirm
control (not a delete) puts focus back on the trigger, exactly as F85 step 2 and the Understanding's
modal example require.

## Attribute tuple
- **Content domain:** job board / ATS candidate profile
- **UI component / pattern:** stepper / multi-step wizard inside a modal dialog
- **Host-language construct:** `role="dialog"` + `aria-modal`, step show/hide, `aria-live` step indicator, focus-return on close
- **Locale / i18n:** en-PT context (Lisbon, Portugal) with en-US UI strings
- **Failure mechanism:** none — correct focus return to trigger on terminal dismissal

## Developer persona
An experienced product engineer who treats focus management as part of "done." They centralized every
exit (Cancel, Escape, and Done) through one `closeWizard()` that calls `editBtn.focus()`, and gave each
step an initial-focus target. They keyboard-tested the full Basics → Availability → Summary → Done path
and confirmed focus lands back on *Edit profile*, where a returning user would expect to continue.

## Element / selector carrying the issue (here: the correctly-handled element)
`#wiz-done` (`commitAndClose()` → `closeWizard()`) returns focus to `#edit-profile`. The same return is
shared by `#wiz-cancel` and the Escape handler.

## Exact accessibility mechanism
The wizard manages focus throughout: `showStep(n)` moves focus to the first field of each step, and the
`aria-live="polite"` step indicator announces "Step n of 3." On terminal dismissal via *Done*,
`commitAndClose()` writes the values into the visible profile card and calls `closeWizard()`, which runs
`editBtn.focus()`. A screen-reader user who finishes editing hears focus land back on *Edit profile* — a
stable, meaningful anchor adjacent to the just-updated details — rather than being dropped at
`document.body`. This satisfies F85 step 2 ("Check whether keyboard focus is put back on the trigger
control") and the Understanding's modal example ("When the dialog is dismissed, focus returns to the
button or the element following the button").

## Expected ACT-style outcome
**passed** (SC 2.4.3 — on dismissal of the multi-step dialog, including via the final Done control,
focus is returned to the originating trigger).

## Why automated tools miss it
This is a PASS that automation can neither confirm nor refute from a snapshot. All the relevant behavior
is runtime: per-step focus moves, the live-region step announcement, and the final focus-return to the
trigger. A static scan sees a valid `role="dialog"` with a label and labeled fields and reports nothing —
it cannot demonstrate that the criterion is *met*, because meeting it depends on operating the wizard to
the end and observing where focus lands. Confirming this page passes requires a human (or AT) to open the
wizard, advance to Done, and verify focus returns to `#edit-profile`. It is included so a verdict engine
must recognize correct focus return on a terminal confirm and NOT flag it.

## Citation
**Reference:** WCAG 2.2 Understanding — Focus Order, modal dialog example (`wcag-understanding/focus-order.html`)
> "When the dialog is dismissed, focus returns to the button or the element following the button."

**Reference:** WCAG Technique F85 — Tests, step 2 (`wcag-techniques/failures/F85.html`)
> "Activate a control in the menu or dialog that causes it to close. … Check whether keyboard focus is put back on the trigger control"
