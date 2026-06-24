# case-02 — Product cards: `<div role="link">` navigated only by a runtime `pointerup` listener

## Scenario
A homeware store "New arrivals" grid (Loom & Larder). Each product tile is a
`<div class="card" role="link" aria-label="…view product">`. Hovering a card lifts it
and shows a pointer cursor; clicking anywhere on the card navigates to the product page.
Inside every card there is also a real `<button>Quick view</button>` that IS keyboard
operable. The header nav is ordinary keyboard-accessible `<a>` links.

## Attribute tuple
- **content-domain:** e-commerce product grid
- **UI-component/pattern:** clickable product card / tile acting as a link
- **host-language construct:** `<div role="link" aria-label>` with no `tabindex`, no `keydown`; navigation via `element.addEventListener('pointerup', …)`
- **locale/i18n:** en-GB (£ pricing)
- **failure-mechanism:** pointer-only handler attached at runtime; ARIA role+name present so the control looks compliant but has no keyboard path

## Developer persona
A front-end developer on a small agency build was told by QA to "make the cards
accessible." They added `role="link"` and an `aria-label` to each card and re-ran axe —
which went green — and considered it done. They never added `tabindex="0"` or a `keydown`
handler, and the navigation itself was already wired through a delegated `pointerup`
listener copied from a "tap-friendly card" recipe, so it works perfectly with a mouse and
on touch but is dead to the keyboard.

## Element / selector carrying the issue
`#grid .card[role="link"]` — the four product-card divs. They navigate only via the
`pointerup` listener registered in the page script; they have no `tabindex` and no key
handler. (The nested `.qv` Quick-view `<button>` is deliberately NOT the issue — it is the
matched, keyboard-operable control.)

## Exact accessibility mechanism
Each card is exposed in the accessibility tree as a link (role="link") with the name from
its `aria-label`, so a screen reader announces "Stoneware mug, Clay, £18 — view product,
link." But the card has no `tabindex`, so it is **not in the sequential focus order** — a
keyboard or switch user can never move focus onto it — and it has no `keydown`/`keyup`
handler, so even programmatic focus would not let Enter activate it. The navigation
function is reachable **only** through the pointer (`pointerup`) path. The page-level
function "open this product" therefore cannot be performed from the keyboard via the card.
(A separate keyboard route to each product is *not* provided by the card; only the
distinct "Quick view" action is keyboard-reachable, which opens a preview, not the product
page.) This is F54: a pointing-device handler is the sole mechanism to invoke the
navigation, and it is not path-dependent, so 2.1.1 fails.

## Expected ACT-style outcome
**failed** — SC 2.1.1 Keyboard (F54), also implicating 4.1.2 in spirit but the *keyboard*
limb is the failure here. The 2.1.1 ACT rules (0ssw9k, akn7bn) are inapplicable — there is
no scroll container and no iframe — so no automated ACT rule fires.

## Why automated tools miss it
This page is specifically escalated past the linter-catchable F59 pattern. axe-core flags
a bare `<div onclick>` with **no role**; here every card HAS `role="link"` and a non-empty
`aria-label`, so the "named control / valid role" checks pass. The click behaviour is
attached with `addEventListener('pointerup', …)` at runtime rather than an inline
`onclick`, which static DOM scanners do not see as an interactive binding. Nothing in the
snapshot is missing or invalid. Detecting the failure requires mousing over a card to learn
the whole tile navigates, then Tabbing through the page and observing that focus never
lands on the card and Enter does nothing — a dynamic, human keyboard test.

## Citation
> **Reference:** WCAG 2.2 Understanding — Keyboard (Intent)
> (`wcag-understanding/keyboard.html`)
>
> **Quote (verbatim):** "Most actions carried out by a pointing device can also be done
> from the keyboard (for example, clicking, selecting, moving, sizing). However, there is
> a small class of input that is done with a pointing device that cannot be done from the
> keyboard in any known fashion without requiring an inordinate number of keystrokes."
>
> **Reference:** WCAG Techniques — F54 (`wcag-techniques/failures/F54.html`)
>
> **Quote (verbatim):** "Check to see whether pointing-device-specific event handlers are
> the only means to invoke scripting functions."
