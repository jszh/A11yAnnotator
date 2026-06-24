# case-06 — 2D saturation/brightness colour square draggable only; keyboard hue slider is a DIFFERENT function (FAIL)

## Scenario
Canvasly's brand-kit editor lets a user choose a primary colour. The classic colour-picker UI has a 2D
saturation/brightness square (drag the handle anywhere inside) plus a hue slider below. The hue slider is
a **native `<input type="range">`** — fully focusable and arrow-key operable. The 2D square, however, is a
plain `<div>` with pointer drag handlers only: no `role`, no `tabindex`, no key handler. So saturation and
brightness cannot be set by keyboard at all. This is the hardest boundary in the set: it requires two
separate human judgments to land the verdict.

## Attribute tuple
- **Content domain:** no-code / design tool (brand-kit colour editor)
- **UI component / pattern:** 2D HSV colour picker (saturation/value square + hue slider)
- **Host-language construct:** `div[role=application]` with `pointerdown`/`pointermove` for S/V (no keyboard) ALONGSIDE a native keyboard-operable `input[type=range]` for hue
- **Locale / i18n:** en-US, hex colour notation
- **Failure mechanism:** the endpoint-dependent S/V square has no keyboard route, and the one keyboard control present (hue) is a *different* function, so no keyboard alternative for S/V exists anywhere

## Developer persona
A product designer building in a design tool reached for the ubiquitous "drag-in-the-square + hue slider"
colour picker. They used a native range input for hue (so that part is keyboard-fine) but built the
saturation/brightness square as a div with pointer handlers, the way every colour-picker tutorial does.
They assumed that because the picker "has a keyboard slider," the picker was keyboard accessible — not
noticing that the slider only moves hue and that S/V are stranded behind a pointer-only square.

## Element / selector carrying the issue
`#sv` (`div[role="application"]`) — the saturation/brightness square. It has pointer drag handlers only;
no element on the page provides a keyboard way to change saturation or brightness. (`#hue` is keyboard
operable but controls a different dimension.)

## Exact accessibility mechanism
A keyboard user can focus the hue range input and change the hue with arrow keys — but there is no way to
focus or operate the saturation/brightness square: it is a `<div>` with no `tabindex` and no `keydown`
handler. Two judgments make this a failure: **(1) endpoint, not path.** The square is endpoint-dependent —
only the final (x = saturation, y = brightness) position the handle lands on matters; the wandering path
of the drag is irrelevant — so it is NOT the free-hand/watercolour exception (contrast case-05) and DOES
require a keyboard equivalent (arrow keys on a 2D slider, or S/V number inputs). **(2) different function,
not parity.** The keyboard-operable hue slider sets a *different* dimension; it does not provide a keyboard
route to saturation or brightness, so the G202 "keyboard alternative exists elsewhere" allowance does not
rescue it. Therefore SC 2.1.1 fails: the S/V function is pointer-only and endpoint-dependent.

## Expected ACT-style outcome
**failed** (SC 2.1.1 Keyboard — saturation/brightness selection is pointer-only and endpoint-dependent;
the keyboard hue slider is a different function, so no keyboard route to S/V exists).

## Why automated tools miss it
axe/WAVE see a real, focusable, labeled `<input type="range">` for hue and conclude the colour picker has
keyboard support; the S/V square is just a div, which scanners do not recognize as a *control* needing
keyboard operation. Catching the failure needs both human judgments: that the square is endpoint- (not
path-) dependent and thus in scope, and that the hue slider is a *different function* so its keyboard
operability does not count as parity. Neither "is this drag path-dependent?" nor "is the other keyboard
control the same function?" is expressible as a DOM lint.

## Citation
**Reference:** WCAG 2.2 Understanding — Keyboard (`wcag-understanding/keyboard.html`)
> "Drawing straight lines, regular geometric shapes, re-sizing windows and dragging objects to a location (when the path to that location is not relevant) do not require path dependent input."

**Reference:** WCAG Technique G202 — Ensuring keyboard control for all functionality (`wcag-techniques/general/G202.html`)
> "This does not necessarily mean that each of the individual controls can be used from the keyboard as long as there are multiple methods to perform the same function available on the page."

**Reference:** WCAG Technique F54 — Failure of SC 2.1.1 due to using only pointing-device-specific event handlers (`wcag-techniques/failures/F54.html`)
> "If check #1 is true and check #2 is false, then this failure condition applies and content fails Success Criteria 2.1.1 Keyboard and 2.1.3 Keyboard (No Exceptions)."
