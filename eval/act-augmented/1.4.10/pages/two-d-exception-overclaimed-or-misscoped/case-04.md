# case-04 — Layout-table masquerade: prose in a <table> claimed exempt, forcing whole-page 2D scroll (data-vs-layout classification)

## Scenario
A dental-practice "About" page lays out staff bios and service descriptions in a 4-column `<table>`
1240px wide and lets the page scroll horizontally, the author reasoning "it's a table, and tables are
exempt from Reflow." But this is a LAYOUT table: the cells contain prose paragraphs with no row/column
data relationship and no `<th>` headers. Prose does not require two-dimensional layout for
understanding, so the exception does not apply — it should reflow into a single 320px column. The
masquerade tests whether the evaluator classifies the content (data vs. layout) rather than just seeing
"a table exists, therefore exempt."

## Attribute tuple
- **Content domain:** healthcare / local dental practice ("About us")
- **UI component / pattern:** prose laid out in a multi-column layout `<table>` (team & services cards)
- **Host-language construct:** `<table table-layout:fixed; width:1240px>` with `<td>` only, no `<th>`
- **Locale / i18n:** en-GB
- **Failure mechanism:** layout table mis-claimed as an excepted data table, so non-data prose 2D-scrolls

## Developer persona
A small-business owner built the site in a basic WYSIWYG editor years ago. To get the four cards
side-by-side they used the editor's "insert table" button (the only multi-column tool they understood)
and pasted bios into the cells. When a consultant flagged the horizontal scrollbar at zoom, they replied
"but tables are exempt from the reflow rule" — conflating a layout table with the genuine-data-table
exception. No `<th>`, no `scope`, no `<caption>`: the structure itself reveals it is layout, not data.

## Element / selector carrying the issue
`table.team` (the 1240px fixed-width layout table). Its `<td>` cells hold prose; there are no `<th>`
header cells and no data relationship. The whole page inherits the resulting horizontal overflow.

## Exact accessibility mechanism
At 320 CSS px, a low-vision user must scroll horizontally to read the second, third, and fourth bio/
service cells, even though each is just a heading plus a paragraph that would wrap perfectly well into a
single column. There is no two-dimensional relationship to preserve — unlike a real data table, no cell's
meaning depends on aligning a column header with a row header. Because the content does not "require
two-dimensional layout for understanding or functionality," the exception does not apply and the prose
must reflow. The author's exemption claim is the over-scope error.

## Expected ACT-style outcome
**failed** (SC 1.4.10). The content is prose in a layout table; it is not excepted and must reflow.

## Why automated tools miss it
An automated checker either ignores Reflow or, on seeing a `<table>`, might assume the exception applies.
The markup is well-formed; no attribute is missing or empty. The failure is a CLASSIFICATION judgment:
is this real tabular data (excepted) or prose arranged with a layout table (not excepted)? The tells —
prose in every cell, no `<th>`/`scope`/`<caption>`, no header-to-data relationship — must be read and
weighed by a human. axe/WAVE/Lighthouse do not adjudicate "data table vs. layout table for the purpose
of the Reflow exception," and they do not render at 320px to see the overflow.

## Citation
**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "A section of content that requires two-dimensional layout for understanding or functionality, such as a table or map, has an exception to this success criterion."

**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "Data tables and grids have a two-dimensional relationship between column and row headers and their data cells. This success criterion therefore has exceptions for data tables and grids from needing to display without scrolling in the direction of text."

**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "Therefore, most sections of content are expected to reflow within the appropriate sizing requirement defined by this success criterion."
