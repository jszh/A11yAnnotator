# case-03 — Three footer "Details" links, each alone in its own list item

## Scenario
A restaurant site's footer has a "More" column listing three links, each named only
**"Details"**, each in its own `<li>`. They go to three different pages (menu, private
events, gift cards), but no text inside any list item — the link's programmatically
determined context — distinguishes them. A screen-reader user hears "Details, Details,
Details."

## Attribute tuple
- **content-domain**: restaurant menu & ordering (independent eatery site)
- **UI-component/pattern**: footer link column (three list items)
- **host-language construct**: `<ul><li><a>` with the link as the entire list-item content
- **locale/i18n**: en
- **failure-mechanism**: generic name repeated across siblings with no distinguishing in-context text; the only differentiator (the destination topic) is neither in the `<li>` nor programmatically associated

## Developer persona
A freelance designer themed a generic restaurant template in Figma and handed dev a footer
mock that used a small grey "Details" link under each footer item to look tidy and uniform.
The developer wired each "Details" to its real page but kept the repeated label because the
mock demanded visual consistency ("they all need to say the same thing or the column looks
ragged"). The uniform look came at the cost of distinguishable link purpose.

## Element / selector carrying the issue
- FAIL: `.col:last-child ul li a` — three links, accessible name "Details", hrefs `/menu`,
  `/private-events`, `/gift-cards`.

## Exact accessibility mechanism
On the Links List, a screen-reader user sees/hears three identical "Details, link" entries
with no way to choose. Tabbing through the footer gives the same: "Details, link… Details,
link… Details, link." Each link's programmatically determined context is its own `<li>`,
whose entire content is the word "Details" — so there is no same-list-item text to supply
purpose, and there is no `aria-label`/`aria-labelledby`/`aria-describedby`. The visual
"More" heading is not programmatic link context (it is in a sibling element, not the list
item), so it cannot rescue the links. The user cannot determine which "Details" leads to
the menu versus private events versus gift cards.

## Expected ACT-style outcome
**failed** — the purpose of each link cannot be determined from its text plus its
programmatically determined context.

## Why automated tools miss it
Every link has the non-empty accessible name "Details", so ACT c487ae and axe's
`link-name` rule PASS. Some tools detect "identical link text → different destinations" and
may emit a soft warning, but that signal is neither necessary nor sufficient for a 2.4.4
failure: WCAG explicitly permits repeated link text when context disambiguates (the
Understanding "PDF / mp3" book-list example). The actual verdict depends on whether each
link's *own list item* supplies purpose — here it does not — which only a human reading the
in-context text can decide.

## Citation
> **Trusted Tester v5.1.3 — SC 2.4.4 (Test 6.A)**
> "'Programmatically determined link context' is limited to same
> sentence/paragraph/list-item/table-cell or associated table header — not arbitrary nearby
> text."

> **WCAG 2.2 Understanding 2.4.4 — Intent**
> "This can be achieved by putting the description of the link in the same sentence,
> paragraph, list item, or table cell as the link, or in the table header cell for a link in
> a data table, because these are directly associated with the link itself."
