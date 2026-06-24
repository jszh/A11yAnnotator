# case-02 — Patient-portal drug-interaction popover: Esc handler bound to a trigger that lost focus

## Scenario
A medication list in a patient portal has an "interactions" pill next to "Warfarin 5 mg."
Activating or focusing it opens a major-interaction warning box that **covers the dosage
text** ("1 tablet by mouth once daily") in the same row. The developer DID write an Escape
handler — but bound it to the trigger button via `btn.addEventListener('keydown', …)`. The
button's own `click` handler then calls `this.blur()` (a "scroll-the-warning-into-view"
convenience), so after activation **focus moves to `document.body`**. Keydown events now
land on the body, never on the button's listener, so **pressing Escape does nothing** while
the warning box is open and obscuring the dose.

## Attribute tuple
- **content-domain**: healthcare / patient portal (medication management)
- **UI-component/pattern**: data-table cell popover / drug-interaction warning
- **host-language construct**: `keydown` listener scoped to the trigger element vs. document
- **locale/i18n**: en
- **failure-mechanism**: Esc handler scoped wrong — bound to an element that has lost focus

## Developer persona
A mid-level developer copied an Escape-to-close snippet from a Stack Overflow answer that
attached the listener to the button (`el.onkeydown`). It worked in their manual test
because they kept tabbing onto the button. Later, a UX request — "scroll the warning into
view and don't leave a focus ring on the pill" — added `this.blur()` to the click handler.
That single line silently stranded focus on `<body>`, breaking the Escape path, but no test
covered "press Escape after clicking."

## Element / selector carrying the issue
- FAIL: `button#warnBtn` (the trigger) — its `keydown`/Escape handler is unreachable after
  `this.blur()` moves focus off it; the popover `#warnPop` stays open over the dose text.

## Exact accessibility mechanism
A keyboard or low-vision magnifier user activates the "interactions" pill. The warning box
appears and covers the "1 tablet by mouth once daily" dosage instruction — clinically
important text the user now cannot see. Per SCR39 they should press Escape to clear the box
while their attention/focus stays put. But because focus was blurred to `<body>` on
activation, the Escape `keydown` is dispatched to the body, where no handler listens. The
box remains. To get rid of it the user must move focus elsewhere (Tab) and hunt their place
back — and a magnifier user who navigates by focus is forced to pan away, re-triggering the
exact problem the SC prevents. The defect is a scope mismatch between *where the listener
lives* and *where focus actually is*, which is invisible in the static markup.

## Expected ACT-style outcome
**failed** — obscuring content appears on focus/activation; the only dismiss mechanism is
an Escape handler that cannot receive the event because the trigger no longer holds focus.

## Why automated tools miss it
A static scan sees a `keydown` listener that checks for `Escape` — superficially "has a
dismiss mechanism" — and a perfectly valid button + `role="tooltip"`. No automated tool
models the runtime focus path: that `this.blur()` in the click handler moves focus to
`<body>`, that the keydown listener is on the *button* not `document`, and that the two
therefore never meet. Determining the failure requires a human to activate the trigger,
notice the box covers the dose, press Escape, observe nothing happens, and then reason that
the handler's scope no longer matches the live focus location. That is handler-scope-vs.-
focus reasoning, not a lint check.

## Citation
> **WCAG Technique SCR39 — Tests, Procedure (content that appears on focus)**
> "The content can be closed without moving the focus way from the trigger. Either by
> pressing Esc, by  pressing another other documented keyboard shortcut, or by activating
> the trigger."

> **WCAG 2.2 Understanding 1.4.13 — Dismissible (Method 2)**
> "Provide a mechanism to easily dismiss the additional content, such as by pressing
> Escape."
