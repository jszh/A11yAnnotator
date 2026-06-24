# case-02 — Quick-view modal that preventDefault()s Esc; only Ctrl+M escapes, no advice (FAIL)

## Scenario
An outdoor-gear e-commerce catalogue (Trailhead Outfitters). Each product card has a "Quick view"
button that opens an overlay (`role="dialog"` `aria-modal="true"`) with product details, colour and
quantity controls, a close "×", and "Add to cart". Tab is trapped inside the overlay. The keydown
handler calls `e.preventDefault(); e.stopPropagation()` on **Esc** so the standard exit method does
nothing. The only keyboard release is the undocumented combo **Ctrl+M**, and there is no advice
text anywhere naming it.

## Attribute tuple
- **Content domain:** e-commerce product grid (outdoor gear)
- **UI component / pattern:** quick-view modal (APG dialog) over a product grid
- **Host-language construct:** overlay `div[role=dialog]` + keydown with `preventDefault`/`stopPropagation` on Escape
- **Locale / i18n:** en
- **Failure mechanism:** standard exit method (Esc) deliberately neutralized; only a non-standard combo (Ctrl+M) escapes, with NO advice — a keyboard trap (direct contrast to case-01)

## Developer persona
A Shopify-theme developer copied a "quick view" snippet and, to reduce accidental dismissals during
checkout funnels, a teammate added an analytics/UX guard that "stops the modal closing on stray key
taps" — which swallowed Esc. They kept Ctrl+M from an internal debug build as the real escape and
forgot to remove it or document it. Mouse users close with "×" and never notice; the keyboard path
is broken.

## Element / selector carrying the issue
`#qv` (`div[role=dialog][aria-modal=true]`). The `keydown` listener on `#qv` calls
`preventDefault()`+`stopPropagation()` for `Escape` (returning without closing) and only closes on
`Ctrl+M`.

## Exact accessibility mechanism
A keyboard/AT user opens the overlay; focus moves in and Tab cycles. They press **Esc** — the
expected standard exit — and nothing happens; the handler explicitly suppresses it. The only way
out is Ctrl+M, which no instruction reveals. A screen-reader or keyboard-only user has no
discoverable, standard way to leave: they are trapped. Because the actual exit (Ctrl+M) is a
non-standard method AND no advice is provided, the SC's conditional-pass clause cannot be satisfied.

## Expected ACT-style outcome
**failed** (SC 2.1.2). Focus cannot be moved away by a standard exit method (Esc is neutralized),
and the non-standard method that does work (Ctrl+M) is not advised to the user.

## Why automated tools miss it
The markup is a textbook-correct modal — `role=dialog`, `aria-modal=true`, accessible name,
focusable close button, Tab cycling — structurally indistinguishable from case-01, which PASSES.
The defect is purely runtime: a tool would have to press Esc, observe that focus does NOT leave,
then discover that only an obscure combo escapes. axe/WAVE/Lighthouse never press keys, so they
report no error.

## Citation
**Reference:** WCAG 2.2 Understanding — No Keyboard Trap (`wcag-understanding/no-keyboard-trap.html`)
> "If untrapping focus requires a different method (rather than unmodified arrow keys, the Tab key, or other \"standard exit methods\"), content can still pass this criterion provided that the user is advised how they can untrap focus using their keyboard interface."

**Reference:** Trusted Tester v5.1.3, Test 4.C (`refs/trusted-tester/sc-2.1.2-no-keyboard-trap.md`)
> "Keyboard focus can be moved away from an element using either: a. Standard navigation keys, OR b. Custom keystrokes that are documented and available to users in the application."
