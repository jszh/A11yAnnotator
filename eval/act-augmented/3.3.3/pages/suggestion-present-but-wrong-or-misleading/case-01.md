# case-01 — Password error suggests "at least 8 characters" but the field requires 12

## Scenario
A credit-union online-banking account-setup step. A visible policy box above the password field states the real rule: *"be at least 12 characters long."* The field also enforces it with `minlength="12"` and a JS validator. When the user submits a short password, an error fires in a `role="alert"` live region, correctly associated via `aria-describedby`, with a confident, specific suggested fix: *"Your password is too short. Use at least 8 characters to continue."* The suggestion names **8**; the field accepts only **12+**. A user who trusts the suggestion and supplies a fresh 8–11 character password is rejected again with the identical message.

## Attribute tuple
- **content-domain:** online banking / fintech (credit-union account setup)
- **UI-component / pattern:** password field with show/hide toggle button + `role="alert"` inline error + visible policy bullet list
- **host-language construct:** `<input type="password" minlength="12">` with `aria-describedby`-linked alert paragraph
- **locale / i18n:** en-US, no locale collision (defect is a numeric contradiction, not i18n)
- **failure-mechanism:** suggestion names a smaller threshold (8) than the field's enforced minimum (12); following it guarantees a re-failure

## Developer persona
A junior developer copied a generic "password too short" error string from an internal snippets library that predated a 2025 security-policy uplift. The bank raised the minimum from 8 to 12 characters; the policy bullets and the `minlength` attribute were updated, but the hard-coded error string still said "at least 8 characters." The string is grammatical, names the field problem, and "provides a suggestion," so it passed code review and an automated a11y scan.

## Element / selector carrying the issue
`#pw-err` (the `role="alert"` paragraph), text *"Your password is too short. Use at least 8 characters to continue."*, describing `#pw` whose `minlength="12"` and JS validator (`v.length >= 12`) enforce a 12-character minimum.

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Screen-reader user:** on the failed submit, the `role="alert"` region announces "Your password is too short. Use at least 8 characters to continue." This is the ONLY corrective guidance offered. Acting on it — typing a new 8-character password — produces the same rejection. The blind user has no visual shortcut to notice the 12 in the policy box conflicts with the 8 in the alert, so the wrong number is the operative instruction.
- **Cognitively-loaded user:** takes the explicit, confident number at face value and loops on failure, the exact abandonment the SC's Intent warns about ("users may abandon the form because they may be unsure of how to correct the error").
- **Sighted keyboard user:** can in principle reconcile the two numbers, but the suggestion still actively misdirects.

## Expected ACT-style outcome
**failed** (SC 3.3.3 — a correction suggestion IS provided, but it does not contain "adequate information for the user to know what is required to fix the error": it states a threshold the field rejects, so following it does not resolve the error).

## Why automated tools miss it
TT test 5.G and any ACT analogue assert that *a suggestion is present* — which is unambiguously true here (specific, associated, announced). axe/WAVE/Lighthouse confirm the `role="alert"`, the `aria-describedby` link, contrast, and that the error text is non-empty. None of them parse the number "8" out of the prose, read `minlength="12"` and the validator and the policy bullets, and judge that 8 < 12 makes the suggestion self-defeating. They have no model of what the field actually accepts to test the suggestion against. Detecting it requires a human to read the suggested fix and compare it to the field's true, visible constraint.

## Citation
> "The intent of this success criterion is to ensure that users receive appropriate suggestions for correction of an input error if it is possible."
— wcag-understanding/error-suggestion.html (Intent) — "appropriate" suggestions; a suggestion that names the wrong threshold is not appropriate for this field.

> "In the case of an unsuccessful form submission, users may abandon the form because they may be unsure of how to correct the error even though they are aware that it has occurred."
— wcag-understanding/error-suggestion.html (Intent) — a wrong suggestion that loops the user back to the same error is exactly this abandonment risk.

> "The description contains adequate information for the user to know what is required to fix the error."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (Evaluate Results) — the PASS condition is *adequate* information; an 8-character suggestion for a 12-character field is inadequate/misleading.
