# case-02 — UK postcode lookup suggests "enter 5 digits" but the locale requires alphanumeric postcodes

## Scenario
A GOV.UK-styled district-council "find your nearest recycling centre" postcode lookup. The locale is unambiguously British: `lang="en-GB"`, the field labelled "UK postcode", the hint *"For example, SW1A 1AA"*, and a `pattern` that accepts alphanumeric postcodes. When a valid-shaped postcode is rejected by the (deliberately spacing-strict) validator, an error fires in `role="alert"`, associated via `aria-describedby`, with a confident, specific suggestion: *"Postcodes must be 5 digits. Please enter your 5-digit postcode (for example, 90210)."* UK postcodes are alphanumeric and are never five digits — `90210` is a US ZIP. No five-digit value can ever satisfy the field's pattern, so following the suggestion guarantees permanent re-failure.

## Attribute tuple
- **content-domain:** government / civic services portal (council recycling-centre finder)
- **UI-component / pattern:** single text postcode field with worked-example hint + `role="alert"` inline error + result panel
- **host-language construct:** `<input type="text" pattern="[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}">` with `aria-describedby` hint + alert
- **locale / i18n:** en-GB form; the suggestion describes a US (en-US) 5-digit ZIP — a cross-locale format collision
- **failure-mechanism:** suggestion names the wrong country's format (numeric ZIP) for an alphanumeric-postcode field; no value of the suggested shape can ever pass

## Developer persona
An agency ported a US address component (originally built for a retailer's ZIP lookup) into a UK council theme. They re-skinned it to GOV.UK, changed the label to "UK postcode", updated the example hint, and loosened the `pattern` to accept letters — but the JS error string was a leftover from the US build ("must be 5 digits"). The string is grammatical, names the field, and offers a concrete example, so it survived QA on a desk where everyone already knew their own postcode and never hit the error.

## Element / selector carrying the issue
`#pc-err` (the `role="alert"` paragraph), text *"Postcodes must be 5 digits. Please enter your 5-digit postcode (for example, 90210)."*, describing `#postcode` whose `pattern` and JS validator (`/^[A-Za-z]{1,2}\d.../`) require an alphanumeric UK postcode.

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Screen-reader user:** the `role="alert"` region announces "Postcodes must be 5 digits. Please enter your 5-digit postcode, for example 90210." With no vision to notice the contradicting "SW1A 1AA" hint above, the blind user follows the only spoken instruction, types five digits, and is rejected again — an infinite loop, because the field's pattern cannot match any all-digit string.
- **Non-UK / cognitively-loaded user:** takes "5 digits / 90210" literally and cannot reach the service at all.
- **Sighted user:** may reconcile the alphanumeric hint with the numeric suggestion, but the suggestion still actively misdirects toward a format that is structurally impossible here.

## Expected ACT-style outcome
**failed** (SC 3.3.3 — a suggestion for corrected input IS provided, but it specifies a format the field cannot accept; it does not give "adequate information to know what is required to fix the error", since no value of the suggested form resolves the error).

## Why automated tools miss it
The presence-of-suggestion check passes: the error is detected, the text is specific, associated, and announced. axe/WAVE/Lighthouse have no model of geography — they do not know that UK postcodes are alphanumeric and that "5 digits / 90210" is a US ZIP, nor do they parse the field's `pattern` to discover that no five-digit value can match it. Determining that the suggested format is wrong for this locale requires real-world knowledge of what a UK postcode is, which automated tools do not possess.

## Citation
> "The intent of this success criterion is to ensure that users receive appropriate suggestions for correction of an input error if it is possible."
— wcag-understanding/error-suggestion.html (Intent) — a suggestion naming the wrong country's format is not an *appropriate* suggestion for a UK postcode field.

> "It should include the list of values if possible, or suggest the allowed value that is most similar to the entered value."
— wcag-techniques/general/G84.html (Description) — the suggestion must point at an *allowed* value; "5 digits" is never an allowed value for this field.

> "The description contains adequate information for the user to know what is required to fix the error."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (Evaluate Results) — guidance that names a format the field rejects is not *adequate* to fix the error.
