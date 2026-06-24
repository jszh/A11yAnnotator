# case-01 — Checkout wizard: mobile `order:` stacks steps Payment, Shipping, Review (badges read 2,1,3)

## Scenario
A three-step e-commerce checkout progress wizard for "Northwind Outfitters": **1 Shipping → 2
Payment → 3 Review**. These steps are an order-dependent process — you cannot pay before you
have entered where to ship. The DOM source order is the correct order (1 Shipping, 2 Payment,
3 Review) and the desktop render (three columns, left to right) is also correct. The visible
"1 / 2 / 3" badges are **hard-coded into each `<li>` in the markup**, so each number is glued to
its own step (Shipping is always "1", Payment "2", Review "3") — exactly as you would want, since
the number is the meaning carrier.

At the `max-width:600px` breakpoint the wizard switches to a vertical stack, and a designer added
flex `order:` rules to "lead with payment" on mobile. The result: the boxes render top-to-bottom
as **Payment, Shipping, Review**. Because each badge number stays attached to its content, the
phone user now reads the column as **"2 Payment · 1 Shipping · 3 Review"** — the badge numbers are
visibly **out of order (2 sits above 1)**, and the visual process order asserts you pay *before*
giving a shipping address. The process order is contradicted for its first two steps at exactly
one viewport.

## Attribute tuple
- **content-domain:** e-commerce product & checkout
- **UI-component/pattern:** multi-step wizard / progress stepper (APG-style ordered process)
- **host-language construct:** flexbox `order:` inside a `@media (max-width:600px)` query; the step
  numbers are static `<span class="step__num">` text hard-coded in each `<li>` (no CSS counter)
- **locale/i18n:** en (US)
- **failure-mechanism:** responsive `order:` reflow that reorders a meaningful sequence at one
  breakpoint (C27 "each order may be meaningful in itself but may cause confusion"; conditional
  variant of F1)

## Developer persona
An agency front-end dev customizing a themed storefront template. Marketing asked to "put the
payment step front and center on phones to reduce drop-off," so the dev added three `order:`
declarations inside the existing mobile media query rather than restructuring the markup. They
tested only the desktop layout against the design comp, saw the correct 1→2→3 left to right, and
shipped. They never resized to a phone to notice that the boxes now stack Payment-first and that
the hard-coded badges therefore read 2, 1, 3 down the column.

## Element / selector carrying the issue
`@media (max-width:600px) .step--payment { order:1 }` and `.step--shipping { order:2 }` on the
`<ol class="wizard">` items, which reverse the first two boxes when the wizard stacks vertically.
The hard-coded `.step__num` badges (1, 2, 3) do not move, so the swap surfaces as descending
badge numbers (2 above 1). The defect manifests ONLY below 600px.

## Exact accessibility mechanism (what AT experiences / why it fails)
This is a cross-state, viewport-conditional desync. (a) A **sighted mobile / screen-magnifier
user** sees the boxes stacked Payment → Shipping → Review, with the pinned badges reading 2, 1, 3
top-to-bottom — i.e. a presented sequence that puts Payment first and shows the step numbers out
of order, which is wrong and confusing for an order-dependent checkout. (b) A **screen-reader
user** reads the `<ol>` in DOM order — Shipping (1), Payment (2), Review (3) — i.e. the *correct*
sequence (the numerals are `aria-hidden`, so the SR conveys order purely through list/DOM
position). So a blind user on a phone and a sighted user on the same phone are looking at
contradictory step orders, the exact "working together, confused by different orders" harm C27
describes. (c) The visual order diverges from the meaningful source order at the tested viewport,
which is the core 1.3.2 violation: the order in which content is presented affects its meaning
(which step comes first), and at ≤600px a correct reading sequence is contradicted by the rendered
sequence. Per the Trusted Tester linearization check, toggling away CSS positioning yields the
source order Shipping→Payment→Review while the rendered mobile order is Payment→Shipping→Review —
they do not match.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The DOM order is the *correct* order, every list item is a valid labelled `<li>`, and the CSS
`order` property is legal. axe-core, WAVE, and Lighthouse evaluate a single rendered viewport, do
not diff rendered geometry across breakpoints, and have no concept that "Payment before Shipping"
changes meaning — they would need to render at ≤600px, recognize the steps are an order-dependent
sequence, and compare the visual order to the meaningful source order. The badge numbers are just
static text characters ("1", "2", "3"); an automated checker does not reason about them as a
sequence and so cannot see that they now read 2, 1, 3 down the column. This is precisely the human
semantic + multi-viewport judgment that no DOM-vs-visual tool running at one width can perform.

## Citation
> **WCAG Techniques, C27 — "Making the DOM order match the visual order":**
> "The order of content in the source code can be changed by the author to any number of visual
> presentations with CSS. Each order may be meaningful in itself but may cause confusion for
> assistive technology users."

(Verbatim from `wcag-techniques/css/C27.html`. The mobile `order:` reflow produces a second,
contradictory visual order of an order-dependent step sequence — the confusion C27 names.)

> **WCAG Understanding 1.3.2, Intent:**
> "A sequence is meaningful if the order of content in the sequence cannot be changed without
> affecting its meaning."

(Verbatim from `wcag-understanding/meaningful-sequence.html`. Checkout steps are such a
sequence; the breakpoint reorder changes which step is "first," affecting meaning.)
