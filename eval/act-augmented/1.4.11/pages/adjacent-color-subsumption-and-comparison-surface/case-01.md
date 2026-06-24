# case-01 — Bank wire inputs: silver/graphite border subsumed into the dark-blue panel (PASS)

## Scenario
"Meridian Trust" online banking. The "Send a domestic wire" form places its recipient
inputs on a dark-blue panel (`#003366`, the exact shade from the WCAG figure). Each input
has a **white interior** and a thin **graphite border** (`#3E5168`). A literal per-edge
contrast tool measures that 1px border against the dark-blue panel, computes **1.55:1**, and
reports a 1.4.11 failure. The correct verdict is the opposite: the border is *subsumed* into
the dark panel (it is closest to it in brightness), and the meaningful adjacency is the
white interior vs the dark-blue panel — **12.6:1** — so the control is clearly identifiable.

## Attribute tuple
- **content-domain:** online banking / fintech
- **UI-component/pattern:** text inputs on a dark colored panel (background-on-background)
- **host-language construct:** `<input>` with `background:#fff` interior + 1px `#3E5168` border, inside a `#003366` panel
- **locale/i18n:** en-US
- **failure-mechanism:** NONE — this is a boundary PASS where the literal tool over-reports; the subsumed border must be ignored and interior-vs-panel measured instead

## Developer persona
A bank front-end engineer copied the W3C "input on a dark background with a subsumed border"
figure almost verbatim when building the wire form. During the audit, the agency's automated
scanner flagged "border #3E5168 vs #003366 = 1.55:1 — Non-text Contrast fail," and the
engineer opened a ticket to "darken the border." This page captures the moment before that
incorrect fix: the page as built actually conforms, and changing the border is unnecessary.

## Element / selector carrying the issue
`.transfer-panel input` — the white-interior, graphite-bordered inputs on the `#003366` panel.

## Exact accessibility mechanism
A low-vision user looking at the panel sees four bright white rectangles on dark blue; the
white interior against the dark-blue surround (12.6:1) makes each input unmistakably a
control, with or without the border. The graphite border, at 1.55:1 against the panel, is
visually absorbed into the dark surround — it neither helps nor is needed to identify the
control. Under the "Adjacent colors" subsumption rule the border is "subsumed into the color
closest in brightness" and is therefore **not** the measured cue. The measured adjacency is
interior-vs-panel, which passes. Screen-reader users are unaffected; the SC protects the
sighted low-vision user, for whom the control is clearly perceivable. Verdict: **PASS**.

## Expected ACT-style outcome
**passed** — SC 1.4.11 Non-text Contrast (Level AA). The visual information required to
identify the control (white interior vs `#003366` panel) is 12.6:1; the border is subsumed
and not subject to the requirement.

## Why automated tools miss it
A contrast checker measures every declared border against its declared neighbor and reports
border `#3E5168` vs panel `#003366` = 1.55:1 as a FAILURE — the wrong answer. It cannot
perform the interpretive step of recognizing that a "dark border line between contrasting
backgrounds is subsumed into the color closest in brightness" and that "any color which does
not interfere with identifying the component can be ignored." Deciding that the white interior
(not the border) is the identifying cue, and that the border is therefore irrelevant, is a
human judgment about which adjacency is meaningful. The page is well-formed (labels, non-empty
title, programmatic input roles), so no linter flags anything else.

## Citation
> **Reference:** WCAG 2.2 Understanding SC 1.4.11 Non-text Contrast — "Adjacent colors"
> (`wcag-understanding/non-text-contrast.html`)
>
> **Quote (verbatim):** "If components use several colors, any color which does not interfere
> with identifying the component can be ignored for the purpose of measuring contrast ratio.
> For example, a 3D drop-shadow on an input, or a dark border line between contrasting
> backgrounds is considered to be subsumed into the color closest in brightness (perceived
> luminance)."
>
> **Quote (verbatim, figure caption):** "The contrast of the input background (white) and
> color adjacent to the control (dark blue `#003366`) is sufficient. There is also a border
> (silver) on the component that is not required to contrast with either."
