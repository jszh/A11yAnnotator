# case-05 — Product grid: "View" link is a sibling `<div>` of the description `<div>`, not in it

## Scenario
An outdoor-gear e-commerce category page ("Trailhead Outfitters — Day Packs"). Each product card is
a flex column: a colored swatch, an `.info` block (product name, blurb, price), and a separate
`.action` block holding a green "View" button link. Visually the card reads top-to-bottom as one
unit, but the product name and the link are in two different sibling `<div>`s. Every link's
accessible name is just "View".

## Attribute tuple
- **content-domain:** e-commerce product listing (retail)
- **UI-component/pattern:** product/listing card grid with a separate full-width "View" CTA block
- **host-language construct:** `<div class="info">` (name + blurb + price) and a sibling `<div class="action">` containing the `<a>` — no shared block, no ARIA association
- **locale/i18n:** en
- **failure-mechanism:** F63 — describing content is in a different programmatic container (a sibling `<div>`) that the user would assume is associated because it is visually adjacent

## Developer persona
A storefront-theme developer building reusable card components split each card into independently
stylable regions (`.swatch`, `.info`, `.action`) so the CTA could be pinned to the card bottom with
`margin-top:auto`. The button text is the theme's default "View". Because the design system treats
the card as the unit, nobody thought the *link* needed the product name — the name is "right there"
in the card. No `aria-label`, no `aria-labelledby`, and the `<a>` wraps neither the name nor the card.

## Element / selector carrying the issue
Each `.card .action > a` (hrefs `/p/summit-22`, `/p/trace-14`, `/p/basin-30`), accessible name
"View". The product name lives in `.card .info .name`, a separate sibling `<div>` — not the link's
sentence, paragraph, list item, table cell, or associated header, and not referenced by any ARIA
property on the link.

## Exact accessibility mechanism (what AT experiences, why it fails)
A screen-reader user navigating the Links list, or tabbing card to card, hears "View, link / View,
link / View, link" — no product names. The card is a plain `<div>` with no list semantics, no
heading inside the link, and no `aria-labelledby` pointing the `<a>` at `.name`. So the link's
programmatically determined context is empty: its own `<div class="action">` contains only the word
"View". The product name in the neighboring `.info` div is visually associated (proximity, shared
card border) but programmatically unrelated — the very "visually-adjacent siblings a person would
assume are associated" trap. To find out which product "View" buys, the user must leave the link and
explore the sibling div: F63.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
Each link has a non-empty accessible name ("View"), a valid unique href, good contrast, and lives in
well-formed markup — axe-core/WAVE/Lighthouse pass it. There is no list-vs-div rule that fires, and
no tool reasons that the visually-adjacent product name is in a *different* `<div>` and is therefore
not the link's programmatic context. Catching it requires knowing that visual proximity is not
programmatic association and that "View" alone is non-descriptive — semantic/visual judgment, not a
linter check. (This is the sibling-`<div>` product-grid variant the corpus does not exercise; the
W3C F63 fixtures only cover adjacent paragraphs and layout-table cells.)

## Citation
> **WCAG Technique F63 — Description:**
> "This describes a failure condition when the context needed for understanding the purpose of a link is located in content that is not programmatically determined link context. If the context for the link is not provided in one of the following ways: in the same sentence, paragraph, list item, or table cell as the link; via a suitable ARIA property such as `aria-label` or `aria-labelledby`…"

(Verbatim from `wcag-techniques/failures/F63.html`. The product name is in a sibling `<div>`, none of the listed forms, and no ARIA property is used.)

> **WCAG 2.2 Understanding — Understanding Link Purpose (In Context), Intent (exception clause):**
> "…whatever amount of context is available on the web page that can be used to interpret the purpose of the link must be made available in the link text or programmatically associated with the link to satisfy the success criterion."

(Verbatim from `wcag-understanding/link-purpose-in-context.html`. The product name is available on the page but is neither in the link text nor programmatically associated.)
