# case-03 — Headerless ARIA grid: `role="table/row/cell"` but no `columnheader`/`rowheader` (F91)

## Scenario
A patient-portal "Lab Results" screen shows a complete blood count (CBC). It is a genuine
clinical data table: each row is an analyte (Haemoglobin, White cell count, Platelets,
Haematocrit, Mean cell volume) and the columns are Analyte / Result / Reference range /
Flag. A value like "118" or "Low" is meaningless without knowing it is the platelet
result. The grid is a `display:grid` div widget with **explicit ARIA table roles**:
`role="table"` on the container, `role="row"` on each row, and `role="cell"` on every
cell — including the visual header row and the analyte-name column. There is **no**
`role="columnheader"`, **no** `role="rowheader"`, and no `<th>` anywhere.

## Attribute tuple
- **content-domain:** healthcare / clinical lab results
- **UI-component/pattern:** framework-style div data grid with ARIA table roles
- **host-language construct:** `role="table"`/`role="row"`/`role="cell"` (no header role)
- **locale/i18n:** en (mixed unit notations g/dL, 10³/µL)
- **failure-mechanism:** F91 (ARIA variant) — table semantics present, header role absent

## Developer persona
A React developer hand-rolled a lightweight results grid from `<div>`s plus a CSS grid,
and "did the accessible thing" by sprinkling ARIA roles so it would be announced as a
table. They copied `role="cell"` onto every cell from the first row's template and never
learned that the header row needed `role="columnheader"` (and the analyte column
`role="rowheader"`). The grid announces "table" in a screen reader, so it felt done.

## Element / selector carrying the issue
`.grid[role="table"]` — the first `[role="row"]` (Analyte/Result/Reference range/Flag,
all `role="cell"`) and every `[role="row"] [role="cell"]:first-child` (the analyte names).
Verified in the Chromium accessibility tree: `table:1, row:6, cell:24`, **zero**
`columnheader`/`rowheader` nodes.

## Exact accessibility mechanism
Because `role="table"`/`row`/`cell` are all valid and present, the widget IS exposed as a
table and the user enters table navigation — but with no header cells, no header is ever
announced. Navigating to the platelets row's flag, the user hears "Low" with no analyte
and no "Flag" column; the high haemoglobin and high haematocrit values are announced as
bare numbers. The clinically critical row/column context is not programmatically
determinable (TT 14.B fails; 14.A passes — the table is identified).

## Expected ACT-style outcome
**failed** (F91; Trusted Tester 14.B `1.3.1-cell-header-association`). ACT rules a25f45
and d0f69e are **inapplicable** (they require a header cell; `role="cell"`-only grids
have none).

## Why automated tools miss it
This is the hardest F91 variant for scanners: the ARIA is *structurally valid* —
`role="cell"` nested in `role="row"` nested in `role="table"` is a conformant ARIA table,
and axe does **not** require a `columnheader`. So no rule fails: a25f45/d0f69e are
inapplicable (no header cell), and the ARIA-structure rules pass (the roles are correct
in isolation). Detecting the defect requires recognising that the first row and first
column *function* as headers and *should* carry `columnheader`/`rowheader`, and that
real clinical values are unintelligible without them — a semantic/visual judgment a DOM
linter cannot make.

## Citation
> **Reference:** WCAG Techniques — F91 "Failure of Success Criterion 1.3.1 for not
> correctly marking up table headers" (`wcag-techniques/failures/F91.html`)
>
> **Quote (verbatim):** "This failure occurs when data tables do not use header elements
> (`th`) or other appropriate table mark-up (the `scope` attribute, `headers` and `id`
> or the ARIA `columnheader` and `rowheader`) roles to make the headers programmatically
> determinable from within table content."

> **Reference:** Trusted Tester v5.1.3 — Test 14.B `1.3.1-cell-header-association`
> (`refs/trusted-tester/sc-1.3.1-info-and-relationships.md`)
>
> **Quote (verbatim):** "Inspect the ANDI Output for each data cell and/or the visual
> highlighting to determine whether the table identifies **all relevant headers** for
> each data cell."
