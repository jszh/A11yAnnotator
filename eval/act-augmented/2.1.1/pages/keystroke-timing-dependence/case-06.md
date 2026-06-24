# case-06 — Photo carousel that advances only on rapid repeated arrow presses (3× → within 500 ms)

## Scenario
A longform photo essay (The Meridian) embeds a 4-photo gallery. The carousel is keyboard-focusable
and documents an arrow-key interaction, but a single press of the → key never advances it: the
handler is debounced to require **three → keydown events within 500 ms** before it moves one photo,
and the burst counter resets if presses come too slowly. There is no single-press "Next" button, no
slide-dots, and no other untimed control to change photos — the only way forward is to "machine-gun"
the arrow key.

## Attribute tuple
- **Content domain:** online journalism / editorial photo essay
- **UI component / pattern:** image carousel with `aria-roledescription` and arrow-key navigation
- **Host-language construct:** `keydown` handler with a burst-debounce (3 presses within a 500 ms window)
- **Locale / i18n:** en
- **Failure mechanism:** rapid repeated keystrokes required within a short period (fast key-repeat), with no single-press / untimed advance control

## Developer persona
A frontend developer building the gallery widget was annoyed that holding the arrow key (OS key-repeat)
flew through all the photos at once, and that a stray tap moved the gallery unintentionally during
scrolling. To "smooth it out," they added a debounce that only fires on a quick burst of presses —
reasoning that a deliberate advance means several fast taps. They tested by tapping → quickly, saw it
advance, and never added a discrete Next button because "the arrow keys handle it." The debounce
inadvertently turned a normal interaction into a timing-gated one.

## Element / selector carrying the issue
`#stage` (the carousel `role="group"` region) and its `keydown` handler. The timing gate is
`BURST_NEEDED = 3` presses within `BURST_MS = 500`; a single or slow press never increments past the
reset. No single-press advance control exists in the DOM.

## Exact accessibility mechanism
The carousel is reachable, named, and accepts the documented arrow keys — operability is satisfied.
The defect is temporal and second-limb: advancing requires emitting three → keystrokes inside a
500 ms window. A keyboard user who presses → once, waits, and presses again (the normal cadence for
switch, scanning, speech-input, sip-and-puff, on-screen-keyboard, and tremor-affected users) never
accumulates a burst, so the gallery stays frozen on photo 1. They can never see photos 2–4. Because
no single-press or otherwise untimed control advances the carousel, there is no Test 4.B passing
path.

## Expected ACT-style outcome
**failed** (SC 2.1.1, second limb / Trusted Tester Test 4.B `2.1.1-no-keystroke-timing`). Advancing
the gallery requires repeating keystrokes within a short period of time, and no keyboard method free
of that timing requirement is provided.

## Why automated tools miss it
Structurally this is an exemplary carousel: focusable stage, `role="group"`,
`aria-roledescription="image carousel"`, an informative accessible name, a live caption and counter.
axe-core, WAVE, and Lighthouse confirm the roles/names/keyboard wiring and report no error. None of
them presses → once and then again slowly to discover that only a 3-press burst advances the gallery.
The requirement exists only in the runtime burst-debounce timing, which static analysis cannot
evaluate — and which the operability-only ACT rules for 2.1.1 do not address.

## Citation
**Reference:** WCAG 2.2 Understanding — Keyboard (`wcag-understanding/keyboard.html`)
> "Examples of \"specific timings for individual keystrokes\" include situations where a user would be required to repeat or execute multiple keystrokes within a short period of time or where a key must be held down for an extended period before the keystroke is registered."

**Reference:** Trusted Tester v5.1.3, Test 4.B — Test Condition (`refs/trusted-tester/sc-2.1.1-keyboard.md`)
> "Individual keystrokes do not require specific timings for activation of functionality."
