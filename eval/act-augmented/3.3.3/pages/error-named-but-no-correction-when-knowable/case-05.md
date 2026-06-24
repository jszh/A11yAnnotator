# case-05 — Quantity spinbutton constrained 1–10: "Value not allowed." with the permitted range never stated in the error text (FAIL)

## Scenario
A Ferndale Roastery wholesale reorder line rendered in its **post-submit error state**. The "Cases per order" control is a custom `role="spinbutton"` whose accepted range is fixed at 1–10 (a per-line case cap for standing accounts; the bounds appear in `aria-valuemin="1"`/`aria-valuemax="10"` and in the validator comment). The buyer entered `24`. The visible, programmatically associated error reads only **"Value not allowed."** It never states the permitted 1–10 range, even though that range is the entire knowable correction and is declared one attribute away on the same element.

## Attribute tuple
- **content-domain:** B2B / wholesale e-commerce reordering
- **UI-component / pattern:** APG **spinbutton** (custom `role="spinbutton"` with valuemin/valuemax/valuenow) + inline `aria-describedby` error
- **host-language construct:** numeric range constraint expressed as ARIA value bounds; server re-display
- **locale / i18n:** en-US
- **failure-mechanism:** bare restatement — the error omits the knowable range; a tempting near-miss is that the range IS exposed on the widget (valuemin/max), but not in the error suggestion the SC requires

## Developer persona
A dev who had read the APG spinbutton pattern carefully wired `aria-valuemin`/`aria-valuemax` correctly and felt the range was "exposed for screen readers." On the validation path he reused a generic numeric-out-of-bounds string, `"Value not allowed."`, assuming the announced widget bounds covered the guidance. He conflated *programmatic range metadata on the control* with *an error suggestion in the message* — so the human-readable correction (1–10) never made it into the error text.

## Element / selector carrying the issue
`#qty-error` (text `"Value not allowed."`), the message referenced by `#qty[aria-describedby="qty-error"]` (the spinbutton). The knowable correction (range 1–10) is present in the widget's `aria-valuemin`/`aria-valuemax` but absent from the error suggestion.

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Screen-reader user:** after the rejected submit, navigating to the field announces the spinbutton plus its describedby error — "Cases per order, spinbutton, 24, invalid entry, Value not allowed." The actionable correction the SC requires (a *suggestion of corrected input*) is not in that text. While `aria-valuemin`/`max` are programmatically present, AT announcement of bounds is inconsistent and, critically, the bounds are abstract control metadata, not a post-error suggestion; the user is told the value is wrong but not that the answer must be 1–10.
- **Cognitive user:** "Value not allowed" gives no anchor; they may try 20, 15, 12 before stumbling onto the cap.
- **Why the bounds do NOT discharge 3.3.3:** SC 3.3.3 requires the *suggestion* be provided when known. `aria-valuemin/max` describe the widget's range in the abstract; the error message is what is surfaced after a failed submit, and it carries no range. The correction is knowable (it's literally on the element) yet not provided in the suggestion.

## Expected ACT-style outcome
**failed** (SC 3.3.3 — an input error is detected, the corrected-input range is knowable, but no suggestion of corrected input is provided in the error text).

## Why automated tools miss it
axe / WAVE / Lighthouse confirm a valid spinbutton (role, accessible name via `aria-labelledby`, valuemin/valuemax/valuenow, associated message, contrast) — SC 3.3.1 passes and the widget looks exemplary. An automated rule could even be *misled* by the presence of `aria-valuemin`/`aria-valuemax` into assuming the user is guided. No checker judges that the human-readable error suggestion omits the range, or that range metadata on a control is not the same as a corrected-input suggestion after an error. `"Value not allowed."` versus `"Enter a quantity from 1 to 10."` are both valid strings; only semantic judgment separates them.

## Citation
> "Goal: Users get suggestions on how to resolve errors."
— wcag-understanding/error-suggestion.html (In brief — Goal; "Value not allowed" offers no resolution)

> "Where errors are detected, suggest known ways to correct them."
— wcag-understanding/error-suggestion.html (In brief — the 1–10 range is a known way to correct, and must be suggested)

> "Provide examples of the correct data entry for the field, Describe the correct data entry for the field"
— wcag-techniques/general/G85.html (Description — describing the correct range, e.g. "1 to 10," is exactly what is required and missing)

> "The description contains adequate information for the user to know what is required to fix the error."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (Evaluate Results — "Value not allowed." lacks the range, so it does not meet this)
