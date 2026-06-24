# case-06 — DMV form: 2px `#1763b5` focus ring at ~6:1 (BOUNDARY / passing anchor)

## Scenario
A government vehicle-registration wizard ("State of Maridon DMV") gives its native
`<select>`s, text inputs, and buttons an author-supplied focus indicator that sits *just
above* the perception threshold: a 2px solid `#1763b5` outline offset 2px from each control
on the white form. This is the deliberate PASSING counterpart to the failing near-threshold
cases in this aspect — it fixes where the perceptible line actually is, so a reviewer
trained on invisible indicators does not over-flag a genuinely visible one.

## Attribute tuple
- **content-domain:** government / civic services (DMV)
- **UI-component/pattern:** native `<select>` + text inputs + buttons in a multi-step wizard
- **host-language construct:** `<select>`/`<input>`/`<button>` with `:focus-visible { outline:2px solid #1763b5; outline-offset:2px }`
- **locale/i18n:** en-US
- **failure-mechanism:** NONE — indicator meets G195 (2px thick, ~6:1 contrast change, full border) → passing boundary

## Developer persona
A state digital-services team follows a public design-system that mandates a "2px solid
focus ring in the link blue, offset 2px" on every interactive control, applied via
`:focus-visible`. They verified the contrast of the ring against the white form during
their accessibility review and shipped it. It is not flashy, but it is genuinely visible.

## Element / selector carrying the issue
`select:focus-visible, input:focus-visible, .btn:focus-visible { outline:2px solid #1763b5;
outline-offset:2px }` — applied to `#vtype`, `#county`, `#plate`, `#vin`, and both buttons.

## Exact accessibility mechanism
A sighted keyboard user Tabs to the "Vehicle type" `<select>`. The focus indicator is a 2px
solid `#1763b5` ring offset 2px from the control on the white form. Against the `#ffffff`
background the ring's contrast change is about **6.0:1** (computed `#1763b5` vs `#ffffff` =
6.02:1; verified rendered maxChannelDelta = 232/255 over 1,344 changed pixels) — well above
G195's 3:1. The band is **2px** thick (meeting the "≥2px if under 3:1" fallback even if it
did not clear 3:1) and forms a full border around the component (meeting the 1px-border area
requirement). The change is large, surrounds the control, and is immediately noticeable, so
the keyboard user can plainly see which control has focus. This is the perceptible side of
the threshold — a genuine, visible indicator.

## Expected ACT-style outcome
**passed** — SC 2.4.7 (Focus Visible, Level AA). Every focusable control has an
author-supplied focus indicator that meets G195's contrast, thickness, and area guidance,
so focus is visibly indicated.

## Why automated tools miss it
This is the symmetry point of the aspect: a pixel-diff confirms "pixels changed" here just
as it does for the invisible failing cases — it cannot, on its own, *confirm* this one
passes for the right reason (sufficient magnitude) versus passing trivially. The correct
**passed** verdict rests on the same human magnitude/contrast judgment used to fail the
others, only resolved on the perceptible side. The deliberate failing sibling pattern — a
`<select>` whose focus only shifts background `#ffffff → #fdfdfd` (~1.02:1, a visually
identical state) — would FAIL; it is described here but intentionally NOT used, so this page
can be a clean PASS that anchors the visible threshold.

## Citation
> **Reference:** WCAG Technique G195 "Using an author-supplied, visible focus indicator"
> (`wcag-techniques/general/G195.html`)
>
> **Quote (verbatim):** "Check that the focus indicator area is at least the size of a 1 CSS
> px border around the component."
>
> **Quote (verbatim):** "Check that the change of contrast of the indicator between focused
> and unfocused states has a ratio of 3:1 or more for the minimum focus indicator area."
>
> **Reference:** WCAG Technique C45 "Using CSS :focus-visible to provide keyboard focus
> indication" (`wcag-techniques/css/C45.html`)
>
> **Quote (verbatim):** "This technique is only sufficient if it uses styles that provide a
> visible focus indicator."
