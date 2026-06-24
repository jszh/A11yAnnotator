# case-06 — Invalid IBAN with a stale success status icon `<title>Looks good!</title>` (inverted text alternative)

## Scenario
An online-banking add-payee screen ("Nordbank Online"). The entered German IBAN `DE89 3704 0044 0532 0130 0X` ends in an illegal `X` and fails validation — the field shows a red border. But the field's status SVG (`role=img`) still carries the leftover *success* state: a green check glyph and `<title>Looks good!</title>`. A Vue merge bug left the IBAN field bound to its initial "valid" status, so the text alternative asserts the opposite of the field's real state.

## Attribute tuple + developer persona
- **content-domain:** finance / online banking payee management
- **UI-component / pattern:** per-field validation status `svg[role=img]` with state-bound `<title>`
- **host-language construct:** SVG `<title>` element as the accessible name, left at a stale value
- **locale / i18n:** en (UI) with de-DE financial data (German IBAN)
- **failure-mechanism:** text alternative is INVERTED — it affirmatively denies the error ("Looks good!") on an invalid field
- **developer persona:** A Vue dev bound each field's status icon `<title>` to a reactive validity flag, but a state-merge bug meant the IBAN field's icon never re-rendered from its initial `valid` value when validation flipped it to invalid. The red border comes from a separate CSS rule that *did* update, so the screen looks "half wrong" only to someone reading both the border and the icon's name.

## Element / selector carrying the issue
`svg#iban-ico` (`role="img"` with child `<title>Looks good!</title>` and a green check path) beside `input#iban` (value `DE89 3704 0044 0532 0130 0X`, `aria-invalid="true"`, red border).

## Exact accessibility mechanism (what AT experiences, why it fails)
- The icon is a valid `role=img` whose accessible name comes from its `<title>` child: "Looks good!". It is associated to the IBAN field via `aria-describedby`.
- A screen-reader user on the invalid IBAN hears "IBAN, invalid, Looks good!" — and many users will weight the explicit positive phrase over the terse "invalid" state, or the field may be reached by reading flow where only "Looks good!" is heard. The text alternative does not identify or describe the error; it denies that one exists.
- This is the worst form of the aspect: not merely generic or mislocated, but semantically opposite, so a non-visual user submits a broken transfer ("Transfers to a wrong account cannot be reversed").
- CDP accessibility tree confirms the icon computes `name="Looks good!"` (rendered, not ignored).

## Expected ACT-style outcome
**failed** — an input error is present, but the field's text alternative conveys success, so the error is neither identified nor described (it is contradicted).

## Why automated tools miss it
The SVG has `role=img` and a non-empty accessible name from a valid `<title>`, contrast is fine, and aria wiring is intact — no structural finding. Automated tools cannot validate the IBAN checksum, cannot know the field is actually invalid, and cannot detect that "Looks good!" contradicts the field's true state. Catching an inverted/stale text alternative requires a human to compare the alternative's meaning against the real error condition.

## Citation
> "In the case of an unsuccessful form submission, it is not sufficient to only re-display the form without providing any hint that the submission failed. The error must be indicated in text."
— wcag-understanding/error-identification.html (Intent of Error Identification)

> "Fill out a form, deliberately enter user input that falls outside the required format or values ... Check that a text description is provided that identifies the field in error and provides some information about the nature of the invalid entry"
— wcag-techniques/general/G85.html (Tests — Procedure)
