# case-04 — Layout `<table>` (two prose columns) wrongly claiming the Reflow data-table exception

## Scenario
A nonprofit annual report renders the director's letter as two newspaper-style columns by putting the
prose into a `<table>` with two fixed 330px `<td>` cells. The table is ~700px wide and `table-layout:
fixed`, so it cannot narrow. At 320 CSS px the page scrolls horizontally and each column's text runs off
the edge. The table holds no tabular data at all — no header/data relationship, no rows beyond one — so
it is a layout table. The Reflow exception is for *sections that require two-dimensional layout for
understanding* (real tables, maps); running prose split into two columns for visual flavor does not
qualify.

## Attribute tuple
- **Content domain:** nonprofit / annual report (director's letter)
- **UI component / pattern:** layout table used for multi-column prose (print-newspaper feel)
- **Host-language construct:** `<table role="presentation">` with fixed-width `<td>` cells, `table-layout: fixed`
- **Locale / i18n:** en (LTR)
- **Failure mechanism:** layout-table-as-prose; misapplied data-table exception

## Developer persona
A print designer producing the foundation's PDF annual report was asked to "also put it on the website."
They reached for the layout idiom they knew from the email and print world — a table to get two columns
of body text side by side — and reasoned that "tables are exempt from the zoom/reflow rule anyway, so
this is fine." It is not: the exception covers tabular DATA, not prose that merely sits in table cells.
They even added `role="presentation"`, which (correctly) tells AT it is NOT a data table — quietly
contradicting the very exception they relied on.

## Element / selector carrying the issue
`table.letter` — a 700px fixed layout table whose two `<td>` cells contain only paragraphs of the
letter. (`role="presentation"` confirms there is no tabular semantics to except.)

## Exact accessibility mechanism
Because the table is `table-layout: fixed; width: 700px` with two 330px cells, it cannot shrink. At
320 CSS px the page overflows horizontally and a magnifier user must scroll left-right to read the
letter — the place-losing motion Reflow forbids. The content is ordinary prose that would reflow
perfectly as a single column; the table is purely presentational. The data-table exception explicitly
does NOT apply, both because there is no tabular data and because `role="presentation"` strips any table
semantics. Correct markup is stacked `<p>` (or CSS columns that collapse), not a fixed table.

## Expected ACT-style outcome
**failed** (SC 1.4.10). b4f0c3 (viewport meta) passes; the layout table is the failure.

## Why automated tools miss it
A tool can see a `<table>` and even see `role="presentation"`, but it cannot decide whether a wide
overflowing table holds genuine tabular data (excepted) or prose that should reflow (not excepted) —
that is the irreducible classification this aspect targets. Scanners also do not render at 320 CSS px to
detect the overflow in the first place. axe/WAVE/Lighthouse report no violation here: the markup is
well-formed and the viewport meta is permissive.

## Citation
**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "A section of content that requires two-dimensional layout for understanding or functionality, such as a table or map, has an exception to this success criterion. However, sections of content within the two-dimensional layout, such as each cell within a table, would still need to meet this success criterion."

**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "Data tables and grids have a two-dimensional relationship between column and row headers and their data cells. This success criterion therefore has exceptions for data tables and grids from needing to display without scrolling in the direction of text."

**Reference:** EN 301 549 Annex C, C.9.1.4.10 (`docs/analysis/en301549/EN301549-ANNEX-C-RELEVANT-CLAUSES.md`)
> "Procedure  1. Check that the web page does not fail WCAG 2.2 Success Criterion 1.4.10 Reflow according to WCAG Conformance Requirements stated in clause 9.6."
