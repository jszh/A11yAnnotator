# case-03 — Password: 12-character value flagged "must be at least 8 characters" (wrong rule asserted; real unmet rule is "at least one number")

## Scenario
A SaaS "set your password" screen in its **post-submit error state**. The password field holds a 12-character value (`riverstonelake`, shown as 12 bullets), and the visible associated error reads *"Password must be at least 8 characters."* The "≥ 8 characters" rule is already satisfied — and the page's own requirements list confirms it, marking "At least 8 characters" and "One letter" as MET (green check) while "At least one number" is the only UNMET rule (red ✗). The validator rejected the password for the missing number, but emitted the canned length message, which is descriptive but inapplicable to this value.

## Attribute tuple
- **content-domain:** B2B SaaS analytics workspace onboarding
- **UI-component / pattern:** `<input type="password">` with a live requirements checklist (`<ul>` of met/unmet rules) + inline error, `aria-invalid="true"`
- **host-language construct:** `aria-describedby` references BOTH the wrong error line and the requirements list; the requirements list and the error contradict each other
- **locale / i18n:** en-US
- **failure-mechanism:** boilerplate mismatch — message names a **rule already passed** (length) while the actual unmet rule (digit) is the one that triggered rejection

## Developer persona
A mid-level engineer ported a password component from an older product whose only rule was length, so its single error string was *"Password must be at least 8 characters."* The new product added a "must contain a number" rule and a fancy requirements checklist, but the engineer reused the legacy error emitter for ALL validation failures rather than mapping each unmet rule to its own message. They tested with a 5-character password (length message correct), shipped, and never tested a long-but-digitless password — so the contradictory case stayed hidden. The message is fluent and the checklist is present, so it cleared review and axe.

## Element / selector carrying the issue
`#pw-err` ("Password must be at least 8 characters") asserting a length defect against `#pw[value]` of length 12, while `#pw-reqs li.unmet` ("At least one number") is the real failing rule.

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Screen-reader user:** focusing the field hears "New password, invalid entry," then the description `aria-describedby` resolves to *"Password must be at least 8 characters."* followed by the requirements list. The error line says length; the list says the digit rule is unmet. The error line — the one most users act on first — directs them to lengthen a password that is already long enough. The two cues **contradict**, and the authoritative-sounding error is the wrong one.
- **Cognitive load:** a contradictory error ("you need 8 characters" on a 12-character value) is actively confusing; the user cannot reliably determine what is wrong.
- **Sighted user:** sees a 12-bullet field told it needs 8 characters — the message plainly does not match the value.

## Expected ACT-style outcome
**failed** (SC 3.3.1 — the detected error is described with a cause that does not apply to the entered value; the description misidentifies the nature of the error).

## Why automated tools miss it
ACT 36b590 passes: a visible, field-identifying indicator "describes the cause of the error or how to resolve it" and is in the accessibility tree. axe/WAVE/Lighthouse see a labelled password field, a resolved `aria-describedby`, an annotated requirements list, fine contrast — no structural fault. No automated tool counts the entered value's characters (12), compares that to the "at least 8" claim to see the rule is already met, and cross-references the requirements list to find the actual unmet rule. Detecting that the asserted cause is false for this value — and that it contradicts the page's own checklist — is a semantic, multi-element reasoning task no checker performs.

## Citation
> "information that is provided by the user but that falls outside the required data format or allowed values."
— wcag-understanding/error-identification.html (Intent — definition of "input error"; the actual error here is the missing digit, not the satisfied length rule)

> "This SC requires that users be provided with information about the nature of the error, including the identity of the item in error."
— wcag-understanding/error-identification.html (Intent) — "the nature of the error" is misreported (length vs digit).

> "create a password that does not meet strength requirements"
— refs/trusted-tester/sc-3.3.1-error-identification.md (How to Test) — the tester who violates a *specific* strength rule (no digit) finds the described error (length) does not match the violation.
