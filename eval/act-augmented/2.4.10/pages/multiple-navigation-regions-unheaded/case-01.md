# case-01 — Corporate site: top nav + left product nav + footer nav, none headed

## Scenario
A marketing landing page for "Northwind Robotics" (industrial automation) carries three
functionally distinct navigation regions:
1. a **top / primary** site nav in the masthead (Products / Solutions / About / Careers / Contact sales),
2. a **left / secondary** nav in the sidebar listing product sub-categories (Palletizing cells, Collaborative arms, Autonomous mobile robots, …), and
3. a **footer** nav of legal/utility links (Privacy / Terms / Accessibility statement / Sitemap / Cookie preferences / Contact us).

Each region is a real `<nav>` landmark, and the page has a single `<h1>` for the main
article. But **none of the three navigation regions has a heading**. A sighted user tells
the three apart instantly by their position and link contents; a screen-reader user
navigating by heading (the `H` key) hears only "Palletizing cells that pay for themselves
in 14 months" and has no heading-level way to distinguish main navigation from product
navigation from footer navigation.

## Attribute tuple
- **content-domain:** industrial automation / B2B manufacturing marketing site
- **UI-component / pattern:** classic three-region layout (top nav + left sidebar nav + footer link nav)
- **host-language construct:** three `<nav>` elements wrapping `<ul>` link lists; one `<h1>` in `<main>`
- **locale / i18n:** en-US
- **failure-mechanism:** H69 nav-demarcation sub-limb — multiple distinct navigational sections, NONE preceded/labelled by a section heading, so heading-navigation cannot tell them apart

## Developer persona
An agency built the site in a visual builder (Webflow) from a stock "SaaS / B2B" template.
The template ships the three navigation blocks pre-styled, and the builder emits `<nav>`
wrappers automatically — which the agency knew satisfied "landmark" best practice. They
added a single big `<h1>` to the hero for SEO and considered headings "done." Nobody on the
team navigates by heading, so the absence of a heading on any nav region was never noticed:
visually the three blocks are obviously separate, so it "looked accessible."

## Element / selector carrying the issue
- `header.top nav` (region 1, top/primary)
- `aside.side nav` (region 2, left/secondary)
- `footer.foot nav` (region 3, footer)

All three are `<nav>` landmarks with NO preceding/associated heading element. The only
heading in the document is `main article h1`, which labels the main content, not any of the
navigation sections.

## Exact accessibility mechanism (what AT experiences, why it fails)
- A sighted user perceives three visually distinct regions (top bar, left rail, dark footer)
  and reads the link text to know each region's purpose.
- A screen-reader user who pulls up the **headings list** (rotor / elements list) or presses
  `H` to move heading-to-heading finds exactly **one** heading — the article `<h1>`. The three
  navigation regions are invisible to heading navigation. The user cannot jump to "footer
  navigation" or "product navigation" by heading, and the headings list gives no sense that
  the page even contains multiple navigation sections.
- Per H69, heading markup should "demarcate different navigational sections like top or main
  navigation, left or secondary navigation and footer navigation." This page has exactly
  those distinct sections and demarcates none of them with a heading, so H69's test #2
  ("each section on the page starts with a heading") is false for every navigation section.

The defect is genuinely in the DOM: three heading-less `<nav>` elements; a real browser +
screen reader will really expose only one heading.

## Expected ACT-style outcome
**failed** (SC 2.4.10 — H69 nav-demarcation sub-limb: the page is organized into multiple
distinct navigation sections and provides a demarcating heading for none of them).

## Why automated tools miss it
Every navigation region is a valid `<nav>` landmark with non-empty, correctly-marked-up
links; the page has exactly one `<h1>`; there are no empty headings and no skipped levels.
axe-core (`page-has-heading-one`, `empty-heading`, `heading-order`, `landmark-unique`),
WAVE, and Lighthouse therefore all report no violation — and ACT rule 047fe0 ("document has
heading for non-repeated content") PASSES because the `<h1>` covers the non-repeated main
content. No automated checker can decide that three landmark navigation regions are
*genuinely distinct sections that each warrant its own demarcating section heading*; that
requires reading the link contents, recognizing that "Products/Solutions/About" (site nav),
"Palletizing cells/Collaborative arms" (product nav), and "Privacy/Terms/Sitemap" (footer
nav) are three different navigational purposes, and judging that a heading is needed to tell
them apart by AT. That is a whole-page semantic/structural judgment a human must make.

## Citation
> "to demarcate different navigational sections like top or main navigation, left or secondary navigation and footer navigation;"
— wcag-techniques/html/H69.html (Description — objective bullet list)

> "Check that the content is divided into separate sections. … Check that each section on the page starts with a heading."
— wcag-techniques/html/H69.html (Tests — Procedure)

> "The intent of this success criterion is to provide headings for sections of a web page, when the page is organized into sections. … When such sections exist, they need to have headings that introduce them. This clearly indicates the organization of the content, facilitates navigation within the content, and provides mental \"handles\" that aid in comprehension of the content. Other page elements may complement headings to improve presentation (e.g., horizontal rules and boxes), but visual presentation is not sufficient to identify document sections."
— wcag-understanding/section-headings.html (Intent of Section Headings)
