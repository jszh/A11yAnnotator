# case-02 — Spreadsheet-paste expense report, all `<td class="xl…">` (F91)

## Scenario
A finance-intranet article posts "Q3 departmental expenses (FY25)". The table lists four
cost centres down the side and five money columns across the top (July, August,
September, Quarter total, vs. budget), with a totals row at the bottom. Every number is a
genuine data value that requires both its cost-centre row and its month/measure column to
be intelligible: "259" alone is meaningless; it means "Sales & Marketing / August". The
markup is a verbatim spreadsheet export — the range was wrapped in a `<table>` and each
cell emitted as `<td>` carrying export style classes (`xl-hdr`, `xl-rowlbl`, `xl-num`,
`xl-total`). The header row got its own dark-blue fill class and the label column its own
light-blue fill class, but both are still `<td>`.

## Attribute tuple
- **content-domain:** corporate finance / management accounting (en-GB, GBP)
- **UI-component/pattern:** spreadsheet export pasted into a CMS WYSIWYG
- **host-language construct:** `<table>` of class-styled `<td>` (no `<th>` at all)
- **locale/i18n:** en-GB ("cost centre", GBP thousands)
- **failure-mechanism:** F91 — export preserves fill/bold styling but emits only `<td>`

## Developer persona
An ops/management-accounting analyst, not a developer, built the GL extract in Excel,
selected the range, copied it, and pasted into the intranet's rich-text editor. Excel's
"paste as HTML" wraps everything in `<td>` with `xl…` style classes and never produces a
`<th>`. The analyst saw the bold blue header band survive the paste, assumed the table
was "fine", and published. No code review touched the markup.

## Element / selector carrying the issue
`table.xl` — the first `<tr>` (`td.xl-hdr` × 6: the month/measure headers) and every
`td.xl-rowlbl` (the cost-centre names). Verified in the Chromium accessibility tree:
`table:1, row:6, cell:36`, **zero** header roles.

## Exact accessibility mechanism
The pasted table is exposed as a real table, so a screen-reader user navigates it cell by
cell — but there are no header cells, so no row or column header is announced. Arrowing
down the "August" column they hear "298, 271, 90, 129, 788" with no month and no cost
centre; arrowing across the "Sales & Marketing" row they hear "204, 271, 259, 734,
+11.8%" with no labels. Financial figures whose meaning depends entirely on their
row/column intersection are stripped of that relationship (TT 14.B fails).

## Expected ACT-style outcome
**failed** (F91; Trusted Tester 14.B `1.3.1-cell-header-association`). ACT rules a25f45
and d0f69e are **inapplicable** (no header cell present).

## Why automated tools miss it
The spreadsheet export is well-formed: valid `<table>`, valid `<td>`s, real text content,
inline classes — nothing for a linter to flag. Because there is no `<th>` or
`role=columnheader/rowheader`, the ACT table rules return inapplicable and the table is
out of scope; axe/WAVE/Lighthouse report nothing. Only a human can recognise the
dark-blue band as the column-header row, the light-blue band as the row-header column,
and judge that these GBP figures are genuine data that lost their header semantics in the
copy-paste — a meaning/visual judgment no automated checker makes.

## Citation
> **Reference:** WCAG Techniques — F91 "Failure of Success Criterion 1.3.1 for not
> correctly marking up table headers" (`wcag-techniques/failures/F91.html`)
>
> **Quote (verbatim):** "For all data tables, check if table headers can be correctly
> programmatically determined by use of one of the following mechanisms:" … "headers
> marked up with table header (`th`) elements" … "If all checks are false, then this
> failure condition applies and the content fails the Success Criterion."

> **Reference:** WCAG 2.2 Understanding 1.3.1 — Intent
> (`wcag-understanding/info-and-relationships.html`)
>
> **Quote (verbatim):** "items that share a common characteristic are organized into a
> table where the relationship of cells sharing the same row or column and the
> relationship of each cell to its row and/or column header are necessary for
> understanding"
