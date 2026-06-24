# case-06 — Boundary PASS: `<pre>` used for non-tabular content; the real table is a `<table>`

## Scenario
A ramen shop's menu page uses `<pre>` twice, but neither block encodes a table, and the data that
*is* tabular (the price list) is marked up as a real `<table>`. (1) An ASCII-art logo/divider is
purely decorative, given `role="img"` + an accessible name. (2) A short menu haiku in `<pre>` uses
line breaks as the poet's intended sequence — it linearizes perfectly and aligns nothing into
columns. The bowl/price data lives in a genuine `<table>` with `<th scope="col">` and
`<th scope="row">`. This sharpens the aspect: a `<pre>` is *not* a 1.3.1 failure by itself; the
failure is character alignment carrying row/column relationships, which is absent here.

## Attribute tuple
- **Content domain:** restaurant menu / small business
- **UI component / pattern:** decorative ASCII logo + poetry in `<pre>` alongside a real data table
- **Host-language construct:** two non-tabular `<pre>` blocks (one `role="img"`, one decorative) + a semantic `<table>` with scoped headers
- **Locale / i18n:** en
- **Failure mechanism:** none for this aspect — included as the negative/boundary control (correct structure used for the genuinely tabular content)

## Developer persona
A careful indie developer building the shop's one-page site knew the menu prices needed a real
table, so they used `<table>` with `scope`. They also wanted a bit of monospace personality (an
ASCII bowl logo and a haiku), and correctly treated those as decoration/prose — labeling the logo
`role="img"` and leaving the haiku as preformatted poetry — rather than smuggling tabular data into
a `<pre>`.

## Element / selector carrying the issue
None. The two `<pre>` blocks (`.logo`, `.haiku`) carry no row/column relationships; `.logo` is
`role="img"` with an `aria-label`; the `.divider` is `aria-hidden`. The only tabular content,
`table.prices`, uses `<thead>`, `<th scope="col">`, and per-row `<th scope="row">`, so the
item→price relationship is programmatically determinable.

## Exact accessibility mechanism
A screen reader announces the logo once via its `role="img"` name ("Tonkotsu Lane logo, a steaming
ramen bowl") and skips its ASCII internals — no lost relationship, because none was encoded. The
haiku reads as three lines of verse in the author's intended order; nothing is aligned into cells,
so linearization preserves the meaning. The price list is navigable as a table: the user can move
cell to cell and hear "Spicy Miso … Price … $16", with the row and column headers associated. There
is no whitespace-encoded table or column anywhere, so F33/F34/F48 do not apply.

## Expected ACT-style outcome
**passed** (SC 1.3.1, for this aspect). No tabular or multi-column relationship is conveyed only by
character alignment; the genuinely tabular content uses real table semantics.

## Why automated tools miss it
Automated tools would also report no violation here — but for the wrong reason: they cannot read
character alignment at all, so a `<pre>` "table" and a decorative `<pre>` look identical to them. A
human reaches the same PASS for the *right* reason: by reading the `<pre>` content and judging that
it carries no row/column relationship, while confirming the price data (which is tabular) uses a
proper `<table>`. The instructive point is that the correct verdict still depends on the same human
visual-semantic judgment the failing cases require — here applied to confirm a pass and to resist
flagging every `<pre>` reflexively.

## Citation
**Reference:** WCAG Technique F48 (`wcag-techniques/failures/F48.html`)
> "Instead, the HTML table element is intended to present tabular data. Assistive technologies use the structure of an HTML table to present data to the user in a logical manner."

**Reference:** WCAG 2.2 Understanding Info and Relationships (`wcag-understanding/info-and-relationships.html`)
> "items that share a common characteristic are organized into a table where the relationship of cells sharing the same row or column and the relationship of each cell to its row and/or column header are necessary for understanding"
