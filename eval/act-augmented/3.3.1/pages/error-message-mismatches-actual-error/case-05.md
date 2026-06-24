# case-05 — Hotel date range: check-out IS after check-in, error claims "must be after check-in" (false relation; real >30-night-max error undescribed)

## Scenario
A hotel booking review page in its **post-submit error state**. Check-in is `2026-08-01`, check-out is `2026-09-25` — i.e. check-out is 55 nights AFTER check-in. The check-out field shows a visible, associated error: *"Check-out date must be after your check-in date."* But check-out **is** after check-in, so the asserted relational cause is false. The form's own visible policy reads *"Maximum stay: 30 nights."* The real, undescribed error is that a 55-night stay exceeds that 30-night cap.

## Attribute tuple
- **content-domain:** travel / hotel booking
- **UI-component / pattern:** `<fieldset>` with two `<input type="date">` controls (check-in / check-out), `aria-describedby` referencing a policy block + inline error, `aria-invalid="true"`
- **host-language construct:** relational validation across two date fields + a separately-rendered policy constraint
- **locale / i18n:** en-US
- **failure-mechanism:** boilerplate mismatch — message asserts a **relation that already holds** (out > in) while the actually-violated constraint (stay ≤ 30 nights) goes undescribed

## Developer persona
A developer wired the date-range validator with two rules — "check-out after check-in" and "stay ≤ 30 nights" — but reused a single generic message, *"Check-out date must be after your check-in date,"* for every date-validation failure (it was the first rule they wrote). They tested by setting check-out before check-in (message correct) and shipped. They never tested a valid-order range that simply exceeds the maximum stay, so the wrong-message-for-the-real-rule case never surfaced. The message names the field and "describes a cause," so it passed review and an axe scan.

## Element / selector carrying the issue
`#out-err` ("Check-out date must be after your check-in date") asserting a false ordering defect, while the real violated constraint is `#stay-policy`'s "Maximum stay: 30 nights" against a 55-night range (`#checkin`=2026-08-01, `#checkout`=2026-09-25).

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Screen-reader user:** focusing check-out hears the policy text and *"Check-out date must be after your check-in date."* Their check-out (Sep 25) is plainly after their check-in (Aug 1); the instruction is nonsensical for their input. Acting on it (pushing check-out later) makes the real problem worse. They cannot determine what is actually wrong — the true constraint (30-night max) is never spoken.
- **Cognitive / non-expert traveller:** a false relational error ("end must be after start" when it already is) is disorienting; they may doubt their own date entry or abandon the booking.
- **Sighted user:** sees two dates in correct order flagged with an ordering error that does not apply.

## Expected ACT-style outcome
**failed** (SC 3.3.1 — the detected error is described with a cause that is false for the entered values; the actual violated constraint is never identified).

## Why automated tools miss it
ACT 36b590 passes: a visible, field-identifying indicator describes a cause and is in the accessibility tree. axe/WAVE/Lighthouse see two labelled date inputs in a `fieldset/legend`, a resolved `aria-describedby`, fine contrast — no fault. No automated tool compares the two date *values* to confirm check-out is already after check-in (making the message false), then cross-references the separately-stated 30-night policy to find the real violation. That is multi-field relational + policy reasoning over values and prose — a human contextual judgment.

## Citation
> "the user enters a bid that is below the previous bid or the minimum bid increment."
— wcag-understanding/error-identification.html (Intent — input-error example of a value violating a *relational/threshold* constraint; analogous to the real >30-night error this message fails to describe)

> "This SC requires that users be provided with information about the nature of the error, including the identity of the item in error."
— wcag-understanding/error-identification.html (Intent) — the "nature of the error" (over the maximum stay) is replaced by a false ordering claim.

> "Each test target either has no form field error indicators, or at least one of the form field error indicators describes: the cause of the error, or how to resolve it, in text that is visible."
— act-rules/extracted/36b590.md (Expectation 2) — satisfied at the string level by a fluent but false cause, which is exactly why the rule cannot catch this.
