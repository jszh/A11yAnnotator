# case-01 — Council-tax "Make a payment" tile: focusable div, onclick only, no key handler

## Scenario
A UK local-government services portal ("Riverleigh Borough Council") presents three service
tiles: *Make a payment*, *Set up a Direct Debit*, and *Tell us you're moving*. The two
secondary tiles are genuine `<a href>` links. The primary tile, **Make a payment**, is a
`<div role="button" tabindex="0" onclick="startPayment()">`. Because it has `tabindex="0"`
and `role="button"`, it receives focus and is announced as a button, so it appears to be "in
the tab order" — but a `<div>` has no implicit activation, and there is no
keydown/keypress/keyup handler, so pressing **Enter** or **Space** does nothing.

## Attribute tuple + developer persona
- **content-domain:** government / civic services (council tax payment)
- **UI-component/pattern:** service-tile card grid; primary action as a "div button"
- **host-language construct:** `<div role="button" tabindex="0" onclick=...>` with no key handler
- **locale/i18n:** en-GB
- **failure-mechanism:** present-but-no-op keyboard activation (no key handler at all)
- **persona:** A junior developer on the council's digital team copied a "clickable card"
  snippet from Stack Overflow. The snippet added `tabindex="0"` and `role="button"` (so it
  *looked* accessible and even passed the team's "is it focusable / does it have a role?"
  checklist) but the original snippet relied on a framework directive for activation that was
  never ported. The mouse works, the tile got shipped, and nobody tabbed to it and pressed a key.

## Element / selector carrying the issue
`.service-tile[role="button"]` — the *Make a payment* tile (the first child of `.tiles`).

## Exact accessibility mechanism (what AT experiences and why it fails)
- A keyboard or switch user **tabs** to the tile (it is in the tab order via `tabindex="0"`).
- A screen reader announces it as **"Make a payment, button"** — so the user reasonably
  expects Enter/Space to activate it.
- The user presses **Enter**, then **Space**. Nothing happens: native `<button>`/`<a>`
  elements have built-in activation behaviour for these keys, but a `<div>` does not, and the
  page wired up only `onclick` (which a pointer fires, but the keyboard does not synthesize for
  a non-native control without a key handler).
- There is **no alternative keyboard path** to the card-payment journey on the page, so the
  primary function is keyboard-reachable but not keyboard-**operable** → fails 2.1.1.

Verified behaviourally (headless Chromium): tile is focusable; Enter does not activate;
Space does not activate; mouse click does activate.

## Expected ACT-style outcome
**failed** (SC 2.1.1, also implicates 2.1.3).

## Why automated tools miss it
axe-core / WAVE / Lighthouse see a focusable element that *has* a role (`button`) and *is*
reachable (`tabindex="0"`). The "interactive controls must be focusable" / "clickable element
must be keyboard accessible" heuristics are satisfied on the surface: it IS focusable and it
DOES have a role. What they cannot determine statically is that **no key handler exists to
execute the action** — confirming that requires actually focusing the element and pressing
Enter and Space and observing that nothing happens. The presence of `role="button"` actively
suppresses the naive "div with onclick but no role" lint that would otherwise fire.

## Citation
> **WCAG Technique SCR29 — Adding keyboard-accessible actions to static HTML elements** (`wcag-techniques/client-side-script/SCR29.html`)
>
> "This technique ensures that the element is focusable by setting the `tabindex` attribute, and it ensures that the action can be triggered from the keyboard by providing an `onkeyup` or `onkeypress` handler in addition to an `onclick` handler."

> **WCAG Technique SCR29 — Tests / Procedure** (`wcag-techniques/client-side-script/SCR29.html`)
>
> "Set keyboard focus to the control … Check that pressing Enter or Space invokes the scripting action."

The tile satisfies the first half (focusable) but omits the required key handler, so the SCR29
test step "pressing Enter or Space invokes the scripting action" fails.
