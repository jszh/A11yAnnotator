# case-02 — Switch in the ON state: the position thumb (#74B97A) is 1.41:1 against the green track that fully surrounds it (the state-conveying part fails its dominant adjacent surface; green-track-vs-page is the distractor)

## Scenario
A SaaS analytics product ("Cadence") shows notification toggles as custom switches. Four are in the
**ON** state on load (one is OFF, as a contrast reference). On a switch, the **position of the
thumb** is the state indicator: thumb-left = off, thumb-right = on. In the ON state the track turns
green `#4E9E52` (3.31:1 against the white page — a "control vs page" sample passes), and the thumb
is recolored a pale "frosted" green `#74B97A` that slides to the right end of the track. Because the
thumb now sits *inside* the green track, the surface adjacent to the thumb on its **entire**
circumference is that green track — and thumb-vs-track is only **1.41:1**. The very element whose
location signals ON cannot be located against the surface it rides, so the ON-state indicator fails
1.4.11 even though the whole toggle contrasts fine with the page. (The OFF switch keeps a white
thumb on the grey track, ~ample contrast, so its position is plainly readable — sharpening that the
ON state specifically loses the cue.)

## Attribute tuple
- **Content domain:** SaaS analytics dashboard (notification settings)
- **UI component / pattern:** switch / toggle (APG switch) — hidden native checkbox + styled track + position thumb
- **Host-language construct:** `input:checked + .track .thumb` (background `#74B97A`) translated to the right end of `.track` (background `#4E9E52` when checked)
- **Locale / i18n:** en (US)
- **Failure mechanism:** state-conveying thumb vs its fully-surrounding adjacent track at 1.41:1, while the decoy (green track vs white page, 3.31:1) passes

## Developer persona
A product designer built the toggle in Figma and exported the ON style with a pale "frosted glass"
thumb because a solid white thumb "blew out" against the saturated green in their dark-themed
mockups. To make the ON state feel "cohesive," they tinted the thumb the same green family as the
track and dropped its drop-shadow so there was no hard edge. They checked the green track against
the white page (passes) and considered the job done — never realizing that for a low-vision user the
*position of the thumb on that track* is the only ON cue, and a same-family green thumb on a green
track is nearly the same lightness all the way around its edge.

## Element / selector carrying the issue
`.switch input:checked + .track .thumb` (`background:#74B97A`), translated to the right end of
`.switch input:checked + .track` (`background:#4E9E52`). The thumb is the state-conveying part; on a
switch its position is the on/off signal, so the relevant adjacent color is the track that surrounds
it on all sides, giving **1.41:1**. The green track vs the white page is 3.31:1 and is the
distractor surface. (Rendered geometry confirms the thumb is fully inside the track on every side —
not a thin sliver — so the green track is unambiguously the dominant adjacent color.)

## Exact accessibility mechanism
A screen-reader user is unaffected: the native checkbox exposes checked=true with a correct
accessible name. For a sighted low-vision user, the toggle reads as a solid green pill; the pale
green thumb is 1.41:1 against the green track around its whole circumference, so they cannot perceive
*where the thumb is* — and thumb position is exactly what distinguishes ON from OFF on a switch.
The Understanding names "the thumb of a slider" as a state mark whose adjacent color "might be
another part of the component," and requires that state information meet 3:1. 1.41:1 is far below
threshold. (Compare the Understanding's passing toggle: a `#7AC2FF` thumb on a `#070CD5` track that
*does* contrast; and the OFF switch on this very page, whose white thumb on grey is clearly visible.)

## Expected ACT-style outcome
**failed** (SC 1.4.11). The ON-state indicator (thumb position, perceived via the thumb against the
track that surrounds it) does not meet 3:1 against its adjacent component color. A passing
component-vs-page contrast is the wrong comparison for an internal state mark.

## Why automated tools miss it
No automated checker isolates "the thumb" as the state-conveying graphical object and tests it
against "the track it sits in." axe/Lighthouse evaluate text contrast (none here) and cannot pick
the correct adjacency. A naive component-vs-page sample lands on the green-vs-white distractor, which
passes (3.31:1). Recognizing that thumb *position* (not the track color) is the ON cue, and that the
relevant adjacent surface is the green track surrounding the thumb, requires human visual reasoning.
The markup is sound: real checkbox, correct accessible name, programmatic checked state.

## Citation
**Reference:** WCAG 2.2 Understanding SC 1.4.11 Non-text Contrast (`wcag-understanding/non-text-contrast.html`)
> "For visual information required to identify a state, such as the check in a checkbox or the thumb of a slider, that part might be within the component so the adjacent color might be another part of the component."

**Reference:** WCAG 2.2 Understanding SC 1.4.11 Non-text Contrast (`wcag-understanding/non-text-contrast.html`)
> "any visual information necessary to indicate state, such as whether a component is selected or focused must also ensure that the information used to identify the control in that state has a minimum 3:1 contrast ratio."

**Reference:** WCAG 2.2 Understanding SC 1.4.11 Non-text Contrast (`wcag-understanding/non-text-contrast.html`)
> "It is possible to use a flat design where the status indicator fills the component and does not contrast with the component, but does contrast with the colors adjacent to the component."
