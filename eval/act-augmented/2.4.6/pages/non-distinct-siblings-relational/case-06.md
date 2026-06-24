# case-06 — PASS control: disambiguated FAQ headings + Shipping/Billing labels

## Scenario
A checkout-plus-FAQ page that is the structural twin of the failing cases but is **correctly disambiguated**. (1) The FAQ accordion's four `<h3>` headings each lead with the actual question ("How long does standard shipping take?", "What is your return policy on worn gear?", …) instead of a repeated generic "Question". (2) The form has a Shipping `<fieldset>` and a Billing `<fieldset>`, each containing a name and a street field — the exact repeated-label hazard — but every group has a section `<legend>` ("Shipping address" / "Billing address") AND every field label leads with the qualifier ("Shipping — Full name", "Billing — Full name", "Shipping — Street address", "Billing — Street address"). Both the generated heading list and a flat form-controls list orient the user correctly.

## Attribute tuple
- **content-domain:** e-commerce checkout + support FAQ (combined page)
- **UI-component / pattern:** FAQ disclosure accordion (`<details>`/`<summary>` with `<h3>`) + grouped checkout form (`<fieldset>`/`<legend>`)
- **host-language construct:** `<h3>` question headings; `<fieldset>` with `<legend>` and `<label for>`-associated inputs, qualifier at the start of each label
- **locale / i18n:** en-US
- **failure-mechanism:** NONE — this is the PASS boundary. It is the deliberate counter-example where the sibling headings and labels ARE mutually distinguishing (per G130's flood/fire example and the ACT cc0f0a b0b11b83 PASS fixture pattern)

## Developer persona
A developer who had previously been dinged in an audit for "Question, Question, Question" FAQ headings and a "Name / Street / Name / Street" checkout form. They applied the reviewer's fix: lead every accordion heading with the literal question text, give each address group a `<legend>`, and additionally prefix every field label with its section word at the START — belt-and-braces, so the labels distinguish themselves even in a flat list that strips the legend grouping.

## Element / selector carrying the issue (here: carrying the PASS)
- `.faq summary h3` — four distinct question strings; the heading list is four skim-able, mutually distinct questions.
- `form fieldset > legend` — "Shipping address" vs. "Billing address" (distinct).
- `.field label` — "Shipping — Full name", "Shipping — Street address", "Billing — Full name", "Billing — Street address": each label is unique and leads with the distinguishing word, so even a flat form-controls list reads four distinct labels.

## Exact accessibility mechanism (what AT experiences, why it passes)
- FAQ: a screen-reader user opening the headings list hears four different questions and can jump straight to the one they need; heading-to-heading navigation orients them. Each `<h3>` describes its panel AND differs from its siblings — G130's relational requirement is met.
- Form: a screen-reader user tabbing the controls hears "Shipping address, group, Shipping — Full name, edit text … Shipping — Street address … Billing address, group, Billing — Full name … Billing — Street address". Even if an AT presents a flat form-fields list (no group context), the labels themselves still distinguish the four fields because each leads with "Shipping —" or "Billing —". This mirrors the floods/fires guidance (distinguishing information at the START) and the b0b11b83 ACT PASS where the section disambiguates repeated labels.
- The disambiguation is genuinely in the DOM: four distinct `<h3>` strings, two distinct `<legend>`s, four distinct `<label>` strings. A browser + screen reader really experience a distinguishable heading/label set.

## Expected ACT-style outcome
**passed** (SC 2.4.6 — both limbs: every heading describes and distinguishes its section (TT 10.A); every visual form label is descriptive and distinguishes its control (TT 5.B); G130 relational requirement satisfied).

## Why automated tools miss it (i.e., why this is a meaningful control, not a trivial pass)
Automated tools would also mark this page as having no SC 2.4.6 violation — but so would a human, and for the *right* reason: the sibling headings/labels are genuinely distinct. The value of this control is that it is the structural near-twin of case-01/02/03/04/05 (same components, same repeated-label hazard) yet PASSES, isolating the variable the aspect targets: whether the heading/label text *distinguishes siblings*. A tool cannot tell case-04 (fail) from case-06 (pass) — both have present, associated, non-empty labels; only the human relational judgment separates them. That contrast is exactly why the failing cases need human review.

## Citation
> "<h1>Disaster preparation</h1> <h2>Flood preparation</h2> <h2>Fire preparation</h2> … Note that the level 2 headings have the distinguishing information at the beginning (i.e., instead of \"Preparation for floods\", \"Preparation for fires\", etc)."
— wcag-techniques/general/G130.html (Examples)

> "Check that each heading identifies its section of the content."
— wcag-techniques/general/G130.html (Tests — Procedure)

> "A form asks for the name of the user. It consists of two input fields to ask for the first and last name. The first field is labeled \"First name\", the second is labeled \"Last name\"."
— wcag-understanding/headings-and-labels.html (Examples of Headings and Labels)
