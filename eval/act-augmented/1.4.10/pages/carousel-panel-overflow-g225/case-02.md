# case-02 — Pricing carousel: one panel's two-column "Business vs Pro" text comparison overflows 320px

## Scenario
"Northwind Mail" presents a "Choose your plan" pricing carousel — a horizontally-scrolling strip
of plan panels. The STRIP scroll is the allowed carousel navigation (WCAG explicitly permits
it). Three plans (Starter, Pro, Enterprise) are clamped to `max-width:296px`, fit a 320 CSS px
viewport, and read top-to-bottom. The "Business" panel, however, embeds a side-by-side
**two-column** "Business vs Pro" feature comparison built as a flex row of two fixed `width:220px`
text columns (no per-column scroll container, no fluid sizing). The panel's own intro text wraps
fine, but the two columns together render ~454px wide, so at 320px that single panel's comparison
TEXT does not fit and forces a within-panel horizontal scrollbar to read the right column.

## Attribute tuple
- **Content domain:** SaaS / B2B software pricing (email & calendar service)
- **UI component / pattern:** pricing/plan carousel (horizontally-scrolling plan strip)
- **Host-language construct:** `overflow-x:auto` flex strip; panels `max-width:296px`; rogue panel
  contains `.compare { display:flex }` with two `.col { width:220px; flex:0 0 220px }` text columns
- **Locale / i18n:** en
- **Failure mechanism:** one panel embeds a side-by-side two-column TEXT comparison whose fixed
  columns total ~454px, exceeding 320 CSS px, requiring within-panel horizontal scrolling — and
  whose two-column layout is NOT essential to understanding (so no Reflow exception applies)

## Developer persona
A growth-marketing dev wanted the "Business" plan to drive upgrades, so they lifted the desktop
"Business vs Pro" comparison block straight into that one plan card. On desktop the two 220px
columns sat comfortably inside the wide card, so it shipped. They reused the marketing site's
fixed-width column markup rather than a responsive label/value layout, and never previewed the
card at a zoomed-in 320px viewport, where the two columns blow past the panel.

## Element / selector carrying the issue
`section.plan .compare` inside the second `section.plan` (the "Business" panel) — a
`display:flex` row of two `.col { width:220px; flex:0 0 220px }` text columns (~454px total).
The other three plan panels contain only a reflowing `ul.feat` list and conform.

## Exact accessibility mechanism
The carousel STRIP scroll is the intended, allowed navigation between plans. The failure is
per-panel and is plain TEXT, not media: at a 320 CSS px viewport the "Business vs Pro" comparison
is ~454px wide, so a low-vision user at ~400% zoom must scroll horizontally within that one panel
to read the Pro column's values — the two-direction reading the SC forbids for a section of
content. Crucially, this two-column comparison does NOT meet a Reflow exception. WCAG notes a
side-by-side comparison *can* pass, but only when "each column fits within a 320 CSS pixel wide
container" (these fixed 220px columns do not), and this is a simple feature checklist whose
meaning is preserved if the columns stack — unlike a code diff where same-horizontal-plane
alignment carries meaning. So the over-wide two-column block is a genuine within-panel reflow
failure. The three clamped panels reflow correctly, proving the carousel mechanism itself is fine.

## Expected ACT-style outcome
**failed** (SC 1.4.10). One panel of the horizontally-scrolling carousel contains a side-by-side
two-column text comparison that does not fit within 320 CSS px and whose layout is not essential,
so the panel requires two-dimensional scrolling to read that section.

## Why automated tools miss it
The markup is clean — valid lists, headings nest, links have text, no contrast issue — so
axe/WAVE/Lighthouse report nothing; `display:flex` with fixed-width columns is legal CSS. Reflow
at 320px is a rendered measurement no static analyzer performs; only laying the page out at 320px
and advancing the strip to the Business panel reveals the overflow. Even an overflow detector
would flag the allowed strip-level scroll and could not isolate that one PANEL's text overflows.
Above all, the load-bearing question — does this two-column comparison require two-dimensional
layout for understanding (exception, pass) or is it decorative text that should stack (fail)? — is
exactly the judgment WCAG assigns to a human evaluator. Here the answer is "not essential," so it
fails; recognizing that requires human semantic and visual judgment.

## Citation
**Reference:** WCAG 2.2 Understanding — Reflow, "Carousels and carousel-like widgets" (`wcag-understanding/reflow.html`)
> "Within vertically scrolling web pages, implementations of carousels can allow for horizontal scrolling of their content. As the carousel scrolls, a new carousel panel or panels are displayed within the visible viewport. As long as each individual panel within the carousel can fit within a 320 CSS pixel viewport, then a user need only scroll in a single direction to read an individual panel's content."

**Reference:** WCAG 2.2 Understanding — Reflow, "Two column presentation of editing changes" Pass (`wcag-understanding/reflow.html`)
> "Pass: An interface to review code/document changes provides a two-column comparison between the original and modified content. Each column fits within a 320 CSS pixel wide container and a horizontal scrollbar can be used to position each column into the visible viewport."

**Reference:** WCAG 2.2 Understanding — Reflow, carousel Fail figure (`wcag-understanding/reflow.html`)
> "Fail: In this modified version of the previous carousel, the second panel's content <strong>does not</strong> fit within the 320 CSS pixel viewport."
