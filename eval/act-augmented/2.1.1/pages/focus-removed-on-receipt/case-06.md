# case-06 — BOUNDARY (passed): editor toolbar suppresses focus on MOUSE press only (`mousedown` → `preventDefault`); keyboard focus rests

## Scenario
A rich-text document editor ("Quillpad"). Each formatting button in the toolbar declines focus **only on pointer interaction**, via `mousedown` → `e.preventDefault()` — the standard pattern that keeps the text caret in the contenteditable when you CLICK Bold (so Bold applies to your selection instead of yanking focus out of the editor). Crucially, there is NO `onfocus="this.blur()"` and NO `focusin` re-grab: a keyboard user can Tab to every toolbar button, focus **rests** on it (the focus ring stays), and Space/Enter toggles `aria-pressed`. This is the looks-like-F55-but-isn't boundary: suppressing the mouse's focus-on-click is legitimate and does not fail 2.1.1.

## Attribute tuple
- **content-domain:** productivity / web word-processor (document editor)
- **UI-component / pattern:** `role="toolbar"` of formatting buttons over a `contenteditable` `role="textbox"`
- **host-language construct:** `addEventListener('mousedown', e => e.preventDefault())` (pointer-only focus suppression); no `focus`/`focusin`/`blur` handlers at all
- **locale / i18n:** en-US
- **failure-mechanism:** NONE — this is the legitimate counter-pattern that resembles F55 in source but only affects mouse, not keyboard focus

## Developer persona
An experienced developer building an editor toolbar applied the well-known `mousedown.preventDefault()` idiom so clicking a formatting button does not blur the editor and lose the user's text selection. They deliberately did NOT touch keyboard focus, and verified Tab/Space still operate every button.

## Element / selector carrying the issue
`.toolbar button[data-cmd="bold"]` (representative). No issue is present; the `mousedown` handler is pointer-scoped and keyboard focus is never removed.

## Exact accessibility mechanism (what AT experiences, why it PASSES)
- Each toolbar button is a real `<button>` with an accessible name (`aria-label`), and the toggle buttons expose `aria-pressed`. The editor is a `contenteditable` `role="textbox"`.
- `mousedown` → `preventDefault()` fires only on a physical pointer press. It cancels the default *mouse* focus assignment so the caret stays in the document on click — it has no effect on keyboard navigation.
- Pressing **Tab** dispatches no `mousedown` event, so the handler never runs: focus lands on the button and **remains** there (the focus ring persists). Space/Enter then fires the `click` handler and toggles `aria-pressed`. The button is fully keyboard operable.
- Both input methods work; nothing removes keyboard focus on receipt. Per F55's own test, "focus remains there until user moves it" — which is the passing condition.

Verified with Puppeteer: `el.focus()` on the Bold button leaves `document.activeElement` equal to that button after the event-loop turn (`rests=true`, `landedOn=button`).

## Expected ACT-style outcome
**passed** (SC 2.1.1 — the toolbar buttons are reachable AND focus rests on them AND they are operable by keyboard; the mouse-only `preventDefault` is not a keyboard failure). Included as a boundary variant to sharpen that suppressing pointer focus-on-click is not F55.

## Why automated tools miss it
This case is here to test the inverse error: a tool (or a careless reviewer) that flagged anything resembling focus suppression near `preventDefault` would FALSELY fail this page. Automated tools cannot tell, from the static markup, whether the focus suppression affects keyboard focus or only pointer focus — both require running the page and distinguishing a `mousedown`-scoped `preventDefault()` (legitimate) from a `focus`/`focusin` self-blur (F55). Correctly judging this as a PASS requires the same behavioural trace as the failing cases — Tab to each button, confirm focus rests, press Space and confirm it toggles — which is human/behavioural judgment, not static analysis.

## Citation
> "Use the keyboard to verify that you can get to all interactive elements using the keyboard. Check that when focus is placed on each element, focus remains there until user moves it."
— wcag-techniques/failures/F55.html (Tests — Procedure; here #2 is TRUE for keyboard focus, so the F55 failure condition does NOT apply)

> "This success criterion does not require that every visible control that can be activated using a mouse or touchscreen must also be focusable and actionable using the keyboard. The normative requirement is only that there must be a way for keyboard interface users to perform the same, or comparable, actions and to operate the content."
— wcag-understanding/keyboard.html (Intent note; the toolbar IS keyboard operable, and the mouse-focus suppression does not remove the keyboard path)

> "Not applicable: If any requirement precondition is false or the web page does not contain content relevant to WCAG 2.2 Success Criterion 2.1.1 Keyboard."
— docs/analysis/en301549/EN301549-ANNEX-C-RELEVANT-CLAUSES.md (C.9.2.1.1 — SC 2.1.1, Result; here the content IS relevant and the check passes — Pass, not N/A)
