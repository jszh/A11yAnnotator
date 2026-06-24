# case-05 — Confirm tile is `<div role="button" tabindex="0">` but only `dblclick`/`pointerup` activate it

## Scenario
A credit-union money-transfer review screen (Meridian Credit Union, "Confirm your
transfer", step 2 of 2). The final action is a green "Confirm & send £420.00" tile styled
as a primary button. It is a `<div role="button" tabindex="0">` with a clear accessible
name, so it focuses and announces correctly. Beside it, a real `<button>Cancel</button>`
works by keyboard. The catch: the confirm tile is wired to fire **only** on a
double-click / `pointerup` (a "double-click to confirm" guard) with **no** `keydown`/`keyup`
handler, so Enter and Space do nothing.

## Attribute tuple
- **content-domain:** online banking / fintech (irreversible money transfer)
- **UI-component/pattern:** custom primary "button" with a double-click confirmation guard
- **host-language construct:** `<div role="button" tabindex="0">` activated via `dblclick` + `pointerup` only; **no** keyboard activation
- **locale/i18n:** en-GB (£ amount)
- **failure-mechanism:** focusable, ARIA-correct control that is nonetheless keyboard-dead (pointer-only activation)

## Developer persona
A careful developer added `role="button"`, `tabindex="0"`, and an `aria-describedby` hint
to the confirm tile — they knew "make divs into buttons properly" — and re-ran axe, which
passed. But the product team also wanted a "double-click to confirm" safeguard against
accidental transfers, so activation was bound to `dblclick`/`pointerup`. The developer
forgot that `role="button"` does NOT add Enter/Space behaviour by itself (you must wire
`keydown`), so the control ended up focusable and ARIA-correct yet impossible to trigger
with a keyboard.

## Element / selector carrying the issue
`#confirmTile` — `div.confirm[role="button"][tabindex="0"]`. It has a valid role, a valid
accessible name ("Confirm & send £420.00"), and is in the tab order, but its only
activation bindings are `dblclick` and `pointerup` (gated on `e.pointerType`), with no
keyboard handler.

## Exact accessibility mechanism
Because the tile has `role="button"`, `tabindex="0"`, and text content, AT exposes it as a
focusable button named "Confirm & send £420.00" — everything looks right. A keyboard user
Tabs to it and sees the focus ring. But the activation logic listens only for `dblclick`
and `pointerup` (and the `pointerup` path is explicitly gated to `pointerType` mouse/touch/pen),
so neither Enter nor Space — the platform keyboard activation keys a button role implies —
invokes `doConfirm()`. The transfer cannot be confirmed from the keyboard at all. The only
keyboard-reachable action is **Cancel**, which is not an equivalent (it abandons the task).
So the consequential function (sending the transfer) is invokable solely through a pointer
gesture. Per the Understanding note, a custom button may legitimately respond to only one
key (e.g. Enter), but it must respond to *some* key — here it responds to *none*. This is
F54: pointing-device handlers are the only mechanism to invoke the function.

## Expected ACT-style outcome
**failed** — SC 2.1.1 Keyboard (F54). This is the hardest variant: 4.1.2 (name/role) is
actually satisfied, and the element IS focusable, so the failure is purely the missing
keyboard *activation*. The 2.1.1 ACT rules (0ssw9k, akn7bn) do not apply.

## Why automated tools miss it
Every static check passes: the control has a valid `role="button"`, a non-empty accessible
name, and `tabindex="0"` (so it is focusable and not flagged as an unreachable interactive
element). axe-core, WAVE, and Lighthouse have no rule that verifies a role="button" element
actually *responds to Enter/Space* — that is a runtime behaviour. The activation is bound to
`dblclick`/`pointerup`, events no static rule maps to a keyboard requirement. The only way
to catch it is to focus the tile and press Enter and Space and observe that nothing happens
— a dynamic keyboard test that requires a human (or AT) to operate the control, exactly the
gap that makes this aspect uncovered by the corpus.

## Citation
> **Reference:** WCAG 2.2 Understanding — Keyboard (Note on custom controls and activation keys)
> (`wcag-understanding/keyboard.html`)
>
> **Quote (verbatim):** "For instance, buttons that have focus can generally be activated
> using both the Enter key and the Space bar. If a custom button control in a web
> application instead only reacts to Enter (or even a completely custom key or key
> combination), this still satisfies the requirements of this success criterion."
>
> **Reference:** Trusted Tester v5.1.3 — Test 4.A `2.1.1-keyboard-access`
> (`refs/trusted-tester/sc-2.1.1-keyboard.md`)
>
> **Quote (verbatim):** "Use the keyboard to operate identified functionality and/or
> access the essential information: tab to the element and execute (e.g., press Enter with
> focus on the element)."
