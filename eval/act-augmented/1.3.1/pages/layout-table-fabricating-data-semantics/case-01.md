# case-01 — County records portal: page chrome in a `<table>` with a `<th colspan="3">` masthead

## Scenario
A county government "Records & Licensing Portal" lays out its entire page — masthead, a
left services-nav column, a main content column with a record-order form, a right
office-hours sidebar, and a footer — using a single positioning `<table>`. The top row is
a `<th colspan="3" scope="colgroup">` holding the agency name "Northbridge County". There
is no tabular data anywhere: the cells are page regions, not row/column observations. The
`<th>` (and its `scope="colgroup"`) falsely asserts that "Northbridge County …" is the
column header governing the nav / content / sidebar cells beneath it.

## Attribute tuple
- **Content domain:** government / civic services (vital-records ordering)
- **UI component / pattern:** full-page chrome layout (masthead + 3-column body + footer)
- **Host-language construct:** native `<table>` used for layout, with `<th colspan="3" scope="colgroup">`
- **Locale / i18n:** en-US
- **Failure mechanism:** a `<th>` (header cell) + `scope` on a layout table — header semantics asserted where no data relationship exists (F46)

## Developer persona
A long-tenured public-sector webmaster maintains the county site on a hand-coded legacy
template from the table-layout era. Years ago they "upgraded" the masthead row from a plain
`<td>` to a `<th>` because a colleague said "headings help screen readers" — conflating a
visual page heading with a table header cell. They added `scope="colgroup"` after an
automated scan suggested "th cells should have a scope". The scan went green; nobody
questioned whether the `<table>` was a data table to begin with.

## Element / selector carrying the issue
`table.portal > tr > th.masthead[colspan="3"]` — the page-title cell. Compounded by
`scope="colgroup"`, which formalizes the false header→cell relationship.

## Exact accessibility mechanism
A screen reader exposes this as a 3-column data table. When the user navigates into the
body cells (nav, main, sidebar) in table-reading mode, the AT announces the column header
for each — "Northbridge County Records & Licensing Portal" — as though it were the heading
that classifies the navigation links, the order form, and the office hours. It is not: these
are independent page regions with no shared row/column meaning. The user is told a
relationship that does not exist, and table-navigation commands ("next cell", "what's this
cell's header?") produce nonsense. Per F46 the structural markup is being used purely for
presentation; per TT 14.C a layout table must not include `<th>`/`scope`.

## Expected ACT-style outcome
**failed** (SC 1.3.1). ACT table rules (a25f45 "table header cell has assigned cells",
d0f69e header/`headers` correctness) would PASS or be inapplicable: the `<th>` does have
assigned cells (the colspan covers row 2's cells) and the references are internally valid.
The page still fails 1.3.1 because the asserted header relationship is fabricated — TT 14.C
requires a layout table to carry no header structure.

## Why automated tools miss it
Every automated table rule assumes the `<table>` is a data table and only audits internal
consistency (do `<th>`s have data cells, do `headers`/`scope` resolve). The `<th colspan="3">`
satisfies "header has assigned cells", so axe/WAVE/Lighthouse report no violation. Deciding
that this `<table>` is *layout* — that "nav | content | sidebar" are page regions, not data
observations sharing a header — requires recognizing the rendered page chrome and judging
that no row/column data relationship exists. No static checker makes that determination
(it is exactly TT 14.C, a human call).

## Citation
**Reference:** WCAG Technique F46 (`wcag-techniques/failures/F46.html`)
> "The objective of this technique is to describe a failure that occurs when a table used only for layout includes either th elements, a summary attribute, or a caption element. This is a failure because it uses structural (or semantic) markup only for presentation. The intent of the HTML table elements is to present data."

**Reference:** Trusted Tester v5.1.3 — Test 14.C Layout Table Structure (`refs/trusted-tester/sc-1.3.1-info-and-relationships.md`)
> "BOTH: the layout does NOT use `role=\"table\"`/associated ARIA table attributes AND does NOT include table structure/relationship elements or attributes (e.g., `<th>`, `scope=\"row\"`)."
