# case-01 — Login: generic "Email or password is incorrect" is the CORRECT withheld suggestion (PASS)

## Scenario
A webmail sign-in page rendered in its **post-submit failed-login state**. A single visible, programmatically-associated error reads *"Email or password is incorrect. Please try again."* It deliberately does not say which of the two was wrong and offers no specific correction. This is the canonical security exception to SC 3.3.3: revealing that the email exists (account enumeration) or that the password was "close" would jeopardize the security of the content. Withholding the specific suggestion is the **correct, conformant** outcome — a PASS that a naive "no suggestion = fail" rule would wrongly flag.

## Attribute tuple
- **content-domain:** consumer webmail / authentication
- **UI-component / pattern:** standard login form, `role="alert"` form-level error governing the credential pair
- **host-language construct:** two `<input>` fields (email + password) sharing one `aria-describedby` error, both `aria-invalid="true"`
- **locale / i18n:** en-US
- **failure-mechanism:** NONE — this is the PASS limb; the discriminating point is that the absence of a specific suggestion is required by the exception

## Developer persona
A senior platform engineer who has read OWASP authentication guidance. They intentionally chose the merged, non-revealing message to prevent username enumeration — the textbook secure-login behavior. The accessibility risk is not that they did something wrong; it is that an over-eager auditor (or a literal automated rule) will report "3.3.3: error detected, no correction suggested" and pressure them to leak which field failed. The page exists to test whether the judge recognizes the exception and reads this as PASS.

## Element / selector carrying the issue
`#login-error` (`role="alert"`, referenced by both `#email[aria-describedby]` and `#password[aria-describedby]`) — a generic credential error that intentionally withholds field-specific correction.

## Exact accessibility mechanism (what AT experiences / why it passes)
- **Screen-reader user:** on submit, the `role="alert"` announces *"Email or password is incorrect. Please try again."* Focusing either field repeats the same associated message. The user is told an error occurred and what to do (try again) without being told a security-revealing specific. This is exactly what the exception intends.
- **Why PASS:** SC 3.3.3 requires suggestions *"unless it would jeopardize the security or purpose of the content."* For a credential pair, a field-specific suggestion (e.g. "no account with that email" or "your password is too short") IS the jeopardizing disclosure. The error is identified (3.3.1 satisfied) and the only correction that would not jeopardize security ("try again") is present. The exception removes the obligation to give a more specific suggestion.

## Expected ACT-style outcome
**passed** — SC 3.3.3 is met because the security exception applies; the suggestion is correctly withheld and the generic guidance ("try again") is provided.

## Why automated tools miss it
axe/WAVE/Lighthouse see a clean, named, programmatically-associated `role="alert"` error and would never object structurally — they cannot test message *quality* at all. The harder failure mode is a heuristic that flags "input error detected but no specific correction suggested." No automated tool can classify these inputs as security-sensitive credentials, cannot know that SC 3.3.3's security exception applies, and cannot judge that the deliberately-generic message is the *required* outcome rather than a deficiency. Deciding that the missing suggestion is conformant here — while the same generic message on a non-sensitive field would fail (see case-03) — is a purely contextual human judgment.

## Citation
> "If an input error is automatically detected and suggestions for correction are known, then the suggestions are provided to the user, unless it would jeopardize the security or purpose of the content."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (WCAG SC 3.3.3 normative text)

> "Providing information about how to correct the error would **jeopardize the security or purpose** of the content (e.g., details about an incorrect password)."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (Test 5.G — DNA condition: when withholding is correct)
