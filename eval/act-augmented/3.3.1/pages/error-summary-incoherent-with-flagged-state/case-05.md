# case-05 — Summary blames "Password", but the only flagged field is its sibling "Confirm password"

## Scenario
An online-banking enrolment form (Harbour Trust Credit Union) where the user sets a password. A red
`role="alert"` summary states **"Password must be at least 10 characters and include a number."** But
the **Password** field is actually valid — green border, `aria-invalid="false"`, and it meets the
stated rule ("Riverbend4291", 13 chars with digits). The field truly in error is the **Confirm
password** sibling, which holds a typo ("Riverbend4219") and is flagged red with `aria-invalid="true"`
and an inline message *"Confirm password does not match the password you entered."* The summary names
the wrong member of a near-identical field pair, and even describes a *different* failure (length/number
rule) than the real one (mismatch).

## Attribute tuple + developer persona
- **content-domain:** online banking / credit-union account enrolment
- **UI-component/pattern:** password + confirm-password pair with top-of-form `role="alert"` summary
- **host-language construct:** two `<input type="password">` controls; `aria-invalid` true on confirm, false on password
- **locale/i18n:** en
- **failure-mechanism:** wrong field named — summary blames sibling "Password" instead of the flagged "Confirm password"
- **developer persona:** A React developer wired the summary to push the *first* registered validator's message regardless of which field failed. Their validation schema lists the `password` strength rule before the `confirmPassword` match rule, and a bug makes the summary always emit the **first rule's label and message** ("Password…") whenever *any* password-group field fails, while the inline error correctly attaches to whichever field actually failed (here, confirm). Because their unit tests only ever submitted a weak password (where both happened to align on "Password"), the cross-field case where confirm fails but password passes was never covered.

## Element / selector carrying the issue
`.banner ul li` (the summary line, "Password must be at least 10 characters…"). The only flagged
control is `#pw2` ("Confirm password", `aria-invalid="true"`). `#pw` ("Password") is
`aria-invalid="false"` and valid. The incoherence: summary names/describes Password; the flagged field
is Confirm password, with a different cause.

## Exact accessibility mechanism (what AT experiences, why it fails)
A screen-reader user hears: "We couldn't complete your enrolment. Password must be at least 10
characters and include a number." They navigate to the **Password** field — which announces *not
invalid* and whose own helper text says "Looks good." They are now stuck: the summary blames a field the
page itself says is fine, while the genuinely-rejected field (Confirm password, "does not match")
carries the real, contradictory message. The user cannot reliably determine what is wrong because the
aggregate description identifies the wrong item and the wrong cause. Each indicator is individually
fluent and the flagged field is correctly wired (passing 36b590 per field), but the summary
misidentifies which sibling is in error.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
"Password" and "Confirm password" are both valid, distinct labels — there is no duplicate-label or
malformed-markup signal. The summary is a valid live region with a fluent specific message; the flagged
"Confirm password" field has `aria-invalid="true"` and a proper associated message, so 36b590 passes.
The defect is that the summary's named field (Password) is valid while its sibling (Confirm password) is
the one flagged. Recognising that requires reading both near-identical labels, checking each field's
actual validity/`aria-invalid` state, and noticing the summary points at the wrong one — a semantic
comparison no automated rule performs.

## Citation
> **WCAG 2.2 Understanding 3.3.1 (Intent), `wcag-understanding/error-identification.html`:**
> "This SC requires that users be provided with information about the nature of the error, including the
> identity of the item in error."

> **ACT 36b590 (Background), `act-rules/extracted/36b590.md`:**
> "A single form field error indicator can be related to multiple test targets. For example, an error
> message at the top of a form can list all the form fields that are required and are empty."

(The top-of-form indicator must relate to the field(s) actually in error; here it identifies a sibling
that is valid, so the "identity of the item in error" is wrong.)
