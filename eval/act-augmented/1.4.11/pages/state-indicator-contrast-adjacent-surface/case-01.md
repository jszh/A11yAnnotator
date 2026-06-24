# case-01 — Checked custom checkbox: brand-tint check at 2.33:1 against its purple fill (the state mark fails its adjacent surface; box-vs-page is a 7:1 distractor)

## Scenario
A healthcare patient portal ("Northgate Health") renders its consent checkboxes as custom
controls: a 24px rounded box that turns brand-purple `#6221EA` when checked and shows an SVG
check. Two of the three boxes are in the **checked** state on load. The box-vs-card contrast is a
comfortable ~7:1, but the check stroke is a *tint* of the brand purple (`#9D85DB`) that contrasts
only **2.33:1** against the purple fill it sits on. The tick is the only thing that tells a
sighted low-vision user "this box is ticked," and against its correct adjacent surface — the box
fill, not the page — it falls below 3:1, so the **checked-state** indicator fails 1.4.11.

## Attribute tuple
- **Content domain:** healthcare / patient portal (consent & communication preferences)
- **UI component / pattern:** custom checkbox (APG checkbox) — hidden native input + styled `.box` + inline-SVG check
- **Host-language construct:** `input[type=checkbox]:checked + label.box svg path` with `stroke` set to a purple tint
- **Locale / i18n:** en (US healthcare)
- **Failure mechanism:** state-mark (the check) vs its own adjacent surface (the fill) at 2.33:1, while the decoy comparison (filled box vs white card, 7.18:1) passes

## Developer persona
A junior front-end dev was told to "match the brand purple everywhere." They pasted a custom-checkbox
snippet from Stack Overflow, then changed the check `stroke` from the snippet's white to
`#9D85DB` — a lighter purple from the design tokens — because pure white "looked harsh and
off-brand" inside the purple box. On their monitor the tick was faintly visible, and the box
itself clearly contrasted with the page, so it shipped. They never measured the tick against the
fill; their contrast linter only flagged text colors.

## Element / selector carrying the issue
`.cb:checked + .box svg .check-stroke` — the check path is `stroke:#9D85DB`, drawn on the
`background:#6221EA` of the checked `.box`. The relevant adjacency for a state mark is the box
fill (per the Understanding "adjacent color might be another part of the component"), giving
**2.33:1**. The box outline/fill vs the white `.card` is ~7:1 and is the distractor surface.

## Exact accessibility mechanism
A screen-reader user is fine: the native checkbox exposes role=checkbox and checked=true. The
failure is purely visual and is for a **sighted low-vision** user (or anyone with reduced contrast
sensitivity). When they scan the form, every box looks like a solid purple square; the 2.33:1 tick
is too faint to resolve, so they cannot distinguish a ticked box from one that is merely filled —
i.e. they cannot read the checked state. The SC requires "any visual information necessary to
indicate state... whether a component is selected" to meet 3:1 against the adjacent colors, and the
adjacent color for an internal state mark is "another part of the component" (the fill). 2.33:1 < 3:1
fails. A correct fix (the Understanding's own example) is a `#E5E5E5` check at 5.6:1.

## Expected ACT-style outcome
**failed** (SC 1.4.11). The checked-state indicator (the check) does not meet 3:1 against its
adjacent surface (the box fill). The passing box-vs-page contrast does not exonerate the page; the
relevant pair for a state mark is the mark vs the part of the component it sits on.

## Why automated tools miss it
axe-core, WAVE, and Lighthouse have no rule that segments a custom control into "state mark" + "the
surface that mark sits on" and tests that pair. They evaluate text contrast (there is none in the
SVG) and, at most, can sample a component against the page — which here is the 7:1 distractor that
*passes*. Deciding that (a) the check is the state-conveying mark and (b) its adjacent color is the
purple fill rather than the white page is a two-step semantic/visual judgment no scanner makes. The
markup is well-formed: real native input, correct label association, non-empty programmatic state.

## Citation
**Reference:** WCAG 2.2 Understanding SC 1.4.11 Non-text Contrast (`wcag-understanding/non-text-contrast.html`)
> "any visual information necessary to indicate state, such as whether a component is selected or focused must also ensure that the information used to identify the control in that state has a minimum 3:1 contrast ratio."

**Reference:** WCAG 2.2 Understanding SC 1.4.11 Non-text Contrast (`wcag-understanding/non-text-contrast.html`)
> "For visual information required to identify a state, such as the check in a checkbox or the thumb of a slider, that part might be within the component so the adjacent color might be another part of the component."

**Reference:** WCAG 2.2 Understanding SC 1.4.11 Non-text Contrast (`wcag-understanding/non-text-contrast.html`)
> "A customized checkbox with light grey check (#E5E5E5), which has a contrast ratio of 5.6:1 with the purple box (#6221EA)."
