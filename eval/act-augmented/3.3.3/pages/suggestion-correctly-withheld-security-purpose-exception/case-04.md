# case-04 — Identity-proofing: generic "couldn't verify" correctly withholds which factor failed (PASS)

## Scenario
A patient-portal **account-recovery identity-verification** step asks for two knowledge-based factors — date of birth and the last four digits of the SSN on file. The user got one wrong and the page is in the post-submit error state. The error reads *"We couldn't verify your identity with the details provided. Check the information and try again, or call Member Services to recover your account."* It deliberately does not reveal which factor failed, does not echo any expected value, and gives an out-of-band recovery path. Disclosing which knowledge factor matched would let an attacker who guessed one factor brute-force the other and would confirm that a DOB/SSN fragment belongs to a real member — both jeopardize the security and the whole purpose of identity proofing. Withholding the per-field suggestion is the **correct** outcome — PASS.

## Attribute tuple
- **content-domain:** healthcare / patient portal — account recovery
- **UI-component / pattern:** two-factor knowledge-based verification, single form-level `role="alert"` shared by both inputs
- **host-language construct:** `<input autocomplete="bday">` (DOB) + `<input maxlength="4">` (SSN-last-4), both `aria-invalid`, both `aria-describedby` the shared error
- **locale / i18n:** en-US (US SSN, MM/DD/YYYY)
- **failure-mechanism:** NONE — PASS limb; the discriminator is that per-field "which one was wrong" disclosure is forbidden, so a single generic outcome is correct

## Developer persona
A healthcare security engineer building HIPAA-aware account recovery. They follow NIST identity-proofing guidance: never confirm which individual knowledge factor matched, because that turns a two-factor check into two independent one-factor guesses. They wrote one shared, non-revealing message plus a human (phone) fallback. The page tests whether the judge recognises that NOT telling the user which factor failed is the conformant, security-mandated choice — not a 3.3.3 omission.

## Element / selector carrying the issue
`#verify-error` (`role="alert"`, referenced by both `#dob[aria-describedby]` and `#ssn4[aria-describedby]`) — a single generic verification-failure message that correctly withholds per-field correction.

## Exact accessibility mechanism (what AT experiences / why it passes)
- **Screen-reader user:** on submit the `role="alert"` announces *"We couldn't verify your identity with the details provided. Check the information and try again, or call Member Services at 1-800-555-0137 to recover your account."* Focusing either field repeats the shared message. The user knows verification failed and has two correction paths (recheck both, or call) without learning which factor matched.
- **Why PASS:** an input error is detected; the only suggestions that would not jeopardize the purpose (recheck everything / use the out-of-band path) are provided. The field-specific suggestion that 3.3.3 would normally want ("your SSN digits are wrong but your DOB is right") is exactly the disclosure the exception forbids. SC 3.3.3 is satisfied.

## Expected ACT-style outcome
**passed** — the per-field suggestion that would jeopardize identity-proofing is correctly withheld; the exception applies and a non-revealing correction path is offered.

## Why automated tools miss it
The error is a clean, named, associated `role="alert"` — axe/WAVE/Lighthouse object to nothing and cannot grade message specificity. A heuristic that flags "error detected but the page does not say which field is wrong" would wrongly fault this page. No automated tool can classify DOB + SSN-last-4 as identity-proofing knowledge factors, cannot know that confirming a per-field match is forbidden, and cannot judge that the generic message is the conformant outcome. That security classification and exception-application is a contextual human judgment.

## Citation
> "If an input error is automatically detected and suggestions for correction are known, then the suggestions are provided to the user, unless it would jeopardize the security or purpose of the content."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (WCAG SC 3.3.3 normative text — "or purpose of the content" covers identity proofing)

> "Providing information about how to correct the error would **jeopardize the security or purpose** of the content (e.g., details about an incorrect password)."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (Test 5.G — DNA condition)

> "Check that other data previously entered by the user is re-displayed, unless the data is in a security related field where it would be inappropriate to retain the data for re-display (e.g. password)."
— wcag-techniques/general/G85.html (Tests — security-related fields are exempted; the SSN field shows •••• rather than re-displaying the entry)
