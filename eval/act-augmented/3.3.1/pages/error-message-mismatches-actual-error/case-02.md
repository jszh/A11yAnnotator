# case-02 — Date of birth: value already in MM/DD/YYYY, error says "use MM/DD/YYYY format" (constraint already satisfied; real future-date error undescribed)

## Scenario
A medical new-patient intake form in its **post-submit error state**. The date-of-birth field retains `03/14/2027`, and a visible, associated error reads *"Date of birth is invalid. Please use the MM/DD/YYYY format."* The field's hint also says "Format: MM/DD/YYYY." But the value `03/14/2027` already conforms exactly to that format — the named fix is a no-op. The actual error is that the date is in the **future**, which is impossible for a birth date; that defect is never described.

## Attribute tuple
- **content-domain:** healthcare / patient intake portal
- **UI-component / pattern:** `<input type="text" inputmode="numeric">` date field inside a `<fieldset>`, `aria-describedby` hint + error, `aria-invalid="true"`
- **host-language construct:** retained value, programmatically associated visible error
- **locale / i18n:** en-US (MM/DD/YYYY)
- **failure-mechanism:** boilerplate mismatch — message names a **constraint that is already satisfied** (format) while the real violated constraint (date must be in the past) goes undescribed

## Developer persona
An agency contractor themed a generic intake template. The date field had one shared validation message — *"Please use the MM/DD/YYYY format."* — wired to fire whenever the date validator returned false, regardless of *why*. The validator actually rejects both malformed strings AND future dates, but only ever emits the format message. The contractor tested with a malformed entry (`14/3/27`), saw the message make sense, and shipped. They never tested a well-formatted future date, so the mismatch never surfaced; the message is fluent and "describes a fix," so it passed review and automated scans.

## Element / selector carrying the issue
`#dob-err` asserting "Please use the MM/DD/YYYY format" against `#dob[value="03/14/2027"]`, a value that already matches MM/DD/YYYY.

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Screen-reader user:** hears "Date of birth, invalid entry, Format: MM/DD/YYYY. Date of birth is invalid. Please use the MM/DD/YYYY format." They confirm their entry is in MM/DD/YYYY, re-enter it identically, and are rejected again. The described fix cannot resolve the error because the error was never about format — they cannot "determine what is wrong."
- **Cognitive / low-vision user:** the only guidance directs them to a format they already used; the real issue (future date) is never surfaced, producing a dead-end loop.
- **Sighted user:** identical trap — the message is competent but inapplicable to the value shown.

## Expected ACT-style outcome
**failed** (SC 3.3.1 — an input error is detected, but the description identifies an already-satisfied constraint and never describes the actual defect; the user cannot determine what is wrong).

## Why automated tools miss it
ACT 36b590 passes: a visible, field-identifying indicator describes "how to resolve it" and is in the accessibility tree. axe/WAVE/Lighthouse see a labelled field, a resolved `aria-describedby`, adequate contrast — no violation. No automated checker parses the value `03/14/2027`, recognizes it already matches the MM/DD/YYYY pattern the message demands, and reasons that the true error (a birth date set in the future) is the one left undescribed. That requires reading the value, the field's stated format, the semantic domain ("date of birth" implies a past date), and the message together — a human judgment.

## Citation
> "the user enters a birth date 2 years in the future;"
— wcag-understanding/error-identification.html (Intent — list of "input error" examples; the real defect here, which the message never identifies)

> "This SC requires that users be provided with information about the nature of the error, including the identity of the item in error."
— wcag-understanding/error-identification.html (Intent) — the "nature of the error" (future date) is misstated as a format problem.

> "Intentionally violate formatting and other form instructions ... Determine whether the error is identified and described in text."
— refs/trusted-tester/sc-3.3.1-error-identification.md (How to Test) — a tester who violates a *non-format* instruction (future date) finds the described error does not match the violation.
