# case-03 — Checkout: identical "Invalid" on CVV (PASS limb) and ZIP (FAIL limb) — judge must split them (overall FAILED)

## Scenario
A coffee-shop checkout in its post-submit error state shows two fields with near-identical terse errors:
- **Security code (CVV):** *"Invalid security code."* — CORRECT to withhold. The CVV is security-sensitive; echoing the expected value or how close the entry is would defeat card verification. For this field the generic non-suggesting message is the conformant outcome (the PASS limb).
- **ZIP code:** *"Invalid."* — a REAL 3.3.3 failure. The ZIP is not security-sensitive, the correct value is knowable, and a suggestion is possible ("ZIP codes are 5 digits, e.g. 94107" / "Did you mean 94107?"). The bare "Invalid" describes nothing and suggests nothing; the exception does not apply, so the missing suggestion is a genuine failure.

The judge must apply the exception **selectively**: same message style, opposite verdicts. The page is **overall FAILED** because of the ZIP field; the CVV is the foil.

## Attribute tuple
- **content-domain:** e-commerce checkout / payment
- **UI-component / pattern:** two `<fieldset>` groups (card details, billing address), each with an inline `role="alert"` error
- **host-language construct:** `<input autocomplete="cc-csc">` (CVV) vs `<input autocomplete="postal-code">` (ZIP), both `aria-invalid`, both `aria-describedby` a bare error
- **locale / i18n:** en-US (USD, 5-digit ZIP)
- **failure-mechanism:** mis-applied exception — a knowable, non-sensitive field (ZIP) is given a withheld generic error as if the security exception covered it

## Developer persona
A frontend dev wired one shared `showError(field, "Invalid")` validation helper across the whole checkout to keep the code DRY. For the CVV that terse output happens to be exactly right (security exception). For the ZIP it is wrong — the helper never specialised the message, so a field that should say "5 digits, e.g. 94107" inherited the same bare "Invalid." The dev assumed "shorter errors are safer" everywhere, not realising the security justification only covers the CVV.

## Element / selector carrying the issue
- PASS limb: `#cvv-error` ("Invalid security code.") on `#cvv` — correctly withheld.
- FAIL limb: `#zip-error` ("Invalid.") on `#zip[value="941"]` — non-sensitive field with a knowable correction and no description or suggestion. This element carries the page's failure.

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Screen-reader user, CVV:** hears "Security code, invalid entry, Invalid security code." They know the code was rejected; no security-revealing specifics — conformant.
- **Screen-reader user, ZIP:** hears "ZIP code, invalid entry, Invalid." The value `941` is three digits; a US ZIP is five. Nothing tells them the length is wrong, the format expected, or a likely correct value. They cannot determine how to fix it. SC 3.3.3 requires a suggestion here because the value is knowable and the field is not security-sensitive, so the exception does not remove the obligation.
- **Why overall FAILED:** the ZIP field detects an input error, a suggestion is possible and not security-jeopardizing, yet none is provided.

## Expected ACT-style outcome
**failed** — the page fails SC 3.3.3 on the ZIP field (knowable correction withheld with no justification). The CVV limb passes, but a single failing field fails the page.

## Why automated tools miss it
Both errors are structurally identical and well-formed: named, `role="alert"`, `aria-describedby`-associated, high-contrast. axe/WAVE/Lighthouse object to neither and cannot grade message quality. A heuristic that flags "input error with no suggestion" would flag BOTH — wrongly faulting the CVV (where withholding is required) — or pass both, missing the ZIP failure. Distinguishing a security-sensitive field (CVV, exception applies) from a non-sensitive one with a knowable fix (ZIP, exception does not apply) is exactly the contextual judgment automated tools cannot perform. The two-field pairing forces that discrimination.

## Citation
> "When input must be one of a set of allowed values, the text description should indicate this fact. It should include the list of values if possible, or suggest the allowed value that is most similar to the entered value."
— wcag-techniques/general/G84.html (Description — applies to the ZIP field; a 5-digit US ZIP has a knowable correct form that should be suggested)

> "The 'in text' portion of the success criterion underscores that it is not sufficient simply to indicate that a field has an error by putting an asterisk on its label or turning the label red. A text description of the problem should be provided."
— wcag-techniques/general/G84.html (Description — the bare "Invalid." on ZIP describes no problem)

> "Providing information about how to correct the error would **jeopardize the security or purpose** of the content (e.g., details about an incorrect password)."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (Test 5.G — DNA; covers the CVV limb only, NOT the ZIP)
