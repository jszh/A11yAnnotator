# case-02 — "Add to cart" rendered as a styled `<div>` button

## Scenario
On the product detail page of **Fernweh Roastery**, the primary call to action is a green,
rounded, filled, button-shaped box reading "Add to cart". It has a pointer cursor, a hover
darken, a pressed (`:active`) state, and clicking it increments the cart badge and pops a
confirmation toast — it behaves in every respect like the page's main **button**. But it is
a `<div class="addcart" onclick="addToCart()">` with no `<button>`, no `role="button"`, and
no `tabindex`. (The secondary "Save to wishlist" action is, by contrast, a real `<button>`
styled to look like a quiet text link — a deliberate foil so the failure is the specific
`<div>` CTA, not a blanket absence of controls.)

## Attribute tuple
- **content-domain:** e-commerce — single-product detail / add-to-cart
- **UI-component / pattern:** primary CTA "add to cart" button
- **host-language construct:** `<div onclick>` (no `<button>`, no `role`, no `tabindex`)
- **locale / i18n:** en-US
- **failure-mechanism:** scripted element presented as a button whose exposed role is **generic** (F42 — emulated control)

## Developer persona
A Shopify-theme contractor who "didn't want the browser's default button styling to fight
the design." Rather than reset a `<button>`, they grabbed a `<div>`, dropped on the brand's
`.addcart` pill styling, and attached an `onclick` that calls the theme's cart AJAX. On a
mouse it was pixel-perfect and demoed clean, so the role/keyboard gap never surfaced. (They
*did* leave the wishlist action as a real `<button>` because it came from a stock snippet —
hence one correct control and one emulated one on the same page.)

## Element / selector carrying the issue
- `.addcart` — the single primary `<div>` CTA. It is styled and behaves as a button but
  exposes a generic role. The sibling `button.wishlist` is a correctly-coded control and is
  **not** the defect.

## Exact accessibility mechanism (what AT experiences)
A sighted user sees a filled rounded box with a label, a pointer cursor, and press feedback —
every cue says "this is the buy button." A screen-reader user encountering the `<div>` hears
only its text content with the **generic** role: it is not announced as a button, it does not
appear when the user lists the page's buttons/form controls, and there is no indication it is
operable. With no `tabindex` it is also unreachable by keyboard, so a keyboard-only or
switch-access user cannot place an order at all. The button relationship that the rounded
filled styling and click behaviour convey is not programmatically determinable.

## Expected ACT-style outcome
**failed** — SC 1.3.1 Info and Relationships, F42 emulated-control path: an element presented
as a button via styling and scripted activation exposes a generic role, so its control
relationship is not programmatically determinable.

## Why automated tools miss it
The `<div>` carries no `role` attribute, so ACT's 1.3.1 role rules (4e8ab6, 674b10) — which
apply only when a role is present — never fire. axe / WAVE / Lighthouse see a `<div>` with text
and a click handler; no static rule classifies a bare element-plus-listener as "a button with
a missing/wrong role." Recognising the filled pill + label + hover/press + add-to-cart action
as a *button*, and judging that its exposed generic role contradicts that presentation, is
human visual and behavioural reasoning that attribute-driven scanners do not perform.

## Citation
**Reference:** WCAG Techniques — *F42: Failure of Success Criteria 1.3.1, 2.1.1, 2.1.3, or
4.1.2 when emulating links* (`wcag-techniques/failures/F42.html`).

> "Scripted event handling is added to a `span` element so that it functions as a link when
> clicked with a mouse. Assistive technology does not recognize this element as a link."

**Supporting reference:** WCAG 2.2 Understanding — *Info and Relationships* (Intent)
(`wcag-understanding/info-and-relationships.html`).

> "When such relationships are perceivable to one set of users, those relationships can be
> made to be perceivable to all."
