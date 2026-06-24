# case-06 — "Username unavailable." (no suggestion) next to a sibling slug field that DOES offer computed alternatives — proving the correction is knowable (FAIL)

## Scenario
An Orbit Developer Hub "claim your handles" step rendered in its **post-submit error state**, with a built-in controlled comparison. Two sibling fields both have a taken value and both show an error identified in text:
- **Project slug** offers a suggestion of corrected input: *"Taken. Try one of: orbit-telemetry-2, orbit-telemetry-io, or telemetry-by-mira."* — proving the system has an alternative-generator that runs on this page.
- **Username** shows only **"Username unavailable."** — a bare restatement with no alternatives and no hint of the naming rules.

The username error is the SC 3.3.3 failure: the correction is **provably knowable** (the sibling demonstrates the very engine that would compute available handles), yet none is offered for the username.

## Attribute tuple
- **content-domain:** developer platform / SaaS account setup
- **UI-component / pattern:** prefixed text inputs ("orbit.dev/@", "orbit.dev/p/"); two sibling fields as a controlled comparison; inline `aria-describedby` errors
- **host-language construct:** uniqueness-constrained identifiers with a server-side alternative-suggestion engine
- **locale / i18n:** en-US
- **failure-mechanism:** bare restatement where the correction is demonstrably knowable — the adjacent field uses the same engine to produce suggestions, defeating any "not knowable" defense

## Developer persona
The platform team built a `suggestAlternatives(taken)` service and wired it into the **slug** flow first because slug collisions were the noisy support driver. The **username** flow predated that work and still used the original one-line `"Username unavailable."` string; nobody circled back to route usernames through the same generator. So one field on the same page proves the correction is computable while the other withholds it — a realistic drift between two code paths that ship side by side.

## Element / selector carrying the issue
`#username-error` (text `"Username unavailable."`), referenced by `#username[aria-describedby="username-error"]`. The proof that the correction is knowable is the sibling `#slug-error`, which offers three computed alternatives for an equivalent collision.

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Screen-reader user:** navigating the form hears, on the username, "Username, edit, invalid entry, Username unavailable." — and then on the very next field hears three concrete alternatives for the slug. They are given a way forward for the slug but left to brute-force the username (mira1? mira_dev? m.ira?), with no rules and no candidates, despite the system clearly being able to suggest them.
- **Cognitive user:** the inconsistency is disorienting — one error helps, the adjacent one does not — and the unhelpful one blocks completion.
- **Why "not knowable" fails as a defense:** SC 3.3.3 and Trusted Tester only excuse a missing suggestion when correction is *not knowable*. Here the page itself disproves that for handles: the slug field's computed alternatives establish that available-name suggestions are knowable and already implemented. The username's omission is therefore a genuine failure, not a DNA.

## Expected ACT-style outcome
**failed** (SC 3.3.3 — for the username field, an input error is detected and corrected-input suggestions are knowable/available, but they are not provided to the user).

## Why automated tools miss it
axe / WAVE / Lighthouse see two structurally identical, correctly-wired error messages (labels resolve, `aria-describedby` resolves to non-empty strings, `aria-invalid="true"`, contrast fine) — SC 3.3.1 passes on both. No checker reads the *content* of the two messages to notice that one contains actionable suggestions and the other is an empty restatement, and certainly none reasons that the suggestion-bearing sibling proves the correction is knowable for the failing field. That cross-field, content-comparing inference is pure human semantic judgment.

## Citation
> "If an input error is automatically detected and suggestions for correction are known, then the suggestions are provided to the user, unless it would jeopardize the security or purpose of the content."
— refs/trusted-tester/sc-3.3.3-error-suggestion.md (the SC text — "are known" is satisfied here: the sibling field proves alternatives are computable, so they must be provided)

> "The user enters an incorrectly spelled city name. The server returns the form ... and a link to a list of city names that the user may have meant, as determined by comparing their original input to a database of city names."
— wcag-techniques/general/G177.html (Examples — computing similar valid values from a known pool is exactly what the slug does and the username should)

> "The objective of this technique is to suggest correct text where the information supplied by the user is not accepted and possible correct text is known. The suggestions may include ... similar text from a known pool of possible text."
— wcag-techniques/general/G177.html (Description — available handles are a "known pool"; the username error suggests none)
