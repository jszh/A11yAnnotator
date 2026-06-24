# case-03 — Skeuomorphic transport buttons: 3D bevel subsumed, filled face identifies the control (PASS)

## Scenario
"TapeDeck DAW," a desktop audio app, renders its transport controls (Play/Pause/Stop/Record/
Loop) as hardware-style buttons. Each button has a **mid-grey filled face** (`#6E6E6E`) on the
light-grey page (`#ECECEC`) = **4.32:1**, and a 3D embossed look built from a 1px light `inset`
highlight (`#F4F4F4`, ~1.07:1 vs page), a 1px dark `inset` shadow (`#C4C4C4`, ~1.48:1 vs page),
and a soft drop-shadow. A per-edge tool that walks the bevel rings flags those faint edges
(<3:1) as a 1.4.11 failure. The correct verdict is PASS: the bevel is a subsumed 3D shadow;
the filled face vs the page identifies each button.

## Attribute tuple
- **content-domain:** SaaS / desktop creative application (digital audio workstation)
- **UI-component/pattern:** toolbar of skeuomorphic (beveled, drop-shadowed) push buttons
- **host-language construct:** `<button>` with a filled `background` face + `inset` highlight/shadow `box-shadow` bevel + drop shadow
- **locale/i18n:** en-US
- **failure-mechanism:** NONE — boundary PASS; the literal tool over-reports the subsumed 3D bevel edges

## Developer persona
A developer building a retro/skeuomorphic theme used a classic embossed-button recipe from an
old CSS tutorial: a light inset highlight on the top-left and a dark inset shadow on the
bottom-right to fake depth, plus a drop shadow. An automated audit flagged the highlight/shadow
edges as low-contrast "borders," and the developer was about to thicken/darken them — but the
control was already conformant via its face.

## Element / selector carrying the issue
`.hw-btn` — buttons whose identifying cue is the `#6E6E6E` face vs the `#ECECEC` page (4.32:1);
the `box-shadow` bevel highlight (`#F4F4F4`) and shadow (`#C4C4C4`) are the subsumed 3D edges.

## Exact accessibility mechanism
A low-vision user sees five distinctly darker rectangles on the light-grey panel and reads them
immediately as buttons — the filled face (4.32:1) carries the identification, reinforced by the
button text. The embossed highlight and shadow are the kind of "3D drop-shadow on an input"
that the Understanding says is "subsumed into the color closest in brightness": the light
highlight merges into the light page, the dark shadow is a thin depth cue, and neither is
needed to identify the control. They do not interfere with identifying the component, so they
are ignored for measurement. Verdict: **PASS**.

## Expected ACT-style outcome
**passed** — SC 1.4.11 Non-text Contrast (Level AA). The identifying visual information (filled
face vs page) is 4.32:1; the 3D bevel/drop-shadow is subsumed and not measured.

## Why automated tools miss it
A naive checker that enumerates each `box-shadow` ring (or a thin painted border) measures the
bevel highlight (~1.07:1) and bevel shadow (~1.48:1) against the page and reports a Non-text
Contrast failure on those edges. That is wrong: it cannot apply the rule that a "3D drop-shadow
on an input ... is considered to be subsumed into the color closest in brightness" and that
"any color which does not interfere with identifying the component can be ignored." Deciding
that the FACE (not the bevel) is the cue, and that the bevel is decorative depth, requires a
human reasoning about what actually identifies the control.

## Citation
> **Reference:** WCAG 2.2 Understanding SC 1.4.11 Non-text Contrast — "Adjacent colors"
> subsumption rule (`wcag-understanding/non-text-contrast.html`)
>
> **Quote (verbatim):** "If components use several colors, any color which does not interfere
> with identifying the component can be ignored for the purpose of measuring contrast ratio.
> For example, a 3D drop-shadow on an input, or a dark border line between contrasting
> backgrounds is considered to be subsumed into the color closest in brightness (perceived
> luminance)."
>
> **Quote (verbatim, Buttons example):** "A button which has a distinguishing indicator such
> as position, text style, or context does not need a contrasting visual indicator to show
> that it is a button..."
