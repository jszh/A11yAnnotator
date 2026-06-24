# case-02 — Live-tracking shortcut needs a rapid double-press of "G" within 250 ms

## Scenario
A public-transit trip planner (Metro Transit) shows a route map. The "center on your live
location / turn on real-time vehicle tracking" function is bound to a documented keyboard
shortcut: pressing **G**. The visible help text reads "G double-press to center on your
location." The handler fires the geolocation function only when two `G` keydown events arrive
within **250 ms** of each other. A single press of G does nothing (it merely arms a 250 ms
window). Two presses more than 250 ms apart are each treated as a fresh first-press and never
fire. No button, menu item, or other keyboard path performs the same function.

## Attribute tuple
- **Content domain:** civic / public transportation (trip planning, live vehicle tracking)
- **UI component / pattern:** keyboard-shortcut on a `role="application"` map region (gmail-style "double-key" accelerator)
- **Host-language construct:** `keydown` handler with an inter-keypress interval check (`Date.now()` delta vs. 250 ms)
- **Locale / i18n:** en
- **Failure mechanism:** rapid double-press / "repeat or execute multiple keystrokes within a short period of time" (2.1.1 second limb), with no single-press alternative

## Developer persona
A junior dev was asked to add a power-user shortcut and copied the "press a letter twice quickly"
idiom from a webmail client they liked (where `gg` jumps to the inbox). They implemented the
250 ms double-press window, tested it themselves by tapping `G` `G` fast, watched the map light
up, and moved on. The product spec only ever said "add a G shortcut for live tracking"; nobody
specified a single-press behaviour or an on-screen button, so geolocation has exactly one trigger
— and that trigger is timing-gated.

## Element / selector carrying the issue
`#map` (the `role="application"` route-map region) and its `keydown` listener. The timing gate is
the `DOUBLE_MS = 250` inter-keypress window; the single-press branch deliberately performs no
action.

## Exact accessibility mechanism
The map is reachable by Tab, is named, and accepts the documented `G` key — so it satisfies the
operability limb (Test 4.A). The defect is temporal: the only way to invoke live tracking is to
emit two `G` keystrokes inside a 250 ms window. Speech-input users (who dictate one key at a
time), switch and scanning users (whose selection cadence is far slower than 250 ms), users with
tremor or limited dexterity, and on-screen-keyboard users physically cannot produce a sub-250 ms
double-press. Because there is no single-press control and no alternate untimed keyboard path to
geolocation, the function is unreachable for them.

## Expected ACT-style outcome
**failed** (SC 2.1.1, second limb / Trusted Tester Test 4.B `2.1.1-no-keystroke-timing`).
Activation requires multiple keystrokes within a short period of time, and no keyboard method
without the timing requirement is provided.

## Why automated tools miss it
A static scan sees a focusable, named region with a documented keyboard interaction and reports no
problem — the markup is well-formed and the shortcut is even self-described in visible text. No
automated checker presses a key twice at two different speeds to discover that only the fast
double-press works. The 250 ms inter-keypress window exists solely in the runtime `keydown`
timing comparison, which static DOM/markup analysis cannot evaluate.

## Citation
**Reference:** WCAG 2.2 Understanding — Keyboard (`wcag-understanding/keyboard.html`)
> "Examples of \"specific timings for individual keystrokes\" include situations where a user would be required to repeat or execute multiple keystrokes within a short period of time or where a key must be held down for an extended period before the keystroke is registered."

**Reference:** Trusted Tester v5.1.3, Test 4.B (`refs/trusted-tester/sc-2.1.1-keyboard.md`)
> "A keyboard method is provided for functionality to be activated without requiring users to perform specific timings for activation."
