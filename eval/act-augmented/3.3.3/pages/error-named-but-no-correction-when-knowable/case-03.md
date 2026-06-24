# case-03 — Password field: "Password does not meet requirements." with the rules sitting in the validator but never surfaced (FAIL)

## Scenario
A Cadence HR workspace-creation form rendered in its **post-submit error state**. The user chose the password `summertime`. The visible, programmatically associated error reads only **"Password does not meet requirements."** The requirements are fully knowable — they are literally encoded in this page's own `RULES` array in the inline `<script>` (≥ 12 characters, one uppercase letter, one number, one symbol), and the chosen value violates three of the four. The system computes exactly which rules failed (`failed[]`) but discards that list instead of surfacing it. No length/complexity hint appears anywhere in the UI — no placeholder, no help text — so a human reading the rendered page finds the rule nowhere.

## Attribute tuple
- **content-domain:** SaaS / B2B HR-software onboarding
- **UI-component / pattern:** native `<input type="password">` with inline `aria-describedby` error; a real client-side validator (`RULES[]`) present in `<script>`
- **host-language construct:** client-side validation that knows the failed-rule set but writes a generic string
- **locale / i18n:** en-US
- **failure-mechanism:** bare restatement — the message names the failure category but withholds the knowable, per-rule correction the validator already computed

## Developer persona
A full-stack dev built a reusable `validate(pw)` helper that returns a boolean for the submit gate. The richer `failed[]` array (which rules broke) existed in the function but was never threaded into the UI — the dev only needed the boolean to block submission, so the UI just shows a single catch-all string. The rule list was "documented in the code," which felt sufficient. The message is present, associated, and high-contrast, so it passed review and an axe scan; the gap (the message doesn't tell the user the rules) was never treated as a defect.

## Element / selector carrying the issue
`#pw-error` (text `"Password does not meet requirements."`), the message referenced by `#pw[aria-describedby="pw-error"]`, evaluated against the knowable constraints in the page's `RULES` array, which `"summertime"` violates.

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Screen-reader user:** hears "Create password, edit, invalid entry, Password does not meet requirements." They are given no rules at all — not the minimum length, not the character-class requirements. They cannot see any on-screen rule list (there is none) and must guess which of the many common password policies this site enforces, retrying blind.
- **Cognitive user:** "does not meet requirements" with no requirements stated is maximally unhelpful; abandonment is the likely outcome.
- **Note on security carve-out:** SC 3.3.3 and Trusted Tester allow withholding suggestions when doing so would jeopardize security (e.g. for an *existing* password on sign-in). That exception does NOT apply here — these are the *creation* rules for a *new* password, which are routinely and safely published; the correction is both knowable and safe to state.

## Expected ACT-style outcome
**failed** (SC 3.3.3 — an input error is detected, the correction is knowable and safe to provide, but the suggestion is not provided to the user).

## Why automated tools miss it
axe / WAVE / Lighthouse confirm the label, the resolved `aria-describedby`, `aria-invalid="true"`, and contrast — SC 3.3.1 passes. No checker reads the password policy (which lives in JS, not in any attribute), determines that the chosen value breaks specific knowable rules, and judges that the visible string surfaces none of them. `"Password does not meet requirements."` and `"Password must be 12+ characters with an uppercase letter, a number, and a symbol."` are both valid non-empty strings correctly wired to the field; only semantic reading distinguishes the restatement from the suggestion.

## Citation
> "Success Criterion 3.3.1 Error Identification provides for notification of errors. However, persons with cognitive limitations may find it difficult to understand how to correct the errors."
— wcag-understanding/error-suggestion.html (Intent — notification alone is insufficient; the user must be able to correct it)

> "Where errors are detected, suggest known ways to correct them."
— wcag-understanding/error-suggestion.html (In brief — the password rules are "known ways to correct" and must be suggested)

> "Based on the type of input required, suggestions for correction cannot be provided because they are not knowable. ... Providing information about how to correct the error would jeopardize the security or purpose of the content (e.g., details about an incorrect password)."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (DNA conditions — neither applies: the new-password rules ARE knowable and stating them does not jeopardize security)
