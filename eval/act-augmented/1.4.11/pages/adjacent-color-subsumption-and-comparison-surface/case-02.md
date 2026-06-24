# case-02 — Borderless inputs: pale-blue fill (FAIL) beside a #043464 background-color input (PASS)

## Scenario
A US state "Benefits Portal" SNAP-renewal wizard (USWDS-styled). On Step 2, every input is
**borderless** and relies SOLELY on its background color to signal that a field is present.
The "Street address" input uses a dark navy fill (`#043464`) on the white page — **12.5:1**,
which is exactly the canonical "no-border input differentiated only by a background color"
PASS from the Understanding doc. The "City or town" and "date of birth" inputs use a very pale
blue fill (`#EAF2FB`) on the same white page — **1.13:1** — far below 3:1. Because the fill is
the *only* cue these fields exist, the pale-blue inputs FAIL.

## Attribute tuple
- **content-domain:** government / civic services portal (SNAP benefits)
- **UI-component/pattern:** borderless text/date inputs differentiated only by background fill
- **host-language construct:** `<input type="text">` / `<input type="date">` with `border:none` and a `background` fill
- **locale/i18n:** en-US (bilingual EN/ES footer)
- **failure-mechanism:** background-color-only input whose fill-vs-page contrast is below 3:1, so the control is not identifiable

## Developer persona
An agency designer adopted a "clean, flat" form style and removed all input borders, using a
subtle tint instead to "show the field area." For the address row they used the design
system's dark accent (`#043464`) and it looked fine; for the rest of the form they used a
much lighter brand tint (`#EAF2FB`) to "keep it soft." Their automated checks passed because
the *labels* and *typed text* contrast fine — nobody measured the field tint itself against
the page as the control-identification cue.

## Element / selector carrying the issue
`.field.bg-pale input` (City or town; date of birth) — borderless inputs whose only cue is a
`#EAF2FB` fill at 1.13:1 against the white page. The PASS contrast is `.field.bg-navy input`.

## Exact accessibility mechanism
A user with moderately low vision scans the form and can clearly see the dark navy "Street
address" field as a distinct box (12.5:1). The pale-blue "City or town" and date fields are
essentially the same lightness as the white page — the boundary of the input is invisible, so
the user cannot tell where to click/type or even that an input exists there (the label sits
above, but the field's presence and extent are conveyed only by the imperceptible tint). For a
borderless input, the Understanding requires the differentiating background color to reach 3:1
against the adjacent page; 1.13:1 does not. Verdict: **FAIL**.

## Expected ACT-style outcome
**failed** — SC 1.4.11 Non-text Contrast (Level AA). The visual information required to
identify the borderless inputs (their `#EAF2FB` fill vs the white page) is 1.13:1, below 3:1.

## Why automated tools miss it
The failing cue is non-text: it is the *fill-vs-page* contrast of a borderless input acting as
the control's only identifier. axe/WAVE/Lighthouse compute text/foreground contrast — and the
labels and entered text are dark-on-pale-blue, comfortably passing 1.4.3 — so they report no
issue. No automated rule says "this borderless field's background tint is the sole cue that a
control exists and must therefore reach 3:1 against the page." Distinguishing "the fill is the
required identifying cue" from "the fill is a decorative tint" is a human interpretive
judgment, and recognizing that the navy field passes while the pale-blue fields fail requires
reasoning about which is the meaningful adjacency.

## Citation
> **Reference:** WCAG 2.2 Understanding SC 1.4.11 Non-text Contrast — "Text input using
> background color" passing example (`wcag-understanding/non-text-contrast.html`)
>
> **Quote (verbatim):** "Text inputs that have no border and are differentiated only by a
> background color must have a 3:1 contrast ratio to the adjacent background (`#043464`)."
>
> **Quote (verbatim, Intent):** "Unless the control is inactive, any visual information
> provided that is necessary for a user to identify that a control is present and how to
> operate it must have a minimum 3:1 contrast ratio with the adjacent colors."
