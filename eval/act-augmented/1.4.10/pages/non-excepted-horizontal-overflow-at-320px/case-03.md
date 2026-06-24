# case-03 — `body { min-width: 600px }` clamps the whole page; it can never reflow below 600px

## Scenario
A public-library FAQ page. Every layout rule is fluid — percentage padding, `max-width: 760px` on the
content, native `<details>` accordions. But one line in the global reset sets `min-width: 600px` on
`<body>`. That floor overrides everything: no matter how far a user zooms, the page body cannot get
narrower than 600px, so at a 320 CSS-px viewport the page scrolls horizontally. The content is a plain
FAQ — nothing two-dimensional.

## Attribute tuple
- **Content domain:** government / civic services (county public library)
- **UI component / pattern:** disclosure accordion (`<details>`/`<summary>`) FAQ
- **Host-language construct:** `body { min-width: 600px }` global floor
- **Locale / i18n:** en (LTR)
- **Failure mechanism:** body/wrapper min-width prevents reflow at any zoom

## Developer persona
A government-IT contractor inherited a CSS reset from a 2014 internal boilerplate that included
`body { min-width: 600px }` — added years ago "so the old fixed-width layout didn't collapse." When the
site was modernized to fluid widths, nobody removed the floor; it sat harmlessly because every test
device was wider than 600px. The page genuinely uses `max-width` and percentages everywhere else, which
makes the survivor `min-width` easy to miss in review.

## Element / selector carrying the issue
`body { min-width: 600px }` — a single declaration. It is especially insidious because the rest of the
stylesheet is correctly responsive, so the page "looks responsive" right up until the viewport drops
below 600px.

## Exact accessibility mechanism
A `min-width` on the document root sets a hard lower bound on layout width. At a viewport of 320 CSS px
the body stays 600px wide and `scrollWidth` exceeds `clientWidth`, producing a page-level horizontal
scrollbar. A magnifier user reading the FAQ must scroll horizontally for every answer. None of the
content (an accordion of short prose answers) requires a two-dimensional layout, so no exception applies.
The remedy is to delete the floor or scope it behind a min-width media query; as written it fails.

## Expected ACT-style outcome
**failed** (SC 1.4.10). b4f0c3 (viewport meta) passes — the failure is the CSS floor, which b4f0c3 never
reads.

## Why automated tools miss it
Linters and axe-core have no rule against `min-width` on `body`; it is valid CSS and often legitimate.
Detecting the failure requires rendering at 320 CSS px and measuring overflow — which static scanners do
not do — and then judging that the clamped content is reflowable FAQ prose rather than an excepted
two-dimensional section. That classification is human.

## Citation
**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "Content can be enlarged without increasing line length." / "Make lines of text reflow within the viewport." / "People who need bigger text find it difficult if they must scroll to read long lines."

**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "When content can fit within smaller viewports it not only helps those using mobile devices to read content. It also helps people who need to resize or zoom in a web interface on larger devices, as is the intent of this success criterion."

**Reference:** EN 301 549 Annex C, C.9.1.4.10 (`docs/analysis/en301549/EN301549-ANNEX-C-RELEVANT-CLAUSES.md`)
> "Not applicable: If any requirement precondition is false or the web page does not contain content relevant to WCAG 2.2 Success Criterion 1.4.10 Reflow."
