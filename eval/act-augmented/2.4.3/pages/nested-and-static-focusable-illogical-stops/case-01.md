# case-01 — Focusable `<div>` wrapping a single "Add to basket" `<button>` (control focused twice)

## Scenario
A small-batch pottery e-commerce product page (Ironbark Pottery). The only primary control
on the page is the "Add to basket" button. The developer made the *wrapping* `<div>`
focusable AND interactive (`tabindex="0"` + `role="button"` + a keydown that re-dispatches
the click) while leaving a real `<button>` inside it. Tabbing therefore stops on the wrapper
**and then** on the button — the same "Add to basket" control appears to receive focus
twice in a row. This is the canonical example pictured verbatim in the Understanding note:
`<div tabindex="0"><button>...</button></div>`.

## Attribute tuple
- **content-domain:** e-commerce product & checkout (artisan pottery)
- **UI-component/pattern:** add-to-cart primary action button
- **host-language construct:** nested focusables — `div[tabindex=0][role=button]` wrapping a native `<button>`
- **locale/i18n:** en (en-AU content)
- **failure-mechanism:** redundant/duplicate focus stop from a focusable wrapper around a focusable child

## Developer persona
A junior front-end dev copied a "make a div behave like a button" snippet from Stack Overflow
(add `tabindex="0"`, `role="button"`, and a keydown→click handler) to style the whole clickable
"surface" with hover/focus rings. They forgot they had *also* left the real `<button>` inside it.
Both keyboard-test fine ("Enter activates it"), so the duplicate stop was never noticed.

## Element / selector carrying the issue
`div.add-wrap[tabindex="0"]` (the wrapper) sitting around `button.add-btn` — both focusable.

## Exact accessibility mechanism (what AT experiences, why it fails)
A keyboard / screen-reader user tabs from the Glaze `<select>` and lands on the wrapper, which
announces as "Add to basket, button" (the role=button + its text content). They press Tab again
and land on the *inner* native `<button>`, which announces as "Add to basket, button" **again**.
The user has no way to know these are one physical control: it reads as two identical buttons
back-to-back. Activating the first does the same thing as the second, so the user wonders whether
they added two mugs, or whether the first press failed. The extra stop does not add information;
it duplicates a control and impedes operation by making a single action ambiguous. This is exactly
the "control appearing to receive focus multiple times due to the use of nested focusable elements"
failure the Understanding note describes.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
`tabindex="0"` on a `<div>` is valid; `role="button"` is a real, correctly-spelled role; the inner
control is a genuine `<button>` with a non-empty accessible name; nothing is `aria-hidden`. axe-core,
WAVE, and Lighthouse have no rule that flags "a focusable wrapper immediately around a single
focusable child." Detecting it requires tabbing the page, observing that focus lands on the *same*
control twice, and making the semantic judgment that the duplicate stop impedes operation rather than
being harmlessly tedious — human reasoning the static scanners do not perform.

## Citation
> **WCAG 2.2 Understanding Focus Order, Intent (note):**
> "it is a failure of Focus Order if items receive focus in an order that impedes the meaning or operation of content, or creates confusing or illogical focus orders — for example, a control appearing to receive focus multiple times due to the use of nested focusable elements."
> `<div tabindex="0"><button>...</button></div>`

(Verbatim from `wcag-understanding/focus-order.html`, the `#intent` note. This page reproduces the
exact `div[tabindex=0]` > `button` shape the note pictures.)
