# case-02 — Bank wire confirmation: expected last-4 digits correctly NOT echoed (PASS)

## Scenario
A retail-bank wire-transfer **security verification step** asks the user to re-key the last four digits of the recipient's account number as a confirmation challenge. The user typed the wrong four digits and the page is in the post-submit error state. The error names the field and gives a non-revealing fix — *"Re-enter the last four digits exactly as printed on the recipient's statement"* — but deliberately does **not** echo the correct four digits and does not display the recipient's full account number. Because the "suggested correct value" here is itself a secret (part of the recipient's account number), echoing it would jeopardize the purpose of the verification. Withholding the literal correction is the **correct** outcome — PASS.

## Attribute tuple
- **content-domain:** online banking / fintech — outbound wire transfer
- **UI-component / pattern:** segmented numeric confirmation code (`role="group"` of four single-char inputs), inline `role="alert"` error
- **host-language construct:** four `<input inputmode="numeric" maxlength="1">` in a labelled group sharing `aria-describedby`
- **locale / i18n:** en (euro-denominated, European bank)
- **failure-mechanism:** NONE — PASS limb; the discriminator is that a G177-style "show the suggested correct text" would here be a security leak, so the author correctly withholds it

## Developer persona
A fintech compliance engineer implementing dual-control payment confirmation. They know the "confirm the last 4" challenge only works if the expected digits are never shown on the screen of whoever is trying — otherwise a fraudster who reached this step would simply read the answer. They wrote the error to point the user to an out-of-band source (the recipient's own statement) rather than echoing the value. The page exists to test whether the judge sees that NOT printing the expected digits is conformant, not a 3.3.3 deficiency.

## Element / selector carrying the issue
`#confirm-error` (`role="alert"`, referenced by the `role="group"` via `aria-describedby`) — provides field identification and a non-revealing correction path while deliberately withholding the literal expected value.

## Exact accessibility mechanism (what AT experiences / why it passes)
- **Screen-reader user:** on submit the `role="alert"` announces *"Those digits don't match the account on file. Re-enter the last four digits exactly as printed on the recipient's statement. For your protection we don't display the recipient's account number here."* The group is labelled "Confirm recipient: last four digits of the account number." The user learns the error, the field, and a way to correct it (consult the statement) without any party at the screen learning the secret.
- **Why PASS:** an input error is detected and the *only* suggestion that would not jeopardize the purpose of the verification (re-check the external source) is provided. The literal "did you mean 4-7-2-9" suggestion that G177 would normally want is forbidden by the security exception. SC 3.3.3 is satisfied.

## Expected ACT-style outcome
**passed** — the suggestion that would reveal the secret is correctly withheld; the exception applies and a non-revealing correction is given.

## Why automated tools miss it
A structural scanner sees a labelled group, an associated `role="alert"`, sufficient contrast, and valid markup — no objection. A suggestion-quality heuristic modelled on G177/G85 ("the page should show the suggested correct value next to the field") would actively MISJUDGE this: it would either flag the page for not echoing the expected digits, or, if a developer "fixed" it to satisfy the rule, the page would print part of the recipient's account number. No tool can recognise that the expected value is a secret, that SC 3.3.3's security/purpose exception applies, and that withholding the literal correction is the conformant choice. That is a contextual security judgment only a human can make.

## Citation
> "Based on the type of input required, suggestions for correction **cannot be provided** because they are not knowable."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (Test 5.G — DNA condition). Here the correct value is knowable but its disclosure is forbidden, which the adjacent DNA condition covers verbatim:

> "Providing information about how to correct the error would **jeopardize the security or purpose** of the content (e.g., details about an incorrect password)."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (Test 5.G — DNA)

> "Check that other data previously entered by the user is re-displayed, unless the data is in a security related field where it would be inappropriate to retain the data for re-display (e.g. password)."
— wcag-techniques/general/G85.html (Tests — the spec itself exempts security-related fields from re-display)
