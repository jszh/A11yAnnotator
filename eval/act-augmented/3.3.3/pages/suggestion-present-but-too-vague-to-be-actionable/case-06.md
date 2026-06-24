# case-06 — Async IBAN validation: a correctly-announced toast that says "We couldn't process that — please review the details and try again."

## Scenario
An online-banking dashboard ("Meridian Bank") validates a recipient **IBAN** asynchronously when the field blurs. The result is announced through a *correctly built* toast: an empty `role="status" aria-live="polite"` container is pre-rendered and its text is updated on change, so screen readers genuinely announce it; `aria-invalid` is set and the toast is associated via `aria-describedby`. The IBAN's structure is fully determinate — for a GB IBAN, 22 characters of `GB` + 2 check digits + 4 bank letters + 14 digits, verified by the mod-97 checksum. The user typed `GB29 NWBK 6016 1331 9268 1` (one digit short). The announced message is **"We couldn't process that — please review the details and try again."** — it never states the expected length, the country format, or that the checksum failed, all of which are knowable and suggestable. This is the long-tail trap: every *dynamic / live-region* requirement is met (4.1.3 passes), so the failure is purely the inadequacy of the announced words.

## Attribute tuple
- **content-domain:** online banking / fintech dashboard
- **UI-component / pattern:** **toast/snackbar** notification inside a pre-rendered `aria-live` region, fired by async (on-blur) validation — a dynamic-state pattern
- **host-language construct:** `<div role="status" aria-live="polite">` updated by JS; `<input aria-invalid aria-describedby>`
- **locale / i18n:** en-GB (GB IBAN), country-specific identifier
- **failure-mechanism:** the live region and announcement are correct, but the announced suggestion is content-free filler over a determinate IBAN rule
- **prevalence:** LONG-TAIL — async validation + a correctly-built toast + a checksum-validated identifier is a sophisticated stack whose ONE remaining flaw is message adequacy

## Developer persona
A senior fintech engineer did the hard parts right: real mod-97 IBAN validation, on-blur async UX, and an accessibility-reviewed toast (pre-rendered polite live region, `aria-invalid`, `aria-describedby`) — they had been burned by a prior 4.1.3 audit and over-corrected on announcement plumbing. But the bank's risk team mandated a single generic failure string for all validation errors ("don't reveal which check failed"), so the carefully-announced toast carries no specifics. The team conflated "don't reveal internal risk logic" with "don't state the public IBAN format," which is not security-sensitive at all.

## Element / selector carrying the issue
`#iban-toast` (announced text "We couldn't process that — please review the details and try again.") associated with `#iban`, whose `validIBAN()` enforces `^GB\d{2}[A-Z]{4}\d{14}$` plus the mod-97 checksum — a determinate, statable rule.

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Screen-reader user:** on blur the polite region announces "We couldn't process that — please review the details and try again." It IS announced (4.1.3 is satisfied) — but "the details" is opaque. They cannot tell whether the IBAN is too short, has a wrong country code, a transposed digit, or a bad checksum. They re-read their own 21 characters, see nothing obviously wrong, and are stuck — the very abandonment 3.3.3 guards against, now wrapped in a technically-perfect announcement.
- **Why 4.1.3 does NOT save it:** Status Messages only requires that the message be *announced without focus change*; it says nothing about whether the announced content is adequate to fix the error. That adequacy is 3.3.3's job, and it fails.
- **What an adequate announcement would say:** "This IBAN is one character short — a UK IBAN has 22 characters (GB + 2 digits + 4 letters + 14 digits). Check for a missing digit." — derivable from the validator.

## Expected ACT-style outcome
**failed** (SC 3.3.3 — the IBAN format and checksum make the correct shape knowable, so a suggestion is possible; the announced message provides neither a suggested correction nor adequate information to fix it. The carve-out for "security or purpose" does not apply: the public IBAN format is not sensitive.)

## Why automated tools miss it
This page is engineered to pass every automatable form/dynamic check: the live region is pre-rendered and polite (4.1.3 passes under axe/Lighthouse live-region heuristics), the error is associated and `aria-invalid` is set (3.3.1 passes), contrast on the dark theme passes. A fix-phrasing heuristic matches "please review … and try again." To flag it, a tool would have to read `validIBAN`, recognize the IBAN rule is determinate (length + mod-97), and judge that the *announced* sentence withholds all of it — and further distinguish that withholding the public format is not a legitimate security carve-out. That layered semantic-adequacy reasoning over correctly-announced dynamic content is beyond static and single-snapshot scanners.

## Citation
> "In the case of an unsuccessful form submission, users may abandon the form because they may be unsure of how to correct the error even though they are aware that it has occurred."
— wcag-understanding/error-suggestion.html (Intent) — the user is fully aware of the error (it was announced) yet unsure how to correct it; that gap is exactly the failure.

> "People with visual disabilities may not be able to figure out exactly how to correct the error."
— wcag-understanding/error-suggestion.html (Intent) — "please review the details" leaves a blind user with no way to figure out which detail.

> "Based on the type of input required, suggestions for correction cannot be provided because they are not knowable." (a DNA condition — here it is NOT met, so the test applies)
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (DNA list) — the IBAN format IS knowable, so the page is in scope and owes an adequate suggestion.
