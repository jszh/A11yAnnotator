# case-04 — Two "Buy now" links disambiguated only by visual alignment under $9 / $99 price blocks

## Scenario
A plant-care app's pricing page lays two plans side by side in a CSS grid: **Sprout
($9/mo)** and **Greenhouse ($99/mo)**. Each column ends in a **"Buy now"** link. The
links have the identical accessible name "Buy now"; each lives in its own bare grid
cell that contains **neither the plan name nor the price**. The price block sits in a
*separate* grid cell laid out visually above its button. The only thing telling a user
which plan a "Buy now" purchases is the **visual alignment** of the button under the
$9 or $99 column — a relationship conveyed purely by layout, not programmatically.

## Attribute tuple
- **content-domain:** consumer SaaS subscription / pricing table
- **UI-component / pattern:** two-column pricing cards with per-plan CTA (APG-style pricing layout)
- **host-language construct:** CSS Grid with price and CTA in *separate* grid cells; two `<a href="#checkout-…">Buy now</a>`
- **locale / i18n:** en-US, USD
- **failure-mechanism:** visual-only disambiguation — identical name, each link's own-cell context is bare and equally uninformative, and the distinguishing price is in a sibling cell positioned above; sighted users disambiguate by alignment, AT users cannot (matches fd3a94 Failed Example 4)

## Developer persona
A designer built the pricing section in a layout tool that emitted a CSS grid, placing
prices and buttons on their own rows so the two columns would align pixel-perfectly.
She used one reusable "Buy now" button component for both plans. Visually it is
flawless — every reviewer instantly knew the left button buys Sprout and the right
buys Greenhouse — so nobody questioned the duplicate label. The plan/price never made
it *into* the button or its DOM neighbourhood; the meaning lives entirely in the grid
geometry.

## Element / selector carrying the issue
`.buyrow.col1 > a.buy[href="#checkout-sprout"]` and
`.buyrow.col2 > a.buy[href="#checkout-greenhouse"]` — two `<a>` named "Buy now", each in
a grid cell that omits the plan name and price; the `$9` / `$99` blocks are in separate
`.price` cells.

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Sighted user:** sees "Buy now" sitting directly under "$9 · Sprout" or "$99 ·
  Greenhouse" and instantly knows which plan each commits to. The disambiguation is
  100% visual position.
- **Screen-reader user using a links list / rotor:** hears "Buy now, link / Buy now,
  link". Following each link's *programmatic* context (its own `.buyrow` cell) yields no
  plan and no price — the contexts are equally bare, so neither distinguishes the $9
  purchase from the $99 purchase. The price is in a sibling cell that is **not** in the
  link's sentence/paragraph/cell context, so it is not programmatically determined link
  context (the F63 trap).
- **Purpose judgment:** the two destinations are non-equivalent (a $9 plan vs a $99
  plan — different price, different feature set). Critically, the page **does** convey
  the difference to sighted users via alignment, so the "no visual information"
  exemption in fd3a94's expectation does **not** apply — which is exactly why it fails.

## Expected ACT-style outcome
**failed** (SC 2.4.4). Two links with identical accessible name and equally bare
context resolve to non-equivalent resources; the difference is conveyed only by visual
alignment, so AT users cannot determine each link's purpose from text + programmatic
context.

## Why automated tools miss it
- Both links have valid hrefs and identical non-empty names — `link-name` passes.
- The price and plan exist in the DOM, so no "missing text" rule fires; a tool cannot
  tell that the price is *visually* but not *programmatically* associated with each
  button (the association is grid position).
- Recognising that "alignment of the link with the price block above" is the *only*
  disambiguator — and that this is therefore a fail rather than a pass — requires
  rendering the layout and reasoning about visual spatial relationships, which static
  analysis and the accessibility tree do not capture.

## Citation
> "These two HTML a elements have the same accessible name and context, but go to different resources. Their purpose is disambiguated for sighted users by the alignment of the links with the images above."
— act-rules/extracted/fd3a94.md (Failed Example 4)

> "then the user will not be able to find out where the link is going with any ease. If the user must leave the link to search for the context, the context is not programmatically determined link context and this failure condition occurs."
— wcag-techniques/failures/F63.html (Description)
