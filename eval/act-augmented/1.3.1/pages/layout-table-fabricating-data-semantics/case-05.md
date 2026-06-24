# case-05 — Ops dashboard: independent widgets given `role="table"` + `role="columnheader"`

## Scenario
An operations dashboard ("Helmsman") arranges six independent monitoring widgets in a CSS
grid. There is no `<table>` element; instead the grid container carries `role="table"`, the
top row of three summary cards carries `role="row"` with `role="columnheader"` on each, and
the three detail widgets below carry `role="cell"`. The ARIA owned-element contract is
satisfied (table → row → columnheader/cell). But the widgets are independent panels:
"Latency p95", "Active Incidents", and "Error Rate" are not columns of one dataset, and
"System Health" / "Delivery" / "Reliability" are not the column headers that classify the
panels beneath them. `role="table"` asserts tabular structure over content that has no
row/column data relationship — the modern ARIA reincarnation of F46.

## Attribute tuple
- **Content domain:** DevOps / SRE observability dashboard
- **UI component / pattern:** widget grid / metric cards (independent panels)
- **Host-language construct:** `<div>` grid with ARIA grid roles (`role="table"`, `row`, `columnheader`, `cell`)
- **Locale / i18n:** en
- **Failure mechanism:** ARIA `role="table"` + `columnheader` applied to a layout grid — fabricated tabular semantics over independent panels (F46 / TT 14.C ARIA limb)

## Developer persona
A full-stack engineer building an internal dashboard wanted the metric grid to "read nicely
in a screen reader" and remembered that data grids use `role="table"`. They sprinkled
`role="table"/row/columnheader/cell` onto the existing flex/grid cards because an
accessibility blog showed those roles for tables, and axe stopped complaining about
"required ARIA child" once the hierarchy was complete. They did not consider that the cards
are not cells of one table — each widget is its own standalone metric.

## Element / selector carrying the issue
`.board[role="table"]` and its `[role="columnheader"]` cards (`System Health`, `Delivery`,
`Reliability`). The lower `[role="cell"]` widgets are exposed as data cells governed by those
column headers.

## Exact accessibility mechanism
AT exposes the dashboard as a 3-column data table. When the user navigates to the "Latency
p95" widget in table mode, the screen reader announces "System Health, Latency p95" — naming
"System Health" as the column header for the latency panel. That relationship is invented:
"System Health" is a separate status widget, not the heading that classifies latency. Table
commands ("read column", "go to column header") traverse unrelated widgets as if they were a
contiguous dataset, and `aria-label="Operations metrics"` reinforces the false "table"
framing. TT 14.C's first limb is precisely the use of `role="table"`/ARIA table attributes on
layout — which this does.

## Expected ACT-style outcome
**failed** (SC 1.3.1). axe's ARIA structure rules pass: the roles are valid, and `role="table"`
has its required owned `row`/`columnheader`/`cell` descendants, so "required ARIA children",
"required parent", and "valid role" all report clean. The page fails 1.3.1 because the
asserted tabular structure does not exist (the panels are independent), which TT 14.C treats
as a layout-table failure even in its ARIA form.

## Why automated tools miss it
ARIA structural rules only check that a declared role has the *structurally required*
parents/children and that role values are valid — all true here. There is no automated rule
that asks "do these elements genuinely form a table of related data, or are they independent
panels falsely labeled `role=table`?" Answering that requires reading the widgets' meaning
(separate metrics, no shared row/column axis) and the rendered layout — a human semantic
judgment. TT 14.C explicitly scopes layout-vs-data to a manual determination, and the ARIA
limb of it is wholly outside the ACT corpus.

## Citation
**Reference:** Trusted Tester v5.1.3 — Test 14.C Layout Table Structure (`refs/trusted-tester/sc-1.3.1-info-and-relationships.md`)
> "Inspect the \"Element\" output in ANDI to determine whether the layout uses `role=\"table\"`. ... the layout does NOT use `role=\"table\"`/associated ARIA table attributes AND does NOT include table structure/relationship elements or attributes (e.g., `<th>`, `scope=\"row\"`)."

**Reference:** WCAG Technique F46 (`wcag-techniques/failures/F46.html`)
> "This is a failure because it uses structural (or semantic) markup only for presentation. The intent of the HTML table elements is to present data."
