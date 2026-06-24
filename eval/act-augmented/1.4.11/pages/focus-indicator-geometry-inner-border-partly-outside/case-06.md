# case-06 — RTL switch: inner focus border (green) fails against the blue track it sits inside

## Scenario
An RTL Arabic settings screen for a city-transit app (`dir="rtl" lang="ar"`). The "تنبيهات
التأخير" (delay alerts) row uses a custom toggle built as `<button role="switch">`. When ON,
the switch track is brand-blue (`#4189B9`) with a white thumb, on a white card. On focus the
switch draws a 3px **inset** border *inside* the track (via `box-shadow: inset`), coloured
dark green (`#008000`). Because the inset border is inside the component, the adjacency it
must beat is the blue track fill — and green-on-blue is 1.35:1, so the focus indicator is
invisible against the surface it sits inside.

## Attribute tuple
- **content-domain:** municipal transit schedule / mobility app (notification settings)
- **UI-component/pattern:** custom `role="switch"` toggle (APG switch pattern), ON state
- **host-language construct:** `:focus { box-shadow: inset 0 0 0 3px #008000 }` on the track
- **locale/i18n:** Arabic, RTL (`dir="rtl" lang="ar"`); uses `inset-inline-start` for thumb
- **failure-mechanism:** inner focus indicator measured against the wrong adjacency — green
  beats the white card (5.14:1) but, being inside the track, must beat the blue track fill
  (1.35:1) and does not

## Developer persona
An engineer localising the app for an MENA launch reused the design-system switch and added a
green inset focus border because the team's accessibility checklist said "focus rings must be
green for brand consistency." He tested it on the OFF (grey) switch, where green-on-grey
looked acceptable, and assumed every state behaved the same. He never re-checked the ON state,
where the track turns brand-blue and the green inset border vanishes into it. The RTL layout
was his focus; the contrast geometry of the inset ring against the *blue* track went unnoticed.

## Element / selector carrying the issue
`.switch:focus` — `box-shadow: inset 0 0 0 3px #008000` over the ON switch's `#4189B9` track
(FAIL, 1.35:1). The first two switches are ON (`aria-checked="true"`), so they exhibit the
failing blue-track case.

## Exact accessibility mechanism (what AT experiences, why it fails)
A keyboard / low-vision user tabs to the ON "delay alerts" switch. The focus indicator is a
green inset border drawn inside the blue track. Because the indicator is inside the component,
the adjacency that matters is the blue track fill, and green-on-blue is **1.35:1** — for a
user with moderately low vision the focus border is indistinguishable from the track, so they
cannot tell the switch is focused before toggling a setting they may not have intended to
change. (The green would clear the *white card* outside the track at 5.14:1, but that is the
wrong adjacency for an inner indicator.) Screen-reader users get correct `role="switch"` /
`aria-checked` semantics — the failure is purely the visual focus indicator's contrast against
the inner surface. The defect is genuinely rendered; the `:focus` rule fires.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The switch has correct `role="switch"` / `aria-checked` and a visible focus change, so
role/name/value and focus-visible heuristics all pass. axe-core, WAVE and Lighthouse cannot
determine that the inset border sits *inside* the track and therefore must contrast with the
blue track fill rather than the white card; they have no model of inner-vs-outer indicator
geometry on a switch. A pixel checker sampling the green against the nearest white card pixels
would read 5.14:1 and wrongly pass it — exactly the wrong adjacency. The RTL/Arabic context
does not change the geometric analysis but moves the case well away from the spec's English
figures, where automation might pattern-match. Choosing the track as the relevant adjacency is
a structural/visual judgement.

## Citation
> **WCAG 2.2 Understanding, Non-text Contrast — "Relationship with Focus Visible":**
> "Other cases include focus indicators which are: only inside the component and need to
> contrast with the adjacent color(s) within the component."

(Verbatim from `wcag-understanding/non-text-contrast.html`. The green inset border is "only
inside the component," so it must contrast with the adjacent colour within the component — the
blue track at 1.35:1 — and it does not.)

> **WCAG 2.2 Understanding, Non-text Contrast — User Interface Components:**
> "any visual information necessary to indicate state, such as whether a component is selected
> or focused must also ensure that the information used to identify the control in that state
> has a minimum 3:1 contrast ratio."

(Verbatim from `wcag-understanding/non-text-contrast.html`. The focus state's inner green
border is the visual information identifying the focused state, and it fails the 3:1 minimum
against the blue track.)
