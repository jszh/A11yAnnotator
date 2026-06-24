# case-01 — Green vs red identical submit buttons (loan confirm), convention in prose only

## Scenario
A personal-lending "Confirm your loan application" step shows two identically shaped,
identically sized submit buttons, **both labelled "Submit"**. One is filled green
(advance / accept the binding agreement), the other red (cancel / discard the draft). The
"green advances, red cancels" convention is stated only in a body paragraph above the
buttons. Nothing in either button's text distinguishes the two destructive-vs-committing
actions.

## Attribute tuple
- **content-domain:** online banking / fintech (personal lending)
- **UI-component/pattern:** paired action buttons (form submit pair)
- **host-language construct:** two `<button type="submit">` in a `<form>`, distinguished by CSS `background`
- **locale/i18n:** en-US
- **failure-mechanism:** action ("proceed" vs "cancel") encoded by fill colour only; redundant cue lives in distant prose, not on the control (G14 / G205 violation)

## Developer persona
An agency front-end dev themed a client's loan wizard from a design comp. The comp showed
a green "primary" and red "danger" button; the dev wired both to the same submit handler,
reused the design-system `<button>Submit</button>` token for both, and trusted the
"green = go" colour convention the designer added as helper copy. No one labelled the
buttons "Confirm" / "Cancel" because the colour "obviously" said which was which.

## Element / selector carrying the issue
`form.actions > button.btn--proceed` and `form.actions > button.btn--cancel` (both have
text "Submit"; they differ only in `background:#1f9d55` vs `#c8332b`).

## Exact accessibility mechanism
A sighted user with red-green colour deficiency, or anyone in grayscale / a monochrome
display, sees two identical "Submit" buttons. The action that distinguishes them
(advance an irreversible credit agreement vs cancel) is carried only by hue, which they
cannot perceive, and the only text cue ("green advances, red cancels") references a colour
they also cannot use to map a button. A screen-reader user hears "Submit button, Submit
button" — the role/name are present but identical, so the colour-encoded action is not in
either accessible name (also failing the G205 "cue in the programmatic name" guidance). The
verified grayscale render shows the two buttons as near-identical mid-gray rectangles.

## Expected ACT-style outcome
**failed** — colour is the only visual means of indicating which action each control
performs; no non-colour text cue is carried by the controls.

## Why automated tools miss it
Both buttons are valid `<button>` elements with non-empty, programmatically determinable
text ("Submit"); each passes name and contrast checks. axe-core / WAVE / Lighthouse have
no model of "green means proceed, red means cancel," cannot read the convention out of a
paragraph 200px away, and cannot judge that the two controls are distinguished only by
`background-color`. Mapping a fill colour to an intended action and verifying a redundant
text cue exists is contextual semantic reasoning.

## Citation
> **WCAG Technique G14 (Understanding 1.4.1 / G14.html — "A form with a green submit button"):**
> "An on-line loan application explains that green buttons advance in the process and red
> buttons cancel the process. A form contains a green button containing the text *Go*. The
> instructions say 'Press the button labeled *Go* to submit your results and proceed to the
> next step.'"

This page is the **negative** of that sufficient example: the convention is stated, but the
green/red buttons are *not* given distinguishing text (both read "Submit"), so the action
is conveyed by colour alone — the exact gap G14 closes by putting "Go" in the control.
