# case-02 — Diner specials board: Breakfast/Lunch/Dinner grid (with prices) faked in a `<pre>` (F34)

## Scenario
"The Blue Caboose Diner" presents its weekly specials on a chalkboard-styled panel. The content is
a genuine data table — rows are weekday ranges (Mon-Tue / Wed-Thu / Fri-Sat), columns are the three
meals (Breakfast / Lunch / Dinner), and cells hold a dish plus a price. It is laid out entirely
with space characters inside one monospaced `<pre>`. The column header row and the weekday row
labels are implied only by alignment; prices sit in their own visual sub-columns. There is no
`<table>`, `<th>`, `scope`, `headers`, or `role` anywhere.

## Attribute tuple
- **Content domain:** independent restaurant / hospitality marketing page
- **UI-component / pattern:** weekly specials board styled as a chalkboard menu (meal × weekday grid + price column)
- **Host-language construct:** `<pre style="white-space:pre">` with monospace font; rows/cols are space padding
- **Locale / i18n:** en-US (prices in USD)
- **Failure-mechanism:** F34 — white-space characters format a table in plain text; header row + row labels never associate with cells, and the linear read order scrambles which dish/price belongs to which meal and day

## Developer persona
A freelance web designer rebuilt the diner's one-page site over a weekend. The owner emailed the
specials as a plain-text block they typed in Notepad with the spacebar (so it would "line up like
the printed board"). The designer dropped it into a `<pre>`, themed it as a chalkboard, and shipped
it — the visual board looked exactly like the photo of the real chalkboard, so it felt done.

## Element / selector carrying the issue
`pre.specials` inside `section.board` — the monospaced block whose space alignment fakes the meal
columns, weekday rows, and price sub-columns.

## Exact accessibility mechanism (what AT experiences, why it fails)
- A sighted diner reads down a meal column ("what's for Dinner this week?") or across a row ("what
  do I get Wed-Thu?") because the 2-D grid makes both axes legible.
- A screen reader reads each source line straight across. The first data line is announced as:
  *"Mon-Tue Buttermilk stack French dip $12 Meatloaf $15"* — three different dishes from three
  different meals, plus two prices, fused into one line, exactly the F34 failure shape
  ("Monday 2 fried eggs tomato soup garden salad").
- Continuation lines ("two eggs $9 sweet potato fries garlic mash") detach sides and prices from
  their dish, and the column headers (Breakfast/Lunch/Dinner) are read once as a lone line
  ("Breakfast Lunch Dinner") with no programmatic tie to any cell. The reading sequence does not
  make sense because there is no structure for the AT to identify it as a table.

Verified intent: 0 `<table>`/`<th>`/`role` nodes; the grid is space-only inside a single `<pre>`,
so AT exposes a flat interleaved character stream.

## Expected ACT-style outcome
**failed** (SC 1.3.2 — white space used to format a table in plain text; linearization produces a
nonsensical reading order; F34).

## Why automated tools miss it
With no `<table>` element there is nothing for a table-semantics rule to assert against — no missing
`<th>`, no empty cell, no `scope` to validate. The `<pre>` is valid HTML and the section has an
accessible name. axe / WAVE / Lighthouse cannot render the monospace layout to discover that spaces
encode a meal × weekday grid, nor judge that reading the line stream glues unrelated cells together.
Distinguishing a faked plain-text table from ordinary preformatted text, and judging the resulting
reading order, requires human visual + semantic reasoning.

## Citation
> "Using white space to organize data in a visual table does not provide the information in a natural
> reading order in the source of the document. Thus, the assistive technology user will not be
> presented with the information in a logical reading order."
— wcag-techniques/failures/F34.html (Description)

> "Monday 2 fried eggs tomato soup garden salad"
— wcag-techniques/failures/F34.html (Examples — a single line a screen reader would speak)

> "This reading order does not make sense since there is no structure in the table for the assistive
> technology to identify it as a table."
— wcag-techniques/failures/F34.html (Examples)
