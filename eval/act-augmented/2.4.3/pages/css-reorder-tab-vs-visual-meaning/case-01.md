# case-01 — Checkout: flex `order` demotes the submit button visually but it is the first Tab stop

## Scenario
A single-page checkout for "Maple & Thread" (a homewares shop). The form is one flex
column. A sighted user reads top-to-bottom: order summary → **1. Quantity** → **2.
Shipping address** → **3. Payment** → and finally the big **"Place order & pay $48.00"**
button at the bottom. But the submit block is authored **first** in the DOM and pushed
to the visual bottom with `order:99`. There is **no positive tabindex and no
focus-managing script**, so the keyboard Tab order is exactly the DOM order: the very
first Tab stop is the irreversible **Place order** button — reached *before* Quantity,
Shipping, or Card details. A keyboard user who presses Tab once and Enter has submitted
an empty/partial order.

## Attribute tuple
- **content-domain:** e-commerce product & checkout
- **UI-component / pattern:** multi-section checkout form with a primary submit CTA
- **host-language construct:** CSS flexbox `order:99` on a DOM-first `<div class="place-order">`; no `tabindex`, no JS
- **locale / i18n:** en-US, USD
- **failure-mechanism:** visual order ≠ tab order — the operational sequence (fill fields *then* submit) is inverted for keyboard users; submit is the first focusable control

## Developer persona
A front-end dev was asked by the design team to "move the Place Order button to the
bottom like the mockup." Rather than reorder the markup, they reached for the quickest
CSS fix they remembered from a Stack Overflow answer — `order:99` on a flex child — and
left the button where it sat in the HTML (it had originally been near the top of an
earlier sticky-header design). The page *looks* identical to the mockup, QA clicked
through it with a mouse, and it shipped. Nobody tabbed through it.

## Element / selector carrying the issue
`form.checkout > div.place-order` — DOM-first, rendered last via `order:99`. Its child
`button[type="submit"]` is therefore the **first** element in the keyboard tab sequence,
ahead of `#qty`, the shipping inputs, and the payment inputs.

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Sighted mouse user:** sees and uses the natural sequence — fills the fields, scrolls
  down, clicks Place order. No problem perceived.
- **Sighted keyboard user / switch user:** presses Tab on page load. Focus lands on
  **"Place order & pay $48.00"** — the last thing they expected, the irreversible action,
  reached before a single field. The visual layout implies "submit is last"; the focus
  order says "submit is first." The hierarchy/relationship implied by the visual
  presentation (data entry precedes commit) is **not preserved**. This is the exact
  failure the Understanding describes: a focus order that "impedes the meaning or
  operation of content."
- **Screen-reader user navigating by Tab:** same — the first interactive stop is the
  commit button, then the form fields, which is illogical for a checkout.
- The sections themselves (`order:1/2/3`) are in the right relative order; the single
  out-of-place stop is the submit, which makes it a focused, realistic single-defect case.

## Expected ACT-style outcome
**failed** (SC 2.4.3). The focusable submit control receives focus in an order that does
not preserve the operability of the checkout — focus reaches the commit action before the
fields that must be completed.

## Why automated tools miss it
- There is **no positive `tabindex`** and **no script**, so F44 and every "positive
  tabindex" / "tab order" linter rule has literally nothing to flag.
- Every input has a programmatic `<label>`, every control has an accessible name, and
  contrast is fine — axe/WAVE/Lighthouse report zero issues.
- Both the DOM order and the CSS `order` value are individually valid. Deciding that the
  resulting tab order is *illogical* requires (1) rendering the page, (2) inferring from
  the visual layout that "Place order" is meant to be the final step, and (3) comparing
  that intended sequence to where Tab actually goes first. That comparison of rendered
  visual meaning vs. keyboard sequence is exactly the human judgment the Understanding
  flags — no static DOM scan models "submit should come after the fields."

## Citation
> "Focus order needs to allow the user to navigate focusable elements in a logical order, and that order needs to preserve any meaning or operation that the page is conveying. Focus order does not necessarily need to follow the visual layout of the web page, as long as the order in which elements receive focus is logical, and the hierarchy and relationship of content implied by the visual presentation is preserved."
— wcag-understanding/focus-order.html (Intent of Focus Order)

> "When the source order does not match the visual order, the tab order through the content must reflect the logical relationships in the content that are displayed visually."
— wcag-techniques/general/G59.html (Description)
