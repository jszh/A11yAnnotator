# case-03 — One-time emailed verification code, generic "that code didn't match" (un-inferable + security -> PASS)

## Scenario
A credit-union two-factor sign-in step rendered in its **post-submit error state**. The user typed a wrong 6-digit one-time code (`408219`) that was emailed to them. A visible, correctly associated error reads *"That code didn't match. Check the most recent email from us and enter the 6-digit code. Codes expire after 10 minutes."* No suggested correct value is offered — and none can be. This is a **DNA / gate PASS** for two independent reasons: a random OTP is not inferable from a wrong guess (not knowable), and echoing the correct code back would defeat verification (security/purpose).

## Attribute tuple
- **content-domain:** online banking / credit union authentication
- **UI-component / pattern:** single one-time-code `<input autocomplete="one-time-code">`, inline error via `aria-describedby`, `aria-invalid="true"`, with a "send a new code" recovery action
- **host-language construct:** text input with `inputmode="numeric"`, retained wrong value, programmatic error association
- **locale / i18n:** en-US
- **failure-mechanism:** NONE — conformant; the test is whether the judge applies BOTH the knowability gate and the security/purpose exception rather than penalizing the absent suggested value

## Developer persona
A security engineer built the 2FA verification step. They deliberately wrote the error to guide the user ("check the most recent email," "codes expire after 10 minutes," "send a new code") while never echoing the secret. They added the footnote "we never display your code on this page" precisely to document that the omission is intentional. The page is correct; the risk is a reviewer mechanically requiring "a suggestion for the correct value" and flagging the page, ignoring that the correct value is both un-inferable and a secret.

## Element / selector carrying the issue
`#otp` (the one-time-code input) and its error `#error-otp`. The judgment is to recognize that no specific suggestion is possible (un-inferable random code) and none is permitted (security), so the generic-but-actionable message is conformant.

## Exact accessibility mechanism (what AT experiences / why it passes)
- **Screen-reader user:** focusing the field hears "6-digit verification code, edit, invalid entry, That code didn't match. Check the most recent email from us and enter the 6-digit code. Codes expire after 10 minutes." This is the maximum actionable guidance: where to look (latest email), what to enter (6 digits), the time limit, and an adjacent "send a new code" button. There is no further suggestion to give — the correct code cannot be inferred and must not be revealed.
- **Cognitively-loaded user:** the message points to a concrete next step (re-check the email or request a new code) rather than a guess at the value.
- **Why it PASSES:** SC 3.3.3 obliges a suggestion only when one is known, "unless it would jeopardize the security or purpose of the content." Both carve-outs apply here.

## Expected ACT-style outcome
**passed** (SC 3.3.3 — an input error is detected, but suggestions for correction are not knowable (a random OTP) and would in any case jeopardize security; the actionable generic message satisfies the criterion).

## Why automated tools miss it
A naive scan sees "error present, no suggested value provided" and could flag a 3.3.3 failure. No automated tool can reason that the correct value is (a) not inferable from a wrong guess and (b) deliberately withheld for security — both DNA conditions. axe/WAVE/Lighthouse confirm the label, the resolved `aria-describedby`, the `aria-invalid` state, and contrast, but have no model of "this value is a secret one-time code." The double gate (knowability + security/purpose) is a semantic and policy judgment, not a markup property.

## Citation
> "If an input error is automatically detected and suggestions for correction are known, then the suggestions are provided to the user, unless it would jeopardize the security or purpose of the content."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (SC text) — both the "are known" precondition and the "jeopardize the security" exception apply to a one-time code.

> "Providing information about how to correct the error would **jeopardize the security or purpose** of the content (e.g., details about an incorrect password)."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (DNA condition) — a one-time verification code is directly analogous to the password example.

> "The intent of this success criterion is to ensure that users receive appropriate suggestions for correction of an input error if it is possible."
— wcag-understanding/error-suggestion.html (Intent) — "if it is possible"; a specific suggestion for a random OTP is not possible.
