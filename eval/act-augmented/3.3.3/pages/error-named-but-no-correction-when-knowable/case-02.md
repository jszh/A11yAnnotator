# case-02 — Performance-date field: "...Use MM/DD/YYYY (for example, 07/04/2025)." correction SUPPLIED (PASS twin)

## Scenario
A Lumen Hall box-office reservation card rendered in its **post-submit error state** — the deliberate **PASS twin** of case-01. The user typed `7/4/2025` in "Performance date" (a real date missing the leading zero on the month). The form accepts exactly MM/DD/YYYY, the same fixed constraint as case-01. The difference that decides SC 3.3.3: the visible, programmatically associated error here does not stop at restating the problem — it **supplies the knowable correction in text**: *"That date isn't in the format we accept. Use a two-digit month and day with a four-digit year — MM/DD/YYYY (for example, 07/04/2025)."*

## Attribute tuple
- **content-domain:** arts / events / box-office ticketing (distinct from case-01's government domain)
- **UI-component / pattern:** ticket-stub card layout, `<input type="text">` date field with `aria-describedby` chaining a help hint + an inline error message
- **host-language construct:** server re-display; retained value; correction text co-located with the field
- **locale / i18n:** en-US
- **failure-mechanism:** NONE — this is the boundary case that conveys the correction (format described + worked example given)

## Developer persona
A small-venue developer had been bitten by exactly the case-01 pattern in a prior audit, so when wiring this form she followed WCAG Technique G85 deliberately: the validation handler emits not just "wrong format" but the field's required shape plus a concrete example matching the user's intent. She treats "does the message tell the user how to fix it?" as a distinct test from "does a message appear?"

## Element / selector carrying the issue
`#visit-error` (the message referenced by `#visit[aria-describedby]`). It carries the correction text — describing the format and giving the worked example `07/04/2025` — so this element is what makes the page PASS.

## Exact accessibility mechanism (what AT experiences / why it passes)
- **Screen-reader user:** focusing the field hears "Performance date, edit, invalid entry, The evening you plan to attend. That date isn't in the format we accept. Use a two-digit month and day with a four-digit year, MM/DD/YYYY, for example 07/04/2025." They learn the exact shape and an example — they can fix it on the next try without sight.
- **Cognitive / low-literacy user:** the worked example `07/04/2025` is concrete scaffolding; they can pattern-match their own date to it.
- **Sighted user:** the format + example removes all ambiguity about slashes and zero-padding.
- **Contrast with the FAIL:** the DOM wiring is structurally identical to case-01 (label, `aria-describedby`, `aria-invalid`, contrast). Only the *meaning of the string* changes — from a restatement to an actionable suggestion — which is precisely the line SC 3.3.3 draws.

## Expected ACT-style outcome
**passed** (SC 3.3.3 — an input error is detected, a correction is knowable, and the suggestion IS provided to the user in text).

## Why automated tools miss it
This is the crux of the whole aspect: an automated checker would score case-01 and case-02 **identically**, because every structural facet is the same (label resolves, `aria-describedby` resolves to a non-empty message, `aria-invalid="true"`, contrast fine, nothing hidden). The only thing that separates this PASS from case-01's FAIL is whether the non-empty string *contains an actionable correction* versus *merely restates the error*. No axe/WAVE/Lighthouse rule reads the string's meaning, so neither the pass nor the fail is detectable by tooling — confirming that the obligation lives entirely in human semantic judgment.

## Citation
> "Where errors are detected, suggest known ways to correct them."
— wcag-understanding/error-suggestion.html (In brief — "What to do"; this page does exactly that)

> "Provide examples of the correct data entry for the field, Describe the correct data entry for the field"
— wcag-techniques/general/G85.html (Description — this message both describes the format and gives a worked example, satisfying the technique)

> "Suggestions for corrected input are provided, OR The description contains adequate information for the user to know what is required to fix the error."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (Evaluate Results — PASS if either is true; here the description contains adequate information)
