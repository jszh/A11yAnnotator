# case-04 — Two sibling carousels: a clamped-vw rail passes, a fixed-380px rail fails (same-page contrast)

## Scenario
"Maple & Stone Realty" shows two horizontally-scrolling listing carousels built from the same
component, one above the other. "Just Listed" (`.good`) clamps every panel to
`width:min(86vw,300px)`, so at a 320 CSS px viewport each panel fits and reads top-to-bottom —
this rail PASSES. "Luxury Collection" (`.lux`) overrides the panel width to a fixed `380px` to
show larger hero photos, so at 320px EVERY panel in that rail overflows and needs an in-panel
horizontal scrollbar — this rail FAILS. Both rails legitimately scroll horizontally at the
strip level. The page as a whole is FAILED because the luxury rail's panels don't fit 320px;
the evaluator must NOT flag either strip-scroll and must pass the first rail while failing the
second.

## Attribute tuple
- **Content domain:** real-estate listings
- **UI component / pattern:** two sibling carousels / horizontal listing rails (same component)
- **Host-language construct:** shared `.rail{overflow-x:auto}`; passing panels
  `width:min(86vw,300px)`; failing panels overridden to `.lux .listing{width:380px}`
- **Locale / i18n:** en
- **Failure mechanism:** the second carousel's panels are fixed wider than 320 CSS px, so every
  panel there requires within-panel horizontal scrolling, while the first carousel's clamped
  panels fit — a same-page pass/fail contrast on the identical widget

## Developer persona
A front-end dev built one reusable carousel that clamps panel width responsively (it works). A
visual designer later asked for the luxury homes to "feel grander" with bigger photos, and added
a one-line theme override (`.lux .listing { width:380px }`) to enlarge those panels. The
override was reviewed only at desktop width, where 380px panels look premium; nobody checked the
luxury rail at 320px, where the fixed width breaks per-panel reflow.

## Element / selector carrying the issue
`.lux .listing` (the three panels of the "Luxury Collection" rail) — `width:380px`, wider than
320 CSS px. The contrast control is `.good .listing { width:min(86vw,300px) }` (the "Just
Listed" rail), which conforms. The shared `.rail { overflow-x:auto }` strip-scroll is allowed
on both and must not be flagged.

## Exact accessibility mechanism
Strip-level horizontal scrolling on both rails is the intended, allowed carousel navigation. In
the "Just Listed" rail, each panel clamps to ≤300px, so at a 320px viewport a low-vision user
reads each home top-to-bottom with vertical-only scrolling — pass. In the "Luxury Collection"
rail, each panel is a fixed 380px, so at 320px every panel exceeds the viewport and the user
must scroll horizontally within each panel to read its price, address, and stats — the
two-direction reading the SC forbids. The only difference is one CSS width value and its effect
at 320px; the same-page contrast isolates that the violation is the fixed panel width, not the
carousel mechanism.

## Expected ACT-style outcome
**failed** (SC 1.4.10). One of the page's two horizontally-scrolling carousels has panels that
do not fit within 320 CSS px, requiring two-dimensional scrolling to read those sections;
the page fails even though the sibling carousel conforms.

## Why automated tools miss it
Both rails are valid, well-formed markup that look identical to a static parser; alt text and
headings are present, so axe/WAVE/Lighthouse report nothing. Reflow at 320px is a rendered
measurement no static tool computes, and the sole difference is a CSS width
(`min(86vw,300px)` vs `380px`) whose consequence only appears AT 320px. An overflow detector
would see horizontal scroll on BOTH strips (allowed carousel behavior) and could not tell that
one carousel's panels fit while the other's don't — that requires rendering at 320px and judging
each carousel's panels individually, i.e. human visual judgment.

## Citation
**Reference:** WCAG Technique G225 (`wcag-techniques/general/G225.html`)
> "Although the entire section requires horizontal scrolling to navigate between panels, each panel is designed to fit within a fixed width of 320 CSS pixels. This ensures that when a 320 CSS pixel wide viewport is used, and the card is in the viewport, each card will remain fully visible without the need for additional horizontal scrolling to read its content."

**Reference:** WCAG 2.2 Understanding — Reflow, "Understanding the scope of exceptions" (`wcag-understanding/reflow.html`)
> "When a section of content is excepted from Reflow, the exception does not automatically extend to other content that doesn't need two-dimensional scrolling for understanding or functionality."

**Reference:** WCAG 2.2 Understanding — Reflow, "Carousels and carousel-like widgets" (`wcag-understanding/reflow.html`)
> "As long as each individual panel within the carousel can fit within a 320 CSS pixel viewport, then a user need only scroll in a single direction to read an individual panel's content."
