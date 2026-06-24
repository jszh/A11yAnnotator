# case-01 — Council levy register: real data table is exempt, but body min-width drags heading/intro/search/pager off-screen (over-scoped exception)

## Scenario
A municipal treasury "Public Records Portal" renders a quarterly property-levy register: a genuine
9-column data table (parcel ID, owner, situs address, land-use class, assessed value, levy band,
exemption code, levy due, balance). The table legitimately needs two-dimensional layout, so it is
covered by the 1.4.10 exception. But the developer set `body { min-width: 980px }` so the table would
"have room", which means the H1, the introductory paragraph, the search field, and the pagination
component — all non-excepted content — ALSO cannot reflow and run off-canvas at 320 CSS px. This is
the exact failing half of the Understanding `reflow-table-pass-fail` figure.

## Attribute tuple
- **Content domain:** government / civic services portal (municipal treasury)
- **UI component / pattern:** data table + search toolbar + pagination component
- **Host-language construct:** `<body>` with `min-width` (page-level 2D scroll floor)
- **Locale / i18n:** en
- **Failure mechanism:** exception over-scoped from the one excepted table to the whole document, so non-excepted surroundings do not reflow

## Developer persona
A back-end-leaning government contractor ported a legacy desktop "assessor register" screen to the web
under deadline. The original was a fixed-width 980px window. To avoid re-flowing the table cells
(which "looked broken when wrapped"), they put `min-width:980px` on `body` so the whole page keeps the
desktop proportions, reasoning "the register is a table, and tables are exempt from Reflow, so the page
is fine." They never tested the heading, search box, or pager at 320px / 400% zoom.

## Element / selector carrying the issue
`body` (the `min-width: 980px` floor) is the root cause; the visibly-affected non-excepted elements are
`h1`, `p.intro`, `div.toolbar` (the `#q` search field) and `nav.pager` (the "Next" link). The `<table>`
itself is the correctly-excepted element and must NOT be flagged.

## Exact accessibility mechanism
At a 320 CSS px viewport (or 1280px @ 400% zoom), a low-vision user must scroll horizontally to read
the page heading and the introductory paragraph — text that has no need for 2D layout — and must scroll
right to even reach the search button and the "Next" pager link, which sit beyond the visible edge. The
table's 2D scrolling is acceptable, but Reflow requires the surrounding heading/intro/search/pager to
adapt to the narrow viewport. Because `body{min-width:980px}` forbids any reflow, the intent of the SC
(read each line of text without scrolling in two directions) is defeated for every non-table region.

## Expected ACT-style outcome
**failed** (SC 1.4.10). The table is exempt; the heading, intro, search field, and pagination are not,
and they fail to reflow at 320 CSS px.

## Why automated tools miss it
axe-core, WAVE, and Lighthouse do not lay the document out at 320 CSS px and cannot detect that a
non-excepted region requires horizontal scrolling — rendered-layout-at-target-viewport is not derivable
from static markup. Every checkable attribute is present and valid (table caption + `scope` headers,
`<label for="q">`, `aria-current` on the pager, accessible `nav` name). A scanner that merely sees "a
table exists" would wrongly treat the page as exempt. Deciding that the table may 2D-scroll while the
heading/search/pager MUST reflow is the human scoping judgment the SC requires.

## Citation
**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "Other content that is related to the table or grid, such as a preceding heading, a search field, or an accompanying pagination to load different sets of data are not excepted from meeting Reflow. For instance, while a table may require two-dimensional scrolling to maintain its understandability, a heading or paragraph that introduce the table, or a search field and pagination component that allow users to search for or navigate to different \"pages\" of table content are not extended this exception."

**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "When a section of content is excepted from Reflow, the exception does not automatically extend to other content that doesn't need two-dimensional scrolling for understanding or functionality."

**Reference:** EN 301 549 Annex C — C.9.1.4.10 (`docs/analysis/en301549/EN301549-ANNEX-C-RELEVANT-CLAUSES.md`)
> "Procedure  1. Check that the web page does not fail WCAG 2.2 Success Criterion 1.4.10 Reflow according to WCAG Conformance Requirements stated in clause 9.6."
