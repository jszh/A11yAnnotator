# case-01 — Checkout: Billing and Shipping address sections interleaved line-by-line

## Scenario
A "Northwind Outfitters" e-commerce checkout, step 2 of 3. The page shows two boxed
sections side by side: **Billing address** (left) and **Shipping address** (right). Each
box visually contains the same five labeled fields in the natural order — Full name,
Street address, Apartment/suite, City, Postal code. Mouse users see two perfectly tidy,
grouped address cards. But the whole form is one flat CSS-grid, and the DOM source order
interleaves the two addresses **one line at a time**: billing-name, shipping-name,
billing-street, shipping-street, billing-apt, shipping-apt, billing-city, shipping-city,
billing-postal, shipping-postal. There is **no `tabindex`** — the tab order is pure
source order, so it zig-zags between the billing card and the shipping card on every Tab.

## Attribute tuple
- **content-domain:** e-commerce product & checkout
- **UI-component / pattern:** dual-address form, two visually-boxed `<fieldset>`-style sections
- **host-language construct:** single CSS-grid form with `grid-template-areas`; fields emitted in interleaved DOM order, placed into cards by named grid areas; no `tabindex`
- **locale / i18n:** en-US
- **failure-mechanism:** interleaved DOM order across two semantic groups (the Understanding's canonical "name → checkbox → street → checkbox" failure, transposed to billing/shipping)

## Developer persona
A front-end dev rebuilt the legacy two-column checkout in CSS Grid to make it responsive.
To get the billing and shipping cards to align row-for-row at every breakpoint, they laid
the whole form out as a single grid and authored the markup **row by row** ("name row,
then street row, then apt row…"), emitting the billing cell and then the shipping cell for
each row. The grid `grid-template-areas` map snaps each field into the correct visual card,
so it looked right in the browser. The dev never tabbed through it and never realised the
source order — and therefore the keyboard focus order — now alternates between the two
addresses.

## Element / selector carrying the issue
The whole interleaved field sequence inside `form[aria-label="Billing and shipping addresses"]`.
Concretely: `#s-name` (shipping Full name) is the **second** field in DOM/tab order, sitting
between `#b-name` (billing Full name) and `#b-street` (billing Street). The primary selector
to inspect is `#s-name` — it is the field that interrupts the billing group.

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Sighted mouse user:** sees two clean cards; clicks straight down one card then the
  other; no problem perceived.
- **Keyboard / screen-reader user:** Tab 1 lands in *Billing → Full name*. Tab 2 jumps to
  *Shipping → Full name* (the focus ring leaps from the left card to the right card). Tab 3
  jumps **back** to *Billing → Street*. The user, who began entering their billing details,
  is thrown into the shipping recipient before they have finished the billing block, then
  back again — the "I am filling in my billing address" mental model is destroyed on the
  second keystroke, and a distracted user can easily enter the shipping recipient's name in
  the billing name field or vice-versa.
- **Verified with Puppeteer** by emulating real Tab presses: the focused element's visual
  x-coordinate alternates `84 → 537 → 84 → 537 → …` (left card ↔ right card) for all ten
  fields, proving the keyboard focus order zig-zags across the billing/shipping boundary.

## Expected ACT-style outcome
**failed** (SC 2.4.3 — focus order does not preserve the meaning of the two address
sections; it interleaves them so the sequence no longer follows the content's grouping).

## Why automated tools miss it
There is no `tabindex` to flag (the tab order is the DOM default), every `<input>` has a
correct `<label for>`/programmatic name, every control is operable, and contrast is fine —
so axe, WAVE, and Lighthouse report a clean form. They have **no model of which fields
belong to the same address**: nothing in the markup says "shipping street must not come
between billing name and billing street." Deciding that the street/apt/city/postal of one
address belong together — and that crossing into the other address mid-sequence breaks
meaning — is pure content-grouping judgment, exactly what SC 2.4.3 leaves to a human.

## Citation
> "However, the tab order for the form skips between fields in different sections of the
> form, so that focus moves from the name field to a checkbox, then to the street address,
> then to another checkbox."
— wcag-understanding/focus-order.html (Examples of Focus Order — the failing example)

> "The intent of this success criterion is to ensure that when users navigate sequentially
> through content, they encounter information in an order that is consistent with the
> meaning of the content and can be operated from the keyboard. This reduces confusion by
> letting users form a consistent mental model of the content."
— wcag-understanding/focus-order.html (Intent of Focus Order)
