# case-02 — Survey-question reorder: drag-and-drop PLUS Move-up/Move-down buttons → function-level keyboard parity (PASS)

## Scenario
PollForge is a survey builder. On the "question order" screen, an author arranges the questions a
respondent will see. The list can be reordered by dragging a card (native HTML5 drag-and-drop, the same
mechanism as case-01) **and** by real Move-up / Move-down `<button>` controls on every card. The buttons
disable at the ends of the list and announce the new position through a `role="status"` live region. This
is the deliberate matched-PASS partner of case-01: the drag markup is essentially identical, but here a
keyboard equivalent for the *same function* exists, so the verdict flips.

## Attribute tuple
- **Content domain:** SaaS survey/research builder (HR pulse survey)
- **UI component / pattern:** drag-to-reorder list WITH redundant up/down buttons (G202 parity)
- **Host-language construct:** `li[draggable=true]` for pointer reorder PLUS `<button>` movers calling `insertBefore`, with focus management + `aria-live` status
- **Locale / i18n:** en-US
- **Failure mechanism:** none — this is the PASS boundary; the reorder function has a full keyboard route

## Developer persona
A senior engineer who has shipped accessible widgets before. They added drag for the mouse-loving PMs,
but knew from the WCAG Understanding note that "reorder" is a function that must be keyboard-operable, so
they also wired Move-up/Move-down buttons (the exact pattern from G90 Example 2 / G202), disabled them at
the list ends, kept focus on the moved control, and announced the new position. They did NOT make the
draggable `<li>` itself focusable — relying instead on function-level parity, which the SC permits.

## Element / selector carrying the issue
`ol#qlist > li.q` carry `draggable="true"` (identical to a failing page), but the `.movers button.up` /
`.movers button.down` controls provide the keyboard route to the **same reorder function**. The verdict
turns on the presence of these buttons, not on the drag markup.

## Exact accessibility mechanism
A keyboard or screen-reader user Tabs to a card's Move-up/Move-down buttons, presses Enter/Space, and the
question moves; focus stays on the logical mover so repeated presses keep reordering; the live region
announces "…moved to position 2 of 4". The reorder function is therefore fully operable from the keyboard
even though the drag handle itself is pointer-only. Per the Understanding note and G202, the SC does not
require every visible control to be keyboard-focusable — only that the *function* have a keyboard route —
so this passes.

## Expected ACT-style outcome
**passed** (SC 2.1.1 Keyboard — the reorder function has a keyboard equivalent via the up/down buttons;
G90 / G202 parity).

## Why automated tools miss it
A naive "drag-only reorder is a 2.1.1 fail" heuristic would FALSE-POSITIVE this page, because the
`draggable=true` + dragstart/drop markup is the same as the failing case-01. No static scanner can
recognize that the Move-up/Move-down buttons are *the keyboard equivalent of the drag function* — that is
a semantic association (two different controls, one function) plus the G202 "multiple methods to perform
the same function" allowance, neither of which is expressible as a DOM lint. Correctly passing this page
requires the same human function-level reasoning that correctly fails case-01.

## Citation
**Reference:** WCAG Technique G90 — Providing keyboard-triggered event handlers (`wcag-techniques/general/G90.html`)
> "Example 2: A reorder feature A web application that allows users to create surveys by dragging questions into position includes a list of the questions followed by a text field that allows users to re-order questions as needed by entering the desired question number."

**Reference:** WCAG Technique G202 — Ensuring keyboard control for all functionality (`wcag-techniques/general/G202.html`)
> "This does not necessarily mean that each of the individual controls can be used from the keyboard as long as there are multiple methods to perform the same function available on the page. Authors are advised to consider how users will discover any keyboard equivalents which are available."

**Reference:** WCAG 2.2 Understanding — Keyboard (`wcag-understanding/keyboard.html`)
> "This success criterion does not require that every visible control that can be activated using a mouse or touchscreen must also be focusable and actionable using the keyboard. The normative requirement is only that there must be a way for keyboard interface users to perform the same, or comparable, actions and to operate the content."
