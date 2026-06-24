# case-03 — "Improve your password." on a creation field with a concrete, enforced, never-stated policy

## Scenario
A SaaS signup ("Cobalt Project Tracker") validates the new password live as the user types: an `aria-live="polite"` status announces the result, the input gets `aria-invalid`, and the message is tied via `aria-describedby`. When the password fails, the only feedback is **"Improve your password."** The policy it enforces is concrete and fully determinate — the validator requires **≥ 12 characters, at least one digit, and at least one symbol** — but none of those requirements is ever surfaced. "Improve" gives no direction: longer? a number? a capital? a symbol? The user is left to brute-force the unstated rule. Crucially this is account *creation* (the policy is meant to be public), not login, so the 3.3.3 security carve-out does not apply.

## Attribute tuple
- **content-domain:** SaaS / developer-tools account creation
- **UI-component / pattern:** SPA inline password validation with a strength meter + `aria-live="polite"` status (the SCR18/SCR32 client-side-validation pattern)
- **host-language construct:** `<input type="password" aria-invalid aria-describedby>` + live `<p role="status">`
- **locale / i18n:** en-US
- **failure-mechanism:** an enforced, knowable creation policy is reduced to the imperative filler "Improve your password" with zero specifics
- **prevalence:** MID — "Improve / strengthen your password" copy is common in growth-tuned signup flows that hide the rules to look friendly

## Developer persona
A growth-minded product designer asked for "encouraging, low-friction" microcopy and replaced the engineer's bulleted requirement list with the single upbeat line "Improve your password," reasoning that listing rules felt heavy. The validation logic (12 chars / digit / symbol) stayed exactly as written; only the human-facing message was softened into something content-free. Live announcement, `aria-invalid`, and association were all kept, so an audit's structural items passed.

## Element / selector carrying the issue
`#pw-msg` ("Improve your password.") describing `#pw`, whose JS validator `passes()` enforces `length >= 12 && /\d/ && /[^A-Za-z0-9]/`. The rule is determinate and stated nowhere in the UI.

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Screen-reader user:** as they type, the polite region announces "Improve your password." repeatedly. They have no way to know the field wants 12+ characters, a digit, and a symbol; each new attempt is a blind guess against an invisible policy. A sighted user at least sees the red strength bar move, but the bar is `aria-hidden` and conveys no rule either, so even that visual crutch is unavailable to AT.
- **Cognitively-loaded user:** "improve" is not an instruction they can act on — improve *how?* — which is precisely the population 3.3.3 protects.
- **What an adequate message would say:** "Use at least 12 characters including a number and a symbol." — exactly the determinate policy the code already holds.

## Expected ACT-style outcome
**failed** (SC 3.3.3 — the required format/values are known and stating them would not jeopardize security in an account-creation context, so a correction suggestion is possible; "Improve your password." provides neither a suggestion nor adequate information to fix the error).

## Why automated tools miss it
Structurally this is a clean inline-validation widget: labelled input, live `role="status"`, `aria-invalid`, `aria-describedby`, good contrast and focus order — axe/WAVE/Lighthouse pass it and 3.3.1 is satisfied. A fix-phrasing heuristic also passes: "Improve your password" is an imperative verb directed at the field. No scanner reads the validator to learn the policy is `≥12 + digit + symbol`, notices the message states none of it, and concludes the suggestion is inadequate. (A scanner might even wrongly *credit* the page under the security carve-out; distinguishing a creation policy that must be stated from a login response that must not is itself a human judgment.) That comparison of message against a knowable, code-defined policy is unavailable to automation.

## Citation
> "The intent of this success criterion is to ensure that users receive appropriate suggestions for correction of an input error if it is possible."
— wcag-understanding/error-suggestion.html (Intent) — correction is possible because the policy is determinate; no suggestion is given.

> "Providing information about how to correct input errors allows users who have learning disabilities to fill in a form successfully."
— wcag-understanding/error-suggestion.html (Benefits) — "Improve your password" provides no information about *how*, defeating this benefit.

> "Providing information about how to correct the error would jeopardize the security or purpose of the content (e.g., details about an incorrect password)."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (DNA list) — the carve-out is for an *incorrect login* password; it does not excuse withholding a *creation* policy, so this field still owes an adequate suggestion.
