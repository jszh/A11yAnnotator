# case-01 — Weekly cafeteria menu as a space-aligned grid inside a `<p white-space:pre>`

## Scenario
A K-12 school district's "This Week in the Cafeteria" page presents the weekly menu as a clean
four-column grid: a header row (Breakfast / Lunch / Snack) and one row per weekday (Mon-Fri),
with each cell holding a food item. Visually it is unmistakably a day × meal table. But the
entire grid is built from space characters inside a single `<p class="menu" style="white-space:pre">`
— there is no `<table>`, `<th>`, `role`, or `<ul>` anywhere. The alignment of characters is the
only thing that encodes the row/column relationships.

## Attribute tuple
- **Content domain:** K-12 school site — nutrition services
- **UI component / pattern:** weekly menu rendered as a faux data table (header row + day rows)
- **Host-language construct:** `<p>` with `white-space:pre` + monospace font (no table element)
- **Locale / i18n:** en-US
- **Failure mechanism:** F34 — space characters used to lay out tabular data; implied column headers (meals) and row headers (weekdays) never programmatically associate with their cells

## Developer persona
A district communications coordinator (not a developer) maintains the site in a WYSIWYG CMS.
They pasted the menu out of a monospaced email from the kitchen, saw it "line up nicely" in the
editor's preformatted-text widget, and published it. To them the columns looked perfect, so it
seemed done — they had no concept that a screen reader linearizes the block.

## Element / selector carrying the issue
`p.menu` — a single paragraph with `white-space:pre`. The weekday labels (Monday…Friday) and the
meal-period labels (Breakfast/Lunch/Snack) are plain text inside the same text run as the food
items; nothing marks them as headers or associates them with cells.

## Exact accessibility mechanism
A sighted user perceives a 4-column grid because the monospace font + spaces align the glyphs.
A screen reader has no table to navigate; it reads the paragraph as one continuous text node in
source order, collapsing the runs of spaces, producing: *"Breakfast Lunch Snack Monday Cinnamon
oatmeal Turkey & cheese wrap Apple slices Tuesday Yogurt parfait …"*. The user cannot tell which
food is breakfast vs lunch, cannot navigate cell-by-cell, and cannot ask "what is Wednesday's
lunch?" because no Wednesday↔Lunch relationship exists in the DOM. If the user overrides the font
to a proportional one, or enlarges text until lines wrap, even the visual grid disintegrates.

## Expected ACT-style outcome
**failed** (SC 1.3.1). The tabular relationships conveyed by character alignment are not
programmatically determinable and are not available in text in a sensible reading order.

## Why automated tools miss it
There is no `<table>`, `role`, `<th>`, `scope`, `headers`, or list element on the page — so every
ACT 1.3.1 rule (all of which are anchored to table/list/heading elements or ARIA attributes) finds
nothing to evaluate. axe-core, WAVE, and Lighthouse see one syntactically valid `<p>` of text and
report no violation. Deciding that the spaces encode a day × meal table with implied headers
requires reading the visual alignment and inferring the relationship — human visual-semantic
judgment a scanner cannot perform.

## Citation
**Reference:** WCAG Technique F34 (`wcag-techniques/failures/F34.html`)
> "The objective of this technique is to describe how using white space characters, such as space, tab, line break, or carriage return, to format tables in text content is a failure to use structure properly. When tables are created in this manner there is no way to indicate that a cell is intended to be a header cell, no way to associate the table header cells with the table data cells, or to navigate directly to a particular cell in a table."

**Reference:** WCAG Technique F34 (`wcag-techniques/failures/F34.html`)
> "This reading order does not make sense since there is no structure in the table for the assistive technology to identify it as a table."
