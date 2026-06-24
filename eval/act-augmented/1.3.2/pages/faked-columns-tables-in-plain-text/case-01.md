# case-01 — EULA scroll-box: two clause columns faked with padding spaces in a `<pre>` (F33)

## Scenario
The pre-install license screen for "Lumen Photo Editor 4.2." The license body is rendered in a
focusable, scrollable region as a single monospaced `<pre>` block. To fit the long legalese on
screen the author laid the clauses out as **two newspaper columns**: each source line holds the
next fragment of the LEFT clause, a run of padding spaces, then the next fragment of a DIFFERENT
RIGHT clause. A sighted reader reads all the way down the left column (clause 1 grant text), then
all the way down the right column (the reverse-engineering / transfer restrictions). The DOM
character stream, however, is line-by-line: left-fragment then right-fragment per line. There is
no `<table>`, no CSS `column-count`, no list — only the alignment of characters encodes the
two-column relationship.

## Attribute tuple
- **Content domain:** desktop software EULA / install flow
- **UI-component / pattern:** scrollable "read-and-accept" license region + agree checkbox + Continue button
- **Host-language construct:** `<pre style="white-space:pre">` with monospace font; columns are padding spaces
- **Locale / i18n:** en-US (legal English)
- **Failure-mechanism:** F33 — white-space characters create multiple columns in plain text; line-wise source order interleaves the two clause columns

## Developer persona
A Windows desktop dev building the NSIS-style installer pasted the company's two-column printed
EULA (laid out for an A4 page) straight into the license control as preformatted text and wrapped
it in `<pre>` to "keep the formatting." The visual layout matched the printed contract, the
checkbox/Continue logic worked, QA signed it off — nobody read it with a screen reader.

## Element / selector carrying the issue
`pre.license` inside `div.scrollbox[role="region"]` — the monospaced block whose space-padding fakes
the two columns.

## Exact accessibility mechanism (what AT experiences, why it fails)
- A sighted user perceives two columns and reads each top-to-bottom; clause 1 ("GRANT OF LICENSE…")
  reads as a coherent paragraph, then the restriction clause ("…and may not be reverse engineered,
  decompiled…") reads as its own coherent paragraph.
- A screen reader reads the character stream in document (line) order, left to right across the
  fake gutter. The first spoken line becomes:
  *"1. GRANT OF LICENSE. Aperture Software grants and may not be reverse engineered,"* — the
  opening of clause 1 spliced onto the middle of the restriction clause.
- Every subsequent line interleaves the two unrelated clauses, so the legal meaning is destroyed:
  a user cannot tell which obligations attach to the grant versus the restrictions, yet must check
  "I have read and agree." The sequence in which content is presented affects its meaning, and no
  correct reading sequence can be programmatically determined.

Verified intent: the page contains 0 `<table>`/`<th>`/`role="table"` nodes and no CSS multicolumn;
the two columns exist only as space padding inside one `<pre>`, so the accessibility tree exposes a
single run of interleaved text.

## Expected ACT-style outcome
**failed** (SC 1.3.2 — white space used to create multiple columns; linear reading order interleaves
the columns into nonsense; F33).

## Why automated tools miss it
The markup is valid and complete: a labelled `role="region"`, a real `<pre>`, a properly-associated
checkbox and button. No rule fires for "this preformatted text visually forms two columns." axe,
WAVE and Lighthouse operate on the DOM/character stream and have no model of the rendered monospace
geometry, so they cannot detect that the visual layout implies a two-column reading order that the
linear DOM order shatters. Recognizing the implied columns from the render and judging that the
linearized stream scrambles the legalese is an inherently visual + semantic human task.

## Citation
> "Using white space characters to create multiple columns does not provide the information in a
> natural reading order. Thus, the assistive technology user will not be presented with the
> information in an understandable manner."
— wcag-techniques/failures/F33.html (Description)

> "If this content were to be interpreted and spoken by a screen reader it would speak the following
> lines: Web Content Accessibility Guidelines including blindness and low vision,"
— wcag-techniques/failures/F33.html (Examples — the interleaved linear read)

> "It is important that it be possible to programmatically determine at least one sequence of the
> content that makes sense."
— wcag-understanding/meaningful-sequence.html (Intent of Meaningful Sequence)
