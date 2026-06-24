# case-05 — Flight itinerary: `grid-template-areas` shows depart→arrive per leg, but DOM groups all departures then all arrivals

## Scenario
A booking-confirmation itinerary. Visually each leg shows **Depart → Arrive** on one line: Outbound `07:15 BUE → 10:05 SCL`, Return `19:40 SCL → 22:30 BUE`. It is a CSS grid using `grid-template-areas`. But after an i18n refactor the markup authors **all departure times first, then all arrival times** (a "departures block" + "arrivals block" so two translators could work in separate passes). DOM/linearized order is therefore `Outbound, Return, 07:15-depart, 19:40-depart, 10:05-arrive, 22:30-arrive`. Grid placement re-interleaves them on screen; linearized, a screen-reader user hears the two **departures** back to back and then the two **arrivals**, so the return's 19:40 departure sits next to the outbound's 10:05 arrival and the legs scramble.

## Attribute tuple
- **content-domain:** travel / airline booking confirmation
- **UI-component / pattern:** multi-leg flight itinerary (label / depart / arrive grid)
- **host-language construct:** `display:grid` + `grid-template-areas`; DOM split into all-departures then all-arrivals
- **locale / i18n:** times localized in a two-pass translation split (the refactor that caused the DOM grouping)
- **failure-mechanism:** F1-style — grid placement pairs depart/arrive per leg visually while source order groups by field, scrambling which time belongs to which leg

## Developer persona
The airline's front-end team localized the confirmation page in two passes. To let one translator own "departures" and another own "arrivals", a refactor split the per-leg template into a departures block and an arrivals block, leaving placement to `grid-template-areas`. The grid still rendered each leg's depart→arrive pair correctly, so QA's visual check passed and nobody re-read the now field-grouped source order.

## Element / selector carrying the issue
`.legs` (the `grid-template-areas` container). The time cells are in DOM order `outdep, retdep, outarr, retarr` (all departures, then all arrivals) but grid-placed as depart/arrive per leg row.

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Sighted user:** reads each leg as a coherent depart→arrive pair on its own row.
- **Screen-reader user:** grid placement is presentational; the reading order follows source, so the user hears: "Outbound · Sat 14 Jun", "Return · Sat 21 Jun", "07:15 Depart Buenos Aires", "19:40 Depart Santiago", "10:05 Arrive Santiago", "22:30 Arrive Buenos Aires". The two departures are spoken consecutively, then the two arrivals — so a listener attempting to pair adjacent times binds the **return departure (19:40)** to the **outbound arrival (10:05)** and may believe a same-day connection exists that does not. The depart/arrive of each leg are never read adjacently.
- Verified with Puppeteer: visual order pairs each leg's depart then arrive (`Outbound, 07:15-dep, 10:05-arr, Return, 19:40-dep, 22:30-arr`); DOM/linearized order is `Outbound, Return, 07:15-dep, 19:40-dep, 10:05-arr, 22:30-arr`.

## Expected ACT-style outcome
**failed** (SC 1.3.2 — the field-grouped source order detaches each flight's departure from its arrival; the programmatically-determined reading order conveys a different, wrong itinerary).

## Why automated tools miss it
All times and labels are real text; there are no empty cells, missing names, or contrast problems, so axe/WAVE/Lighthouse pass. A tool cannot know that a flight leg's depart and arrive must be read adjacently to be understood, nor reconstruct the grid pairing from `grid-area` rules to notice the source order groups by field instead. Judging that the linearized stream scrambles the legs requires reading it as an itinerary — human comprehension of meaning.

## Citation
> "The order in which items appear on a screen may be different than the order they are found in the source document. Assistive technologies rely on the source code or other programmatically determined order to render the content in the correct sequence."
— wcag-techniques/failures/F1.html (Description)

> "Content that does not meet this Success Criterion may confuse or disorient users when assistive technology reads the content in the wrong order, or when alternate style sheets or other formatting changes are applied."
— wcag-understanding/meaningful-sequence.html (Intent of Meaningful Sequence)
