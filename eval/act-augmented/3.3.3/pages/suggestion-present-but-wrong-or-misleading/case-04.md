# case-04 — Item-count error suggests "between 1 and 100" but the field's documented limit is 50

## Scenario
A contents-insurance quote wizard, step 3: "How many high-value items do you want to schedule?" The visible help text beside the field states the real rule — *"Online quotes cover up to 50 scheduled items. For 51 or more, please call us."* — and the field enforces it with `max="50"` and a JS validator (`n <= 50`). Enter 80 and an error fires in `role="alert"`, associated via `aria-describedby`, with a confident, specific suggested range: *"That number isn't valid. Please enter a number between 1 and 100."* The suggested ceiling (100) is double the field's true ceiling (50). A user who follows the suggestion and enters any value 51–100 — exactly what the suggestion invites — is rejected again.

## Attribute tuple
- **content-domain:** insurance quote wizard (contents insurance, high-value items)
- **UI-component / pattern:** multi-step wizard with a numeric `<input type="number">` spinbutton + visible help text + `role="alert"` inline error
- **host-language construct:** `<input type="number" min="1" max="50">` with `aria-describedby` help + alert
- **locale / i18n:** en-GB (GBP), no i18n collision (defect is a numeric range contradiction)
- **failure-mechanism:** suggested upper bound (100) overstates the field's enforced/documented maximum (50); values in the suggested range 51–100 are rejected

## Developer persona
The product team reduced the online self-serve cap from 100 to 50 items (anything larger now routes to a phone agent). The help text, the `max` attribute, and the validator were updated in the same ticket — but the validation error string lived in a shared `messages.js` constants file and was missed. It still reads "between 1 and 100" from the original spec. The message is specific and gives a range, so it read as a good error suggestion in review.

## Element / selector carrying the issue
`#items-err` (the `role="alert"` paragraph), text *"Please enter a number between 1 and 100."*, describing `#items` whose `max="50"` and JS validator (`n >= 1 && n <= 50`) cap the value at 50, as the visible `#items-help` text also states.

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Screen-reader user:** the failed submit announces "That number isn't valid. Please enter a number between 1 and 100." The user takes the explicit range at face value and re-enters, say, 75 — squarely inside the suggested range, squarely rejected by the field. The corrective guidance literally points into the invalid zone.
- **Cognitively-loaded user:** anchors on the stated maximum "100" and repeatedly tries values the field cannot accept, the abandonment loop the SC's Intent describes.
- **Sighted user:** can read the "up to 50" help text and reconcile, but the announced suggestion still actively misdirects.

## Expected ACT-style outcome
**failed** (SC 3.3.3 — a suggestion for corrected input IS provided as an explicit range, but the range is wrong: it includes values (51–100) the field rejects, so it is not "adequate information for the user to know what is required to fix the error").

## Why automated tools miss it
The suggestion is present, specific, associated, and announced — the presence check passes. axe/WAVE/Lighthouse do not parse "between 1 and 100" out of the alert prose, read `max="50"` and the validator and the "up to 50" help text, and compute that 100 exceeds the true ceiling so the suggested range is partly invalid. They have no model of the field's allowed range to test the suggested range against. Detecting the overstated upper bound requires a human to compare the suggested range with the field's documented/enforced range.

## Citation
> "Some examples of information that is not accepted include ... information that is provided by the user but that falls outside the required data format or allowed values."
— wcag-understanding/error-suggestion.html (Intent) — the field rejects values outside 1–50; a suggestion inviting 1–100 sends the user back outside the allowed values.

> "When input must be one of a set of allowed values, the text description should indicate this fact. It should include the list of values if possible, or suggest the allowed value that is most similar to the entered value."
— wcag-techniques/general/G84.html (Description) — the suggested range must reflect the allowed values; "1 to 100" misstates them.

> "The description contains adequate information for the user to know what is required to fix the error."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (Evaluate Results) — a range that includes rejected values is not adequate information to fix the error.
