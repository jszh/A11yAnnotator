# case-01 — Grid-area swap: "Shipping & returns" heading visually over the reviews block

## Scenario
A product-detail page for an outdoor-apparel store. Three panels — product
specifications, customer reviews, and shipping & returns — are laid out with CSS
`grid-template-areas` in a two-column grid. In the DOM the `<h2>` "Shipping &
returns" is immediately followed by the shipping text (DOM order: specs, reviews,
shipping). But the grid assigns the shipping panel to the **top-right** area, so on
screen the "Shipping & returns" heading renders directly above the **customer-reviews**
content. A sighted user reading top-to-bottom, left-to-right sees a "Shipping &
returns" heading sitting over five-star reviews — the visible heading does not
describe the content perceived beneath it.

## Attribute tuple
- **content-domain**: e-commerce — product detail page (outdoor apparel)
- **UI-component/pattern**: multi-panel product layout via CSS grid `grid-template-areas`
- **host-language construct**: `<section>` grid container with `grid-area` per `<article>`
- **locale/i18n**: en
- **failure-mechanism**: flat-tree vs. visual reading-order divergence via CSS grid area placement

## Developer persona
An agency themed a Shopify-style "Dawn"-like theme for a client. The original template
stacked the panels in one column. To "balance the page," the front-end dev introduced a
named-area grid and, mid-iteration, dragged the shipping panel into the top-right slot in
their design tool — which emitted `grid-area: shipping` on the markup that was still
DOM-adjacent to the shipping text. They never re-checked that the heading still sat over
the right content; the page "looked fine" because specs filled the tall left column.

## Element / selector carrying the issue
- FAIL: `#shipping h2` ("Shipping & returns") — rendered in the top-right grid cell,
  visually above `#reviews`, whose review content it does not describe.
- The reviews panel `#reviews` itself has **no heading** visible at its top, compounding
  the mis-orientation: a scanning user attributes the "Shipping & returns" heading to the
  reviews beneath it.

## Exact accessibility mechanism
A sighted user — and especially a low-vision user scanning by visual heading prominence,
or a screen-magnifier user who sees only a viewport region at a time — relies on the
**visible** spatial relationship between a heading and the content under it. Here the
"Shipping & returns" heading is rendered immediately above the reviews block, so the user
forms the wrong expectation ("these stars/quotes are about shipping") and cannot locate
shipping policy by scanning where it visually appears. The heading fails to describe the
topic of the content the user actually perceives beneath it (TT 10.A). A screen-reader
user navigating the flat tree, by contrast, hears the heading glued to the shipping text
and is unaffected — which is exactly why this is a rendered-order failure that the
flat-tree-only rule (b49b2e) does not catch.

## Expected ACT-style outcome
**failed** (a visible heading does not describe the content perceived under it once the
grid layout is rendered).

## Why automated tools miss it
axe-core, WAVE, and Lighthouse read the DOM / flat accessibility tree, where the
"Shipping & returns" `<h2>` is immediately followed by the shipping paragraph — a clean
heading-then-matching-content pair that passes every structural and "descriptive heading"
heuristic. They do not compute the rendered grid geometry, nor do they reason about
whether a heading describes the content a sighted user perceives below it. ACT rule
b49b2e explicitly orders elements "by the flat tree" and its Assumptions warn the rule
breaks precisely when "due to positioning, it is possible to render a document in an
order that greatly differs from the tree order." Detecting this requires rendering the
page, reading it visually, and making a semantic heading-to-content judgment — human work.

## Citation
> **ACT Rule b49b2e — Heading is descriptive (Assumptions)**
> "This rule assumes that the flat tree order is close to the reading order as elements
> are rendered on the page. Due to positioning, it is possible to render a document in an
> order that greatly differs from the tree order, in which case the content which is
> visually associated with a heading might not be the content following it in tree order
> and this rule might fail while Success Criterion 2.4.6 Headings and Label is still
> satisfied."

> **Trusted Tester v5.1.3 — Test 10.A (How to Test)**
> "For each visually identified heading, compare the heading text to the content beneath
> the heading."
