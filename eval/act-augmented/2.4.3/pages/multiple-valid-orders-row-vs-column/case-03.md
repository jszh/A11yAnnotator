# case-03 — Budget spreadsheet, diagonal-snake tabindex destroying both valid orders (FAIL)

## Scenario
A departmental FY budget worksheet: rows are expense categories (Salaries, Travel,
Equipment, Software), columns are the four quarters (Q1–Q4). A two-axis budget grid like
this has **two** legitimate focus orders — row-major (one category's full year at a time)
or column-major (one quarter at a time across all categories). This page provides
**neither**. The author applied positive `tabindex` that **snakes diagonally** through the
grid (Salaries-Q1 → Travel-Q2 → Equipment-Q3 → Software-Q4 → Travel-Q1 → Equipment-Q2 →
…), so each Tab jumps to a cell that shares **neither a category nor a quarter** with the
previous one. Both the per-category-year relationship and the per-quarter-snapshot
relationship are destroyed. This is the **meaning-destroying near-twin** of the valid
column-major grids — it **fails** (F44).

## Attribute tuple
- **Content domain:** government / public-sector finance (library budget)
- **UI component / pattern:** spreadsheet-style 2-D data-entry table with totals footer
- **Host-language construct:** scrambled positive `tabindex` (1–16) sequenced diagonally
- **Locale / i18n:** en
- **Failure mechanism:** F44 — tabindex order follows no row/column relationship; both candidate logical orders are broken (the contrast case against case-01/02's valid column-major order)

## Developer persona
The worksheet started life as a finance-team Excel sheet. When it was ported to a web form,
a contractor copied the cells in the order they happened to be selected in the spreadsheet
(a diagonal drag-fill the accountant had used), and the build script stamped `tabindex`
onto each input in that copy order. Nobody tab-tested the result. Visually the table is
perfectly normal; only keyboard traversal reveals the diagonal scramble.

## Element / selector carrying the issue
The 16 `td input` controls. Tab order follows `tabindex` 1→16, which is the diagonal
sequence enumerated in the page comment. Consecutive focus stops (e.g. `sal_q1` →
`trv_q2` → `eqp_q3`) belong to different categories AND different quarters. Inspect the
`tabindex` values across the grid to see the diagonal walk.

## Exact accessibility mechanism
A keyboard / screen-reader user tabbing the grid hears: "Salaries Q1", then "Travel Q2",
then "Equipment Q3", then "Software Q4", then "Travel Q1" … Although each input has a clear
accessible name, the *sequence* conveys no relationship: the user cannot complete one
category's year, cannot complete one quarter, and has no way to predict where focus goes
next. To enter "all of Q1" they must hunt non-adjacent stops (positions 1, 5, 9, 13). This
impedes both the meaning (two intersecting groupings) and the operability (coherent data
entry) of the table — precisely the F44 failure, and precisely what distinguishes it from a
valid column-major alternative.

## Expected ACT-style outcome
**failed** (SC 2.4.3, F44). The tab order preserves neither logical order; it is a
meaning-destroying scramble, not a different-but-valid alternative.

## Why automated tools miss it
Every cell has a real accessible name (`aria-label`), headers/scope are correct, contrast
passes, and `tabindex` values are syntactically valid integers — so axe-core, WAVE, and
Lighthouse report no 2.4.3 failure (at most the generic "avoid positive tabindex"
advisory, which fires identically on the *valid* case-02 and so cannot distinguish them).
No static tool models whether a tab sequence follows a row or column relationship;
detecting that this diagonal walk breaks both 2-D relationships — while column-major would
have preserved one — is a human reasoning judgment.

## Citation
**Reference:** WCAG Technique F44 (`wcag-techniques/failures/F44.html`)
> "When the values of the tabindex attribute are assigned in a different order than the relationships and sequences in the content, the tab order no longer follows the relationships and sequences in the content."

**Reference:** WCAG 2.2 Understanding — Focus Order (`wcag-understanding/focus-order.html`)
> "it is a failure of Focus Order if items receive focus in an order that impedes the meaning or operation of content, or creates confusing or illogical focus orders"
