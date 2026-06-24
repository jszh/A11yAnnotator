# case-05 — Toggle on/off shown by green vs grey only (<3:1), no ON/OFF text or position cue

## Scenario
A SaaS notification-settings panel uses pill switches whose on/off **state** is shown only
by fill colour: green `#5aa86a` = ON, grey `#979797` = OFF. The knob is **centred and
fixed** — it does not slide — so there is no position cue, and there is no "On"/"Off" text.
The green and grey have a luminance contrast of ~1.0:1 (verified), far below 3:1, so per the
WCAG Understanding note this is a colour-(hue)-only distinction, **not** a lightness one.

## Attribute tuple
- **content-domain:** SaaS analytics dashboard (account settings)
- **UI-component/pattern:** custom switch / toggle (APG switch)
- **host-language construct:** `<button role="switch" aria-checked>` with a centred `.knob`; state = CSS `background` swap only
- **locale/i18n:** en-US
- **failure-mechanism:** a *state* (on/off) conveyed by hue alone, with a deliberately low (~1:1) on-vs-off contrast so the lightness exemption does not apply, and no position/text cue

## Developer persona
A dashboard dev built switches from a Tailwind-style snippet but customised the "on" colour
to brand green and, to keep the pill compact, centred the knob instead of sliding it. He
*did* do the ARIA correctly (role=switch, aria-checked updates, label via aria-labelledby),
so his axe scan was clean — and he assumed clean axe meant accessible. The purely visual
green/grey-only state slipped through because no tool flags it.

## Element / selector carrying the issue
`button.switch[role="switch"]` — `aria-checked="true"` renders `background:#5aa86a`,
`false` renders `#979797`; `.knob` is `left:50%; transform:translateX(-50%)` (never moves).

## Exact accessibility mechanism
This is deliberately **not** a 4.1.2 failure: a screen-reader user IS told "switch, on/off"
correctly, because role, name (aria-labelledby), and aria-checked are all present and
update. The failure is purely 1.4.1 for the **sighted** user who cannot distinguish the two
hues: with the knob fixed and no text, a red-green colour-deficient user (or anyone in
grayscale) sees four identical pills and cannot tell which settings are enabled. The
verified grayscale render confirms all four toggles become indistinguishable. Because the
on/off contrast is ~1.0:1, the Understanding's "lightness ≥ 3:1 also counts" allowance does
not rescue it — the difference really is hue only.

## Expected ACT-style outcome
**failed** — colour (hue) is the only visual means of conveying the switch's on/off state;
there is no non-colour cue (no text, no knob position, and <3:1 lightness difference).

## Why automated tools miss it
axe-core / Lighthouse confirm `role=switch` + accessible name + `aria-checked` and pass the
control; each pill colour also passes 1.4.3 against the page background. No tool computes the
contrast *between the on-colour and the off-colour*, and none reasons that, with the knob
fixed in place, colour is the sole visual differentiator of state. That is a visual judgment
about two rendered states, not a markup check.

## Citation
> **WCAG 2.2 Understanding 1.4.1 (use-of-color.html, note on lightness):** "if content
> relies on the user's ability to accurately perceive or differentiate a particular color
> an additional visual indicator will be required regardless of the contrast ratio between
> those colors. For example, knowing whether an outline is green for valid or red for
> invalid."

Knowing whether a toggle is green-for-on or grey-for-off is exactly this: it relies on
perceiving a particular colour, and (with on-vs-off contrast ~1.0:1 and no position/text
cue) no additional visual indicator is provided.
