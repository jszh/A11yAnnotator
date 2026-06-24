# case-01 — SaaS plan-comparison matrix built entirely from `<td>` (F91)

## Scenario
A B2B analytics product ("Northwind Analytics") has a "Compare plans" page. Four plans
(Starter / Growth / Scale / Enterprise) run across the top and eight features
(Monthly price, Included projects, Data retention, API rate limit, SAML/SSO, Audit log
export, Dedicated success manager, plus a CTA row) run down the side. It is a genuine
two-axis data matrix: a cell such as "Yes" or "$120" is meaningless without both its
plan (column) and its feature (row). The first row is styled as an obvious blue header
band and the first column as a bold grey header rail — but every cell, including those
two bands, is a plain `<td>`. No `<th>`, no `scope`, no `headers`/`id`, no
`role="columnheader"`/`rowheader"`.

## Attribute tuple
- **content-domain:** SaaS / B2B pricing
- **UI-component/pattern:** feature-comparison matrix (two-axis: plans × features)
- **host-language construct:** `<table>` with 100% `<td>` cells
- **locale/i18n:** en-US (USD pricing)
- **failure-mechanism:** F91 — visual headers present, header markup absent

## Developer persona
A marketing-site developer rebuilt the pricing page from a Figma export. The design
delivered the comparison grid as styled rectangles, and the dev reproduced it cell-for-cell
with a `<table>` and CSS classes (`tr:first-child` band, `td:first-child` rail) to get the
exact look. Because the header styling came entirely from CSS selectors, they never typed a
single `<th>`; the page "looked right" so it shipped.

## Element / selector carrying the issue
`table.compare` — specifically the first `<tr>` (the plan names) and every
`td:first-child` (the feature names), which function as headers but are `<td>`. Verified
in the Chromium accessibility tree: the table exposes `table:1, row:9, cell:45` and
**zero** `columnheader`/`rowheader` nodes.

## Exact accessibility mechanism
The table is in the accessibility tree as a real table, so a screen-reader user enters
table-navigation mode — but no cell is a header, so as they move across a row or down a
column nothing is announced as context. Moving down the "Scale" column they hear
"$120, 50, 3 years, 5,000 / min, Yes, Yes, —, Choose Scale" with no plan name and no
feature label tying any value to its meaning. The header-to-data relationship that
sighted users get from the blue band and bold rail is not programmatically determinable
(TT 14.B fails; 14.A passes because the table itself IS identified).

## Expected ACT-style outcome
**failed** (F91; Trusted Tester 14.B `1.3.1-cell-header-association`). ACT rules a25f45
and d0f69e are **inapplicable** (no header cell exists to make them applicable).

## Why automated tools miss it
a25f45 ("headers attribute refers to cells in same table") and d0f69e ("table header
cell has assigned cells") both require a `<th>` or `role=columnheader/rowheader` to even
be applicable; an all-`<td>` table returns inapplicable from both, so F91 is silently
out of scope. axe-core, WAVE, and Lighthouse raise nothing because a table composed
entirely of `<td>` is valid HTML with no missing/empty attribute to lint. Recognising
that the blue first row is a column-header row, that the bold first column is a
row-header column, and that the data cells are unintelligible without them, requires a
human to read the rendered grid and judge that this is a data table — exactly the
omitted judgment.

## Citation
> **Reference:** WCAG Techniques — F91 "Failure of Success Criterion 1.3.1 for not
> correctly marking up table headers" (`wcag-techniques/failures/F91.html`)
>
> **Quote (verbatim):** "This failure occurs when data tables do not use header elements
> (`th`) or other appropriate table mark-up (the `scope` attribute, `headers` and `id`
> or the ARIA `columnheader` and `rowheader`) roles to make the headers programmatically
> determinable from within table content. Making headers programmatically determinable is
> especially important when data cells are only intelligible together with header
> information."

> **Reference:** Trusted Tester v5.1.3 — Test 14.B `1.3.1-cell-header-association`
> (`refs/trusted-tester/sc-1.3.1-info-and-relationships.md`)
>
> **Quote (verbatim):** "**Test Condition:** *All data cells are programmatically
> associated with relevant headers.*"
