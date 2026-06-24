# case-03 — Bank login inputs: focus = a 1px `rgba(0,0,0,.06)` box-shadow ring (caret suppressed)

## Scenario
A credit-union online-banking sign-in page styles its credential fields with a custom
focus "ring" instead of the default outline. On focus, each input gets
`box-shadow: 0 0 0 1px rgba(0,0,0,0.06)` — a 1px halo at 6% black over the white field.
The native text caret has been globally suppressed (`caret-color: transparent`), so the
faint ring is the *only* focus change. Tabbing between Member ID and Password produces a
non-zero but effectively invisible difference.

## Attribute tuple
- **content-domain:** online banking / fintech
- **UI-component/pattern:** username + password login form
- **host-language construct:** `<input>` with `:focus { box-shadow:0 0 0 1px rgba(0,0,0,.06) }`, `outline:none`, `caret-color:transparent`
- **locale/i18n:** en-US
- **failure-mechanism:** focus ring present but ~1.14:1 and 1px (G195 contrast + 4px/2px fallbacks all fail), and the one native cue (caret) is suppressed

## Developer persona
A contractor reused a focus-ring utility copied from a marketing landing page
(`focus:ring-1 focus:ring-black/5`), where 5–6% black over a saturated hero looked like a
tasteful glow. Pasted onto the white banking form it all but disappears. Separately, a
designer earlier added `caret-color: transparent` site-wide because "the blinking I-beam
clashes with the brand," removing the one focus cue a text field would otherwise have.

## Element / selector carrying the issue
`input:focus { box-shadow:0 0 0 1px rgba(0,0,0,0.06) }` on `#user` and `#pin`, combined
with `input { outline:none; caret-color:transparent }`. (The "Sign in" button and the
"Forgot password?" link have real high-contrast outlines, so the defect is isolated to the
two text inputs.)

## Exact accessibility mechanism
A sighted keyboard user Tabs into the Member-ID field. The focus indicator is a 1px
box-shadow halo whose color composites to roughly `#f0f0f0` over the white field — a
contrast change of about **1.14:1** against the field and page (verified rendered ring-band
maxChannelDelta = 15/255). The visible band is ~1 CSS px (spread 1px, no offset border), so
G195's "at least a 1px border... otherwise at least 4 CSS px on the shortest side" and the
"at least 2px thick if under 3:1" fallback both fail. Crucially, the native caret — which
the Understanding doc lists as a valid field focus cue ("a vertical bar is displayed in the
field") — is suppressed, so nothing perceptible remains. The shadow paints real pixels
(oj04fd passes), but the user cannot tell which field is active when entering credentials.

## Expected ACT-style outcome
**failed** — SC 2.4.7 (Focus Visible, Level AA). The focus indicator is present but below
the perception threshold, and the one native indicator (the text caret) is removed.

## Why automated tools miss it
There is a `:focus` rule applying a `box-shadow`, so "missing focus style" heuristics do
not fire, and `outline:none` has a documented author replacement. No automated checker
composites the `rgba` ring against the field, computes the resulting contrast delta, or
compares the band width to G195's 4px / 2px thresholds; none flags `caret-color:transparent`
as removing a focus cue. A pixel diff confirms "ring band changed." Judging the ring
imperceptible — and recognizing that suppressing the caret removed the fallback cue — is a
human visual judgment.

## Citation
> **Reference:** WCAG 2.2 Understanding SC 2.4.7 Focus Visible
> (`wcag-understanding/focus-visible.html`)
>
> **Quote (verbatim):** "When text fields receive focus, a vertical bar is displayed in the
> field, indicating that the user can insert text, OR all of the text is highlighted,
> indicating that the user can type over the text."
>
> **Reference:** WCAG Technique G195 "Using an author-supplied, visible focus indicator"
> (`wcag-techniques/general/G195.html`)
>
> **Quote (verbatim):** "If the focus indicator area is not at least equal to the area of a
> 1 CSS pixel border, check that it has an area of at least 4 CSS pixels along the shortest
> side of the component."
