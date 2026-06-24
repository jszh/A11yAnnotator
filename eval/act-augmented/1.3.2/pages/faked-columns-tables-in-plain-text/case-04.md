# case-04 — Flight itinerary: six space-aligned columns in a read-only `<textarea>` (gate detaches from flight)

## Scenario
A "Your trip is confirmed" page from Meridian Air shows the itinerary in a read-only `<textarea>`.
The block is a six-column data table — Flight | Date | Route | Depart | Arrive | Gate — aligned with
space characters in a monospace font, mimicking the confirmation grids airlines email. The most
safety-relevant cell, the Gate, lives in the rightmost space-aligned column. There is no `<table>`,
no `role`, no list; alignment alone encodes which value belongs to which field and which row.

## Attribute tuple
- **Content domain:** travel / airline booking confirmation
- **UI-component / pattern:** read-only `<textarea>` itinerary with six aligned columns
- **Host-language construct:** `<textarea readonly>` with space-padded columns + `white-space:pre` monospace
- **Locale / i18n:** en-US (24-hour times, IATA codes)
- **Failure-mechanism:** F34 — white-space characters format a table in plain text; linear reading order glues Depart/Arrive/Gate together and detaches the gate from its flight

## Developer persona
A booking-engine backend dev needed to show the itinerary on the confirmation page. The reservation
service already produces a fixed-width plain-text itinerary for confirmation emails (padded with
spaces to align columns), so the dev reused that exact string and dumped it into a read-only
textarea instead of re-modeling it as a table. It rendered as the familiar airline grid, so it
looked correct.

## Element / selector carrying the issue
`textarea#itin` — the read-only field whose space-aligned columns fake the Flight/Date/Route/Depart/
Arrive/Gate grid.

## Exact accessibility mechanism (what AT experiences, why it fails)
- A sighted traveler scans across one row to read "MA 933 … Gate B6," or down the Gate column to find
  every gate; the 2-D alignment makes the row/column mapping obvious.
- A screen reader reads each source line straight across as one run: *"MA 933 12 Jul DEN -> ORD 11:55
  15:08 B6."* With every row repeating times and a short gate token, the listener must hold six fields
  in working memory and infer that the trailing token is the gate — and because the header row
  ("Flight Date Route Depart Arrive Gate") has no programmatic association with the cells, nothing
  anchors which token is the gate versus the arrival time. Read out of column context the gate
  detaches from its flight, defeating the one thing the traveler most needs. The sequence as
  linearized fails to preserve the meaning the grid conveyed.

Verified intent: 0 `<table>`/`<th>`/`role` nodes; columns are space padding inside the textarea
value, so AT exposes a flat per-line stream.

## Expected ACT-style outcome
**failed** (SC 1.3.2 — white space used to format a multi-column table in plain text; linearization
scrambles which gate/time belongs to which flight; F34).

## Why automated tools miss it
A labelled, read-only `<textarea>` of ordinary text passes every form-label, name and ARIA check.
There is no table to validate, no missing header to report. Automated tools treat the value as a
string and cannot reconstruct the monospace column geometry, so they cannot see the six columns or
judge that reading the line glues the gate to unrelated fields. Detecting the faked columns and the
broken reading order requires human visual + semantic judgment.

## Citation
> "When tables are created in this manner there is no way to indicate that a cell is intended to be a
> header cell, no way to associate the table header cells with the table data cells, or to navigate
> directly to a particular cell in a table."
— wcag-techniques/failures/F34.html (Description)

> "Plain text is not suitable for displaying complex information like tables because the structure of
> the table cannot be perceived."
— wcag-techniques/failures/F34.html (Description)

> "Content that does not meet this Success Criterion may confuse or disorient users when assistive
> technology reads the content in the wrong order"
— wcag-understanding/meaningful-sequence.html (Intent of Meaningful Sequence)
