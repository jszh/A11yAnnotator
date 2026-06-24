# case-01 — Free-text "Reason for return" textarea, generic "this field is required" (correction not knowable -> PASS)

## Scenario
A home-goods returns flow rendered in its **post-submit error state**. The required "Reason for return" textarea was left empty, so a visible, correctly associated error appears: *"Please tell us your reason for return — this field is required."* No specific suggestion for corrected input is offered — and none is possible, because the field collects open-ended prose ("in your own words, tell us why"). The only knowable rule is "must not be empty," which the message states exactly. This is the canonical **DNA / precondition-gate PASS**: the correction is genuinely not knowable, so a generic required-message is conformant.

## Attribute tuple
- **content-domain:** e-commerce returns / reverse logistics
- **UI-component / pattern:** required `<textarea>` (free-text), programmatically associated inline error via `aria-describedby`, `aria-invalid="true"`
- **host-language construct:** native `<textarea required>` re-rendered in server error state with retained empty value
- **locale / i18n:** en-US
- **failure-mechanism:** NONE — this is a conformant page; the test is whether the judge correctly applies the *knowability gate* and does NOT penalize the absent suggestion

## Developer persona
A mid-level dev on the e-commerce team built the returns form to spec. The product owner deliberately wanted a free-text reason field rather than a dropdown, "so we hear how customers actually feel." The dev wired a single generic validator: required fields that are empty show "[label] — this field is required." They never added a per-field suggestion for the textarea because there is nothing to suggest — the reason is whatever the customer types. The page is correct; the risk is that an over-eager 3.3.3 reviewer (or a rubric that learned "every error needs a suggestion") flags it as a failure.

## Element / selector carrying the issue
`#reason` (the required free-text `<textarea>`) and its associated error `#error-reason`. The judgment hangs on recognizing that for THIS field a correction is not knowable, so the absence of a suggestion is conformant.

## Exact accessibility mechanism (what AT experiences / why it passes)
- **Screen-reader user:** focusing the field hears "Reason for return, edit, invalid entry, Please tell us your reason for return — this field is required." This is the complete, correct, and sufficient information: the user knows the field is required and that they must type something. No further "suggestion" exists to provide — the system cannot guess the customer's reason.
- **Cognitively-loaded user:** the message is plain and actionable ("tell us your reason"). There is no missing fix to hunt for.
- **Why it PASSES:** 3.3.3 obliges a suggestion only when one is *known*. For free-form prose the correct value is not inferable or enumerable; the most specific possible message is "this is required," which is present and associated.

## Expected ACT-style outcome
**passed** (SC 3.3.3 — an input error is detected, but suggestions for correction are not knowable for a free-text reason field; the generic required-message is the conformant maximum, so the success criterion is satisfied).

## Why automated tools miss it
Automated tools have no concept of whether a correction is *computable* for a given field. axe/WAVE/Lighthouse confirm the structural facts (label present, `aria-describedby` resolves, `aria-invalid` set, contrast fine) but cannot tell an open-ended prose field (suggestion not knowable -> absence is fine, PASS) from an enumerable field like "Month" (suggestion knowable -> absence is a fail). The distinction is entirely about field meaning and human-inferred knowability — exactly the precondition gate ACT does not model. A tool that simply checked "error present but no suggestion text" would WRONGLY fail this page.

## Citation
> "The intent of this success criterion is to ensure that users receive appropriate suggestions for correction of an input error if it is possible."
— wcag-understanding/error-suggestion.html (Intent) — "if it is possible" is the knowability gate; here a specific suggestion is not possible.

> "Based on the type of input required, suggestions for correction **cannot be provided** because they are not knowable."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (DNA condition) — a free-text reason satisfies this DNA condition, so absence of a suggestion is conformant.

> "Suggestions for corrected input are provided, OR ... The description contains adequate information for the user to know what is required to fix the error."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (Evaluate Results — PASS if ANY true) — "this field is required" tells the user what is required to fix the error, satisfying the second PASS condition.
