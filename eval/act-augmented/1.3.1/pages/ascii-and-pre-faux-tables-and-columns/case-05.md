# case-05 — Municipal election results in `<pre>` with vertically-stacked angled column headers

## Scenario
An official municipal "Unofficial Results" page from a city clerk's office. The results are a data
table: rows are polling subdivisions, columns are the three mayoral candidates, cells are
right-aligned vote counts, with a leading subdivision-label column. To fit narrow columns the
author stacked each candidate's name vertically — one letter per line — as angled column headers,
exactly the style of the W3C F48 election example. The whole thing is one `<pre>`: no `<table>`,
`<th>`, `scope`, `headers`, or `role`. Because the headers are columns of single letters, AT cannot
even reconstruct the candidate names.

## Attribute tuple
- **Content domain:** government / civic — election results
- **UI component / pattern:** results table with right-aligned numeric columns and vertical (stacked-letter) column headers
- **Host-language construct:** `<pre>` with space alignment; headers rendered as one character per line
- **Locale / i18n:** en-CA (Canadian municipal context)
- **Failure mechanism:** F48/F34 — tabular numeric data in `<pre>`; candidate column headers exist only as vertically-stacked characters that linearize to meaningless single letters

## Developer persona
A clerk's-office staffer received the tabulation as a fixed-width report from the vote-counting
software and republished it verbatim in a `<pre>` to preserve the official-looking alignment, with
the candidate surnames angled vertically to keep the table narrow on the page. The visual fidelity
to the printed canvass felt like the priority; the screen-reader experience was never considered.

## Element / selector carrying the issue
`pre.results` — the candidate headers are columns of single letters (L/A/M/B/E/R/T reading down),
the dashed separator row is decorative ASCII, and each subdivision row is a label plus three
space-aligned, right-justified numbers. Every vote-to-candidate-to-subdivision relationship is in
the alignment only.

## Exact accessibility mechanism
A screen reader reads the block top-to-bottom, line by line. The stacked headers come out as a run
of isolated letters — *"L A M B E R T"* — not the name "LAMBERT", so the columns have no
human-meaningful labels at all. The data rows then read as
*"0103 MILLPOND WARD 290 512 33"* — three bare numbers with nothing identifying which candidate or
that 512 is the leading tally. The user cannot answer "how many votes did Okaford get in Old Town
Ward?" because neither the candidate axis nor the per-cell association exists in the DOM. Numbers
right-aligned by spaces also lose their column identity entirely once the alignment is collapsed.

## Expected ACT-style outcome
**failed** (SC 1.3.1). The candidate × subdivision vote relationships, and even the column header
labels, are conveyed solely through whitespace alignment and are not programmatically determinable.

## Why automated tools miss it
The page is one valid `<pre>` of text; there is no table element, attribute, or role for any ACT
1.3.1 rule to attach to, so axe-core / WAVE / Lighthouse pass it silently. No tool reconstructs a
candidate × subdivision results table — much less recognizes that the vertically-stacked letters
are column headers — from space-aligned characters. That interpretation is pure human
visual-semantic reasoning.

## Citation
**Reference:** WCAG Technique F48 (`wcag-techniques/failures/F48.html`) — election example
> "Election results displayed using preformatted text"

**Reference:** WCAG Technique F34 (`wcag-techniques/failures/F34.html`)
> "In addition, assistive technologies will interpret content in the reading order of the current language. Using white space to organize data in a visual table does not provide the information in a natural reading order in the source of the document. Thus, the assistive technology user will not be presented with the information in a logical reading order."
