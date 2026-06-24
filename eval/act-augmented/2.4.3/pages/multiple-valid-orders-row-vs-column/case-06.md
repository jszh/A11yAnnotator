# case-06 — Theatre seat map, focus scatters randomly across the grid (FAIL)

## Scenario
A theatre seat-selection map. The grid's rows are seat rows A–D (front to back) and its
columns are seat numbers 1–6; each seat is a focusable `<button role="checkbox">` the patron
toggles. For a seating map **both** orders are valid — row-by-row (A1…A6, B1…) or
column-by-column (A1, B1, C1, D1, then A2…) — because either reflects the auditorium's
spatial layout. This page provides **neither**. The seat buttons are emitted in DOM source
order as a **random scatter** (the order they were dragged onto the layout canvas: B3, A6,
D1, A2, C5, B1, …), and CSS Grid pins each to its true (row, seat) position so the map
*looks* correct. Tab therefore teleports the focus ring around the auditorium — front-left,
back-right, mid-center — with no relationship to row, seat number, or adjacency. This is the
**meaning-destroying near-twin** of a valid row/column seat order — it **fails**.

## Attribute tuple
- **Content domain:** events / ticketing (theatre booking)
- **UI component / pattern:** spatial seat-map picker built from toggle buttons (`role="checkbox"`)
- **Host-language construct:** random-scatter DOM source order + CSS Grid coordinate pinning (focus order = scattered source order)
- **Locale / i18n:** en
- **Failure mechanism:** focus order follows neither a row, a column, nor proximity — a scatter that destroys the spatial relationship (the contrast case against case-01/02/04/05's valid column orders, and against a valid row order)

## Developer persona
A junior front-end dev built the seat map in a visual layout tool, dragging seat components
onto a canvas one at a time in whatever order caught their eye, and exported the result. The
export preserved the drag order as DOM source order and used absolute grid coordinates for
visual placement. Because mouse users click seats directly, the scrambled tab order was never
noticed in QA — it only surfaces for keyboard and screen-reader users.

## Element / selector carrying the issue
The 24 `.seat[role="checkbox"]` buttons inside `.map[role="group"]`. DOM/source order is the
scatter listed in the page comment (B3 → A6 → D1 → A2 → C5 → …); visual position is set per
button via `grid-column` (seat number) and `grid-row` (seat row). Compare DOM order to the
`grid-row`/`grid-column` values to see that consecutive focus stops share no row, no column,
and no adjacency.

## Exact accessibility mechanism
A keyboard user Tabbing the map sees the focus ring jump from Row B Seat 3 to Row A Seat 6 to
Row D Seat 1 to Row A Seat 2 — front, back, front again — unable to track their position in
the plan or methodically pick adjacent seats. A screen-reader user hears "Row B, Seat 3,
available", "Row A, Seat 6, available", "Row D, Seat 1, available" — an order that conveys no
spatial structure, making it nearly impossible to mentally reconstruct which seats are next to
each other (the whole point of a seat map). Each seat's name is correct, but the *sequence*
impedes both the meaning (the auditorium's spatial layout) and the operability (choosing seats
together). This is exactly the illogical/confusing focus order the SC prohibits, and it is what
distinguishes a scatter from the protected row/column alternatives.

## Expected ACT-style outcome
**failed** (SC 2.4.3). The focus order preserves neither a row, a column, nor adjacency; it is
a meaning-destroying scramble, not a different-but-valid order.

## Why automated tools miss it
Every seat button has a correct accessible name (`aria-label`), valid `role="checkbox"` +
`aria-checked`, sufficient contrast, and a visible focus ring — axe-core, WAVE, and Lighthouse
report nothing. No static tool reconstructs the seat grid's spatial relationship to test whether
the DOM/focus sequence follows it. Distinguishing this random scatter from a valid column-major
seat order requires a human to understand the map's spatial meaning and watch where the focus
ring actually travels.

## Citation
**Reference:** WCAG 2.2 Understanding — Focus Order (`wcag-understanding/focus-order.html`)
> "Care should be taken so that the focus order makes sense to both of these sets of users and does not appear to either of them to jump around randomly."

**Reference:** WCAG 2.2 Understanding — Focus Order (`wcag-understanding/focus-order.html`)
> "it is a failure of Focus Order if items receive focus in an order that impedes the meaning or operation of content, or creates confusing or illogical focus orders"
