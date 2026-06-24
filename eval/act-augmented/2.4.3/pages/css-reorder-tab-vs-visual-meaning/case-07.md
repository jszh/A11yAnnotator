# case-07 — Seat-selection grid: CSS places seats 1–40 row-major, but DOM is column-major so Tab walks down columns

## Scenario
A theater seat-selection chart for "Riverbank Playhouse." It renders as a plainly numbered
grid: 8 seat columns by 5 rows, with the seats **numbered 1 through 40 straight across** —
row 1 is `1 2 3 4 5 6 7 8`, row 2 is `9 10 … 16`, down to row 5 `33 … 40`. A sighted user
reads it the natural way (left-to-right across a row, then down), and crucially the **number
printed on each seat *is* its position in that reading order** — so the intended order is
self-evident from the page itself, with no calendar/date arithmetic to reconstruct. Every
seat is a real `<button>`, placed into the chart by CSS `grid-column` (.col-N) and
`grid-row` (.row-N), so the seats *look* correctly arranged: seat 1 top-left, seat 40
bottom-right. But the DOM emits the buttons **column-major** — all of column 1 first
(1, 9, 17, 25, 33), then all of column 2 (2, 10, 18, 26, 34), and so on. With **no positive
tabindex and no script**, keyboard Tab follows the DOM, so focus walks **down each column**:
1, 9, 17, 25, 33, 2, 10, 18, 26, 34, 3, 11, … The visited seat numbers do not ascend; the
keyboard focus order contradicts the visible numbered order shown by the chart.

## Attribute tuple
- **content-domain:** arts / ticketing — theater seat selection
- **UI-component / pattern:** numbered seat-selection grid (grid of seat buttons)
- **host-language construct:** CSS Grid 2-D placement (`grid-column` + `grid-row`) with a
  column-major DOM emission order; no `tabindex`, no JS
- **locale / i18n:** en-US, western left-to-right reading
- **failure-mechanism:** an ordered, explicitly-numbered 2-D sequence (seats 1–40) whose
  focusable cells are visited column-wise instead of in the visible numbered reading order

## Developer persona
A developer generated the chart server-side by looping over seat columns ("for each column,
output that column's seats top to bottom") because the venue's inventory feed was stored
column-by-column. They positioned each seat with `grid-column`/`grid-row` so the visual
chart came out right and the numbers landed where expected, and verified it *looked* correct
in the browser. The column-major emission order — invisible to the eye — silently became the
tab order. They never keyboard-tested the chart.

## Element / selector carrying the issue
The seat `<button>` elements inside `.grid`. They are positioned by `.col-N`/`.row-N` to
form the visible numbered chart, but their **DOM order is grouped by column** (e.g. column 1
seats 1, 9, 17, 25, 33 appear consecutively in source). The result is a tab order of
1, 9, 17, 25, 33, 2, 10, 18, 26, 34, 3, … — not the 1, 2, 3, … sequence printed on the
seats and implied by the grid.

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Sighted mouse user:** clicks the desired seat directly; the source order is invisible.
- **Sighted keyboard / switch user:** Tabbing into the chart moves focus straight **down the
  first column** (1 → 9 → 17 → 25 → 33), then jumps to the top of the next column. To reach
  the seat printed "5" — the fifth seat a reader sees — the user must Tab past 20 other seats
  first (it is the **21st** Tab stop). The seats are an inherently **ordered, numbered
  sequence**, and the chart presents them in plain numeric reading order; the focus order
  does not preserve that meaning or operability — it is confusing, makes choosing a specific
  seat laborious, and makes reasoning about "the seat next to the one I just focused" wrong
  (Tab from seat 1 lands on seat 9, not seat 2).
- This is the Understanding's failing standard: a focus order that "impedes the meaning or
  operation of content, or creates confusing or illogical focus orders." (Note: an APG grid
  widget might offer arrow-key 2-D navigation, but this page provides none — Tab is the only
  sequential mechanism, and it is column-major.)

## Expected ACT-style outcome
**failed** (SC 2.4.3). The focusable seat controls receive focus in a column-major order
(1, 9, 17, 25, 33, 2, 10, …) that contradicts the explicitly numbered 1→40 sequence shown by
the visual chart, breaking the meaning and operability of seat selection.

## Why automated tools miss it
- No positive `tabindex` and no JS → F44 / tab-order linters find nothing.
- Every seat is a real `<button>` with an `aria-label`; the group has an accessible name;
  contrast is fine → axe/WAVE/Lighthouse pass.
- CSS Grid 2-D placement and the column-major DOM order are both individually valid.
  Detecting the defect requires (1) rendering the chart, (2) recognizing that the cells form
  an ordered numbered sequence read left-to-right then top-to-bottom, and (3) comparing that
  to the actual Tab path to see it walks columns instead. Reconstructing the intended visual
  reading sequence of a 2-D grid and judging the focus order against it is exactly the human
  visual/semantic task the Understanding flags; no DOM-only scan performs it.

## Verification note
Rendered and probed with headless Chrome: seats sorted by on-screen geometry (top, then
left) read `1, 2, 3, …, 40` ascending — i.e. the visual chart is a correctly numbered grid.
The actual keyboard Tab sequence is `1, 9, 17, 25, 33, 2, 10, 18, 26, 34, 3, 11, …`
(identical to DOM source order, since there is no tabindex/JS). The seat printed "5" is the
21st Tab stop. Visual reading order and Tab order therefore diverge as documented.

## Citation
> "Focus order needs to allow the user to navigate focusable elements in a logical order, and that order needs to preserve any meaning or operation that the page is conveying."
— wcag-understanding/focus-order.html (Intent of Focus Order)

> "When the source order does not match the visual order, the tab order through the content must reflect the logical relationships in the content that are displayed visually."
— wcag-techniques/general/G59.html (Description)
