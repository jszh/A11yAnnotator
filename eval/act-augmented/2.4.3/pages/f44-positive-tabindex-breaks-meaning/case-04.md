# case-04 — Positive tabindex row-interleaves two interdependent plan-config columns, breaking the column units

## Scenario
A mortgage "Configure & compare rate locks" tool with two side-by-side columns: **Plan A**
(30-year fixed) on the left and **Plan B** (15-year fixed) on the right. Each column stacks the
same three inputs vertically — **Loan amount**, **Down payment**, **Discount points** — and the
page instructs the user to fill in *each plan completely*, then compare the estimated monthly
payment. The positive `tabindex` values **interleave the columns row by row**:
A.amount (1) → B.amount (2) → A.down (3) → B.down (4) → A.points (5) → B.points (6) → Compare (7).
So Tab ping-pongs left → right → left → right across the gutter instead of completing Plan A then
Plan B. The three fields of each plan are a meaningful unit; interleaving them destroys that
relationship.

## Attribute tuple
- **content-domain:** online banking / fintech (mortgage rate-lock configurator)
- **UI-component / pattern:** two-column side-by-side comparison form (CSS grid)
- **host-language construct:** positive `tabindex` 1–7 assigned row-major across two columns (interleaving)
- **locale / i18n:** en-US
- **failure-mechanism:** positive tabindex interleaves interdependent columns, breaking each column's field-group relationship (F44 / Understanding two-column case)
- **AT-behavior facet:** screen magnifier at 300% — focus leaps off-screen to the other column on every Tab

## Developer persona
A developer wanted keyboard users to be able to "compare each row at a time" and assumed
row-by-row tabbing was a feature, mirroring how someone might *read* a comparison table. They
hand-numbered the tabindex down the rows (1,2 then 3,4 then 5,6) without considering that this is a
data-*entry* configurator, not a read-only table, and that each plan's three fields must be entered
as a set. It demoed fine on a wide desktop where both columns are visible at once.

## Element / selector carrying the issue
- `section.col.a` inputs `#a-amt` (1), `#a-down` (3), `#a-pts` (5) interleaved with
  `section.col.b` inputs `#b-amt` (2), `#b-down` (4), `#b-pts` (6).
- The interleaving is created purely by the positive `tabindex` ordering; visual/DOM order keeps
  each column's three fields contiguous.

## Exact accessibility mechanism (what AT experiences)
A keyboard user starts entering Plan A's loan amount, presses Tab, and is thrown to Plan B's loan
amount — abandoning Plan A mid-configuration. Tab again returns to Plan A's down payment, then to
Plan B's, and so on. The grouping "these three fields belong to Plan A" is never experienced as a
unit. For a screen-magnifier user at 300%, only one column fits in the viewport, so each Tab yanks
focus off-screen to the other column and back — the disorienting "field interpreted in the wrong
context" failure the Understanding doc warns about for magnification. The focus order does not
preserve the meaning (column = plan unit) or operability (you cannot complete one plan before the
other). Fails 2.4.3.

This is deliberately at the judgment boundary: the *identical* row-interleaved order would be
PERFECTLY VALID for an independent read-only data table navigated row-by-row (the Understanding doc
says either row-major or column-major can satisfy the SC). The verdict flips only because these
columns are interdependent *configuration units*, not independent cells — a semantic judgment.

## Expected ACT-style outcome
**failed** — F44 failure of SC 2.4.3; positive tabindex interleaves interdependent column units so
the focus order breaks the row/column relationships and operability.

## Why automated tools miss it
All markup is valid: labelled inputs, semantic sections with `aria-labelledby`, good contrast. axe
emits only the best-practice positive-tabindex note. Deciding that row-interleaving *breaks* meaning
here requires (a) recognising the two columns are interdependent entry units that must each be
completed as a set, and (b) knowing the same interleaving would be fine for an independent table —
plus a visual/magnifier judgment that focus leaps off-screen. No scanner models task semantics or
viewport geometry, so none can distinguish the failing interleave from the legitimate one.

## Citation
**Reference:** WCAG Understanding Focus Order (`wcag-understanding/focus-order.html`).

> "However, if the two columns are independent of each other, and meaning/operation are not
> affected, it is not a failure if elements in the right-hand column receive focus first, followed
> by the elements in the left-hand column."

**Supporting reference:** WCAG Understanding Focus Order — magnification note
(`wcag-understanding/focus-order.html`).

> "Only a small portion of the page may be visible to an individual using a screen magnifier at a
> high level of magnification. Such a user may interpret a field in the wrong context if the focus
> order is not logical."
