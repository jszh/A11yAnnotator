# case-06 — ZIP code: user typed "9021", error names "ZIP code 90210 not found" (phantom value the user never entered)

## Scenario
An e-commerce checkout shipping step in its **post-submit error state**. The ZIP field retains the value the user typed, `9021` (four digits). The visible, associated server error reads *"ZIP code 90210 not found in our database. Please check the code and try again."* — a fluent message that even quotes a specific ZIP. But it quotes `90210` (five digits), a value the user **never entered**; the field plainly shows `9021`. The real defect (a 4-digit ZIP is too short / incomplete) is never described, and the quoted value contradicts the field's own retained value.

## Attribute tuple
- **content-domain:** e-commerce checkout / shipping address
- **UI-component / pattern:** address form, ZIP `<input inputmode="numeric">` with `aria-describedby` server error, `aria-invalid="true"`
- **host-language construct:** server-echoed error string that quotes a value, paired with a retained field value that differs
- **locale / i18n:** en-US
- **failure-mechanism:** boilerplate mismatch — the message names a **phantom value** (`90210`) the user did not type, so it neither matches the value nor describes the real defect (too short)

## Developer persona
The checkout backend runs a ZIP lookup and, on miss, returns *"ZIP code {zip} not found in our database."* with the looked-up value interpolated. A bug in the address-normalizer pads short ZIPs with a trailing zero before lookup (`9021` → `90210`), so the error quotes the padded value, not what the user typed, while the form re-renders the user's original `9021`. The developer tested only with real 5-digit ZIPs (where padded == typed), so the discrepancy never appeared. The message is grammatical, names the field, and even quotes a code, so it passed review and an axe scan — automated tools never compare the quoted value to the field's value.

## Element / selector carrying the issue
`#zip-err` ("ZIP code 90210 not found...") quoting `90210` while `#zip[value="9021"]` holds the value the user actually entered; the real error (4-digit ZIP is too short) is never stated.

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Screen-reader user:** focusing the ZIP field hears *"ZIP code, 9 0 2 1, invalid entry, ZIP code 90210 not found in our database. Please check the code and try again."* The field value announced (`9021`) and the value named in the error (`90210`) **differ**. The user has no way to reconcile them — did they mistype? is the system confused? The message describes a code they never entered and never says the real problem is that their ZIP is one digit short. They cannot determine what is wrong.
- **Cognitive load:** being told a different number than the one you typed is profoundly confusing and erodes trust.
- **Sighted user:** sees `9021` in the box and an error about `90210` — a visible contradiction.

## Expected ACT-style outcome
**failed** (SC 3.3.1 — the described error references a value the user did not enter and never identifies the actual defect of the entered value; the user cannot determine what is wrong).

## Why automated tools miss it
ACT 36b590 passes: a visible, field-identifying indicator describes a cause ("not found") and is in the accessibility tree — it is, if anything, *more* descriptive than the pass examples because it quotes a code. axe/WAVE/Lighthouse see a labelled field, a resolved `aria-describedby`, fine contrast. No automated tool extracts the ZIP quoted inside the message (`90210`), compares it to the field's retained value (`9021`), and concludes the message names a phantom value while failing to describe the real (too-short) defect. That value-vs-message comparison is a semantic judgment no checker performs.

## Citation
> "the user enters a non existent zip or postal code;"
— wcag-understanding/error-identification.html (Intent — input-error example; here the message asserts non-existence of a code the user never typed, and the real defect, an incomplete ZIP, is undescribed)

> "The intent of this success criterion is to ensure that users are aware that an error has occurred and can determine what is wrong."
— wcag-understanding/error-identification.html (Intent) — a message quoting a different value than the user entered defeats "determine what is wrong."

> "Check that a text description is provided that identifies the field in error and provides some information about the nature of the invalid entry and how to fix it."
— wcag-techniques/general/G85.html (Tests, Procedure) — "the nature of the invalid entry" (too short) is misreported as a not-found lookup of a value never entered.
