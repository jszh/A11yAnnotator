# case-06 — PASS twin: phone-number suggestion is ACCURATE for the field's true 10-digit rule

## Scenario
A patient-portal "update your mobile number" field. The visible help text states the real rule — *"Enter a 10-digit US mobile number, including the 3-digit area code … for example (415) 555-2671"* — and the validator enforces exactly 10 digits. Enter a 7-digit number and an error fires in `role="alert"`, associated via `aria-describedby`, with a suggestion that is **correct and actionable against the field's true rule**: *"Enter all 10 digits, including your 3-digit area code — for example (415) 555-2671. You entered 7 digits."* The named format (10 digits incl. area code) matches the enforced rule, the worked example is itself a valid value, and the digit-count feedback is accurate. A user who follows the suggestion (adds the 3-digit area code to reach 10 digits) is accepted. This is the corrected counterpart of the failing cases — identical *presence* of suggestion text, but the suggestion is true.

## Attribute tuple
- **content-domain:** healthcare / patient portal (mobile-number update for SMS reminders)
- **UI-component / pattern:** `<input type="tel">` with visible help text + `role="alert"` inline error giving a worked example and a live digit count
- **host-language construct:** `<input type="tel" inputmode="tel">` with `aria-describedby` help + alert; validator counts digits
- **locale / i18n:** en-US (10-digit NANP number); the help text, example, and rule all agree
- **failure-mechanism:** NONE — included as a true-PASS boundary to contrast with the wrong-suggestion failures; the suggestion's format, example, and count all match the field's enforced rule

## Developer persona
A diligent developer who read the SC 3.3.3 techniques (G84/G85/G177): the error message states the required format, gives a worked example that is itself a valid value, and reports the user's actual digit count so they know exactly what to change. The help text, the worked example, and the validator were authored together from one source of truth (10 digits incl. area code), so they cannot drift.

## Element / selector carrying the issue (here: the element that demonstrates the PASS)
`#tel-err` (the `role="alert"` paragraph) text *"Enter all 10 digits, including your 3-digit area code — for example (415) 555-2671. You entered 7 digits."*, describing `#tel` whose validator requires exactly 10 digits — the suggestion and the enforced rule agree.

## Exact accessibility mechanism (what AT experiences / why it passes)
- **Screen-reader user:** on the failed submit, the `role="alert"` region announces the format, the area-code requirement, a valid example, and how many digits they actually entered. Acting on it — adding the area code to reach 10 digits — is accepted. The corrective guidance is sufficient and correct, satisfying the SC's "adequate information to know what is required to fix the error."
- **Cognitively-loaded / motor-impaired user:** the explicit digit count and concrete example minimise the number of correction attempts, the SC's stated benefit.

## Expected ACT-style outcome
**passed** (SC 3.3.3 — an input error is detected and a correct, adequate suggestion for correction is provided; following it resolves the error).

## Why automated tools miss it (i.e. why this still needs a human even to confirm the PASS)
A naive scanner cannot certify a *pass* on this limb any more than it can detect the *failures*: axe/WAVE/Lighthouse only confirm that suggestion text exists, is associated, and is announced — which is equally true on the failing pages in this set. Confirming that the suggestion is **correct** (the named 10-digit format matches the validator, the worked example is a valid value, the digit count is accurate, and following it actually clears the error) requires a human to read the suggestion, infer the field's true rule, and verify they agree. Here they do, so the human verdict is PASS; the identical surface to the failing cases is exactly why correctness is a human judgment.

## Citation
> "An input field requires that a month name be entered. If the user enters '12,' suggestions for correction may include: A list of the acceptable values … The conversion of the input data interpreted as a different month format, e.g., 'Do you mean December?'"
— wcag-understanding/error-suggestion.html (Examples) — a suggestion that names the acceptable format/value (as here, 10 digits + a valid example) is the conforming pattern.

> "Provide examples of the correct data entry for the field, Describe the correct data entry for the field …"
— wcag-techniques/general/G85.html (Description) — this suggestion both describes the format and gives a correct example, meeting the technique.

> "Suggestions for corrected input are provided, OR The description contains adequate information for the user to know what is required to fix the error."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (Evaluate Results) — both PASS conditions are met: a correct suggestion AND adequate information to fix the error.
