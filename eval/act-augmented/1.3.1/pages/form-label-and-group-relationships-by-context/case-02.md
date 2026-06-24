# case-02 — Survey radios: question is a styled `<div>`, group not associated (no fieldset/legend, no radiogroup)

## Scenario
A coffee roaster's post-purchase survey asks "How did you hear about us?" rendered as a bold `<div class="q">` that visually reads as a heading, with four radio buttons beneath it ("Search engine", "A friend", "Instagram or TikTok", "Podcast ad"). The radios share `name="hear"` but are NOT wrapped in a `<fieldset>`/`<legend>` and have no `role="radiogroup"` + `aria-labelledby`. A second question on the same form ("Would you order from us again?") IS correctly wrapped in a fieldset/legend, making Q1's omission a deliberate, isolatable contrast.

## Attribute tuple
- **content-domain:** e-commerce / post-purchase customer survey
- **UI-component / pattern:** APG radio group
- **host-language construct:** `name`-shared `<input type="radio">` set under a styled `<div>` (no `<fieldset>`); compared against a correct `<fieldset><legend>` sibling
- **locale / i18n:** en-US, LTR
- **failure-mechanism:** group question conveyed only by visual heading styling; not programmatically associated as the group's label

## Developer persona
A React developer building with a utility-CSS kit styled the question with a `.q` class to match the design and dropped four `<input type="radio">`s with `<label for>` for each option — and ran axe, which reported zero violations because every radio had a label. Believing "labels = done", they never added a fieldset. For the second question they happened to copy a snippet that included a fieldset, so only Q1 regressed.

## Element / selector carrying the issue
The first radio group: `input[name="hear"]` (4 radios) governed visually by `div.q` ("How did you hear about us?"), which is not their programmatic group label.

## Exact accessibility mechanism (what AT experiences, why it fails)
- Each radio has a valid accessible name from its own `<label for>` ("Search engine", etc.) — e086e5 passes on all four.
- A screen-reader user arrowing through the group hears "Search engine, radio button, 1 of 4", "A friend, 2 of 4"… The QUESTION "How did you hear about us?" is in an unassociated `<div>` and is never announced as the group's context.
- The option labels are meaningless in isolation: "A friend" answers WHAT? Without the question, the user cannot answer correctly. TT 5.C is explicit that radio buttons must be programmatically associated with their question — that association is absent here.
- Contrast with Q2: there the `<legend>` "Would you order from us again?" IS announced when entering the fieldset, so the group context is conveyed.

## Expected ACT-style outcome
**failed** (SC 1.3.1 — the question/group relationship shown visually is not programmatically determinable for the first radio set).

## Why automated tools miss it
axe-core e086e5 checks only that each form field has a non-empty accessible name, which every radio satisfies via its `<label for>`. There is no automated rule that requires a set of same-named radios to carry a group label, nor one that can recognize that the bold `<div>` above them IS the question those radios answer. Whether several controls form a group that shares a visually-shown question — and therefore need a `<fieldset>`/`<legend>` or `role="radiogroup"` — is a contextual reading-and-grouping judgment. A static scanner sees four validly-named radios and a styled div and reports nothing.

## Citation
> "At minimum, **radio buttons and checkboxes** should be programmatically associated with their question and response."
— refs/trusted-tester/sc-1.3.1-info-and-relationships.md (Test 5.C, Notes)

> "The objective of this technique is to mark up a set of related controls within a form as a group. Any label associated with the group also serves as a common label or qualifier for individual controls in the group. … For a group of radio buttons, one should use `role="radiogroup"` instead of `role="group"`."
— wcag-techniques/aria/ARIA17.html (ARIA17, Description)
