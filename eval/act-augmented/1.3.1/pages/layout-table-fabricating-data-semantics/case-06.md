# case-06 — HTML email: nested layout tables, one leftover `<th scope="col">` header band (not `role="presentation"`)

## Scenario
A weekly typography newsletter ("The Proof Sheet, Issue 47") is built the way HTML email
always is — from deeply nested layout `<table>`s. Best practice (and the rest of this email)
marks every layout table `role="presentation"` so AT ignores the table semantics. The defect
is a single leftover artefact: the masthead "header band" table was copied from a *data-table*
block in the email service provider's snippet library and still carries a
`<th scope="col">The Proof Sheet</th>` — and, unlike its siblings, it is the one layout
table that is *not* `role="presentation"`. So this band re-enters the accessibility tree as a
data table whose column header is "The Proof Sheet", falsely asserting a header relationship
over the masthead/issue cells.

## Attribute tuple
- **Content domain:** email newsletter / publishing (typography)
- **UI component / pattern:** HTML-email masthead band inside nested layout tables
- **Host-language construct:** nested `<table>`s; most `role="presentation"`, one with a `<th scope="col">` and no presentation role
- **Locale / i18n:** en-US
- **Failure mechanism:** a `<th scope="col">` surviving on a layout table whose `role="presentation"` was dropped — header semantics fabricated on a layout band (F46)

## Developer persona
An email developer assembled the newsletter from the ESP's drag-and-drop block library. They
added `role="presentation"` to the layout tables they hand-wrote, but the "branded header"
block was dragged in pre-built — and that block had originally been authored as a tiny data
table (it once held a two-column stats banner), so it shipped with a `<th scope="col">` and
no presentation role. In the email-client preview it looked perfect, the ESP's built-in
checker only flags missing alt text, and the stray `<th>` survived into the send.

## Element / selector carrying the issue
`table.header-band` — the only non-`role="presentation"` layout table — and its
`th[scope="col"].logo` ("The Proof Sheet"). Every sibling layout table is correctly
`role="presentation"`, which makes the one defect easy to overlook.

## Exact accessibility mechanism
Because `role="presentation"` is absent on the header band *and* it contains a `<th>`, AT
re-exposes that band as a data table: "table, 1 column", with "The Proof Sheet" announced as
the column header for the issue-line cell beneath it. The user is told that "The Proof Sheet"
is the *column header* classifying the issue/subtitle — a fabricated relationship; it is just
a masthead. The surrounding presentational tables read normally, so the experience is a
single jarring "table" interruption asserting structure that does not exist. F46 names a
`<th>` in a layout table as a direct failure; TT 14.C requires layout tables to carry no
header structure (or to be `role="presentation"`).

## Expected ACT-style outcome
**failed** (SC 1.3.1). The `<th scope="col">` has its assigned cell (the issue cell in its
column), so internal header rules (a25f45) pass; the other tables are correctly
presentational and raise nothing. The page fails 1.3.1 because the header band is a layout
table carrying a `<th>` without `role="presentation"` (F46 / TT 14.C).

## Why automated tools miss it
Scanners see a mostly well-formed email: most layout tables are `role="presentation"`, and
the one `<th>` that exists has an assigned cell, so the internal-correctness rules pass. No
rule flags "a `<th>` on a layout table" because no rule decides the band is layout — it would
have to distinguish this masthead band (layout) from a genuine data band (which *should* keep
its `<th>`). That layout-vs-data determination, and noticing that exactly one sibling lost its
`role="presentation"`, is the TT 14.C human judgment. (TT even instructs testers to *ignore*
header alerts on tables that ARE marked presentation — the inverse case — underscoring that
the call hinges on human layout judgment, not the markup alone.)

## Citation
**Reference:** WCAG Technique F46 (`wcag-techniques/failures/F46.html`)
> "The objective of this technique is to describe a failure that occurs when a table used only for layout includes either th elements, a summary attribute, or a caption element. ... When a table is used for layout purposes the th element should not be used. Since the table is not presenting data there is no need to mark any cells as column or row headers."

**Reference:** Trusted Tester v5.1.3 — Test 14.C Layout Table Structure (`refs/trusted-tester/sc-1.3.1-info-and-relationships.md`)
> "If a table has `role=\"presentation\"` and also denotes header relationships (e.g., `<th scope=\"row\">`), ANDI provides an alert; ignore this alert on a layout table (presentation role suppresses semantics)."
