# case-03 — Quick-view modal: close ✕ is mouse-only (span+onclick), no keydown, no Esc (FAIL)

## Scenario
"Summit & Pine Outfitters" product grid. Each card has a "Quick view" button; activating
one opens a `role="dialog" aria-modal="true"` modal with the product image, a size
`<select>`, a quantity `<input>`, and an "Add to cart" button. A focus trap cycles Tab
among those form controls. The only dismiss is a round "✕" close glyph in the top-right —
but it is a `<span>` with `role="button"` and `onclick="closeQV()"` only: it is **not
focusable** (no `tabindex`, not a real button) and has **no `keydown` handler**. There is
also **no Esc handler**. The dialog is therefore closeable by mouse (click the ✕) yet
trapped for the keyboard: the ✕ can never be tabbed to or keyboard-activated, and Tab just
cycles the form forever.

## Attribute tuple
- **content-domain:** e-commerce product & checkout (outdoor retail)
- **UI-component/pattern:** APG "dialog (modal)" — product quick-view overlay
- **host-language construct:** `<span role="button" onclick>` close glyph (mouse-only) inside a `role="dialog"` focus trap
- **locale/i18n:** en-US
- **failure-mechanism:** the only dismiss control is pointer-only — not focusable, no keydown — and no Esc handler exists

## Developer persona
An agency themed a Shopify Dawn-style storefront and bolted on a custom "Quick view"
modal. The designer mocked the close affordance as a small grey circle with an ✕, so the
developer styled a `<span class="close">` to match the comp exactly and wired `onclick`.
A lint rule complained the ✕ had no accessible name and no role, so they added
`role="button"` and `aria-label="Close quick view"` to silence it — which makes the
*name/role* check pass while leaving the control mouse-only. They QA'd by clicking with a
mouse; the modal opened and closed perfectly. No keyboard pass was performed.

## Element / selector carrying the issue
`#qv-close` — the `<span class="close" role="button" aria-label="Close quick view"
onclick="closeQV()">✕</span>`. It is excluded from the focus trap's `focusables()`
(`querySelectorAll('select, input, button')` does not match a span) and has no `keydown`;
combined with the absent Esc branch in `#qv`'s handler, the dialog has no keyboard exit.

## Exact accessibility mechanism
A keyboard user activates "Quick view"; focus moves to the size `<select>`. Tabbing:
size → quantity → Add to cart → (wraps) → size, forever. The ✕ is a `<span>` with no
`tabindex`, so it is never in the tab order — the user can *see* a close affordance but
can never move focus to it, and even if they could, it has no `keydown` to fire on Enter
or Space. Pressing **Esc does nothing** (the handler early-returns for any non-Tab key).
A screen-reader user in browse mode may *hear* "Close quick view, button" (the injected
role + name), try to activate it, and find nothing happens via keyboard — `onclick` does
fire a synthetic click for some AT, but switch users, magnifier users, and keyboard-only
users who cannot reach it are stranded with no working dismiss. The modal carve-out
requires the user be able to untrap and leave with the keyboard; here only a mouse can.
Verdict: **FAILED**.

## Expected ACT-style outcome
**failed** — SC 2.1.2 No Keyboard Trap (Level A), legitimate-containment-vs-trap limb. The
only dismiss is pointer-operable (non-focusable span with `onclick`, no keydown) and there
is no Esc handler, so a keyboard user cannot move focus away from the modal.

## Why automated tools miss it
The ✕ span carries `role="button"` and `aria-label="Close quick view"`, so a name/role
linter sees a named, roled control and passes; the dialog has a proper accessible name
(`aria-labelledby`); every field is labelled; nothing is missing or empty, and there is no
contrast issue. axe/WAVE/Lighthouse do not test whether a `role="button"` element is
*actually focusable* or whether it has a *keyboard* handler in practice, and they never
press Tab/Enter/Esc on the open modal. Detecting the trap requires a human to Tab the live
dialog (observing the ✕ is skipped), attempt to keyboard-activate the visible Close, and
press Esc — then reason that a mouse-only dismiss does not satisfy the keyboard-exit
requirement of the modal carve-out.

## Citation
> **Reference:** WCAG Techniques — G21 "Ensuring that users are not trapped in content"
> (`wcag-techniques/general/G21.html`)
>
> **Quote (verbatim):** "The objective of this technique is to ensure that keyboard users
> do not become trapped in a subset of the content that can only be exited using a mouse or
> pointing device."
>
> **Quote (verbatim, WCAG 2.2 Understanding SC 2.1.2 Intent):** (`wcag-understanding/no-keyboard-trap.html`)
> "Keyboard focus is not considered trapped when the user can navigate away from a component
> using only a keyboard interface, and if it only requires unmodified arrow or Tab keys or
> other "standard exit methods"."
