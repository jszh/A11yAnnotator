# case-06 — Airline seat map "exit row" flagged only by a background-image glyph

## Scenario
An airline seat-selection page. Exit-row seats (row 12) are flagged with a green
"emergency exit / running person" glyph, but the glyph is a stylesheet `background-image`
(`button.seat.exit { background-image: ... }`) painted into the corner of each seat button.
The buttons' accessible names are just the seat numbers ("12A", "12F"); the exit-row status
is image-only. A visible legend mentions exit rows generically ("Exit-row seats offer extra
legroom and may carry an additional fee") but is **not** programmatically tied to which seats
are exit-row, so an AT user cannot map the legend to a specific seat. This is a long-tail
travel variant where the F3 carrier sits on an otherwise-nameable interactive control.

## Attribute tuple
- **content-domain:** travel / airline booking
- **UI-component / pattern:** interactive seat-map grid of toggle buttons
- **host-language construct:** stylesheet rule `background-image` on `<button class="seat exit">`
- **locale / i18n:** en-GB (EDI→GVA)
- **failure-mechanism:** F3 — per-seat "exit row" status conveyed exclusively by a background image; legend text not associated

## Developer persona
A dev on the booking team implemented the seat map; the `seat.isExitRow` flag from the API was
mapped to a CSS class that paints the exit icon. The button's label was wired from the seat
number only. The team added a one-line legend paragraph "for clarity", believing that satisfied
the requirement — not realising the legend is unlinked to the seats and that the per-seat exit
status remains image-only in the accessibility tree.

## Element / selector carrying the issue
- `button.seat.exit` (12A–12D) — toggle buttons whose accessible name is the seat number; the
  `.exit` background-image glyph is the only per-seat carrier of exit-row status.
- `.legend` — generic exit-row prose, not associated (`aria-describedby` etc.) with the seats.

## Exact accessibility mechanism (what AT experiences)
A screen-reader user tabbing the grid hears "12A, button, not pressed" — identical to "13A,
button, not pressed" one row down — with no signal that 12A is an exit-row seat. Exit-row
seats carry real consequences (eligibility rules, an evacuation-assistance duty, extra cost),
yet that status lives entirely in a `background-image`, which adds nothing to the accessibility
tree. The unlinked legend does not help: the user has no way to know *which* buttons it refers
to. Forced-colors / "hide backgrounds" removes the glyph for sighted users as well.

## Expected ACT-style outcome
**failed** — F3: the per-seat exit-row designation is conveyed exclusively by a CSS background
image and is not programmatically determinable per seat (the legend is not associated). ACT
1.1.1 rules are **Inapplicable**: the buttons already have accessible names (seat numbers), so
accessible-name rules pass, and the F3 carrier (a background image) is not itself a nameable
element.

## Why automated tools miss it
Every seat button has a non-empty accessible name, so accessible-name and button-name rules
pass. The exit indicator is a `background-image` — no `image-alt` target, no extra
accessibility node. axe/WAVE/Lighthouse cannot OCR the exit glyph, cannot tell that exit-row
status is missing from the button name, and cannot detect that a nearby legend paragraph is
*supposed* to (but does not) describe specific seats. Recognising the green glyph as
load-bearing safety information requires human visual + domain judgment.

## Citation
**Reference:** WCAG Technique F3 — *Failure of Success Criterion 1.1.1 due to conveying
information exclusively using CSS background images* (`wcag-techniques/failures/F3.html`).

> "Therefore, it is a failure to use this property to add images to convey this required
> information."

**Supporting reference:** Trusted Tester v5.1.3 — Test 7.C, How to Test
(`refs/trusted-tester/sc-1.1.1-non-text-content.md`).

> "For each background image, determine whether important information provided by it is
> available without it."
