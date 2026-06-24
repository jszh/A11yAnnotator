# case-05 — Map zoom controls named with leaked i18n keys (+ a correctly-named boundary control)

## Scenario
The live route map in a municipal transit app (MetroLink). Three icon-only map controls float
over the map: zoom-in (+), zoom-out (−), and "locate me" (crosshair). The two zoom buttons'
accessible names are raw, un-interpolated i18n message keys that the translation layer never
resolved: `aria-label="map.ctrl.zoomIn"` and `aria-label="map.ctrl.zoomOut"`. A screen reader
announces "map.ctrl.zoomIn, button" — a dotted developer key, not a purpose. The third control
("locate me") was wired correctly with `aria-label="Center map on my location"`, and is
included as a deliberate within-page PASS boundary so the contrast is sharp: same widget, same
toolbar, one descriptive name and two meaningless keys.

## Attribute tuple
- **Content domain:** municipal transit / trip planner map
- **UI component / pattern:** map control cluster (zoom in/out group + locate-me) over a `role="application"` map
- **Host-language construct:** native `<button>` with inline `<svg aria-hidden>`, named via `aria-label`
- **Locale / i18n:** en UI with a broken i18n pipeline — message KEYS leaked into the names
- **Failure mechanism:** un-resolved i18n key string used as the accessible name (non-empty, non-descriptive); plus a correct control as the boundary

## Developer persona
The map control bar reads its labels from a translation helper, e.g. `t('map.ctrl.zoomIn')`.
Two buttons were authored before those keys existed in the en locale file, so `t()` fell
through and returned the key itself as a string — which is non-empty, so no error surfaced. A
later teammate hand-wrote the locate-me button with a literal English `aria-label` and got it
right. Result: two leaked keys and one good name shipped side by side.

## Element / selector carrying the issue
FAIL: `.zoomgroup button[aria-label="map.ctrl.zoomIn"]` and
`.zoomgroup button[aria-label="map.ctrl.zoomOut"]`.
PASS (boundary): `.controls > button[aria-label="Center map on my location"]`.
The zoom buttons' purpose is conveyed only by the + / − glyphs; the key strings carry none of it.

## Exact accessibility mechanism
AccName of the two zoom buttons = the literal key strings "map.ctrl.zoomIn" / "map.ctrl.zoomOut"
(from `aria-label`; SVG is `aria-hidden`). A screen reader announces them verbatim — a user
cannot tell which zooms in and which zooms out, and the dotted-namespace string signals nothing.
The locate-me button announces "Center map on my location, button," which correctly identifies
its purpose. Roles and keyboard operability are correct on all three; only the two zoom names
are defective.

## Expected ACT-style outcome
**failed** (SC 4.1.2) — driven by the two zoom buttons, whose non-empty names PASS the ACT
"Button has non-empty accessible name" rule yet fail to communicate purpose. The locate-me
button is a PASS on the same SC (descriptive name), demonstrating the boundary within one page.

## Why automated tools miss it
All three buttons have non-empty accessible names, so axe/WAVE/Lighthouse pass every one of
them — including the two with leaked keys. No automated rule recognizes "map.ctrl.zoomIn" as an
un-resolved i18n key versus "Center map on my location" as a real purpose; both are valid
strings to a parser. Distinguishing the meaningless keys from the meaningful name requires a
human to read the strings and map them to the + / − / crosshair glyphs — semantic judgment.

## Citation
**Reference:** WCAG Technique ARIA14 (`wcag-techniques/aria/ARIA14.html`)
> "When no clear visible text label is available due to design decisions, the accessible name can be set by using the aria-label attribute instead, provided that the element has an implicit or explicit role that supports naming."

**Reference:** WCAG 2.2 Understanding Name, Role, Value (`wcag-understanding/name-role-value.html`)
> "additional measures need to be taken to ensure that the controls provide important and appropriate information to assistive technologies and allow themselves to be controlled by assistive technologies."
