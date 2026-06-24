# case-07 — Excepted data table is wide and uncontained, dragging the NON-excepted prose off-canvas ("the exception does not extend")

## Scenario
A transit timetable page. The timetable IS a genuine data table (stop columns × trip rows) and genuinely
requires a two-dimensional layout, so the table itself is excepted from Reflow. The trap: the table is
`min-width: 760px` and is NOT placed in its own scroll container, and the content wrapper was sized to
match the table (`.page { width: 760px }`) so everything would "line up." So the wide table widens the
entire content block, and the surrounding NON-excepted content — the "Before you ride" and "Service
notes" paragraphs and headings — is forced to wrap at 760px instead of at the 320px viewport, dragging
its text off the right edge too. At 320 CSS px the user must scroll horizontally to read ordinary prose,
not just the table. Per the Understanding doc, the table being excepted does NOT excuse the prose; this
is a FAIL even though the overflowing element is a real data table.

This is the inverse of case-06: same kind of legitimate table, but uncontained, so the exception leaks
onto content that should have reflowed.

## Attribute tuple
- **Content domain:** municipal transit schedule
- **UI component / pattern:** real `<table>` timetable (data) + surrounding service-note prose
- **Host-language construct:** `table { min-width: 760px }` uncontained; `.page { width: 760px }` sized to the table
- **Locale / i18n:** en (LTR)
- **Failure mechanism:** excepted two-dimensional content extends the content block so non-excepted prose cannot reflow

## Developer persona
A transit-agency web author correctly built the timetable as a semantic `<table>` and knew "tables are
exempt from reflow." To make the prose "line up" under the timetable they sized the content wrapper to
the table (`.page { width: 760px }`) and never wrapped the table in a scroll container. The
misunderstanding is precise and common: they extended the table's exception to the entire content block,
including the plain paragraphs around it.

## Element / selector carrying the issue
The non-excepted prose (`.page > h2`, `.page > p`) is the failing content — it cannot reflow because the
wrapper `.page { width: 760px }` (sized to the uncontained excepted `table.timetable { min-width: 760px }`)
forces the prose to wrap at 760px rather than at the viewport. The fix is to wrap the table in an
`overflow:auto` box (as in case-06) and give `.page` a fluid `max-width` so the prose reflows
independently.

## Exact accessibility mechanism
At 320 CSS px the content block is 760px wide because the wrapper was sized to the table, so every
paragraph and heading forms a 760px line box and its text runs off the right edge (`scrollWidth` ~780px).
The timetable scrolling horizontally is acceptable (excepted), but the service-notes paragraphs now also
require left-right scrolling to read each line — and those paragraphs have no two-dimensional requirement
whatsoever. The Reflow exception applies only to the section that needs it; it does not automatically
extend to neighboring content. Because non-excepted prose requires two-dimensional scrolling, the page
fails. (Contrast with case-06, where the identical kind of table is contained and the prose reflows → pass.)

## Expected ACT-style outcome
**failed** (SC 1.4.10). The excepted table is fine; the non-excepted surrounding prose forced off-canvas
is the violation.

## Why automated tools miss it
This is the subtlest classification in the aspect. A tool detecting page overflow would see a wide
`<table>` and might wrongly excuse the whole page as "table exception." Conversely, a tool that flags any
overflow would wrongly flag case-06. Getting case-07 right requires the human distinctions that (a) the
table is excepted, but (b) the paragraphs are NOT, and (c) those paragraphs are themselves forced into
two-dimensional scrolling because the table was not isolated. No automated checker performs that
section-by-section exception analysis.

## Citation
**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "If a section of content meets the exception for two-dimensional scrolling, the exception only applies to that section. When a section of content is excepted from Reflow, the exception does not automatically extend to other content that doesn't need two-dimensional scrolling for understanding or functionality."

**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "Fail: Due to the way this example was implemented, the web page has both horizontal and vertical scrollbars. While the table meets the exception for two-dimensional layout for understanding, the paragraphs following the table in the screenshot do not."

**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "Other content that is related to the table or grid, such as a preceding heading, a search field, or an accompanying pagination ... are not excepted from meeting Reflow ... They would still be expected to adjust to smaller viewports."
