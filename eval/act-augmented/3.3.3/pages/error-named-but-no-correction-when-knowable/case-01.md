# case-01 — Date of birth field: "Invalid date." with no format shown though MM/DD/YYYY is the only accepted shape (FAIL)

## Scenario
A Travis County homestead-exemption form rendered in its **post-submit error state**. The user typed `3-7-1965` in "Date of birth" — a real, unambiguous date, just dashed and unpadded. The server accepts exactly one format, MM/DD/YYYY (the validator regex `^\d{2}/\d{2}/\d{4}$` is preserved in the page's inline comment). The visible, programmatically associated error reads only **"Invalid date."** No format, no example, no allowed-values hint appears anywhere on the page, even though the correction ("Use MM/DD/YYYY, e.g. 03/07/1965") is trivially knowable from the field's own constraint.

## Attribute tuple
- **content-domain:** government / county tax-office civic service
- **UI-component / pattern:** native `<input type="text">` date field + top-of-form `role="alert"` error summary + inline `aria-describedby` message
- **host-language construct:** server-side validation re-display; retained value; programmatically associated visible error string
- **locale / i18n:** en-US (US date order is itself the unstated constraint)
- **failure-mechanism:** bare restatement — message names the error ("Invalid date.") but omits the knowable correction (the fixed MM/DD/YYYY format)

## Developer persona
A county-IT contractor wired the legacy COBOL-era date check (`MMDDYYYY` with slashes) to a single canned string, `"Invalid date."`, that the mainframe returned for any non-matching input. The format requirement lived only in the back-end spec, never in the page. The contractor's checklist item was "does an error message appear for a bad date?" — it does, it is correctly associated and high-contrast, so the item was ticked and an axe scan passed. Nobody asked the harder question: does the message tell the user what shape to use?

## Element / selector carrying the issue
`#dob-error` (text content `"Invalid date."`), the message referenced by `#dob[aria-describedby="dob-error"]`, evaluated against `#dob[value="3-7-1965"]` and the fixed accepted format MM/DD/YYYY.

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Screen-reader user:** focusing the field hears "Date of birth, edit, invalid entry, Invalid date." They know *that* it is wrong but have no way to learn the required shape. Was it the dashes? The order? The missing leading zeros? The two-digit vs four-digit year? Nothing tells them, and they cannot see the field to guess. They retype variations blindly.
- **Cognitive / low-literacy user:** "Invalid date" provides zero scaffolding for someone who is unsure which of several plausible date formats this form wants; they are likely to abandon.
- **Sighted user:** even with the value on screen, the message gives no hint that slashes + zero-padding + MM/DD/YYYY is the rule.
- **Contrast with a PASS:** had the message read "Invalid date — use MM/DD/YYYY, e.g. 03/07/1965," the same AT path would deliver the correction. The DOM wiring is identical; only the *meaning* of the string differs.

## Expected ACT-style outcome
**failed** (SC 3.3.3 — an input error is automatically detected and a correction is knowable, but the suggestion is not provided to the user; the message is a restatement only).

## Why automated tools miss it
axe / WAVE / Lighthouse confirm every structural facet: the label resolves, `aria-describedby` resolves to a non-empty message, `aria-invalid="true"` is set, the `role="alert"` summary exists, contrast is ~7:1, nothing is hidden. SC 3.3.1 (error is identified in text) genuinely passes. No checker compares the **entered value** and the field's **fixed accepted format** against the **message text** to judge that a correction is knowable yet absent — `"Invalid date."` and `"Invalid date — use MM/DD/YYYY"` are both valid non-empty strings correctly wired to the field. Distinguishing presence-of-correction from presence-of-error-text is a semantic judgment no automated tool performs.

## Citation
> "the user enters a date in the wrong format;"
— wcag-understanding/error-suggestion.html (Intent — example of an "input error" where the wrong format is the defect)

> "If the user enters '12,' suggestions for correction may include: A list of the acceptable values ... The conversion of the input data interpreted as a different month format, e.g., 'Do you mean December?'"
— wcag-understanding/error-suggestion.html (Examples — when correction is knowable from a limited/known format, the suggestion must be offered; here none is)

> "Provide examples of the correct data entry for the field, Describe the correct data entry for the field, Show values of the correct data entry that are similar to the user's data entry"
— wcag-techniques/general/G85.html (Description — the text description must do one of these; "Invalid date." does none)

> "Suggestions for corrected input are provided, OR The description contains adequate information for the user to know what is required to fix the error."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (Evaluate Results — PASS needs one of these; "Invalid date." gives neither)
