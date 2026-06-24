# case-01 — Settings dialog Close drops focus to `document.body`, dumping the user to the top of the page (FAIL)

## Scenario
A SaaS analytics product (Metrico) has a "Pipeline Health" dashboard with a *Dashboard settings*
button in the toolbar. Activating it opens a modal dialog that is, on open, correct: focus moves into
the first field. The dialog has four ways to close it — the header **×**, **Cancel**, **Save changes**,
and **Escape** — and all four route through one `closeDialog()` function. That function hides the
overlay but never returns focus to the *Dashboard settings* trigger. Because the element that had focus
is now hidden, the browser resets focus to `document.body`. The next Tab therefore starts from the very
first focusable element on the page (the sticky header nav), forcing a keyboard user who was working in
the toolbar to tab all the way back down to where they were.

## Attribute tuple
- **Content domain:** SaaS analytics dashboard (data-pipeline monitoring)
- **UI component / pattern:** modal dialog (settings) with multiple close affordances
- **Host-language construct:** `role="dialog"` + `aria-modal`, class-toggled overlay, shared `closeDialog()`
- **Locale / i18n:** en-US, metric/SI units
- **Failure mechanism:** F85 close branch — focus set to document (body) after dismissal instead of the trigger

## Developer persona
A junior front-end engineer wired the dialog from a tutorial that covered *opening* a modal properly
("remember to move focus into the dialog!") but said nothing about *closing* one. Their `closeDialog()`
just removes the `open` class. They tested by clicking with a mouse, saw the dialog disappear, and shipped.
On-open focus management gave them false confidence that the whole flow was accessible.

## Element / selector carrying the issue
`#settings-dialog` on dismissal — specifically the `closeDialog()` handler bound to `#dlg-x`,
`#dlg-cancel`, `#dlg-save`, and the Escape key. The trigger that should receive focus back is
`#open-settings`.

## Exact accessibility mechanism
On open, `openDialog()` calls `interval.focus()`, so AT and keyboard users are correctly placed inside
the dialog. On close, `closeDialog()` only removes the `.open` class; it does not call
`openBtn.focus()`. The previously-focused control is inside the now-`display:none` overlay, so the user
agent moves focus to `document.body`. A screen reader announces nothing meaningful and the virtual
cursor resets; a sighted keyboard user sees the focus ring vanish, and the next Tab lands on the first
header nav link at the top of the page — far above the toolbar they were operating. This is precisely
F85's "Setting focus to the document after dismissing a menu" failure: "The user must tab from the
beginning of the navigation sequence to reach the point from which the [dialog] was opened."

## Expected ACT-style outcome
**failed** (SC 2.4.3 — after the dialog is dismissed, keyboard focus is not put back on the trigger
control nor on a logical neighbor; it is dumped on `document.body`).

## Why automated tools miss it
The dialog passes every static check: valid `role="dialog"`/`aria-modal="true"`, `aria-labelledby`
resolves to a real heading, the close button has an `aria-label`, all fields are labeled, and focus is
correctly moved *into* the dialog on open. axe-core, WAVE, and Lighthouse evaluate one DOM snapshot;
they never open the dialog, dismiss it, and check where focus landed. Detecting that focus fell to
`document.body` instead of returning to `#open-settings` is a runtime, interaction-driven observation
that requires a human or AT to perform the close-then-Tab sequence.

## Citation
**Reference:** WCAG Technique F85 — Failure due to dialogs/menus not adjacent to their trigger in the navigation order (`wcag-techniques/failures/F85.html`)
> "When a menu is dismissed, it is removed or hidden from the web page and focus is set to the document. The user must tab from the beginning of the navigation sequence to reach the point from which the menu was opened."

**Reference:** WCAG 2.2 Understanding — Focus Order (`wcag-understanding/focus-order.html`)
> "When the dialog is dismissed, focus returns to the button or the element following the button."
