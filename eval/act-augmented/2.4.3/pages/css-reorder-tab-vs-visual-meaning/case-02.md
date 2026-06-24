# case-02 — Joint mortgage form: CSS grid renders two columns, DOM interleaves them so focus ping-pongs

## Scenario
A joint mortgage pre-approval form for "Northgate Mutual." It renders as two clearly
titled columns: **Primary applicant (you)** on the left, **Co-applicant** on the right.
Each column has the same four fields stacked vertically (name, date of birth, SSN last-4,
annual income). The visual layout strongly implies "fill your column top to bottom, then
fill the co-applicant's column." But the DOM **interleaves** the two columns field by
field — primary-name, co-name, primary-DOB, co-DOB, primary-SSN, co-SSN, ... — and CSS
**grid placement** (`grid-column` / `grid-row`) sorts each field into its visual cell.
With **no positive tabindex and no script**, the keyboard Tab sequence follows the DOM:
focus jumps **Primary name → Co-applicant name → Primary DOB → Co-applicant DOB → ...**,
alternating between two interdependent people on every single field.

## Attribute tuple
- **content-domain:** online banking / fintech (mortgage pre-approval)
- **UI-component / pattern:** two-column comparison-style form with paired fieldsets
- **host-language construct:** CSS Grid `grid-template-columns:1fr 1fr` + per-field `grid-column`/`grid-row`; DOM emits fields interleaved; no `tabindex`, no JS
- **locale / i18n:** en-US
- **failure-mechanism:** interdependent columns out of order — focus alternates between two applicants instead of completing one column then the next

## Developer persona
A junior dev built this with CSS Grid after reading a "build a comparison table with
Grid" tutorial. The tutorial's pattern emitted cells in *visual reading order* (row by
row, left then right) and let `grid-template-columns` wrap them into two columns — which
is fine for a static comparison table. The dev reused that exact source-order pattern for
an *interactive form*, not realizing that for inputs the source order is also the tab
order. Visually it matched the Figma two-column spec perfectly, so it passed design
review. No one tabbed through both columns.

## Element / selector carrying the issue
The eight text `<input>` controls inside `div.compare`.

- **Element-under-test selector (co-applicant / right column):** `div.compare div.c2 input`
  — matches the four right-column inputs `#c-name, #c-dob, #c-ssn, #c-income`.
- **Primary / left column, for contrast:** `div.compare div.c1 input`
  — matches `#p-name, #p-dob, #p-ssn, #p-income`.

NOTE: the column class (`c1`/`c2`) is on the wrapping `div.field` (e.g.
`<div class="field c2 r2">`), **not** on the `<input>`, so a selector like
`div.compare input.c2` matches **zero** elements; the input must be reached via its
parent (`div.c2 input`).

The defect is the mismatch between **DOM order** and the **grid-placed visual columns**:
the DOM interleaves the two columns row by row
(`#p-name, #c-name, #p-dob, #c-dob, #p-ssn, #c-ssn, #p-income, #c-income`), while
`grid-column:1` (`.c1`) / `grid-column:2` (`.c2`) sort each field into its visual column.
Tab therefore follows the interleaved DOM and ping-pongs across the gutter on every row.

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Sighted mouse user:** clicks each field directly; the interleaving is invisible.
- **Sighted keyboard / switch user:** Tab goes Primary-name, then jumps across the gutter
  to Co-applicant-name, back to Primary-DOB, across to Co-applicant-DOB, and so on. The
  two columns are **interdependent** (they are two parties to the *same* application that
  will be compared), and the visual layout presents them as two separate top-to-bottom
  lists. The focus order does not preserve that relationship — it scrambles "my details"
  with "their details," which is confusing and error-prone (it is easy to type the
  co-applicant's income into your row when focus has jumped columns).
- This is the precise failing example the Understanding gives: a form whose "tab order …
  skips between fields in different sections of the form."
- Contrast with case-03 (independent columns): here the columns are NOT independent, so
  per the Understanding the cross-column focus order **is** a failure.

## Expected ACT-style outcome
**failed** (SC 2.4.3). Focusable form controls receive focus in an order that does not
preserve the meaning/operability implied by the two-column visual presentation; focus
moves between interdependent sections instead of completing one then the other.

## Why automated tools miss it
- No positive `tabindex` and no JS → F44 and tab-order linters have nothing to check.
- Every `<input>` has an associated `<label>` and accessible name; contrast and structure
  are valid → axe/WAVE/Lighthouse pass.
- CSS Grid placement and interleaved DOM are both perfectly legal. To detect the problem a
  tool would have to (1) render the grid, (2) recognize that the result is two columns of
  the *same* form belonging to two *interdependent* applicants, and (3) decide that the
  intended fill order is column-by-column, not row-by-row. Distinguishing "interdependent
  columns (fail) vs independent columns (pass)" is exactly the judgment the Understanding
  reserves for a human; no automated checker has that model.

## Citation
> "Focus order does not necessarily need to follow the visual layout of the web page, as long as the order in which elements receive focus is logical, and the hierarchy and relationship of content implied by the visual presentation is preserved."
— wcag-understanding/focus-order.html (Intent of Focus Order)

> "However, if the two columns are independent of each other, and meaning/operation are not affected, it is not a failure if elements in the right-hand column receive focus first, followed by the elements in the left-hand column."
— wcag-understanding/focus-order.html (Intent of Focus Order)

> "However, the tab order for the form skips between fields in different sections of the form, so that focus moves from the name field to a checkbox, then to the street address, then to another checkbox."
— wcag-understanding/focus-order.html (Examples of Focus Order — failing example)
