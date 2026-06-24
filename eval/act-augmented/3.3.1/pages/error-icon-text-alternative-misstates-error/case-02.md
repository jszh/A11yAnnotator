# case-02 — Filled-but-too-short password, error icon `alt="This field is required"` (wrong cause)

## Scenario
A workforce SaaS password-reset screen ("Cadence HR"). The user submitted a new password `summer7` (7 characters). The policy requires at least 10 characters, so it is genuinely invalid — but *not* empty. On the failed submit the field shows a red error icon whose `alt` is the validation library's default required-field string, `alt="This field is required"`. A visible rules list also shows "At least 10 characters (yours has 7)".

## Attribute tuple + developer persona
- **content-domain:** HR / workforce SaaS password reset
- **UI-component / pattern:** inline error icon emitted by a jQuery-validation-style plugin template
- **host-language construct:** `<img alt>` bound to the plugin's default message + `aria-errormessage` association
- **locale / i18n:** en-US
- **failure-mechanism:** text alternative names the WRONG CAUSE — "required" for a field that is filled but too short
- **developer persona:** A dev wired up a generic validation plugin and used its default error template for every field; the template hardcodes the icon's `alt` to the plugin's stock `required` message. When the `minlength` rule fired, the icon (and its `alt`) was reused unchanged, so a too-short error is announced as a missing-required-field error.

## Element / selector carrying the issue
`img#newpw-icon` (`alt="This field is required"`) beside `input#newpw` (value `summer7`, `aria-invalid="true"`, `aria-errormessage="newpw-icon"`).

## Exact accessibility mechanism (what AT experiences, why it fails)
- The icon is a valid `role=img` with a non-empty accessible name, programmatically tied to the field as its error message.
- A screen-reader user hears: "New password, invalid, This field is required." But the field is NOT empty — they typed `summer7`. The announced cause (required/missing) contradicts the field's true error (too short). A user following the announcement will re-type *something*, which is already present, and keep failing without ever learning the real rule (≥10 chars).
- The actual error condition matches the Understanding's second class of input error — input "outside the required data format or allowed values" — yet the text alternative describes the first class (omitted required information).
- CDP accessibility tree confirms `name="This field is required"`.

## Expected ACT-style outcome
**failed** — the error is described in a text alternative, but the description identifies the wrong nature of the error (required vs. too-short), so the user cannot determine what is actually wrong.

## Why automated tools miss it
The image has a non-empty `alt`, `aria-errormessage` is correctly wired, and the contrast is fine — every structural rule passes. Automated tools cannot read the field's *value* and *policy* to know the password was supplied but too short, and they cannot judge that "This field is required" is the wrong cause. Detecting a wrong-cause text alternative requires reasoning about the field's actual state versus the alternative's meaning — human judgment.

## Citation
> "An "input error" includes: information that is required by the web page but omitted by the user, or information that is provided by the user but that falls outside the required data format or allowed values."
— wcag-understanding/error-identification.html (Intent of Error Identification)

> "When users enter input that is validated, and errors are detected, the nature of the error needs to be described to the user in manner they can access."
— wcag-techniques/general/G84.html (Description)
