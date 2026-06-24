# case-01 — Phone field: all-digit value flagged with "remove letters and parentheses" (cause that did not occur)

## Scenario
A carrier line-activation wizard rendered in its **post-submit error state**. The user typed an all-digit mobile number, `12025550143` (eleven ASCII digits). The carrier rejected it, and a visible, correctly associated error reads *"Mobile number is invalid. Remove letters and parentheses from your phone number, then try again."* The field's own hint says "Enter digits only." The value already contains only digits — there are no letters and no parentheses to remove. The asserted cause did not occur; the real defect (an 11-digit string for a field that wants a 10-digit national number) is never described.

## Attribute tuple
- **content-domain:** telecom / mobile carrier account onboarding
- **UI-component / pattern:** native `<input type="tel">` with `aria-describedby` hint + inline error, `aria-invalid="true"`
- **host-language construct:** single text field, retained value, programmatically associated visible error message
- **locale / i18n:** en-US
- **failure-mechanism:** boilerplate mismatch — message describes a cause (letters/parentheses) that is **factually absent** from the entered value

## Developer persona
A junior dev building the activation flow grabbed a generic phone-validation snippet from a Stack Overflow answer whose error string was *"Remove letters and parentheses from your phone number."* The snippet was written for a free-text phone field that accepted `(202) 555-0143`. In this flow the field is digits-only and the actual server rule is "exactly 10 digits," but the dev wired the canned message to fire on every validation failure without re-checking what defect it claimed. It reads fluently, names the field, and "describes a fix," so it sailed through their checklist and an axe scan.

## Element / selector carrying the issue
`#error-phone` (the message referenced by `#phone[aria-describedby]`) asserting "Remove letters and parentheses" against `#phone[value="12025550143"]`, an all-digit value.

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Screen-reader user:** focusing the field hears "Mobile number, edit, invalid entry, Mobile number is invalid. Remove letters and parentheses from your phone number." They search their value for letters and parentheses, find none, retype the same digits, and are rejected again. The error is *programmatically perfect* (named, described, in the accessibility tree via `aria-describedby`) but **factually wrong**, so the user cannot determine what is actually wrong.
- **Cognitively-loaded / low-literacy user:** the authoritative, fluent instruction sends them hunting for a defect that isn't there; the real problem (one digit too many / wrong format) is invisible.
- **Sighted user reading carefully:** same trap — the text is competent prose that simply does not match the value on screen.

## Expected ACT-style outcome
**failed** (SC 3.3.1 — an input error is detected and an error is shown, but the description does not identify *this* value's actual error; the user is not enabled to "determine what is wrong").

## Why automated tools miss it
ACT rule 36b590 Expectation 2 is satisfied: a visible error indicator exists, it identifies the field, and it "describes the cause of the error or how to resolve it" as a self-contained string in the accessibility tree. axe/WAVE/Lighthouse confirm the label, the resolved `aria-describedby`, the contrast, and the textbox role — every structural facet passes. No checker reads the **entered value** (`12025550143`), compares it against the field's stated constraint ("digits only"), and judges that the message names a cause (letters/parentheses) the value does not exhibit. That value↔constraint↔message agreement check is a contextual semantic judgment no automated tool performs.

## Citation
> "the user enters alphabetic characters or parentheses into their phone number field that only accepts numbers;"
— wcag-understanding/error-identification.html (Intent — list of "input error" examples; here that error did **not** occur, yet it is the one described)

> "The intent of this success criterion is to ensure that users are aware that an error has occurred and can determine what is wrong."
— wcag-understanding/error-identification.html (Intent)

> "This rule checks that text error messages provided when the user completes a form field with invalid values or using an invalid format, identify the cause of the error or how to fix the error."
— act-rules/extracted/36b590.md (Description) — the rule only checks that *a* cause/fix is described, never that the described cause matches the actual value.
