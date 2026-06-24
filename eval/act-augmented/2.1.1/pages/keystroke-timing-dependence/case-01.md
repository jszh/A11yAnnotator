# case-01 — "Delete account" button that fires only if Enter/Space is HELD for 2 seconds

## Scenario
A SaaS account-settings "Danger zone" (Beacon Analytics). To delete the workspace the user
types the confirmation slug, then must activate a "Hold to delete account" button. The button
is keyboard-focusable and responds to keyboard events, but its JavaScript measures the
**duration** of the keypress: a progress fill advances only while the Enter (or Space) key is
physically held, and the destructive action fires only once the key has been held continuously
for **2000 ms**. A normal tap of Enter — keydown immediately followed by keyup — never reaches
the threshold, so it does nothing. There is no other keyboard control on the page that deletes
the account.

## Attribute tuple
- **Content domain:** SaaS / B2B product settings (account administration)
- **UI component / pattern:** "hold-to-confirm" destructive-action button (a touch/press-and-hold gesture ported to a `<button>`)
- **Host-language construct:** native `<button>` with `keydown`/`keyup` duration measurement via `requestAnimationFrame`
- **Locale / i18n:** en
- **Failure mechanism:** keystroke-HOLD-duration gate — "a key must be held down for an extended period before the keystroke is registered" (2.1.1 second limb), no untimed alternative

## Developer persona
A product designer admired the "press and hold to confirm" pattern from mobile OS delete
dialogs (and from GitHub-style "hold to merge" experiments) and asked a frontend developer to
reproduce it on the web settings page to "prevent accidental account deletion." The dev wired
`mousedown`/`mouseup` for pointer users and, to be thorough, added `keydown`/`keyup` handlers so
the keyboard "works too" — calling `preventDefault()` so the browser's default Enter-activates-button
behaviour wouldn't fire the action instantly. They tested by holding the key on their mechanical
keyboard, saw the bar fill, and shipped it. They never considered a user who cannot hold a single
key for two seconds.

## Element / selector carrying the issue
`button#delBtn` (the "Hold to delete account" control). The timing logic lives in its
`keydown`/`keyup` listeners and the `REQUIRED_MS = 2000` hold threshold in the page script.

## Exact accessibility mechanism
The button is in the tab order, has role `button`, and has the accessible name "Hold to delete
account," so it is fully *reachable and operable* in the Test 4.A sense — Enter and Space reach
it. The failure is temporal: the handler ignores discrete keystrokes and only registers a press
that is **sustained** for two seconds. Users of switch access, sip-and-puff, speech input
("press Enter"), on-screen keyboards, and scanning software issue a single discrete activation;
they cannot emit a two-second-long held keystroke. For them the only destructive control on the
page is unactivatable. Because no untimed keyboard method to delete the account is provided
anywhere else on the page, Test 4.B has no passing path.

## Expected ACT-style outcome
**failed** (SC 2.1.1, second limb / Trusted Tester Test 4.B `2.1.1-no-keystroke-timing`). The
function requires a specific timing (extended hold) of an individual keystroke, and no
keyboard-accessible method without that timing requirement is provided.

## Why automated tools miss it
axe-core, WAVE, and Lighthouse verify that the control is a real button, is focusable, has an
accessible name, and has keyboard event handlers — all of which are present and correct, so they
report no error. None of them simulates *holding a key for a measured duration* and observes that
a discrete keypress fails to activate the control. The timing dependency exists only in the
runtime behaviour of the `keydown`/`keyup` duration check; it is invisible to static DOM/markup
analysis.

## Citation
**Reference:** WCAG 2.2 Understanding — Keyboard (`wcag-understanding/keyboard.html`)
> "Examples of \"specific timings for individual keystrokes\" include situations where a user would be required to repeat or execute multiple keystrokes within a short period of time or where a key must be held down for an extended period before the keystroke is registered."

**Reference:** Trusted Tester v5.1.3, Test 4.B (`refs/trusted-tester/sc-2.1.1-keyboard.md`)
> "Determine whether there are instances where the **timing of keystrokes** is required to activate the element ... If timing-dependent functionality exists, determine if another keyboard-accessible method on the page does **not** require specific timing."
