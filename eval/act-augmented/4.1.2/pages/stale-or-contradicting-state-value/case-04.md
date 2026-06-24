# case-04 — Volume slider thumb at max but aria-valuenow="0" (media player)

## Scenario
A Tidewater Radio "Now Playing" web player has a custom volume slider between a low-volume and a
high-volume icon. The slider is rendered at **maximum**: the pink fill spans the entire rail and the
thumb sits flush at the far-right end. Its exposed value, however, is `aria-valuenow="0"` (with
`aria-valuemin="0"`, `aria-valuemax="100"`), and there is no `aria-valuetext`. So a sighted user sees
full volume while an AT user is told the volume is at the minimum, 0.

## Attribute tuple
- **content-domain:** music / media streaming player
- **UI-component/pattern:** slider / range (APG Slider pattern), single thumb
- **host-language construct:** `<div role="slider" aria-valuemin/aria-valuemax/aria-valuenow>` with CSS-positioned thumb
- **locale/i18n:** en
- **failure-mechanism:** rendered thumb position (max) contradicts the exposed `aria-valuenow` (0); no `aria-valuetext` to override

## Developer persona
A developer building the player widget. The volume defaults to 100% in the audio engine and the thumb
is painted from that engine value (`left:100%`, `width:100%`), but the slider element's
`aria-valuenow` was left at the markup placeholder `"0"` they used while stubbing the component, and
never bound to the engine's current value on first paint. The keydown handler updates `aria-valuenow`
and the thumb together, so once the user presses an arrow key they stay in sync — but the **initial**
state announces 0 while showing max.

## Element / selector carrying the issue
`div[role="slider"][aria-valuenow="0"]` whose child `.thumb` is at `left:100%` and `.fill` is at
`width:100%`.

## Exact accessibility mechanism (what AT experiences, why it fails)
A screen reader announces "Volume, slider, **0**" (or "0%", or "0 of 100"). A user who wants to lower
a too-loud track is told it is already at 0 and cannot lower it further, or presses Arrow Up expecting
to raise from 0 and instead overshoots from the true max. Because there is no `aria-valuetext`, nothing
overrides the numeric `aria-valuenow`, so the lie is the only thing AT hears. SC 4.1.2 requires values
to be programmatically determinable and kept current; here the determinable value is the opposite end
of the range from the rendered value.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The slider has `role="slider"`, an accessible name ("Volume"), and the complete required range state
set — `aria-valuemin`, `aria-valuemax`, `aria-valuenow` — each a syntactically valid number within
range. ACT 4e8ab6 (required states present), 5c01ea (permitted), and 6a7281 (valid number value) all
pass; nothing is malformed. No checker computes the thumb's pixel position relative to the rail and
compares it to `aria-valuenow`. Recognizing that the thumb is at the far-right maximum while the
exposed value says 0 is a position-vs-value visual judgment that static analysis cannot perform.

## Citation
> **WCAG 2.2 SC 4.1.2 text (via `refs/trusted-tester/sc-4.1.2-name-role-value.md`):**
> "states, properties, and values that can be set by the user can be programmatically set; and
> notification of changes to these items is available to user agents, including assistive technologies."

> **WCAG Technique G108 (Using markup features to expose ... user-settable properties ... and provide notification of changes), `wcag-techniques/general/G108.html`:**
> "allow user-settable properties to be directly set, and provide notification of changes"

(The slider's value is a user-settable property; exposing `aria-valuenow="0"` for a thumb rendered at
maximum means the property's current value is not truthfully provided to AT.)
