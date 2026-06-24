# case-06 — Recipe carousel: one card's six-tile no-wrap "stats bar" drives that card past 320px

## Scenario
"Brambleway Kitchen", a recipe blog, shows "This week's picks" as a horizontally-scrolling
recipe carousel — a flex strip (`overflow-x:auto`) of recipe cards. The STRIP scroll is the
allowed carousel navigation. Each card reads top-to-bottom: hero image, title, blurb, then a
"stats bar" of small metric tiles. The card is sized BY its content (`width:max-content`) with
the image and the title/blurb block pinned to 280px, so a normal card is 280px wide and fits a
320 CSS px viewport. The stats bar is a flex row with `flex-wrap:nowrap` and tiles set
`flex:0 0 auto`, so its tiles never wrap and never shrink. Four cards carry four short tiles
(Prep / Cook / Serves / Cal), a ~280px row that fits. ONE card — "Slow-Braised Lamb Ragù" —
carries SIX tiles (Prep / Cook / Total / Serves / Cal / Level). Because that row cannot wrap,
it is ~428px wide, which (since the card sizes to its content) drives that single card to ~454px
— wider than the 320px viewport. When the user advances the carousel to that card, ~150px of it
sits off the right edge, so the last tiles and the blurb's right end can only be read by
scrolling horizontally within that one panel.

## Attribute tuple
- **Content domain:** food / recipe blog
- **UI component / pattern:** recipe carousel (horizontally-scrolling strip of recipe cards)
- **Host-language construct:** `overflow-x:auto` flex strip; cards `width:max-content` with a
  280px image + 280px `.head`; stats bar `.stats { display:flex; flex-wrap:nowrap }` with tiles
  `flex:0 0 auto`
- **Locale / i18n:** en
- **Failure mechanism:** a no-wrap flex "stats bar" whose tile COUNT is larger for one card, so
  that content-sized card grows past 320 CSS px and needs within-panel horizontal scrolling —
  and the stats bar is a plain linear set of facts, NOT an excepted 2-D table/grid

## Developer persona
A blog theme author built recipe cards whose width follows their content and added a tidy
single-line "stats bar" so the numbers always line up in a neat row (`flex-wrap:nowrap`). They
previewed the theme with the standard four metrics (prep, cook, serves, calories), where the row
is comfortably narrower than the card, and shipped. The defect surfaces only for a recipe that
populates the optional extra metrics (total time, difficulty): six tiles in a row that cannot
wrap push that one card wider than a zoomed-in viewport — a combination the author never
previewed at 320px.

## Element / selector carrying the issue
`article.recipe .stats` within the third card ("Slow-Braised Lamb Ragù"). Its six
`flex:0 0 auto` tiles in a `flex-wrap:nowrap` row total ~428px, and because the card is
`width:max-content`, that drives the whole card to ~454px — wider than the 320 CSS px viewport.
The other four cards' four-tile stats bars are ~280px and keep their cards at 280px, which fit.

## Exact accessibility mechanism
Strip-level horizontal scrolling is the intended, allowed navigation between recipe cards. The
failure is per-panel and content-dependent: at a 320 CSS px viewport, when the user advances the
carousel so the Ragù card's left edge is at the viewport start, the card extends ~150px past the
right edge. A low-vision user at ~400% zoom must therefore scroll horizontally WITHIN that one
panel to read the off-screen "Cal" and "Level" tiles (and the clipped end of the blurb) — the
two-direction reading the SC forbids. Crucially, the stats bar does NOT qualify for the Reflow
exception for "data tables and grids": it is a flat, one-line list of independent metrics whose
meaning survives wrapping onto two lines (unlike a true grid where a two-dimensional row/column
relationship carries meaning). So the over-wide panel is a real per-panel reflow failure, not an
excepted section. Allowing the stats row to wrap (`flex-wrap:wrap`) would let the card fit 320px
and pass.

## Expected ACT-style outcome
**failed** (SC 1.4.10). One panel of the horizontally-scrolling carousel is sized by a
non-wrapping stats bar to be wider than 320 CSS px, so that panel requires two-dimensional
scrolling to read while the sibling panels conform.

## Why automated tools miss it
The markup is valid — images have alt, headings nest, roles are correct, contrast is fine — so
axe/WAVE/Lighthouse report nothing; `flex-wrap:nowrap` with `flex:0 0 auto` is legal CSS.
Whether a card exceeds 320px depends on HOW MANY tiles that particular card has AT 320px — a
content-dependent rendered measurement no static analyzer performs. An overflow detector would
see the allowed strip scroll and, on hitting the wide card, could not decide the load-bearing
question: is this stats bar an excepted 2-D grid (pass) or a plain metric list that should wrap
(fail)? Distinguishing acceptable strip-level scroll from an over-wide single panel, and judging
that the stats bar is not excepted grid data, requires rendering at 320px, advancing to that
card, and human semantic/visual judgment.

## Citation
**Reference:** WCAG Technique G225 (`wcag-techniques/general/G225.html`)
> "Although the entire section requires horizontal scrolling to navigate between panels, each panel is designed to fit within a fixed width of 320 CSS pixels. This ensures that when a 320 CSS pixel wide viewport is used, and the card is in the viewport, each card will remain fully visible without the need for additional horizontal scrolling to read its content."

**Reference:** WCAG 2.2 Understanding — Reflow, "Carousels and carousel-like widgets" (`wcag-understanding/reflow.html`)
> "As long as each individual panel within the carousel can fit within a 320 CSS pixel viewport, then a user need only scroll in a single direction to read an individual panel's content."

**Reference:** WCAG 2.2 Understanding — Reflow, "Tabular data and grid-based UI" (`wcag-understanding/reflow.html`)
> "Data tables and grids have a two-dimensional relationship between column and row headers and their data cells. This success criterion therefore has exceptions for data tables and grids from needing to display without scrolling in the direction of text. However, individual cells would still need to meet Reflow - unless the cell contains content that also requires two-dimensional layout for usage or meaning."
