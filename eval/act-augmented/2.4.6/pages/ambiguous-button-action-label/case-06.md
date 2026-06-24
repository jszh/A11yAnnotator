# case-06 — PASS control: every button names both its action and its specific object

## Scenario
A meal-planner app ("Thyme & Again"). The page combines the two component families
used by the failing cases — a repeated list of row-action buttons and a three-choice
confirmation — but **re-labels every button so its function is unmistakable**. The
draft list's buttons read "Remove “Smoked paprika chickpea stew” from this week"
(etc.), naming both the action and the specific recipe; the three-choice
confirmation reads "Save changes to recipe", "Discard changes", and "Export recipe
as PDF" instead of three "OK"s. No control relies on a generic verb, an omitted
object, or a mismatched verb.

## Attribute tuple
- **content-domain:** recipe / meal-planner app
- **UI-component / pattern:** repeated list row-action buttons + a three-choice confirmation button row (the failing cases' two patterns, done correctly)
- **host-language construct:** native `<button type="button">` elements with full, function-naming text content
- **locale / i18n:** en-GB
- **failure-mechanism:** none — deliberate PASS control isolating the aspect from confounds

## Developer persona
A developer who had read an internal accessibility checklist that said "button text
must say what the button does to what." She wrote out each row-action label in full
("Remove “…” from this week") even though it looked long, and split the generic
confirmation into three explicit actions, accepting the extra width as the cost of
clarity. She verified by tabbing the page with VoiceOver and confirming each button
announced a distinct, self-explanatory name.

## Element / selector carrying the (resolved) issue
`ul.recipes > li > button` and `section.box .actions > button` — every `<button>`
has an accessible name that names both its action verb and its specific object or
function.

## Exact accessibility mechanism (what AT experiences, why it passes)
- **Sighted user:** reads each button and immediately knows what it does and to
  which recipe.
- **Screen-reader user (buttons list / rotor / tabbing):** hears five distinct,
  function-clear names — "Remove “Lemon & thyme roast chicken” from this week",
  "Save changes to recipe", "Discard changes", "Export recipe as PDF" — and never
  encounters an ambiguous "OK", "Remove", "Go", "Continue", or "Click here". Each
  control's purpose is determinable from its label alone.
- **Function judgment:** every visible button label is sufficiently clear and
  descriptive that users know its function, satisfying TT 5.B's button-function
  prong.

## Expected ACT-style outcome
**passed** (SC 2.4.6, TT 5.B button-function prong / G131). This is the contrast
control for the aspect: same component families as the failing cases, but labels
that name action + object, so a human judging function-descriptiveness passes it.

## Why automated tools miss it
Automated tools also pass this page — but only for the trivial reason that all
accessible names are non-empty, which they would equally (and wrongly) conclude for
the failing cases case-01..case-05. The value of this control is that a **human**
applying the function-descriptiveness judgment *also* passes it, which confirms the
aspect is about label *quality*, not label *presence* — exactly the distinction
automated checks cannot draw.

## Citation
> "Each visual button label is sufficiently clear and descriptive, so users know its function."
— refs/trusted-tester/sc-2.4.6-headings-and-labels.md (Test 5.B — Evaluate Results, point 2)

> "Labels and headings do not need to be lengthy. A word, or even a single character, may suffice if it provides an appropriate cue to finding and navigating content."
— wcag-understanding/headings-and-labels.html (Intent of Headings and Labels)
