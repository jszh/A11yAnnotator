# case-02 — `role="grid"` date picker that captures BOTH Tab and Shift-Tab to "keep focus in the calendar"

## Scenario
A flight-booking site ("Meridian Air"). The "Departure date" field opens an ARIA grid date picker — `role="grid"` with `role="gridcell"` day cells, roving tabindex, an accessible name via `aria-labelledby`, and arrow-key navigation between days (this is the exact "calendar widget" construct the WCAG Understanding cites as the canonical example). The defect: the grid's keydown handler captures BOTH `Tab` and `Shift+Tab` with `preventDefault()` and remaps them to next/previous day, "so the user doesn't tab out of the calendar before choosing a date." There is no `Esc` handler and no instruction. Once focus enters the grid the user can never reach the "Search flights" button — until they happen to press Enter on a day (which is not Tab and not advised anywhere).

## Attribute tuple
- **content-domain:** travel / flight booking
- **UI-component / pattern:** APG `grid` date picker with roving tabindex and 2-D arrow navigation
- **host-language construct:** `keydown` handler `preventDefault()`ing `Tab` AND `Shift+Tab` and remapping both to cell movement
- **locale / i18n:** en-US
- **failure-mechanism:** the calendar-widget example's interaction model is implemented, but Tab in *both* directions is also confiscated — the very key the Understanding names as a standard exit is swallowed

## Developer persona
A booking-funnel engineer was told by product that "users keep tabbing past the date picker and submitting an empty search." Rather than validate the field, they made the calendar "sticky" by blocking Tab/Shift+Tab while it is open, reasoning that arrows are how you move in a calendar anyway. They added Enter-to-pick as the only way the grid closes, and never wrote any "press Esc to leave" affordance.

## Element / selector carrying the issue
`tbody#calGrid[role="grid"]` — its `keydown` listener's `case 'Tab': e.preventDefault(); ...` branch (handles both `shiftKey` directions). Day cells are `td[role="gridcell"]`.

## Exact accessibility mechanism (what AT experiences, why it fails)
- The grid is a textbook calendar widget: arrows move left/right/up/down between day cells (`ArrowRight`/`ArrowLeft`/`ArrowDown`/`ArrowUp`), `Home`/`End` jump to row ends, roving tabindex keeps exactly one cell tabbable. This matches the Understanding's calendar example precisely.
- A keyboard user opens the calendar and lands on Oct 1. Arrows navigate the month — correct.
- Pressing `Tab` does NOT move to the "Search flights" button; pressing `Shift+Tab` does NOT move back to the "To" field. Both are intercepted and remapped to day movement. There is no `Esc` exit and no documented alternate key.
- Net: focus enters the grid and the only standard exit keys (Tab and Shift+Tab, named in the SC and the Understanding) are both confiscated in both directions. A keyboard or screen-reader user is stuck on the calendar.
- Verified with Puppeteer: after opening the calendar, 8 consecutive `Tab` presses stay on `role="gridcell"` and never reach `#searchBtn` (`tabExitsToAfter: false`).

## Expected ACT-style outcome
**failed** — SC 2.1.2. This is the FAIL half of the aspect's grid contrast: arrows-captured-AND-Tab-also-swallowed (both directions) with no advised exit. (A grid where Tab correctly exits to the next control — leaving Tab alone while only arrows move cells, as the calendar example intends — would PASS; this page is the failing variant.)

## Why automated tools miss it
axe-core reports zero violations (verified). The grid is valid ARIA with a complete name/role/structure and a correct roving tabindex — nothing static to flag, and indeed this is the *recommended* calendar pattern. The trap is the `preventDefault()` on Tab/Shift+Tab, observable only by actually pressing those keys inside the open grid and confirming focus never leaves. An automated checker cannot tell an arrows-only grid (compliant) from an arrows-plus-Tab-captured grid (a trap) without driving both key classes and reasoning that the *grid* is supposed to release Tab even while it owns the arrows. That two-key-class behavioural test plus widget-semantics judgment is exactly what tools cannot do.

## Citation
> "A calendar widget allows users to add, remove or update items in their calendar using the keyboard. The controls in the widget are part of the tab order within the web page, allowing users to tab through the controls in the widget as well as to any links or controls that follow."
— wcag-understanding/no-keyboard-trap.html (Examples — the canonical calendar widget this page subverts: tabbing must reach "any links or controls that follow")

> "Keyboard focus is not considered trapped when the user can navigate away from a component using only a keyboard interface, and if it only requires unmodified arrow or `Tab` keys or other "standard exit methods"."
— wcag-understanding/no-keyboard-trap.html (Intent)

> "Keyboard access is restricted to a small section of the page with no way to navigate out of the "loop" to the rest of the page."
— refs/trusted-tester/sc-2.1.2-no-keyboard-trap.md (How to Test, 2b — the trap condition met here)
