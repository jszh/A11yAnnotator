# case-04 — Data table: "Download" links disambiguated only by a column label that is a styled `<td>`, not a `<th>`

## Scenario
A county procurement page (Marin County "Open Bids & Solicitations") lists solicitations in a real
data table. Each row has two "Download" links: one for the Specifications packet, one for the Bid
Form. The two document columns are told apart ONLY by a header-looking sub-row whose cells are
`<td>` elements styled bold/centered to look like column headers — they are not `<th>` and carry no
`scope`. So nothing programmatically associates "Specifications" / "Bid Form" with the cells holding
the links. Six "Download" links, no programmatic distinction.

## Attribute tuple
- **content-domain:** government / public-sector procurement
- **UI-component/pattern:** data table with two document-download columns under a merged "Documents" header
- **host-language construct:** real `<table>` with a legitimate `<thead><th scope="col">` row PLUS a fake sub-header row built from `<td>` (the column labels that matter)
- **locale/i18n:** en (US gov)
- **failure-mechanism:** F63 — the only disambiguating text ("Specifications"/"Bid Form") is in a `<td>` that is not an associated table header cell

## Developer persona
A county-IT developer needed a two-line header: a merged "Documents" cell spanning two columns, then
"Specifications" and "Bid Form" beneath it. They got the merged `<th colspan="2">` right, but for the
second header line they reused a normal table row and styled the `<td>`s to look like headers
(`background`, `font-weight:700`, centered) rather than figuring out the second `<th scope>` row.
Visually it is indistinguishable from a real header, so it shipped.

## Element / selector carrying the issue
The six `td.docs > a` links (e.g. `/bids/25-014/specs.pdf`, `/bids/25-014/bidform.pdf`), each with
accessible name "Download". The cells that would distinguish them — `tr.subhead > td` containing
"Specifications" and "Bid Form" — are `<td>`, not `<th scope="col">`, so they are not associated
header cells for the link cells below.

## Exact accessibility mechanism (what AT experiences, why it fails)
This IS a data table, so a screen reader announces header associations as it navigates cells — but
only for cells that are actually `<th>` (or carry `headers`/`scope`). The real header row exposes
"Solicitation", "Due date", and "Documents". The second line ("Specifications", "Bid Form") is `<td>`
with no `scope` and no `headers` attribute pointing to it, so AT treats it as ordinary data, not as
the column header for the link cells. When the user reaches a "Download" link, the announced context
is at best "Documents" (the merged real header) for BOTH columns — it cannot tell a spec packet from
a bid form. The row's solicitation name gives the project but not which of the two documents this is.
The disambiguating words exist visually but are not the link's programmatically determined context:
F63. (Had the sub-row used `<th scope="col">`, those labels WOULD be associated header cells and the
links would pass — that boundary is exactly what makes this a `<th>`-vs-`<td>` judgment.)

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The table is well-formed: a real `<thead>`, real `<th scope="col">` on the first header line, valid
`colspan`, every link with a non-empty name and valid href, and good contrast. axe-core/WAVE/
Lighthouse do not flag "a styled `<td>` that looks like a header but isn't" — there is no missing
attribute or empty cell to catch, and "Download" is a legitimate accessible name. Recognizing the
failure requires (a) noticing the second header line is `<td>` not `<th>`, (b) knowing only an
*associated* header cell counts as programmatic context, and (c) judging that "Download" + the merged
"Documents" header still cannot distinguish spec from bid form — layered semantic reasoning no
scanner performs.

## Citation
> **WCAG 2.2 Understanding — Understanding Link Purpose (In Context), Intent:**
> "…or in the table header cell for a link in a data table, because these are directly associated with the link itself."

(Verbatim from `wcag-understanding/link-purpose-in-context.html`. The disambiguating labels are in a `<td>`, not a table header cell, so they are not directly associated.)

> **Trusted Tester v5.1.3 — SC 2.4.4, How to Test, step 2:**
> "Determine whether the ANDI Output, in combination with the **programmatically determined link context** (text that is in the **same sentence, paragraph, list item, or table cell** as the link, or in a **table header cell** associated with the table cell that contains the link), adequately describes the link's purpose or function."

(Verbatim from `refs/trusted-tester/sc-2.4.4-link-purpose.md`. A non-`th` cell is not "a table header cell associated with" the link cell.)
