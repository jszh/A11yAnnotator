# case-06 — Over-disclosure: 2FA error confirms first-3-digits + exact code length (verification oracle) (FAILED)

## Scenario
A two-step verification screen rejected the user's one-time code and is in the post-submit error state. The exception SHOULD apply (a one-time auth code is security-sensitive; the correct withheld message is just *"That code isn't valid. Request a new code."*). Instead the author wrote an over-helpful suggestion that turns the field into a brute-force **oracle**: *"Almost! Your first 3 digits (4 1 9) are correct, but the code has 6 digits and you entered 5. Check the last digits and try again."* It confirms which leading digits matched and the exact expected length. An attacker — or anyone who can read/hear the error — can now fix the length and brute-force only the remaining unknown digits, collapsing the code's entropy. That jeopardizes the security and purpose of the content; the exception forbids exactly this partial-match feedback. The defect is not a missing suggestion — a specific, well-formed suggestion is present — it is that the suggestion leaks a verification oracle. **FAILED.**

## Attribute tuple
- **content-domain:** identity provider / SaaS authentication — 2FA (TOTP)
- **UI-component / pattern:** segmented one-time-code entry (`role="group"` of six single-char inputs), inline `role="alert"` error
- **host-language construct:** six `<input inputmode="numeric" maxlength="1" autocomplete="one-time-code">`, all `aria-invalid`, group `aria-describedby` the error
- **locale / i18n:** en
- **failure-mechanism:** over-disclosure of a partial-match oracle — confirming correct leading digits and exact length defeats the 2FA purpose

## Developer persona
A product engineer chasing a lower OTP drop-off rate added "smart" inline feedback: instead of a flat rejection, the validator compares the entry against the real code and tells the user how close they got, to reduce frustration. They optimised the helpfulness half of 3.3.3 (and a UX metric) and never considered that "your first 3 digits are correct, the code is 6 long" is a textbook information leak that turns one 6-digit guess into a much smaller search. It reads friendly and "suggests a fix," so it passed review and any "did we help the user?" check.

## Element / selector carrying the issue
`#otp-error` (`role="alert"`, referenced by the `role="group"` via `aria-describedby`) — a suggestion whose content confirms the correct leading digits ("4 1 9") and the exact code length (6), forming a brute-force oracle.

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Screen-reader user:** on submit the `role="alert"` reads *"Almost! Your first 3 digits, 4 1 9, are correct, but the code has 6 digits and you entered 5. Check the last digits and try again."* The AT user hears confirmation of which digits matched and the exact length. The accessibility tree literally carries the oracle; speech output broadcasts it to anyone nearby.
- **Why FAILED:** SC 3.3.3 requires suggestions *"unless it would jeopardize the security or purpose of the content."* A one-time verification code is security-sensitive; partial-match feedback (correct prefix + length) is the disclosure the exception is designed to prevent, because it materially reduces the work to defeat the second factor. The author supplied a suggestion that violates the exception governing the field, so the page fails.

## Expected ACT-style outcome
**failed** — the error suggestion jeopardizes the security/purpose of the 2FA code by confirming the correct leading digits and the exact expected length (a brute-force oracle), which the SC 3.3.3 exception exists to prevent.

## Why automated tools miss it
The message is friendly, named, `role="alert"`, programmatically associated, high-contrast, and structurally an exemplary error suggestion — axe/WAVE/Lighthouse would approve, and a "did the page help the user fix the error?" heuristic would mark it PASS (exactly wrong). No automated tool can reason that "first 3 digits correct + length is 6" is a security leak that collapses a 2FA code's entropy and defeats its purpose. Recognising the partial-match oracle and tying it to the security exception is contextual security reasoning no checker performs. This page is distinct from case-05 (which echoes stored secrets); here the leak is comparative feedback about the live verification.

## Citation
> "If an input error is automatically detected and suggestions for correction are known, then the suggestions are provided to the user, unless it would jeopardize the security or purpose of the content."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (WCAG SC 3.3.3 normative text — partial-match feedback violates the exception)

> "Providing information about how to correct the error would **jeopardize the security or purpose** of the content (e.g., details about an incorrect password)."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (Test 5.G — DNA; partial-match feedback on an auth code is the same class of forbidden disclosure)

> "Where errors are detected, suggest known ways to correct them."
— wcag-understanding/error-suggestion.html (In brief — "What to do"; the suggestion here is "known" but its disclosure jeopardizes security, so it must be withheld, not surfaced as this page does)
