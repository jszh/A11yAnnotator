# case-03 — Co-working dashboard of four independent widgets (PASS / multiple valid orders)

## Scenario
A "morning dashboard" start page for a co-working space, with four widgets: weather, a stock
watchlist, today&rsquo;s room bookings, and a transit-departures board. CSS grid
`grid-template-areas` places them weather (top-left), transit (top-right), bookings (bottom-left),
stocks (bottom-right). The DOM order is different again: bookings, stocks, weather, transit. None
of this matters &mdash; the four widgets are mutually independent, each internally ordered (the
transit board is soonest-first, the bookings chronological), and nothing is interleaved. Any
permutation of the four reads sensibly, so there is no single correct order to violate.

## Attribute tuple
- **Content domain:** SaaS / co-working facilities dashboard ("start page")
- **UI component / pattern:** CSS-grid dashboard of independent widget cards (feed-of-widgets)
- **Host-language construct:** `grid-template-areas` + `grid-area` mapping DOM order &ne; visual order
- **Locale / i18n:** en
- **Failure mechanism:** NONE present — applicability-gate PASS control demonstrating the
  "more than one order is correct" limb

## Developer persona
A dashboard developer who supports user-customisable widget layouts: users drag widgets into any
grid cell, so the saved CSS `grid-area` rarely matches the DOM insertion order. The team reasoned
(correctly) that because each widget is a standalone card, the source order is irrelevant and they
never bothered to keep DOM order in sync with the grid. An auditor might flag the DOM/visual
mismatch out of habit.

## Element / selector carrying the issue
The `div.grid` container and its four `section.widget` children (`#w-bookings`, `#w-stocks`,
`#w-weather`, `#w-transit`). The judgement concerns the container&rsquo;s lack of meaningful
sequence, not any single widget.

## Exact accessibility mechanism
A screen reader reads the widgets in DOM order: bookings, stocks, weather, transit. Each is a
complete, internally-ordered unit; none bleeds into another. Whether the user hears weather before
or after the bookings changes nothing, because the widgets do not depend on one another. This is
the "multiple correct orders" limb: there are several reading orders that all satisfy the SC, and
the page provides one of them &mdash; which is all that is required.

## Expected ACT-style outcome
**passed** (SC 1.3.2). The container has no meaningful sequence; more than one order is correct and
only one needs to be provided.

## Why automated tools miss it
No tool checks 1.3.2. A DOM-vs-visual-order heuristic would mis-fire on the grid-area remapping.
The correct verdict requires recognising that the four cards are independent &mdash; so every
order is valid &mdash; which is a semantic judgement about the content, not a geometric or DOM-order
fact a checker can derive.

## Citation
**Reference:** WCAG 2.2 Understanding &mdash; Meaningful Sequence, "For clarity" list (`wcag-understanding/meaningful-sequence.html`)
> "There may be more than one order that is \"correct\" (according to the WCAG 2 definition)."

**Reference:** WCAG 2.2 Understanding &mdash; Meaningful Sequence, "For clarity" list (`wcag-understanding/meaningful-sequence.html`)
> "Only one correct order needs to be provided."
