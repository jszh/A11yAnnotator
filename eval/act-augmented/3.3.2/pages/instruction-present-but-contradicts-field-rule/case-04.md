# case-04 — Phone fieldset: legend "Phone number (US, 10 digits)" but checkout requires 11 digits (country code)

## Scenario
An outdoor-gear checkout. The phone control is the textbook H71 pattern: a real `<fieldset>` with a `<legend>` — *"Phone number (US, 10 digits)"* — grouping split sub-fields with `title` labels ("Area code", "Exchange", "Number"). But there is a **fourth, leading "Country code" box** that the legend never mentions, and the submit validator demands **11 digits total** (`1` + area + exchange + number) with the country-code box filled. A US shopper who reads the legend, types their familiar 10-digit number into the three labelled boxes, and leaves the unexplained leading box blank is rejected. The group instruction understates the real requirement (10 vs 11); the enforced rule is one digit longer than the legend says.

## Attribute tuple
- **content-domain:** e-commerce product & checkout
- **UI-component / pattern:** split phone control grouped by `fieldset`/`legend` (H71), with a leading country-code sub-field and a JS submit validator
- **host-language construct:** `<fieldset><legend>` over four `<input maxlength>` boxes with `title` attributes
- **locale / i18n:** en-US UI, but the enforced format is the international 11-digit (E.164-style country-code) form the legend doesn't describe
- **failure-mechanism:** group legend states a digit count (10) one short of the enforced count (11); the extra required field is unmentioned

## Developer persona
The store expanded to ship internationally and the platform team added a leading country-code box and switched validation to require the full 11-digit number. They wired the new box and the `\d{11}` check, but the legend text — copied long ago from the US-only checkout, *"Phone number (US, 10 digits)"* — was never revised. It's a real `<legend>` on a real `<fieldset>`, so it sails through H71/axe checks; it simply describes the *old* rule.

## Element / selector carrying the issue
The `<legend>` "Phone number (US, 10 digits)" on the phone `<fieldset>`, contradicted by `#cc` (an unmentioned required country-code box) and the validator's `/^\d{11}$/` total-length rule. The stated count (10) is short of the enforced count (11).

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Screen-reader user:** entering the group hears the legend "Phone number, US, 10 digits," then the first box's title "Country code." The legend told them the number is 10 digits, so they may skip the country-code box (it sounds optional / out of scope of the stated 10) and fill the three labelled fields with their 10-digit number. Submit fails. The legend — the group-level instruction 3.3.2 cares about — described a rule the checkout no longer enforces.
- **Cognitively-loaded user:** "US, 10 digits" frames the task as the familiar domestic number; the unexplained extra box and the hidden 11-digit rule produce exactly the confusion the SC warns against.
- **Voice-control / braille user:** relies on the programmatic legend + titles; both describe a 10-digit US number, so there is no in-band signal that 11 digits incl. a country code are mandatory.

## Expected ACT-style outcome
**failed** (SC 3.3.2 — a group instruction is provided for the multi-field control, but it specifies a shorter/different requirement than the fields enforce; following it cannot produce an accepted value).

## Why automated tools miss it
The `<fieldset>` has a non-empty `<legend>` and every sub-field has an accessible name — so H71 is satisfied, TT 5.A passes, and axe/WAVE/Lighthouse confirm the grouping, names, and contrast. No scanner parses "10 digits" out of the legend, counts the four boxes (or reads the `\d{11}` validator and the required country-code check), and reasons that the enforced total exceeds the stated count. There is no automated model of the composite field's true accepted length to compare against the legend's prose. Catching it requires reading the legend, inferring the enforced length, and noticing the mismatch.

## Citation
> "The single \"Phone number\" label also cannot label all three fields. To address this, the three fields are grouped in a fieldset with the legend \"Phone number\"."
— wcag-understanding/labels-or-instructions.html (Examples) — the legend is the sanctioned group instruction; here that very instruction misstates the field's real rule.

> "Instructions or labels may also specify data formats for data entry fields, especially if they are out of the customary formats or if there are specific rules for correct input."
— wcag-understanding/labels-or-instructions.html (Intent) — an 11-digit country-code form is "out of the customary" US format and needs a correct instruction, which the legend fails to give.

> "Visual labels or instructions are provided for form elements."
— refs/trusted-tester/sc-3.3.2-labels-or-instructions.md (Test 5.A Test Condition) — the visible instruction is present and the test's presence-only condition passes, leaving the 10-vs-11 inaccuracy undetected.
