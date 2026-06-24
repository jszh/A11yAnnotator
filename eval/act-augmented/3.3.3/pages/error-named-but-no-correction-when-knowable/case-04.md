# case-04 — Free-text "State" field accepting only the 50 USPS codes: "Please enter a valid state." with no list, format, or nearest-match hint (FAIL)

## Scenario
A Beacon Mutual auto-insurance quote wizard rendered in its **post-submit error state**. The garaging-address "State" control is a free **text** field, but the server accepts only the small fixed enumerated set of the 50 USPS two-letter codes (the full set is preserved in the page's inline comment). The user typed `Calif.` — unmistakably California, code `CA`. The visible, programmatically associated error reads only **"Please enter a valid state."** It offers no list of allowed values, no format hint ("use the two-letter code"), and no nearest-match suggestion ("Did you mean CA?"), even though the entered text is similar to exactly one allowed value.

## Attribute tuple
- **content-domain:** insurance quote wizard (multi-step)
- **UI-component / pattern:** stepper / wizard; free-text `<input>` standing in for an enumerated control; inline `aria-describedby` error
- **host-language construct:** text field whose true domain is a fixed enumeration; server-side validation re-display
- **locale / i18n:** en-US (USPS two-letter codes are the unstated allowed set)
- **failure-mechanism:** bare restatement on a limited-allowed-values field — neither the value list nor the nearest match is suggested

## Developer persona
An agency contractor reused a generic "required text field" component for State rather than a `<select>`, because the back-end API wanted a string and a free text box was the fastest wire-up. Validation simply checks membership in the codes array and, on failure, prints the catch-all `"Please enter a valid state."` The contractor knew the allowed set (it's right there in the array) and could have listed it or computed the nearest match, but the generic component had a single error slot, so the richer guidance was never built. The message is present and associated, so it passed an axe scan.

## Element / selector carrying the issue
`#state-error` (text `"Please enter a valid state."`), referenced by `#state[aria-describedby="state-error"]`, evaluated against the fixed 50-code enumeration and the entered value `"Calif."` (nearest allowed value: `CA`).

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Screen-reader user:** hears "State, edit, invalid entry, Please enter a valid state." They have no idea the field wants a two-letter code rather than a full name or abbreviation-with-period; they cannot see neighboring fields for a pattern and must guess among "California", "Calif", "CA", "Cal.". Each blind retry risks another rejection.
- **Cognitive / low-literacy user:** "a valid state" presupposes the user knows what "valid" means here; the actual constraint (exactly the USPS code) is invisible.
- **Why the correction is doubly knowable:** (1) the allowed values are a small fixed list that could be shown, and (2) `"Calif."` maps to exactly one code, so a "Did you mean CA?" suggestion is computable — the Understanding doc explicitly endorses both forms. The message provides neither.

## Expected ACT-style outcome
**failed** (SC 3.3.3 — an input error is detected, the correction is knowable from a limited set of allowed values, but no suggestion is provided).

## Why automated tools miss it
axe / WAVE / Lighthouse confirm the label, the resolved `aria-describedby`, `aria-invalid="true"`, and contrast — SC 3.3.1 passes. No checker knows that this free-text field's real domain is a 50-value enumeration, nor that `"Calif."` is one edit away from `CA`; it cannot judge that the message lists none of the allowed values and suggests no match. `"Please enter a valid state."` and `"Enter the two-letter state code, e.g. CA for California."` are both valid non-empty strings — only human semantic judgment about the field's allowed-value set distinguishes them.

## Citation
> "An input field requires that a month name be entered. If the user enters '12,' suggestions for correction may include: A list of the acceptable values, e.g., 'Choose one of: January, February ...' The conversion of the input data interpreted as a different month format, e.g., 'Do you mean December?'"
— wcag-understanding/error-suggestion.html (Examples — "Suggestions from a Limited Set of Values"; the State field is exactly this limited-set case and offers neither the list nor the "did you mean")

> "When input must be one of a set of allowed values, the text description should indicate this fact. It should include the list of values if possible, or suggest the allowed value that is most similar to the entered value."
— wcag-techniques/general/G84.html (Description — the message does neither)

> "Determine whether guidance provides sufficient details for how to correct the error and/or offers suggestions of corrected input."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (How to Test — "Please enter a valid state." provides no such details)
