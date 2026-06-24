# case-01 — Product grid where every card heading reads "Product"

## Scenario
A houseplant e-commerce listing page ("Fernwell") shows six product cards in a 3-column grid. Each card has a thumbnail, a `<h3>` heading, the species name, care metadata, price, and an "Add to cart" link. Every one of the six `<h3>` headings reads the single word **"Product"**. The actual differentiator — "Monstera deliciosa", "Snake plant", "ZZ plant", etc. — lives in a `<span class="name">` in the card body, NOT in the heading. A sighted user reads the body and instantly tells the cards apart; a screen-reader user navigating by heading hears "Product" six times.

## Attribute tuple
- **content-domain:** e-commerce product listing / collection page
- **UI-component / pattern:** product card grid (repeating CMS component)
- **host-language construct:** `<article>` cards each with an `<h3>` heading + body `<span>`s
- **locale / i18n:** en-US
- **failure-mechanism:** relational/uniqueness failure of G130 — each heading is individually plausible (each card IS a product) but the SET of sibling headings is undifferentiated, so the generated heading list and heading-to-heading navigation give no orientation

## Developer persona
A front-end developer wired a Vue `<ProductCard>` component to the storefront's CMS. The CMS feed exposes `card.type` (always the literal string `"Product"`) and `card.title` (the species). The developer bound the prominent `<h3>` to `card.type` — reasoning "the heading labels what KIND of thing the card is" — and rendered `card.title` as a styled sub-line. It looked fine in the visual design review because the species name is clearly visible, so nobody noticed the heading itself never changes.

## Element / selector carrying the issue
`main .grid .card h3` — all six instances. Each contains the identical text node "Product"; the disambiguating species name is in the adjacent `span.name`, which is NOT a heading and is not part of the heading text.

## Exact accessibility mechanism (what AT experiences, why it fails)
- A sighted user scans the grid and reads each species name next to the heading; the cards are trivially distinguishable.
- A screen-reader user who opens the rotor/elements list of headings, or presses `H` / `3` to move heading-to-heading, hears: "heading level 3, Product … heading level 3, Product … heading level 3, Product …" six times. The heading list — exactly the orientation aid SC 2.4.6 exists to support — conveys zero differentiation between products.
- Per G130, descriptive headings must identify their section "in relation … to other sections of the same web page." Each "Product" heading fails that relational test: it does not distinguish its card from the five siblings. The species name being present elsewhere in the card does not rescue the heading, because the heading text is what populates the heading list.

The defect is genuinely in the DOM: six `<h3>` elements all contain the text "Product"; a browser + screen reader will really announce them identically.

## Expected ACT-style outcome
**failed** (SC 2.4.6 — heading limb / TT 10.A: the heading does not adequately describe/distinguish its section relative to sibling sections; G130 relational requirement not met).

## Why automated tools miss it
Every heading is present, non-empty, correctly nested (h1 → h2 → h3), and carries a valid heading role, so axe-core (`empty-heading`, `heading-order`, `page-has-heading-one`), WAVE, and Lighthouse all report no violation. The string "Product" is a real English word that does describe the card. No automated checker performs the cross-element comparison ("are these six sibling headings mutually distinguishable, and would the generated heading list orient a user?") — that requires reading all six cards, understanding that the species name is the true differentiator, and judging that the chosen heading text collapses the distinction. That is human semantic judgment over the whole page.

## Citation
> "Descriptive headings identify sections of the content in relation both to the web page as a whole and to other sections of the same web page."
— wcag-techniques/general/G130.html (Description)

> "Authors may also want to consider putting the most important information at the beginning of each heading. This helps users \"skim\" the headings to locate the specific content they need, and is especially helpful when browsers or assistive technology allow navigation from heading to heading."
— wcag-techniques/general/G130.html (Description)

> "When headings and labels are also correctly marked up and identified in accordance with 1.3.1 Info and Relationships, this success criterion helps people who use screen readers by ensuring that labels and headings are clearer when presented in a different format — for example, in an automatically generated list of headings, a table of contents, or when jumping from heading to heading within a page."
— wcag-understanding/headings-and-labels.html (Benefits of Headings and Labels)
