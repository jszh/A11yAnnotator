# case-01 — Wholesale quantity matrix, column-major tab order (valid alternative)

## Scenario
A B2B wholesale "standing order" builder for a coffee roaster. A 3x3 matrix of
`type="number"` quantity inputs: rows are pack sizes (6 / 12 / 24-pack), columns are
three blends (Morning, Decaf, Espresso). The grid LOOKS like an ordinary western
row-major table, but keyboard Tab walks it **column-by-column** — all three pack sizes
of Morning, then Decaf, then Espresso. This is achieved by emitting the `<input>` cells
in column-major DOM source order and re-placing them visually with CSS `grid-column` /
`grid-row`; **no `tabindex` is used at all**. Completing one blend's full size-ladder
before moving to the next is a genuine purchasing workflow, so column-major is a
logical order and the page **passes**.

## Attribute tuple
- **Content domain:** e-commerce / B2B wholesale ordering
- **UI component / pattern:** 2-D data-entry grid of quantity inputs (matrix form)
- **Host-language construct:** CSS Grid placement (`grid-row`/`grid-column`) decoupling DOM order from visual order; no `tabindex`
- **Locale / i18n:** en (western LTR; default expectation is row-major)
- **Failure mechanism:** NONE present — this is the false-positive trap. Order is non-default (column-major) but still reflects a logical relationship.

## Developer persona
A backend-leaning full-stack dev built the order grid by iterating the product list in
the outer loop and the pack sizes in the inner loop (`for blend: for size:`), so the
inputs came out of the template in column-major source order. They then used CSS Grid to
lay the cells back into the familiar table shape because the designer's mock showed a
row-major table. They deliberately did **not** add `tabindex` (they'd read that positive
tabindex is an anti-pattern), so the tab order is simply the natural source order — which
happens to be column-major.

## Element / selector carrying the issue
The nine `.cell input` controls inside `.grid[role="group"]`. The DOM order is
`#m6, #m12, #m24, #d6, #d12, #d24, #e6, #e12, #e24` (column-major) while the visual order
reads row-major (`#m6, #d6, #e6, ...`). Inspect via DOM order vs. `grid-column` values.

## Exact accessibility mechanism
A keyboard / screen-reader user tabbing the grid receives focus in the order Morning-6,
Morning-12, Morning-24, then Decaf-6 ... Each input is correctly labeled, so at every
stop the user hears an unambiguous name ("Morning 12-pack, spin button"). The sequence
"all of one blend, then the next blend" preserves the meaning (a per-product size ladder)
and operability (every cell is reachable, once, in a coherent run). Per the SC, when more
than one order preserves meaning, only one need be provided — column-major satisfies it.
There is no point at which focus jumps unpredictably or destroys the row/column
relationship, so an evaluator must **not** flag it merely for being non-row-major.

## Expected ACT-style outcome
**passed** (SC 2.4.3). The focus order is a different-but-valid logical order; flagging it
would be an over-flag of a legitimate alternative.

## Why automated tools miss it
This page passes axe-core, WAVE, and Lighthouse outright (labels present, headers/scope
fine, contrast fine, nothing hidden) — there is no defect to detect. The relevant point is
the *opposite* failure mode: a naive order-heuristic that flagged any tab order diverging
from visual/left-to-right would FALSE-POSITIVE here. Deciding that column-major "still
reflects a logical relationship in the content" requires understanding the purchasing
workflow — a reasoning task no static tool performs.

## Citation
**Reference:** WCAG 2.2 Understanding — Focus Order (`wcag-understanding/focus-order.html`)
> "There may be different orders that reflect logical relationships in the content. For example, moving through components in a table one row at a time or one column at a time both reflect the logical relationships in the content. Either order may satisfy this success criterion."

**Reference:** Trusted Tester v5.1.3 (`refs/trusted-tester/sc-2.4.3-focus-order.md`)
> "Focus order does not necessarily need to be top to bottom, left to right."
