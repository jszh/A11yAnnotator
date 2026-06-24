# case-05 — PASS boundary: ZIP error that names the format, gives an example, AND suggests the corrected value

## Scenario
A checkout shipping form ("Trailhead Outfitters") flags the ZIP-code field on submit using the **same plumbing** as the failing pages in this aspect — `aria-invalid="true"`, error tied via `aria-describedby`, a `role="alert"` summary, focus moved. The difference is the only thing that matters for 3.3.3: the message is **adequate**. The user entered `9021`; the error reads **"Enter a 5-digit ZIP code, for example 90210. You entered '9021' — it looks like one digit is missing."** It names the format (5 digits), gives a worked example (90210), and offers a suggestion derived from the user's own input (a digit is missing). This is the mirror of the aspect: where the FAIL cases say "check your entry" / "enter a valid value" / "improve your password," this case says exactly what to change. It exists to sharpen the judge's line between *mentions fixing* and *tells you how*.

## Attribute tuple
- **content-domain:** e-commerce checkout (shipping address)
- **UI-component / pattern:** server/client redisplay with `role="alert"` summary + inline error (identical structural pattern to the FAIL pages, so only message quality varies)
- **host-language construct:** `<input type="text" inputmode="numeric" aria-invalid aria-describedby maxlength="5">`
- **locale / i18n:** en-US
- **failure-mechanism:** none — this is the adequate-suggestion control; the message satisfies both TT result limbs
- **prevalence:** boundary control (what good looks like for a knowable numeric format)

## Developer persona
A developer who actually wrote per-field validation copy: the ZIP validator both checks `^\d{5}$` and composes a tailored message — restating the format and example every time, and diagnosing the specific shortfall (missing digits, letters present, empty) from the entered value. They treated the error string as part of the feature, not as boilerplate, which is precisely why this passes where the others fail.

## Element / selector carrying the issue
`#zip-err` — but here it is the *positive* exemplar: "Enter a 5-digit ZIP code, for example 90210. You entered '9021' — it looks like one digit is missing." describing `#zip` (validator `^\d{5}$`).

## Exact accessibility mechanism (what AT experiences / why it passes)
- **Screen-reader user:** focus lands on the ZIP field and they hear "ZIP code, edit, invalid entry, Enter a 5-digit ZIP code, for example 90210. You entered '9021' — it looks like one digit is missing." They now know the exact target shape (5 digits), have a concrete example, and are told what is wrong with their value. They can correct it on the next attempt without guessing — the outcome 3.3.3 is designed to produce.
- **Cognitively-loaded user:** the message is directly actionable: add the missing digit to make five.
- **Why it is not a 3.3.3 failure:** the description contains adequate information for the user to know what is required, and it also offers a suggested correction — either limb alone would suffice; both are present.

## Expected ACT-style outcome
**passed** (SC 3.3.3 — an input error is detected and the suggestion both names the required format with an example and offers a correction inferred from the input; both Evaluate-Results limbs are satisfied).

## Why automated tools miss it (i.e. cannot distinguish this PASS from the FAIL twins)
To an automated checker this page is indistinguishable from case-01/02/04: all have a present, non-empty, programmatically associated error string in a live `role="alert"` with focus management. A scanner sees "error text exists and is associated" in every case and cannot tell that *this* string conveys an actionable format-plus-example-plus-suggestion while the others convey nothing. The PASS/FAIL distinction in this aspect is entirely a semantic-adequacy reading of the message contents — which is exactly why this boundary case is valuable for a human/LLM judge and invisible to axe/WAVE/Lighthouse.

## Citation
> "An input field requires that a month name be entered. If the user enters '12,' suggestions for correction may include: A list of the acceptable values … [or] The conversion of the input data interpreted as a different month format, e.g., 'Do you mean December?'"
— wcag-understanding/error-suggestion.html (Examples) — the adequate pattern: state acceptable values and/or suggest a correction from the input, which this ZIP message does.

> "Provide examples of the correct data entry for the field, [or] Describe the correct data entry for the field."
— wcag-techniques/general/G85.html (Description) — "a 5-digit ZIP code, for example 90210" does both.

> "Suggestions for corrected input are provided, OR … The description contains adequate information for the user to know what is required to fix the error."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (Evaluate Results — PASS if ANY true) — this message satisfies both limbs, so it passes.
