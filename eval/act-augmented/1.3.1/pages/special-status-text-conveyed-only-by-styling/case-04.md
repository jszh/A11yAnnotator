# case-04 — Course schedule: cancelled sessions shown only by italic + strike-through

## Scenario
A university LMS course-schedule page (BIOL 204). The data table is structurally exemplary —
real `<table>`, `<caption>`, `<th scope="col">`/`<th scope="row">`, correct cell associations —
so the *table-structure* limb of 1.3.1 passes. The defect is purely in text presentation: two
sessions are **cancelled**, and the only signal is that the cancelled rows render in **italic
with a strike-through** (`td.cancelled { font-style: italic; text-decoration: line-through; }`).
No "Cancelled" word, no status column, no `<del>`/`<s>`/ARIA, and no colour cue.

## Attribute tuple
- **content-domain:** higher-ed LMS / course page
- **UI-component/pattern:** data table (well-formed) with status conveyed by cell styling
- **host-language construct:** `<td>`/`<th>` + CSS `font-style: italic` & `text-decoration:
  line-through`
- **locale/i18n:** en
- **failure-mechanism:** "cancelled" special status conveyed by italic + strike-through with no
  markup and no text equivalent (F2; G117 not applied) — note this is *distinct* from the
  table-structure failures the ACT corpus already covers

## Developer persona
A teaching assistant updates the schedule directly in the LMS's rich-text/table editor. When two
sessions were cancelled, they selected those rows and clicked the editor's "italic" and
"strikethrough" toolbar buttons — the fastest way to make the rows "look cancelled." They didn't
add a status column or the word "Cancelled" because "you can see they're crossed out." The table
itself was built properly with header rows, so it sailed through the institution's accessibility
checker.

## Element / selector carrying the issue
`td.cancelled` / `th.cancelled` — the "Wed 18 Mar / Lab 5 / Osmosis practical" row and the
"Mon 30 Mar / Lecture 11 / Guest seminar" row. The italic+strike styling is the sole carrier of
the cancellation status.

## Exact accessibility mechanism (what AT experiences, why it fails)
Navigating the table cell-by-cell, a screen-reader user hears: "Wed 18 Mar, Lab 5, Osmosis
practical, Science Wing B2" with the same intonation as every live session — `font-style:italic`
and `text-decoration:line-through` on a `<td>` are not announced. So the student is told a class
is scheduled when it is cancelled, and will attend a lab that is not running, while possibly
overlooking that "Wed 25 Mar — Lab 5 (make-up)" is the real session. A braille user gets the same
flat output. The relationship "this session is cancelled" is conveyed by presentation alone,
available neither programmatically nor in any cell text, so the page fails 1.3.1 even though its
table semantics are perfect.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The table passes every automated table rule (caption present, scoped headers, associated cells)
— so a checker reports the table as *accessible*, which actively masks the problem. `italic` and
`line-through` on a cell are valid CSS that no tool flags. axe-core, WAVE and Lighthouse cannot
read the schedule, recognise that the strike-through encodes "cancelled," and verify that no cell
restates it. Distinguishing a struck-through "cancelled" row from struck-through decoration, and
confirming the status is in no text, is human content judgment.

## Citation
> **WCAG Techniques, G117:**
> "The objective of this technique is to ensure that information conveyed through variations in
> the formatting of text is conveyed in text as well. … Variations in the visual appearance can
> be made by changes in font face, font size, underline, strike through and various other text
> attributes. When these types of variations convey information, that information needs to be
> available elsewhere in the content via text."

(Verbatim from `wcag-techniques/general/G117.html`. The strike-through conveys "cancelled" but
that information is not available anywhere in the cell text, exactly the gap G117 closes — e.g.
adding the word "Cancelled" or a status column.)

> **WCAG 2.2 Understanding 1.3.1 (Intent):**
> "The intent of this success criterion is to ensure that information and relationships that are
> implied by visual or auditory formatting are preserved when the presentation format changes.
> For example, the presentation format changes when the content is read by a screen reader…"

(Verbatim from `wcag-understanding/info-and-relationships.html`. The "cancelled" relationship
implied by the strike-through is lost when the schedule is read by a screen reader.)
