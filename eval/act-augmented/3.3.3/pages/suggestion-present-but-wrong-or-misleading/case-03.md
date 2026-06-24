# case-03 — Promo-code "Did you mean SPRING20?" suggestion offers a code that is itself expired/invalid

## Scenario
A home-goods checkout bag. Applying an unrecognised promo code triggers a confident "did you mean…" suggestion in a `role="status"` live region — *"We couldn't find 'SAVE20'. Did you mean SPRING20?"* — with an **Apply SPRING20** button that fills the field. This is the canonical G177 "did-you-mean from a known pool" pattern: error detected, corrected-input suggestion provided, associated and announced. But the suggested code `SPRING20` is itself invalid: the page's own visible **Current promotions** table shows *SPRING20 — Expired 30 Apr 2026*, and today is shown as 14 June 2026. Clicking "Apply SPRING20" inserts it and the validator rejects it: *"This code has expired (30 Apr 2026) and can no longer be used."* The suggestion sends the user in a circle toward a dead value.

## Attribute tuple
- **content-domain:** e-commerce product & checkout (home & living retailer)
- **UI-component / pattern:** coupon/promo field with "did you mean" suggestion + one-click Apply button, `role="status"` feedback, visible promotions table
- **host-language construct:** `<input type="text">` + injected suggestion `<button>` in an `aria-live="polite"` region
- **locale / i18n:** en, GBP currency; no i18n collision (defect is data-validity, not locale)
- **failure-mechanism:** the "did you mean" suggestion names a value from the pool that is no longer valid (expired), so applying the suggestion re-fails

## Developer persona
A Shopify/headless storefront developer wired a fuzzy "did you mean" promo helper that matches the user's typo against ALL historical promo codes by Levenshtein distance, without filtering by active/expired status. `SPRING20` is the closest string to a mistyped `SAVE20`, so it is suggested — even though the campaign ended in April. The feature was demoed in March when SPRING20 was live, so the bug never surfaced in QA; it only appears after the code expires.

## Element / selector carrying the issue
`#cp-feedback` (the `role="status"` region) containing the text *"Did you mean SPRING20?"* and its **Apply SPRING20** `<button>`. The suggested code `SPRING20` is in the `EXPIRED` set, not the `VALID` set, and the visible promotions table marks it *Expired 30 Apr 2026*.

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Screen-reader user:** after the failed apply, the polite live region announces "We couldn't find SAVE20. Did you mean SPRING20? Apply SPRING20, button." The blind user activates the offered button trusting the system's recommendation, and is met with "This code has expired." They cannot glance at the promotions table to pre-empt the dead suggestion. The single corrective action the page offers leads straight back to an error.
- **Cognitively-loaded / motor-impaired user:** the SC's benefit "reduce the number of times they need to change an input value" is inverted — the suggestion adds a guaranteed-failed round trip.
- **Sighted user:** can read the expiry in the table and ignore the suggestion, but the suggestion is still actively wrong.

## Expected ACT-style outcome
**failed** (SC 3.3.3 — a "suggestion for corrected input" IS provided, but it is not a valid correction: the suggested value is rejected by the same field, so it provides no adequate path to fix the error).

## Why automated tools miss it
The page exemplifies the *sufficient* technique on its face — a "did you mean" suggestion is present, associated, announced, and even one-click actionable. axe/WAVE/Lighthouse cannot know the live set of valid promo codes, cannot read the expiry date out of the promotions table, and cannot simulate clicking "Apply" to discover the suggested code is rejected. Judging that the suggested correction is itself invalid requires cross-referencing the suggestion against the page's own rules — a semantic, ground-truth comparison no scanner performs.

## Citation
> "The conversion of the input data interpreted as a different month format, e.g., 'Do you mean December?'"
— wcag-understanding/error-suggestion.html (Examples) — the "did you mean" pattern is the SC's own model of a good suggestion; here the suggested value is invalid, defeating the pattern.

> "Check that the user is presented with suggestions for the correct text."
— wcag-techniques/general/G177.html (Tests, Procedure) — the suggestion must be for *correct* text; SPRING20 is not correct (expired) for this field.

> "Suggestions for corrected input are provided, OR ... The description contains adequate information for the user to know what is required to fix the error."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (Evaluate Results) — a suggested correction that the field still rejects is neither a valid corrected input nor adequate information.
