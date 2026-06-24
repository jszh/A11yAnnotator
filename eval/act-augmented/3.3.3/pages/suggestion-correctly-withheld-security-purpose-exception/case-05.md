# case-05 — Over-disclosure: password-reset suggestion leaks the security-question answer and previous password (FAILED)

## Scenario
A bank "set a new password" screen in its post-submit error state. The author tried to be helpful and gave a very specific, well-associated suggestion for fixing the rejected new password — but the suggestion **leaks security-sensitive content**, quoting the user's security-question answer (*"Hawthorne"*) and their previous password (*"Maple2021!"*) verbatim:
*"That password can't be used. It can't contain the answer to your security question ("Hawthorne") or repeat your previous password ("Maple2021!"). Please choose something different."*
This is the inverse failure: the password field is the textbook security-sensitive field where the 3.3.3 exception SHOULD apply, but the author violated it by disclosing. A specific, fluent, programmatically-perfect suggestion is present — that is the trap. The defect is that the suggestion's content jeopardizes security. **FAILED.**

## Attribute tuple
- **content-domain:** online banking — password reset / credential management
- **UI-component / pattern:** new-password + confirm field, inline `role="alert"` suggestion
- **host-language construct:** `<input type="password" autocomplete="new-password">` with `aria-describedby` pointing at a richly-specific error suggestion
- **locale / i18n:** en-US
- **failure-mechanism:** over-disclosure — the exception is triggered (password field) and the author leaks secrets (security answer + prior password) inside the "helpful" suggestion

## Developer persona
A well-meaning mid-level dev read SC 3.3.3 / G177 ("provide suggested correction text") and over-corrected: they made the rejection message maximally specific by echoing the exact strings the new password collided with — pulling the user's stored security-question answer and previous password into the message to "explain why." They optimised for the helpfulness half of 3.3.3 and ignored the security exception, turning a conformant generic rejection into a credential-leaking one. It reads beautifully and passes a "did you suggest a fix?" check, so it shipped.

## Element / selector carrying the issue
`#newpw-error` (`role="alert"`, referenced by `#newpw[aria-describedby]`) — a specific suggestion whose content discloses the user's security-question answer ("Hawthorne") and previous password ("Maple2021!").

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Screen-reader user:** on submit the `role="alert"` reads aloud *"That password can't be used. It can't contain the answer to your security question, quote Hawthorne unquote, or repeat your previous password, quote Maple2021 exclamation mark unquote."* The AT user — and anyone within earshot of the speech output, or watching the screen — now hears/sees the user's security-question answer and prior password. The accessibility tree literally contains the secrets.
- **Why FAILED:** SC 3.3.3 requires suggestions *"unless it would jeopardize the security or purpose of the content."* Here the exception is triggered (security-sensitive password field) yet the author provides a suggestion whose content jeopardizes security. Trusted Tester treats "details about an incorrect password" as the canonical thing that must be withheld; this page does the opposite — it broadcasts secrets. The page fails because the suggestion violates the exception that governs the field.

## Expected ACT-style outcome
**failed** — the page jeopardizes the security of the content by disclosing the security-question answer and previous password inside the error suggestion, which the SC 3.3.3 exception exists to prevent.

## Why automated tools miss it
The message is grammatical, named, `role="alert"`, programmatically associated, high-contrast, and structurally a model error suggestion — axe/WAVE/Lighthouse would PRAISE it, and a "did the page suggest a correction?" heuristic would mark it PASS (the opposite of correct). No automated tool can recognise that the quoted strings "Hawthorne" and "Maple2021!" are the user's security-question answer and prior password, nor that printing them jeopardizes the security the field protects. Identifying that the suggestion's *content* breaches the security exception is a purely semantic, contextual human judgment.

## Citation
> "Providing information about how to correct the error would **jeopardize the security or purpose** of the content (e.g., details about an incorrect password)."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (Test 5.G — DNA; "details about an incorrect password" is exactly what this page discloses)

> "If an input error is automatically detected and suggestions for correction are known, then the suggestions are provided to the user, unless it would jeopardize the security or purpose of the content."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (WCAG SC 3.3.3 normative text — the exception is violated here)

> "Check that other data previously entered by the user is re-displayed, unless the data is in a security related field where it would be inappropriate to retain the data for re-display (e.g. password)."
— wcag-techniques/general/G85.html (Tests — the spec singles out passwords as data that must NOT be surfaced; this page surfaces the previous password)
