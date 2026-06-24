# case-01 — "Please check your entry and try again." on a date-of-birth field whose format is fully knowable

## Scenario
A healthcare patient portal ("Northbrook Family Health") re-displays an appointment form after a failed server-side POST. The date-of-birth field is correctly flagged: `aria-invalid="true"`, an inline error tied via `aria-describedby`, a real `role="alert"` summary at the top, and focus moved to the field. Everything about error *identification* is right. The problem is the words: the inline error and the summary both say only **"Please check your entry and try again."** — fix-oriented language that conveys nothing about what the field wants. The user typed `march 3 1990`; the field actually accepts `MM/DD/YYYY` in the past (a trivially knowable, statable rule), but that is never surfaced. A second field on the same page (insurance member ID) is a PASS twin: same component, but its hint names the exact format ("3 letters followed by 9 digits, for example ABC123456789").

## Attribute tuple
- **content-domain:** healthcare / patient portal
- **UI-component / pattern:** server-redisplayed form with a `role="alert"` error summary + inline per-field error (the canonical G85/SCR32 redisplay pattern, done correctly except for wording)
- **host-language construct:** `<input type="text" aria-invalid aria-describedby>` + `<p class="err">` + summary `role="alert"`
- **locale / i18n:** en-US
- **failure-mechanism:** suggestion uses fix-oriented filler ("check your entry and try again") with zero field-specific content, on a field whose correct constraint is knowable
- **prevalence:** HEAD — the single most common generic server-validation string

## Developer persona
A back-end developer wired up the validation layer with a single shared error template — `Please check your entry and try again.` — reused for every field, because the framework's validator only returns a boolean per field and the team never wrote per-field messages. The accessibility contractor later added the `role="alert"`, `aria-invalid`, `aria-describedby`, and focus management (so the audit's "is the error identified and reachable?" items passed) but treated the message *string* as out of scope. The result identifies the error perfectly and says nothing useful.

## Element / selector carrying the issue
`#dob-err` (and the matching summary link text), both reading "Please check your entry and try again." for `#dob`. The PASS-twin contrast is `#member-hint`.

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Screen-reader user:** on load, focus lands on the DOB field and they hear "Date of birth, edit, invalid entry, Please check your entry and try again." They have already "checked" — they typed their birth date. The message gives no clue whether the field wanted `03/03/1990`, `1990-03-03`, `March 3, 1990`, or a four-digit year only. They are left to guess the format by trial and error, which is exactly the abandonment risk 3.3.3 exists to prevent.
- **Cognitively-loaded / low-literacy user:** "check your entry" presupposes they know what a correct entry looks like; they do not, and nothing tells them.
- **Contrast (PASS twin):** the member-ID hint states the format and an example, so a user can produce a correct value on the first try — the actionable target the DOB error misses.

## Expected ACT-style outcome
**failed** (SC 3.3.3 — an input error is detected and a correction *could* be suggested because the required format is knowable, but the message provides neither a suggested correction nor adequate information for the user to know what is required to fix the error; it is fix-oriented filler only).

## Why automated tools miss it
SC 3.3.1 fully passes here: the error is identified, programmatically associated, in a live `role="alert"`, and focused — axe/WAVE/Lighthouse all confirm that. A naive 3.3.3 heuristic that scans for fix-oriented phrasing ("please", "try again", "check") is *satisfied* by this string. No tool can determine that "Please check your entry and try again." carries no field-specific content, that the field's correct constraint (MM/DD/YYYY, in the past) is knowable, and that therefore a suggestion *should* have been given. Judging the semantic adequacy of fix-language against a field's knowable rule is precisely the human call no scanner can make.

## Citation
> "The intent of this success criterion is to ensure that users receive appropriate suggestions for correction of an input error if it is possible."
— wcag-understanding/error-suggestion.html (Intent) — correction here is possible (the format is knowable) yet no correction information is given.

> "Determine whether guidance provides **sufficient details** for how to correct the error and/or offers suggestions of corrected input."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (How to Test, step 2) — "Please check your entry and try again." provides no such details.

> "The description contains adequate information for the user to know what is required to fix the error."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (Evaluate Results #2) — this is the bar the vague string fails; nothing in it tells the user what is required.
