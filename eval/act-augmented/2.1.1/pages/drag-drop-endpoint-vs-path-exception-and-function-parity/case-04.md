# case-04 — Resizable docs splitter: role="separator" with full ARIA values but NO arrow-key handler (FAIL)

## Scenario
An API-reference reader (Stripe-style) has a left navigation pane and a right content pane separated by
a draggable splitter the user can drag to widen or narrow the nav. The splitter is marked up as a
textbook ARIA window-splitter — `role="separator"`, `aria-orientation="vertical"`, `aria-valuemin`,
`aria-valuemax`, `aria-valuenow`, an `aria-label`, and `tabindex="0"` so it is focusable. But there is
**no `keydown` handler**: focusing the splitter and pressing ArrowLeft/ArrowRight does nothing and
`aria-valuenow` never changes. Resize works by mouse drag only.

## Attribute tuple
- **Content domain:** developer docs / API reference
- **UI component / pattern:** two-pane resizable splitter (`role="separator"` window splitter, APG)
- **Host-language construct:** `div[role=separator][tabindex=0]` with `aria-valuemin/max/now` but only a `mousedown`/`mousemove` resize; no keyboard handler
- **Locale / i18n:** en-US, monospace code samples
- **Failure mechanism:** ARIA value contract is present and valid but the documented keyboard interaction (arrow keys adjust the separator) is unimplemented — behavior, not markup

## Developer persona
A mid-level dev followed an "accessible splitter" blog post far enough to copy the ARIA attributes
(role=separator, aria-valuenow, tabindex=0) and felt confident it was accessible because axe was green.
They implemented the mouse drag with `mousemove`, updating `aria-valuenow` as they dragged — but never
added the `keydown` branch that the APG separator pattern requires (ArrowLeft/Right/Home/End). They
tested by dragging with a mouse; they never focused the handle and pressed an arrow key.

## Element / selector carrying the issue
`#splitter` (`div[role="separator"][tabindex="0"]`) — focusable and fully ARIA-described, but with no
keyboard handler, so arrow keys do not resize and `aria-valuenow` is updated only by mouse drag.

## Exact accessibility mechanism
A keyboard user can Tab to the splitter (it is focusable and shows a focus style) and a screen reader
announces "Resize navigation panel, 280" — so it *advertises* itself as an adjustable separator. But
pressing ArrowLeft/ArrowRight (and Home/End) does nothing: there is no `keydown` listener, `aria-valuenow`
stays at 280, and the pane width never changes. The resize *function* is operable by pointer (mousedown
drag) only. Resizing a region is endpoint-dependent — only the final width matters, not the path the
pointer travels (the Understanding text lists "re-sizing windows" as explicitly NOT path-dependent) — so
the exception does not apply and SC 2.1.1 fails. The valid ARIA actively masks the failure and makes the
broken keyboard contract worse: the control *claims* to be adjustable but cannot be adjusted.

## Expected ACT-style outcome
**failed** (SC 2.1.1 Keyboard — the resize function has no keyboard operation despite a focusable
separator; the path exception does not cover resizing).

## Why automated tools miss it
axe-core/WAVE validate the ARIA: `role="separator"` with `aria-valuenow` inside its min/max is
syntactically correct and focusable, so every static check passes — and the ARIA presence makes the
widget *look* fully accessible. No scanner presses ArrowLeft on the focused separator and observes that
`aria-valuenow` does not move; verifying the keyboard contract is a runtime interaction. It also requires
the human judgment that resizing is endpoint- (not path-) dependent and therefore in scope for 2.1.1.

## Citation
**Reference:** WCAG 2.2 Understanding — Keyboard (`wcag-understanding/keyboard.html`)
> "Drawing straight lines, regular geometric shapes, re-sizing windows and dragging objects to a location (when the path to that location is not relevant) do not require path dependent input."

**Reference:** WCAG Technique G202 — Ensuring keyboard control for all functionality (`wcag-techniques/general/G202.html`)
> "Examples of functionality include the use of physical controls such as links, menus, buttons, checkboxes, radio buttons and form fields as well as the use of features like drag and drop, selecting text, resizing regions or bringing up context menus."

**Reference:** WCAG Technique G90 — Providing keyboard-triggered event handlers (`wcag-techniques/general/G90.html`)
> "make sure that all event handlers triggered by non-keyboard UI events are also associated with a keyboard-based event, or provide redundant keyboard-based mechanisms to accomplish the functionality provided by other device-specific functions."
