# case-02 — "Enter a valid value." on a 1–10 spinbutton whose bounds are encoded in the DOM

## Scenario
An e-commerce cart ("Maple & Oak Roastery") uses an APG-style custom spinbutton for each line item: `role="spinbutton"` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-label`, stepper buttons, `aria-invalid`, and an `aria-live="assertive"` status. The first product allows quantities **1 to 10** (`aria-valuemin="1" aria-valuemax="10"`); the shopper has 14 in the field, so it is correctly flagged invalid and announced — but the error reads only **"Enter a valid value."** The exact range it is rejecting against is literally already in the DOM (`aria-valuemax="10"`) yet never spoken to the user. The second product is a PASS twin: identical spinbutton, but its error names the bound — "Enter a quantity between 1 and 6 — only 6 left in stock."

## Attribute tuple
- **content-domain:** e-commerce product & cart
- **UI-component / pattern:** WAI-ARIA APG **spinbutton** (custom div with role + bounded values + stepper buttons) wired to a live error region
- **host-language construct:** `<div role="spinbutton" aria-valuemin aria-valuemax aria-valuenow aria-invalid aria-describedby>`
- **locale / i18n:** en-US
- **failure-mechanism:** default validity string ("Enter a valid value") substituted for the field-specific range, even though the range is enforced and present in ARIA attributes
- **prevalence:** HEAD — "Enter a valid value" is the browser/library default and one of the most-copied error strings on the web

## Developer persona
A front-end developer built the spinbutton from the APG example and bound the inline error to the validation library's default message, ` valueMissing → "Enter a valid value." `, never overriding it per field. They were diligent about ARIA bounds (so the value is announced correctly and steppers clamp), which makes the component *look* exemplary to a checker — the inadequacy is hidden in the one string they left at its default while the real bound sits in `aria-valuemax`.

## Element / selector carrying the issue
`#q1-err` ("Enter a valid value.") describing `#q1` (`role="spinbutton" aria-valuemin="1" aria-valuemax="10"`). The PASS-twin contrast is `#q2-err` ("Enter a quantity between 1 and 6 …").

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Screen-reader user:** focusing the spinbutton hears "Quantity, Ethiopia Yirgacheffe, spin button, 14, invalid entry, Enter a valid value." They learn it is invalid but not what range is valid; "a valid value" could be 1, 10, 100, or a non-integer for all the message says. They must guess against an unstated bound — the abandonment risk 3.3.3 targets.
- **Braille user:** the terse braille line shows only "Enter a valid value" with no number to work from.
- **Contrast (PASS twin):** "between 1 and 6" tells the user the exact corrective range on the first read, so they can produce an accepted value immediately.

## Expected ACT-style outcome
**failed** (SC 3.3.3 — the input error is detected and the correct value range is known and even encoded in the field, so a suggestion is possible; the message neither suggests a corrected value nor gives adequate information to fix it).

## Why automated tools miss it
The component is, structurally, a model APG spinbutton: bounded ARIA values, programmatically associated error, live status, correct roles and contrast. axe/WAVE/Lighthouse confirm all of that and 3.3.1 passes outright. A heuristic that looks for an instructional/fix-oriented string also passes — "Enter a valid value" is grammatically an instruction. No tool reasons that the valid range is `aria-valuemin`..`aria-valuemax`, that the message omits it, and that omission makes the suggestion inadequate. Recognizing that a default validity string is filler relative to a knowable, DOM-present bound is a semantic adequacy judgment unavailable to scanners.

## Citation
> "Some examples of information that is not accepted include information that is required but omitted by the user and information that is provided by the user but that falls outside the required data format or allowed values."
— wcag-understanding/error-suggestion.html (Intent) — a value outside the allowed 1–10 range is exactly this case; the allowed values are known.

> "A list of the acceptable values, e.g., 'Choose one of: January, February … December.'"
— wcag-understanding/error-suggestion.html (Examples → Suggestions from a Limited Set of Values) — the adequate move is to state the acceptable values/range; "Enter a valid value" does the opposite.

> "Suggestions for corrected input are provided, OR … The description contains adequate information for the user to know what is required to fix the error."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (Evaluate Results) — neither limb is met; the range is withheld.
