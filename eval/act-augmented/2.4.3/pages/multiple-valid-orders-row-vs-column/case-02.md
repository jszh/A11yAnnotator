# case-02 — Weekly timetable checkboxes, day-column vertical tab via grouped tabindex (valid alternative)

## Scenario
A university seminar-availability picker. The visual grid is a classic weekly timetable:
rows are time slots (08:00 / 10:00 / 13:00 / 15:00), columns are the five weekdays
(Mon–Fri). Each of the 20 cells is a "I can attend" checkbox. The student's actual task is
"decide my whole week one day at a time," so focus is driven **column-major (by day)**:
all four Monday slots, then all four Tuesday slots, etc. The column order is produced with
**contiguous, day-grouped positive `tabindex` values** (Mon = 10–13, Tue = 14–17, …,
Fri = 26–29). Because those values group cleanly by day, they DO follow a logical
relationship, so this is a valid alternative order, not an F44 scramble — the page
**passes**.

## Attribute tuple
- **Content domain:** higher-ed / course registration (LMS-adjacent)
- **UI component / pattern:** `<table>`-based weekly timetable of checkboxes (calendar matrix)
- **Host-language construct:** sequential positive `tabindex` re-sequencing focus column-first (distinct from case-01's CSS-Grid DOM-order mechanism)
- **Locale / i18n:** en
- **Failure mechanism:** NONE — false-positive trap. Positive tabindex is present (a common automated red-flag) but the order it produces is logical (by-day grouping).

## Developer persona
A junior dev was told by the academic-advising team that students "always plan their week
day by day." The HTML table was authored row-major (one `<tr>` per time), but to make the
tab flow match how advisers coach students, the dev sprinkled `tabindex` on the checkboxes
counting down each day's column before starting the next. They kept the values contiguous
and grouped, unaware that "positive tabindex" is a generic lint flag — but in this case the
order it yields is genuinely meaningful.

## Element / selector carrying the issue
The 20 `td input[type="checkbox"]` controls. Tab order is the `tabindex` ascending sequence
10→29, which traverses the grid column-major (by weekday). Visual/DOM order is row-major (by
time). Inspect the `tabindex` attribute values per column.

## Exact accessibility mechanism
A keyboard user pressing Tab lands on Mon-08:00, Mon-10:00, Mon-13:00, Mon-15:00, then
Tue-08:00 … Each checkbox is wrapped in an explicit `<label>` with a unique spoken name
("Mon 13:00, §A3, checkbox"), so the screen-reader announcement at each stop is
unambiguous and the by-day run is coherent. Meaning (a per-day availability column) and
operability (every cell reachable once) are preserved. The SC permits column-at-a-time as
an alternative and requires only one valid order, so an evaluator must not flag this — the
hard call is recognizing that day-grouped tabindex is logical, not a meaning-destroying
reorder.

## Expected ACT-style outcome
**passed** (SC 2.4.3). A valid column-major alternative; the presence of positive tabindex
does not by itself violate 2.4.3 when the resulting order follows a content relationship.

## Why automated tools miss it
axe-core/WAVE/Lighthouse have no rule that fails 2.4.3 on order; at most they emit a generic
"avoid positive tabindex" *best-practice* advisory (often suppressed), which is not a
conformance failure. They cannot determine that the tabindex sequence groups by day and
therefore "reflects a logical relationship." A heuristic that flagged every positive
tabindex as a 2.4.3 failure would false-positive on this legitimate page — exactly the
over-flagging this aspect measures.

## Citation
**Reference:** WCAG 2.2 Understanding — Focus Order (`wcag-understanding/focus-order.html`)
> "If there is more than one order that preserves meaning and operability, only one of them needs to be provided."

**Reference:** WCAG Technique F44 (`wcag-techniques/failures/F44.html`)
> "This document describes a failure that occurs when the tab order does not follow logical relationships and sequences in the content."
(Here the tab order DOES follow a logical relationship — the by-day grouping — so F44 does not apply.)
