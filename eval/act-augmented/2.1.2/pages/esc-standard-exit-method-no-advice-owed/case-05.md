# case-05 — Inline APG-style date-picker grid that clamps arrows AND captures Tab/Shift+Tab/Esc — no standard exit fires, no advice (FAIL)

## Scenario
A coworking-space room-booking form (Atrium Coworking, "Book the Birchwood room"). The Date field is an
**inline, non-modal** date-picker rendered as an APG-style `role="grid"` calendar: a roving `tabindex`
puts exactly one day cell in the tab order, and arrow keys move day-to-day inside the grid. This is the
correct, standard way to navigate *within* a grid — so far so good. The failure is that the grid's
keydown handler also **captures `Tab` and `Shift+Tab` and redirects them back onto another day cell**,
**clamps the arrow keys at the grid edges** (no roll-out to the next/previous control), and **swallows
`Esc`** with `preventDefault()` while wiring no exit. Once a keyboard user lands on a day, *no* standard
exit method (Tab, Shift+Tab, arrows-out, Esc) moves focus out of the calendar to the Start-time `<select>`
or back to the name field, and there is no advice text naming any escape key. The only way out is the mouse.

## Attribute tuple
- **Content domain:** workplace / facilities booking (coworking meeting-room reservation)
- **UI component / pattern:** inline (non-modal) APG-style date-picker `role="grid"` with roving `tabindex`
- **Host-language construct:** `table[role=grid]` of `button[role=gridcell]`; a grid-level `keydown` that `preventDefault()`s `Tab`/`Shift+Tab`/arrows/`Esc`
- **Locale / i18n:** en
- **Failure mechanism:** the component handles its own *in-grid* navigation correctly but intercepts EVERY standard exit method, so focus that enters the grid cannot leave it by keyboard; no documented alternate key is provided

## Developer persona
A developer hand-built a date picker after reading the APG grid pattern. They correctly added roving
`tabindex` and arrow-key movement, and — to keep the grid feeling "app-like" — also intercepted `Tab`
so it would step day-to-day "like a spreadsheet," reasoning that "arrow keys / Tab are the standard way
to move around a grid." They never noticed that `Tab` must still be able to *leave* the widget, and they
clamped the arrows at the edges rather than rolling focus out. Their manual check was mouse-driven
(click a day, click Confirm), so the trap never surfaced before shipping.

## Element / selector carrying the issue
`#calGrid` (`table[role=grid]`) and its `.day` (`button[role=gridcell]`) cells. The grid-level `keydown`
listener calls `e.preventDefault()` for `Tab`, `Shift+Tab`, the arrow keys at the boundary, and `Escape`,
and only ever moves focus to another day — so there is no keyboard path out of the grid.

## Exact accessibility mechanism
A keyboard/AT user tabs from the name field into the calendar and lands on a day cell. They then try to
continue to the Start-time control: `Tab` just moves to the next day; `Shift+Tab` moves to the previous
day; arrowing down/right past the last day clamps on day 31; `Esc` does nothing. There is no on-screen
instruction naming an escape key. Focus is genuinely trapped on the calendar for keyboard-only users
(a mouse user can simply click out, which is how the bug evaded the author). This sits exactly on the
SC's conditional-pass boundary: in-grid arrow navigation needs no advice, but because **no** standard
exit method actually releases focus *and* no alternate method is documented, the component fails.

## Expected ACT-style outcome
**failed** (SC 2.1.2). Keyboard focus can be moved *to* the grid but cannot be moved *away from* it using
standard navigation keys, and no documented custom keystroke is provided — keyboard focus is trapped.

## Why automated tools miss it
The markup is a valid APG grid: correct `role="grid"`/`role="gridcell"`, a single tab stop via roving
`tabindex`, labelled month-nav buttons, and scoped column headers. Static scanners (axe, WAVE, Lighthouse)
inspect structure and a single tab stop and report no issue; axe-core in particular has no rule for
runtime keyboard traps. The defect lives entirely in the `keydown` handler's `preventDefault()` of the
exit keys and only manifests once focus is *inside* the grid and a key is pressed. Catching it requires a
human (or scripted keyboard driver) to enter the grid and attempt each standard exit method — the
per-position, drive-the-keyboard discipline the spec's "each section of the page" framing demands. A
deterministic Puppeteer probe confirms it: from a day cell, Tab / Shift+Tab / Esc / arrows-to-edge all
keep focus on a `.day` cell, while a mouse click on the Start-time `<select>` escapes — a keyboard-only trap.

## Citation
**Reference:** WCAG 2.2 Understanding — No Keyboard Trap (`wcag-understanding/no-keyboard-trap.html`)
> "Keyboard focus is not considered trapped when the user can navigate away from a component using only a keyboard interface, and if it only requires unmodified arrow or Tab keys or other \"standard exit methods\"."

**Reference:** WCAG 2.2 Understanding — No Keyboard Trap (`wcag-understanding/no-keyboard-trap.html`)
> "If untrapping focus requires a different method (rather than unmodified arrow keys, the Tab key, or other \"standard exit methods\"), content can still pass this criterion provided that the user is advised how they can untrap focus using their keyboard interface."

**Reference:** Trusted Tester v5.1.3, Test 4.C — How to Test (`refs/trusted-tester/sc-2.1.2-no-keyboard-trap.md`)
> "Keyboard users are unable to move away from an element (e.g., using TAB or an arrow key)."
