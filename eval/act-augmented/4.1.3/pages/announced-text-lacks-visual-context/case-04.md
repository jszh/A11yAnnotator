# case-04 — Seat-map selection announces "Selected" but not "Seat 14C selected" (grid position is the locator)

## Scenario
A concert-ticketing seat-selection page ("Aurora Concert Hall"). A grid of seat buttons (rows 12–15,
seats A–H) lets the user pick seats. Each seat button has a complete accessible name (e.g. "Row 14,
seat C, available") and a valid `aria-pressed` state. Selecting a seat turns it green and writes a
message into a shared `role="status"` / `aria-atomic="true"` live region — but the message is just
"Selected" (or "Removed"), never "Seat 14C selected." Which seat was chosen is conveyed only by which
cell in the visual map changed color.

## Attribute tuple
- **content-domain:** events / concert ticketing
- **UI-component/pattern:** interactive seat map (grid of toggle buttons) + shared status region
- **host-language construct:** `<button aria-pressed>` seats; one shared `<span role="status" aria-live="polite" aria-atomic="true">` set to "Selected"
- **locale/i18n:** en
- **failure-mechanism:** announced status omits the seat coordinate that the visual grid position supplies; no seat identity placed in the atomic region

## Developer persona
An agency developer who carefully built each seat button with a descriptive `aria-label` and toggling
`aria-pressed` — they clearly understood accessible names and states. For the *selection confirmation*
they added a shared status line and wrote "Selected" because, at the moment of clicking, the seat is
visibly highlighted and the seat number is implicit from where the user clicked. They conflated "the
control announces its name on focus" (true) with "the status confirmation re-states which control" —
the status line is a separate region and never repeats the seat coordinate. They tested by clicking and
watching the green fill, never by listening to the confirmation in isolation.

## Element / selector carrying the issue
`#seatStatus` (`span[role="status"][aria-live="polite"][aria-atomic="true"]`). On selection it is set
to `"Selected"`. The seat identity lives on the individual seat button's `aria-label` (e.g. "Row 14,
seat C, available") and on its visual grid position, not in the status region.

## Exact accessibility mechanism (what AT experiences, why it fails)
A screen-reader user arrows to a seat, hears "Row 14, seat C, available, toggle button, not pressed,"
and presses Enter. The button's `aria-pressed` flips to true (announced as "pressed"), and the shared
polite status region updates to "Selected," which the screen reader speaks as "Selected." The status
*confirmation* never says "Row 14 seat C." For a sighted user the just-clicked seat is unambiguous —
it is the one that turned green in the map. For the AT user, if they are reviewing their picks, the
running confirmation log is a series of identical "Selected" announcements with no coordinates. The
status message — the thing meant to confirm the outcome — lacks the seat context the visual map
carries. Remediation: announce "Seat 14C selected" (the coordinate placed inside the atomic region).

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The seat buttons pass name/role/state checks; the status region is present, valid, non-empty, and
announced — so it is neither an F103 missing-role failure nor a 4.1.2 naming failure. There is no
automated rule that the *confirmation status* must restate which control was acted on when the control's
identity is otherwise conveyed by visual grid position. axe/WAVE/Lighthouse cannot reason that
"Selected" is insufficient because the seat coordinate exists only as the spatial location of the
changed cell. That mapping of map-position to required status text is human judgment.

## Citation
> **WCAG 2.2 Understanding 4.1.3, `wcag-understanding/status-messages.html` — "Non-displayed text specific to AT users":**
> "There may be cases where the addition of visible text does not by itself convey sufficient
> information to the user of assistive technology. For example, the proximity of new content to other
> pieces of information on the screen may provide a visual context that is lacking in the text alone."

> **WCAG 2.2 Understanding 4.1.3, `wcag-understanding/status-messages.html` — Intent:**
> "The ability of an assistive technology to announce such new important text content allows more users
> to benefit from an awareness of the information in an equivalent manner."

> **WCAG Technique ARIA22, `wcag-techniques/aria/ARIA22.html` — Tests / Procedure step 3:**
> "Check that elements or attributes that provide information equivalent to the visual experience for
> the status message ... also reside in the container."
