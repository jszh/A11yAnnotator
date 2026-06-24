# case-01 — Investigation "Continue reading" rail of eight unique related-story links is display:none below 600px and exists nowhere else (FAIL)

## Scenario
A long-form coastal-news investigation ("The Tidemark Review") presents the article in the main
column and, in a sticky right-hand rail headed "Continue this investigation," eight hand-curated
links to the other pieces in the same investigative thread (the 2024 disposal dispute, the
contractor-overruns timeline, the sub-committee minutes, the sediment data, the editorial, etc.).
Those eight links appear ONLY in that rail. At `max-width:600px` the page collapses to a clean single
column — the article reflows perfectly, no horizontal scroll, viewport meta is permissive — but the
rail is removed with `display:none` and the eight links are reproduced nowhere else: no "More stories"
disclosure, no link to a section index, no inline list inside the article. On a phone, or at 400% zoom,
the follow-up investigation is unreachable.

## Attribute tuple
- **Content domain:** news / long-form investigative editorial
- **UI component / pattern:** sticky sidebar "related content" rail (`<aside>` + `<ul>` of links)
- **Host-language construct:** CSS grid two-column layout collapsed by a `@media (max-width:600px)` rule that sets `display:none` on the aside
- **Locale / i18n:** en-GB (£, DD Month YYYY date style)
- **Failure mechanism:** unique navigational content hidden at narrow width with no equivalent disclosure/link/duplicate

## Developer persona
A small newsroom's part-time front-end developer themed the site from a generic "magazine" CSS-grid
starter. The starter's responsive rule hides the sidebar on mobile "to declutter," a pattern they
copied without thinking about whether the sidebar held anything unique. Because the topnav genuinely
is duplicated in the footer, hiding *it* on mobile is harmless — and that harmless precedent made the
developer assume hiding the whole sidebar was equally safe. It was not: the "Continue this
investigation" links live only in the rail.

## Element / selector carrying the issue
`aside.rail` (selector `aside.rail`, inside `.wrap`) — specifically the `@media (max-width:600px)`
rule `aside.rail { display: none; }`. The dropped content is the eight `<a>` elements under
`aside.rail ul li`. The footer nav is the *decoy* equivalent — it duplicates only the four section
links, not the eight unique story links.

## Exact accessibility mechanism
At ≥601px the eight related-investigation links are visible, focusable, and in the reading order — a
low-vision user who zooms can reach them. The moment the viewport reaches 320px (a phone, or 400%
zoom on a 1280px window per the SC's reference relationship), `display:none` removes the entire `aside`
from the rendering AND the accessibility tree, so a screen-reader user navigating the reflowed page
never encounters those links and a keyboard user can never Tab to them. Because the same links are not
repositioned into the single column, not behind a disclosure, and not reachable by any other view, the
narrow rendering has strictly less information and functionality than the wide one. That is exactly the
F102 failure: content available at a wider width is not available after reflow to 320px.

## Expected ACT-style outcome
**failed** (SC 1.4.10). Content present at 1280px is absent at 320px with no equivalent mechanism.

## Why automated tools miss it
axe-core, WAVE, and Lighthouse evaluate a single static DOM snapshot. The eight links are well-formed
`<a href>` elements with descriptive text, so they pass link-name, focus-order, and in-DOM checks at
every width. No automated tool renders the page at two widths, computes which interactive content
remains reachable at 320px, and reasons that these specific links exist in no other location.
`display:none` inside a media query is one of the most common, legitimate responsive idioms on the web
— flagging every occurrence would be pure noise — so tools deliberately do not. Deciding that *this*
hidden block was unique and unreplaced requires a human to diff the wide and narrow renderings and
judge that no equivalent surfaces the dropped links.

## Citation
**Reference:** WCAG Technique F102 (`wcag-techniques/failures/F102.html`)
> "This content, however, should still be available after reflow to 320px viewport width, either by being repositioned in a single column view, or through some interaction offering the information in some other way, for example, in a disclosure area, a dialog, or via a link to another view."

**Reference:** WCAG Technique F102 — Examples (`wcag-techniques/failures/F102.html`)
> "A block of blog entry links in a side column disappears entirely after reflow (i.e., it is not available further down in the single column view)."
