# case-04 — University dept layout table: left-nav `<th scope="row">` + `headers=` fabricating cross-region headers

## Scenario
A university Marine Biology research-group page lays out its body as a two-column `<table>`:
a left navigation column (Research / People / Publications links) beside a right content
column. The author made each left-nav cell a row header — `<th scope="row" id="nav-…">` —
and pointed each content cell back at it with `headers="nav-…"`. The header/`headers`
plumbing is internally flawless (every `<th>` has assigned cells, every `headers` reference
resolves), but the relationship is fabricated: a navigation link ("Research") is asserted as
the *row header that describes* an unrelated content block sitting beside it. They are two
independent page regions that merely share a visual row.

## Attribute tuple
- **Content domain:** higher education / academic research group
- **UI component / pattern:** two-column nav-beside-content body layout
- **Host-language construct:** native `<table>` for layout with `<th scope="row">` + `headers` attributes
- **Locale / i18n:** en
- **Failure mechanism:** `scope="row"` + `headers` on a layout table — a fully-wired but false row-header relationship across unrelated regions (F46)

## Developer persona
A graduate-student site maintainer inherited a decade-old department template. They ran an
automated checker that warned "th element has no scope" and "data cells should reference
their headers", so they dutifully added `scope="row"` to every nav cell and `headers="…"` to
every content cell until the warnings cleared. The tool went green. They never questioned the
prior author's choice to mark the navigation column as row headers — the layout *looked* like
rows, so "row headers" seemed right.

## Element / selector carrying the issue
`table.body th.navcell[scope="row"]` (three of them: `#nav-research`, `#nav-people`,
`#nav-pubs`) and the matching `td.content[headers="nav-…"]` cells that reference them.

## Exact accessibility mechanism
In table-reading mode, AT announces each content cell with its row header — e.g. when the
user lands on the "Coastal ecosystems under thermal stress" paragraph, the screen reader
prepends "Research" as the cell's row header, implying "Research" classifies/labels that
paragraph the way a real row header ("Q3 Revenue") labels a data cell. But "Research" is a
navigation link, and the paragraph is page content; there is no row/column data relationship.
The AT user is fed a relationship the page does not actually have, and the navigation column
is mis-exposed as data headers. Per TT 14.C a layout table must not include `<th>` or
`scope`/`headers` relationship attributes.

## Expected ACT-style outcome
**failed** (SC 1.3.1). This case is engineered to PASS every internal ACT table rule:
a25f45 ("table header cell has assigned cells") passes because each `<th scope="row">` has
the data cell in its row; d0f69e ("`headers` attribute refers to a cell in the same table")
passes because every `headers` id resolves correctly. The page still fails 1.3.1 because the
relationship is fabricated on a layout table (F46 / TT 14.C).

## Why automated tools miss it
The whole point of the ACT header rules is to verify that header references are *internally
correct* — and here they are perfect, so the rules pass and report a clean table. Automated
tools have no rule that asks "should this `<table>` carry header structure at all?" because
that requires deciding the table is layout: that the left column is navigation and the right
column is independent content, with no shared row/column meaning. That is a semantic/visual
judgment (TT 14.C) that axe/WAVE/Lighthouse cannot perform; a perfectly-wired false
relationship is the hardest variant for them precisely because the plumbing is valid.

## Citation
**Reference:** WCAG Technique F46 (`wcag-techniques/failures/F46.html`)
> "Although not commonly used in a layout table, the following structural markup would also be failures of Success Criterion 1.3.1 Info and Relationships if used in a layout table: headers attributes [and] scope attributes."

**Reference:** Trusted Tester v5.1.3 — Test 14.C Layout Table Structure (`refs/trusted-tester/sc-1.3.1-info-and-relationships.md`)
> "The layout table DOES NOT designate the layout table using ARIA `role=\"table\"` AND DOES NOT include table header structure and relationship elements and/or associated attributes."
