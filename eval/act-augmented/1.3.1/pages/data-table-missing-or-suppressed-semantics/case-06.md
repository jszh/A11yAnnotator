# case-06 — Boundary PASS: layout table correctly suppressed + data table correctly kept

## Scenario
An order-confirmation email ("Brewhouse Coffee Co.") contains **two** tables side by side,
deliberately, to isolate the human judgment this aspect turns on:
- **(A) a layout table** — a classic email "two columns" arrangement (greeting on the
  left, an "Order #A-90412" badge on the right). It has no headers, no caption, and reads
  sensibly in source order. It carries `role="presentation"`.
- **(B) a genuine data table** — the order line items. Cells like "3" or "$9.00" are
  meaningless without their headers ("Reusable filter / Qty / Unit price"). It is built
  correctly with `<caption>`, `<th scope="col">` across the top, and `<th scope="row">`
  for each product, and is **not** given `role="presentation"`.
Both decisions are correct, so the page **passes** SC 1.3.1. This is the discrimination
case: it shows what correct suppression (layout) vs. correct retention (data) looks like,
making the F92 failure in case-04 legible by contrast.

## Attribute tuple
- **content-domain:** e-commerce transactional email (order confirmation)
- **UI-component/pattern:** email layout table (A) + order line-items data table (B)
- **host-language construct:** `<table role="presentation">` (layout) + `<table>` with `<th scope>` (data)
- **locale/i18n:** en (USD)
- **failure-mechanism:** none — correct boundary variant (PASS)

## Developer persona
An email developer who actually understands the distinction: email clients demand
table-based layout, so they used a `<table role="presentation">` for the greeting/badge
columns (the right call — a layout table must not expose header semantics), and a proper
semantic `<table>` with `scope` for the purchase summary (the right call — data must keep
its headers). This is the "did it correctly" counterpart to the failing cases.

## Element / selector carrying the issue
Two elements demonstrate the *correct* choices:
- `table.layout[role="presentation"]` — correctly suppressed; in the accessibility tree it
  contributes no table semantics.
- `table.order` — correctly retained; verified in the Chromium accessibility tree as
  `table:1, row:5, columnheader:4, rowheader:3, cell:11` (every data cell is associated
  with its column and row header via `scope`).

## Exact accessibility mechanism
For the layout table, `role="presentation"` removes the (unneeded) table semantics, so a
screen-reader user simply reads the greeting then the order badge in order — no spurious
"table with 1 row, 2 columns" announcement. For the data table, the retained `<caption>`,
`<th scope="col">`, and `<th scope="row">` mean that navigating to the "$9.00" cell
announces its column header ("Unit price") and row header ("Reusable filter (size 02)"),
so every figure is intelligible. Both behaviours are correct; nothing about the content's
information or relationships is lost.

## Expected ACT-style outcome
**passed** (Trusted Tester 14.A/14.B PASS for the data table; 14.C PASS for the layout
table — it does not use `role="table"` table-header structure and *does* carry
`role="presentation"`). ACT rules a25f45/d0f69e would evaluate the data table's headers as
correctly associated (or be inapplicable to the layout table).

## Why automated tools miss it (i.e. why a human is still required even on a PASS)
Automated tools cannot *originate* this verdict: they cannot determine that table (A) is
layout (so suppressing it is correct) while table (B) is data (so it must keep headers).
A scanner sees one `role="presentation"` table (no error — valid) and one table with
`<th scope>` (no error — valid) and would report "no issues" *regardless of whether the
choices were appropriate*. The same tool output would appear if the roles were swapped
(the failing case-04 pattern). Confirming this page is genuinely correct — that the
suppressed table really is layout and the semantic table really is the data — requires the
human to recognise which table is which, the exact judgment that makes case-04 fail and
this page pass.

## Citation
> **Reference:** WCAG Techniques — F46 "Failure of Success Criterion 1.3.1 due to using th
> elements, caption elements, or non-empty summary attributes in layout tables"
> (`wcag-techniques/failures/F46.html`)
>
> **Quote (verbatim):** "When a table is used for layout purposes the th element should not
> be used. Since the table is not presenting data there is no need to mark any cells as
> column or row headers."

> **Reference:** Trusted Tester v5.1.3 — Test 14.C `1.3.1-layout-table-structure`
> (`refs/trusted-tester/sc-1.3.1-info-and-relationships.md`)
>
> **Quote (verbatim):** "**Evaluate Results (PASS if ANY true)** … The `<table>` element
> includes `role="presentation"`, OR BOTH: the layout does NOT use
> `role="table"`/associated ARIA table attributes AND does NOT include table
> structure/relationship elements or attributes (e.g., `<th>`, `scope="row"`)."
