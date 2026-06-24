# case-02 — Visible field labels are display:none at 320px, leaving disappear-on-type placeholders; labels do not reappear on focus (FAIL)

## Scenario
A job-application form ("Greycliff Logistics — Warehouse Operative (Nights)") lays each input out in a
two-column grid: a right-aligned visible `<label>` on the left, the control on the right. Every label
is correctly associated via `for`/`id`, and every input also carries placeholder text. At desktop
width this is a clean, fully labelled form. A `@media (max-width:480px)` rule collapses the grid to a
single column and sets `.field > label { display:none }` "to save vertical space." After reflow to
320px each control shows only its placeholder — and placeholders vanish the moment the user types.
Nothing restores the label text: it is not shown above the input, not revealed on focus, not in a
disclosure. The persistent visible label that was present at desktop width is gone after reflow.

## Attribute tuple
- **Content domain:** job board / ATS application flow
- **UI component / pattern:** labelled form with two-column label-beside-input grid collapsing to single column
- **Host-language construct:** `<label for>` + `<input placeholder>`; `display:none` on the label column inside a `@media (max-width:480px)` query
- **Locale / i18n:** en-GB (National Insurance number, RTITB/ITSSAR forklift licence, DD/MM/YYYY)
- **Failure mechanism:** persistent visible label removed at narrow width; placeholder-only substitute that disappears on input and no on-focus label restoration

## Developer persona
A back-end engineer at a logistics firm built the careers portal and was told the mobile form "looked
cramped." Their fix was the quickest one a search turned up: hide the label column on small screens and
"let the placeholder do the work," reasoning that the placeholder already says the same thing. They
kept the `for`/`id` wiring intact because a linter had once complained about it — so the form still
passes that linter — but they did not consider that a placeholder is not a persistent label and
vanishes as soon as anyone types, nor that low-vision users zoom rather than use a small physical
screen.

## Element / selector carrying the issue
`.field > label` under the rule `@media (max-width:480px){ .field > label { display:none; } }`. Every
labelled field (`#full-name`, `#ni`, `#phone`, `#start`, `#shift`, `#licence`, `#why`) loses its
visible label at 320px. The placeholder attributes are the inadequate substitute.

## Exact accessibility mechanism
At ≥481px a sighted or low-vision-zooming user sees a permanent text label beside each control. At
320px the label is removed from the rendering; the only remaining on-screen cue is the placeholder,
which (a) is low-contrast grey, (b) is not a persistent label, and (c) is erased the instant the user
enters a value — so a user who pauses mid-form, or returns to review answers, sees a column of filled
boxes with no visible indication of what each one is. The labels do not reappear on focus or on input,
and no disclosure/dialog/link surfaces them. The visible labelling information present at desktop width
is therefore not available after reflow to 320px. (Note: because `for`/`id` is intact, a screen reader
still announces a name — but the SC limb at issue is the *loss of the visible, persistent label
information* the low-vision/zoom audience relies on, exactly the F102 placeholder example.)

## Expected ACT-style outcome
**failed** (SC 1.4.10). Labels visible at 1280px are hidden at 320px with no equivalent shown after
reflow; the placeholder-only substitute disappears on input and labels do not reappear on focus.

## Why automated tools miss it
axe-core, WAVE, and Lighthouse check that each input has a programmatic accessible name. The
`for`/`id` associations are present and correct at every width, so those checks pass unconditionally —
the tools never see a problem. They do not render the form at 320px and observe that the *visible*
label was removed, that the remaining placeholder is destroyed on typing, or that focusing the field
fails to bring the label back. Recognising that persistent visible labelling was traded for a
disappear-on-type placeholder, and that nothing restores it after reflow, is a human visual-and-
behaviour comparison across two viewport widths — outside the static-DOM, single-width model these
tools use.

## Citation
**Reference:** WCAG Technique F102 — Examples (`wcag-techniques/failures/F102.html`)
> "Labels above text inputs are hidden and replaced by placeholder text after reflow, without a technique showing dedicated labels when focusing the fields."

**Reference:** WCAG Technique C38 (`wcag-techniques/css/C38.html`)
> "When space is limited in the viewport for the label and input to sit next to each other horizontally, they will be changed to a vertical alignment."
