# case-04 — Two error icons sharing one generic name `"Invalid input"` (cannot identify which field / what error)

## Scenario
A homeware ecommerce checkout ("Loomfield Home", en-GB). Two postcode fields are in error for *different* reasons: the shipping postcode `9021` is too short, and the billing postcode `SW1A 0AA!` contains an illegal `!` character. Both error icons reuse one SVG sprite (`<use href="#warn">`) and both `<svg role="img">` wrappers carry the identical hardcoded `aria-label="Invalid input"`. Every error in the form is announced with the same generic phrase.

## Attribute tuple + developer persona
- **content-domain:** ecommerce / homeware checkout
- **UI-component / pattern:** reused SVG sprite (`<use>`) error icon across multiple fields
- **host-language construct:** shared `aria-label` string applied to two `svg[role=img]` instances
- **locale / i18n:** en-GB (UK postcodes)
- **failure-mechanism:** text alternative is too generic to identify which field or what error, and is identical across distinct errors
- **developer persona:** An agency dev built one reusable `<svg><use href="#warn">` error component and gave it a single stock `aria-label="Invalid input"` to "keep it DRY". Sighted users disambiguate by position and the visible values, so QA never noticed that to a screen-reader user every error sounds the same and none names a field or a cause.

## Element / selector carrying the issue
`svg#ship-zip-ico` and `svg#bill-zip-ico` (both `role="img" aria-label="Invalid input"`), beside `input#ship-zip` (`9021`, too short) and `input#bill-zip` (`SW1A 0AA!`, illegal character).

## Exact accessibility mechanism (what AT experiences, why it fails)
- Both icons are valid `role=img` graphics, each with a non-empty accessible name and `aria-describedby` association to its field.
- A screen-reader user tabbing the form hears "Postcode, invalid, Invalid input" at the shipping field and the **exact same** "Postcode, invalid, Invalid input" at the billing field. Nothing identifies *which* postcode or *what* is wrong (too short vs. illegal character). The two distinct errors are indistinguishable.
- SC 3.3.1 requires identifying "the identity of the item in error" and describing the error; a single generic string reused across fields does neither.
- CDP accessibility tree confirms BOTH icons compute `name="Invalid input"` (rendered, not ignored). (Note: the `<title>` inside `<symbol>` referenced via `<use>` does not propagate as the name in Chromium, which is why the page uses `aria-label` on each wrapper so the generic name is genuinely exposed.)

## Expected ACT-style outcome
**failed** — errors are conveyed by text alternatives that are too generic (and non-unique) to identify the item in error or describe what is wrong.

## Why automated tools miss it
Each icon has `role=img` and a non-empty accessible name, and the aria associations are valid — no empty-name, missing-role, or unlabeled-graphic finding. Automated tools have no notion that two correctly-labelled icons saying "Invalid input" fail to *distinguish* two different field errors; judging that the shared generic name cannot identify the field or describe the specific error requires human reasoning about meaning and context.

## Citation
> "This SC requires that users be provided with information about the nature of the error, including the identity of the item in error."
— wcag-understanding/error-identification.html (Intent of Error Identification)

> "The form field with the error is identified in text (e.g., "Error: Password field.")."
— refs/trusted-tester/sc-3.3.1-error-identification.md (How to Test, 3a)
