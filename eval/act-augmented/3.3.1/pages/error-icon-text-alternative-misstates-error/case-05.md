# case-05 — Error icon `aria-label="Date is in the past"` placed beside the Email field (correct cause, wrong field)

## Scenario
An alumni reunion RSVP form ("Pembury College", en-GB). Two fields are invalid: the Email `ravi@@pembury.ac.uk` has a double `@`, and the Preferred date `2024-07-18` is in the past. After a form refactor the developer cut-and-pasted the date row's error-icon block above the email row but never updated its `aria-label`, so the EMAIL field now sits beside an SVG whose accessible name is the well-formed but field-mismatched `aria-label="Date is in the past"`. The genuinely-past date field, meanwhile, has lost its indicator entirely.

## Attribute tuple + developer persona
- **content-domain:** education / event RSVP
- **UI-component / pattern:** inline `svg[role=img]` error icon, moved during a refactor
- **host-language construct:** `aria-label` on `svg[role=img]` left stale after a copy/paste row reorder
- **locale / i18n:** en-GB
- **failure-mechanism:** text alternative correctly describes a DIFFERENT field's error than the one it adjoins (mislocation)
- **developer persona:** A dev reordering the form copied the date field's error markup (icon + `aria-label="Date is in the past"`) up to the email row to fix vertical alignment, intending to retype the label, then got distracted. The icon visually reads as "error" so it looked right in the browser; the stale `aria-label` survived because nothing visible reflects it.

## Element / selector carrying the issue
`svg#email-ico` (`role="img" aria-label="Date is in the past"`) beside `input#email` (`ravi@@pembury.ac.uk`, `aria-invalid="true"`). The actually-past `input#rsvp-date` (`2024-07-18`) has no surviving indicator.

## Exact accessibility mechanism (what AT experiences, why it fails)
- The icon is a valid `role=img` with a non-empty, *specific* accessible name, associated to the email input via `aria-describedby`.
- A screen-reader user on the email field hears "Email address, invalid, Date is in the past." The description is specific and well-formed — but it describes the *date* field's error, not the email's (double `@`). It is actively misleading: the user may conclude the email is fine and a date is wrong.
- Compounding it, the real past-date error has no text alternative at all on its own row, so that error is silent.
- CDP accessibility tree confirms the email icon computes `name="Date is in the past"`.

## Expected ACT-style outcome
**failed** — the text alternative beside the email field describes a different field's error; the email error is mis-described and the date error is unidentified.

## Why automated tools miss it
The icon has `role=img`, a non-empty (and even descriptive) accessible name, and valid aria wiring — nothing for a linter to flag; the alt is not generic and not empty. No automated rule checks whether "Date is in the past" matches the *email* field it sits beside, nor that the date field lost its indicator. Detecting a correctly-worded-but-mislocated text alternative requires a human to match each alternative's meaning to its actual field and error state.

## Citation
> "in cases where this is not already made obvious by the nature of the form."
— wcag-understanding/error-identification.html (Benefits — the value to cognitive/learning users of an accurate, specific identification, which a mislocated description defeats)

> "Determine whether the error is identified and described in text. a. The form field with the error is identified in text ... b. Text describes the error"
— refs/trusted-tester/sc-3.3.1-error-identification.md (How to Test, step 3)
