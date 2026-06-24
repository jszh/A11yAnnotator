# case-01 — Fixed-width 680px article container forces page-level horizontal scroll at 320px

## Scenario
A small food-writing publication ("Cadence Kitchen Journal") renders a long-form essay. The masthead
and footer are fluid. The article body, however, is pinned to `width: 680px` so it keeps a pleasant
reading measure on desktop. Nothing in the article is two-dimensional — it is plain prose with a
blockquote — yet the fixed width means that at a 320 CSS-px viewport the whole page acquires a
horizontal scrollbar and every line of text runs off the right edge.

## Attribute tuple
- **Content domain:** news / long-form editorial (independent food publication)
- **UI component / pattern:** single-column article body inside `<main>`
- **Host-language construct:** `.article { width: 680px; margin: 28px auto }` (fixed px width, not max-width)
- **Locale / i18n:** en (LTR horizontal language → 320 CSS-px requirement applies)
- **Failure mechanism:** fixed-width container; non-excepted prose cannot reflow below 680px

## Developer persona
A designer-turned-blogger learned typography from a print background where a fixed measure is sacred.
They set `width: 680px` on the article "so the line length stays in the sweet spot" and tested only on
their 27-inch monitor. They never set `max-width`, never zoomed to 400%, and never opened the page on a
phone in landscape-to-portrait. The masthead and footer use percentage padding and looked fine, which
reassured them the page was "responsive."

## Element / selector carrying the issue
`main .article` — the `width: 680px` declaration. (Contrast anchors: `.masthead` and `.sitefoot`, which
are fluid and would reflow correctly on their own.)

## Exact accessibility mechanism
At a viewport equivalent to 320 CSS px (1280px zoomed to 400%), the 680px article cannot shrink, so
`document.scrollWidth` exceeds the viewport and the browser shows a horizontal scrollbar. A low-vision
user who has zoomed in must now scroll left-and-right to read every single line of body copy — exactly
the back-and-forth, place-losing motion Reflow exists to prevent. The content is ordinary running prose
with no table, map, graphic, or fixed-dimension media, so no Reflow exception applies. The fix is a
one-token change (`max-width: 680px` plus a fluid `width`), but as written the page fails.

## Expected ACT-style outcome
**failed** (SC 1.4.10). Note: ACT rule b4f0c3 (viewport meta) PASSES here because zoom is permitted —
the failure is purely in the rendered layout, which b4f0c3 never inspects.

## Why automated tools miss it
axe-core, WAVE, and Lighthouse do not render the page at a 320 CSS-px viewport and do not measure
`scrollWidth > clientWidth`. b4f0c3, the only ACT rule mapped to 1.4.10, is a pure string check of the
viewport `content` attribute and reports pass. Even a tool that DID detect page overflow could not, on
its own, decide that the overflowing element is non-excepted prose (a genuine failure) rather than a
data table or media (a legitimate exception). Classifying the 680px block as "prose that should reflow"
is the human judgment.

## Citation
**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "The intent of this success criterion is to let users enlarge text and other related content without having to scroll in two dimensions to read. When lines of text extend beyond the edge of a viewport, users will be forced to scroll back-and-forth to read line by line. This can cause them to lose their place and can significantly increase both physical and cognitive effort."

**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "This criterion requires non-excepted sections of content that are written in horizontal languages reflow when narrowed to a width equivalent to 320 CSS pixels."

**Reference:** EN 301 549 Annex C, C.9.1.4.10 (`docs/analysis/en301549/EN301549-ANNEX-C-RELEVANT-CLAUSES.md`)
> "Type of assessment   Inspection ... Procedure  1. Check that the web page does not fail WCAG 2.2 Success Criterion 1.4.10 Reflow according to WCAG Conformance Requirements stated in clause 9.6."
