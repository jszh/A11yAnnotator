# case-01 — Product carousel: one 420px "bundle" promo card overflows 320px while every other card fits

## Scenario
"Highland & Field", an outdoor-gear retailer, ships a homepage "Trending This Week" section
built as a horizontally-scrolling product carousel (a flex strip with `overflow-x:auto`).
Four product cards are a tidy `width:300px` and read top-to-bottom. The agency added a
featured "Trail Pack Bundle — Save 25%" promo card and, to make it stand out, hard-coded it
to `width:420px` with a 396px-wide hero image and a no-wrap "$189.00 • You save $61 vs.
buying separately" price row. On a desktop it just looks like an eye-catching featured card.
At a 320 CSS px viewport that one panel cannot fit and forces a SECOND, in-panel horizontal
scrollbar — the user must scroll horizontally to finish reading that single panel.

## Attribute tuple
- **Content domain:** e-commerce (outdoor gear retail)
- **UI component / pattern:** APG carousel / horizontally-scrolling product card strip
- **Host-language construct:** `display:flex; overflow-x:auto` strip; cards `flex:0 0 auto`;
  rogue card `width:420px` with `width:396px` inner `<img>` and `white-space:nowrap` price row
- **Locale / i18n:** en
- **Failure mechanism:** one panel sized wider than 320 CSS px (fixed-px card + fixed-px inner
  media + no-wrap text) so that single carousel panel needs within-panel horizontal scrolling

## Developer persona
An agency themed a Shopify-style storefront. A marketing manager asked for the bundle to "be
bigger and pop" in the trending row, so the agency front-end dev bumped that one card to 420px
and dropped in a wider promo photo, without considering that the carousel must still let each
panel be read with vertical-only scrolling at 320px. The QA pass was done at desktop width,
where the wider card simply reads as "featured".

## Element / selector carrying the issue
`article.card.promo` (the "Trail Pack Bundle" panel) — `width:420px`, containing
`img.feature` at `width:396px` and `.pricerow` with `white-space:nowrap`. Every sibling
`article.card` is `width:300px` and conforms.

## Exact accessibility mechanism
The carousel STRIP scrolling horizontally is the intended, allowed navigation between panels
(WCAG explicitly permits this). The failure is per-panel: when the viewport is 320 CSS px and
the user advances the strip to the promo card, that panel is 420px wide — wider than the
viewport — and its 396px image plus the no-wrap price/save line cannot fit either. A low-vision
user at 400% zoom (≈320px viewport) now has to scroll horizontally back-and-forth WITHIN this
one panel to read its price and savings, which is exactly the two-direction reading the SC
forbids for a section of content. The four `width:300px` cards do not exhibit this — they fit
and read top-to-bottom — proving the carousel mechanism itself is fine.

## Expected ACT-style outcome
**failed** (SC 1.4.10). One section panel in the horizontally-scrolling carousel is not
designed to fit within 320 CSS px, so it requires two-dimensional scrolling to read.

## Why automated tools miss it
The DOM is clean: every image has alt, headings nest, list roles are valid, contrast passes —
naive axe/WAVE/Lighthouse checks all PASS. Reflow is a rendered-layout property at a specific
viewport; static analyzers never lay the page out at 320px and measure per-panel width. Even an
overflow-measuring tool would detect overflow on the STRIP, which is allowed (the carousel
working), and could not tell that one PANEL is the violation. Distinguishing "acceptable
strip-level horizontal scroll (navigation)" from "unacceptable within-panel horizontal scroll
(over-wide panel)" requires interpreting the widget's purpose and inspecting each panel
individually at 320px — human semantic and visual judgment.

## Citation
**Reference:** WCAG 2.2 Understanding — Reflow, "Carousels and carousel-like widgets" (`wcag-understanding/reflow.html`)
> "As long as each individual panel within the carousel can fit within a 320 CSS pixel viewport, then a user need only scroll in a single direction to read an individual panel's content."

**Reference:** WCAG 2.2 Understanding — Reflow, carousel Fail figure (`wcag-understanding/reflow.html`)
> "Fail: In this modified version of the previous carousel, the second panel's content <strong>does not</strong> fit within the 320 CSS pixel viewport."

**Reference:** WCAG Technique G225 (`wcag-techniques/general/G225.html`)
> "Although the entire section requires horizontal scrolling to navigate between panels, each panel is designed to fit within a fixed width of 320 CSS pixels."
