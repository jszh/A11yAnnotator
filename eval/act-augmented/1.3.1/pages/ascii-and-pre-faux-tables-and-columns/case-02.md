# case-02 — University course schedule as a tab-separated `<pre>` block

## Scenario
A "Weekly Schedule" panel inside a university LMS (Canvas-style) course page. The schedule is a
genuine data table: rows are time slots (9:00–9:50, 10:00–11:50, …), columns are the five
weekdays, and each cell names the session (Lecture / Lab A / Recitation / Office hours / —). The
instructor pasted it into a `<pre>` where the columns are aligned with literal TAB characters and
the time labels run down the left edge. The header row (Mon…Fri) and the row labels (the times)
are implied only by tab alignment. No `<table>`, `<th>`, `scope`, `headers`, or `role` exists.

## Attribute tuple
- **Content domain:** higher-ed LMS / course page
- **UI component / pattern:** weekly class schedule (time × weekday grid)
- **Host-language construct:** `<pre>` with TAB-separated columns + `tab-size` CSS
- **Locale / i18n:** en-US (Central time)
- **Failure mechanism:** F48 — `<pre>` used to mark up tabular information; tabs (collapsed by AT) carry the column structure

## Developer persona
A biology professor authored the schedule in a plain-text editor with tab stops, where it lined
up perfectly. They pasted it into the LMS rich-text editor's "preformatted" style so the alignment
would survive, considered the visual result correct, and moved on. They never used a screen reader
and assumed "if it looks like a table, it is one."

## Element / selector carrying the issue
`pre.schedule` — the time-slot labels, the weekday header row, and the session names are all plain
text separated by `\t`. The CSS `tab-size:14` makes the tabs render as wide, even-looking columns,
reinforcing the illusion of a table that does not exist in the DOM.

## Exact accessibility mechanism
F48 specifically: the `<pre>` "preserves only visual formatting … the visually implied logical
relationships between the table cells and the headers are lost." A screen reader exposes the block
as one text run; it collapses each TAB to a single space, so the carefully aligned columns flatten
to: *"Monday Tuesday Wednesday Thursday Friday 9:00–9:50 Lecture — Lecture — Lecture …"*. The user
cannot determine that "Lab A" belongs to Wednesday at 10:00, cannot navigate by column or row, and
cannot answer "what meets Tuesday at 1:00?" The em-dash placeholders ("—") read as literal dashes,
further detaching sessions from their day/time. Reflowing or changing the font destroys the visual
grid too.

## Expected ACT-style outcome
**failed** (SC 1.3.1). The time × weekday relationships exist only in tab alignment and are neither
programmatically determinable nor available in a sensible linear reading order.

## Why automated tools miss it
A `<pre>` containing text is valid HTML with no table semantics to inspect, so there is no element,
attribute, or role for any ACT 1.3.1 rule to attach to. axe-core / WAVE / Lighthouse pass it
silently — none of them parse tab-aligned text to reconstruct an implied table. Judging that the
tab columns encode a schedule with implied row/column headers is human visual-semantic reasoning.

## Citation
**Reference:** WCAG Technique F48 (`wcag-techniques/failures/F48.html`)
> "This document describes a failure caused by use of the HTML pre element to markup tabular information. The pre element preserves only visual formatting. If the pre element is used to markup tabular information, the visually implied logical relationships between the table cells and the headers are lost if the user cannot see the screen or if the visual presentation changes significantly."

**Reference:** WCAG Technique F48 (`wcag-techniques/failures/F48.html`) — schedule example
> "A schedule formatted with tabs between columns"
