# case-04 — Two stacked Yes/No questions, neither grouped: AT cannot tell which "Yes" answers which question

## Scenario
A municipal building-permit application's "Scope" section poses two yes/no questions in sequence: Q1 "Will the work change the building's footprint?" and Q2 "Is the property in a designated flood-hazard zone?". Each question is a styled `<p class="q">`. Each question has its own radio pair labelled "Yes"/"No" via `<label for>`, with distinct `name` attributes (`footprint`, `flood`). But neither pair is wrapped in a `<fieldset>`/`<legend>` or `role="radiogroup"`, so the question→group association exists only in the visual stacking.

## Attribute tuple
- **content-domain:** government / municipal permit application
- **UI-component / pattern:** two adjacent boolean radio groups with identical option labels
- **host-language construct:** two `name`-distinct radio pairs, each under an unassociated `<p>` question; no `<fieldset>`
- **locale / i18n:** en-US, LTR
- **failure-mechanism:** ambiguous group membership — identical "Yes"/"No" options across two ungrouped sets; which radio answers which question is conveyed only by layout

## Developer persona
A government contractor migrated a paper PDF permit form to HTML on a tight timeline. They reproduced the two questions as bold paragraphs and added Yes/No radios for each, carefully giving each radio a `<label for>` and unique `name` so the data would post correctly. The accessibility scan passed (all radios labelled), so they marked the page conformant — not realizing that without fieldsets the two identically-optioned groups are indistinguishable to anyone navigating by control.

## Element / selector carrying the issue
`input[name="footprint"]` and `input[name="flood"]` — two boolean groups whose governing questions (`p.q`) are not their programmatic group labels; the second "Yes" (`#fl_y`) is announced identically to the first "Yes" (`#fp_y`).

## Exact accessibility mechanism (what AT experiences, why it fails)
- All four radios have valid accessible names ("Yes"/"No") via `<label for>` — e086e5 passes.
- A screen-reader user who jumps between FORM CONTROLS (a common navigation mode) lands on a radio announced as "Yes, radio button, 1 of 2" with no programmatic context about which question it answers. Both groups announce the same "Yes"/"No"; the questions are unassociated paragraphs.
- Because the questions sit in `<p>` elements outside any group, AT does not speak the question when the user enters the radio set — the group's shared question is lost. TT 5.C: radios "should be programmatically associated with their question and response." Here they are not.
- Sighted users have no trouble — the vertical stacking makes ownership obvious — which is exactly why this is a layout-only relationship failure.

## Expected ACT-style outcome
**failed** (SC 1.3.1 — the question/group relationship for each radio set is conveyed only visually; ambiguous group membership for AT).

## Why automated tools miss it
e086e5 confirms each radio is named and stops there. No automated rule asserts that two adjacent radio groups with identical option labels must each carry a distinguishing group label, nor can a scanner read the two `<p>` questions and reason that the second "Yes" belongs to the flood question rather than the footprint question. Detecting "ambiguous group membership" requires understanding that the option labels collide, that the only disambiguator is the visually-stacked prose question, and that this disambiguation never reaches the accessibility tree — pure contextual/visual human judgment.

## Citation
> "At minimum, **radio buttons and checkboxes** should be programmatically associated with their question and response."
— refs/trusted-tester/sc-1.3.1-info-and-relationships.md (Test 5.C, Notes)

> "The intent of this success criterion is to ensure that information and relationships that are implied by visual or auditory formatting are preserved when the presentation format changes. For example, the presentation format changes when the content is read by a screen reader"
— wcag-understanding/info-and-relationships.html (Intent)
