# case-05 — PASS control: a correctly-built "Top Stories" carousel where only the strip scrolls

## Scenario
"Riverside Civic News" presents a "Top Stories" horizontally-scrolling carousel. The STRIP
scrolls horizontally to move between story panels — which WCAG explicitly permits. Each of the
five story panels is clamped to `width:min(90vw,300px)`, all text uses `overflow-wrap:anywhere`
so even long words break, and each panel's only image is `width:100%`. At a 320 CSS px viewport
every panel fits and reads top-to-bottom; the user scrolls horizontally ONLY to change stories
(the carousel working), never to read within a panel. This is the boundary control: it must NOT
be failed merely because a horizontal scrollbar is present.

## Attribute tuple
- **Content domain:** news / civic editorial (local nonprofit newsroom)
- **UI component / pattern:** "top stories" horizontal news carousel (filmstrip of story cards)
- **Host-language construct:** `overflow-x:auto` flex strip; panels `width:min(90vw,300px)`;
  `overflow-wrap:anywhere` on headings/body; images `width:100%`
- **Locale / i18n:** en
- **Failure mechanism:** NONE — this is a conforming carousel; the only horizontal scroll is the
  allowed strip-level navigation between panels

## Developer persona
A newsroom developer who had previously been dinged for a fixed-width carousel rebuilt it
carefully: clamped panel widths with `min()`, forced long words to break, and made all media
fluid. They verified at 320px that each story fits before shipping. This page documents what
"done right" looks like so the aspect's pass boundary is sharp.

## Element / selector carrying the issue
None carries a violation. The relevant correct constructs are `.stories { overflow-x:auto }`
(allowed strip scroll) and `.story { width:min(90vw,300px) }` with `overflow-wrap:anywhere`,
which keep every panel within 320 CSS px.

## Exact accessibility mechanism
A low-vision user at ~400% zoom (≈320px viewport) sees one story panel at a time, reads it
top-to-bottom with vertical-only scrolling, and swipes the strip horizontally to advance to the
next story. The horizontal scroll is the carousel's intended navigation between panels, not
two-direction reading of a single section. Because each panel fits 320px and wraps its text,
no within-panel horizontal scrolling is ever needed — the SC is satisfied.

## Expected ACT-style outcome
**passed** (SC 1.4.10). The horizontally-scrolling carousel is designed so each panel fits
within 320 CSS px; the strip-level horizontal scroll is the allowed navigation between panels
and is not a Reflow failure.

## Why automated tools miss it
A naive "horizontal scrollbar present → Reflow fail" heuristic would FALSE-POSITIVE on this
perfectly conforming carousel. Confirming the actual pass condition — that each panel fits 320px
AND that the horizontal scroll is allowed strip-level navigation — is a rendered measurement at
320px combined with judgment about the widget's purpose, neither of which static analyzers
(axe/WAVE/Lighthouse) perform. The page is a control proving the evaluator must reason about
carousel intent rather than flag any horizontal scroll.

## Citation
**Reference:** WCAG 2.2 Understanding — Reflow, "Carousels and carousel-like widgets" (`wcag-understanding/reflow.html`)
> "Within vertically scrolling web pages, implementations of carousels can allow for horizontal scrolling of their content. As the carousel scrolls, a new carousel panel or panels are displayed within the visible viewport. As long as each individual panel within the carousel can fit within a 320 CSS pixel viewport, then a user need only scroll in a single direction to read an individual panel's content."

**Reference:** WCAG 2.2 Understanding — Reflow, carousel Pass figure (`wcag-understanding/reflow.html`)
> "Pass: A carousel presents different panels of teaser content about homes for sale. The carousel container scrolls horizontally, independent of the vertical scrolling of the primary web page. Each individual panel within the carousel is designed to be read vertically... When enlarged, each panel can fit within the 320 CSS pixel viewport."

**Reference:** WCAG 2.2 Understanding — Reflow, "Content that can benefit from two-dimensional layout" (`wcag-understanding/reflow.html`)
> "Nor does it require all sections of content scroll in a single direction, so long as each can be read without two-dimensional scrolling to read the lines of text they present."
