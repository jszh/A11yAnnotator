# case-04 — "Password" creation field: complexity rules are error-as-format, never stated up front

## Scenario
A SaaS signup ("Cadence workspace"). The password-creation field is labelled **"Password"** and has a
help line under it — but the help only says "Choose something memorable", which is friendly and
misleading. The real complexity rules (at least 12 characters **and** at least one symbol) are enforced
only by the submit handler and disclosed only in the error message *after* a rejected submit. So the
label and its visible instruction name the topic and give vague guidance, while the actual data
requirements appear only as error-as-format — which TT 5.B explicitly says is insufficient.

## Attribute tuple
- **content-domain:** SaaS analytics dashboard / B2B trial signup
- **UI-component/pattern:** centered signup panel with email + new-password fields and help text
- **host-language construct:** `<label>` + `<input type="password">` + a `.help` instruction that does NOT state the rules + a hidden error that does
- **locale/i18n:** en
- **failure-mechanism:** complexity/data requirements exist but surface only after a rejected submit (error-as-format)

## Developer persona
A growth-focused founder told the developer to "keep signup friction-free and the copy warm", so the
password hint was written as "Choose something memorable" rather than a rules list. The 12-character +
symbol policy was added later in the auth service to satisfy a security review, and the only place it
got reflected on the front end was the error branch of the submit handler. The reassuring instruction
and the real policy were authored by different people at different times and never reconciled.

## Element / selector carrying the issue
`#password` (`input[name="password"]`), label "Password" via `label[for="password"]`. The associated
visible instruction `p.help` reads "Choose something memorable" and does not state the policy. The real
constraint (`v.length >= 12 && /[^A-Za-z0-9]/.test(v)`) lives only in the submit handler; the rule text
appears only in `#pw-err`, shown after a failed submit.

## Exact accessibility mechanism (what AT experiences, why it fails)
A screen-reader user hears "Password, edit text" and then the instruction "Choose something memorable".
Presence of a label and instruction satisfies 3.3.2, and the label is a correct, non-empty accessible
name (4.1.2 fine). But neither the label nor the instruction communicates the applicable data
requirements — minimum 12 characters and at least one symbol — so the user cannot tell what input is
expected and will likely create a short or all-alphanumeric password that is rejected. They learn the
real rule only from the after-submit error. TT 5.B's Note is explicit that an error message is not
sufficient to communicate the expected format. The topic ("Password") is correct, so this is purely the
missing-requirement limb, not a topic mismatch.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The label is present, associated, and non-empty, and there is even a visible instruction paragraph — so
axe-core, WAVE and Lighthouse see a generously labelled field and report nothing. Worse for tooling: the
presence of *some* help text can read as a positive signal. No scanner evaluates whether that
instruction actually states the enforced complexity policy, nor reads the validator to learn the
12-char/symbol rule. Judging that "Choose something memorable" fails to convey the real requirement —
which appears only on error — is a semantic comparison only a human can make.

## Citation
> **Trusted Tester v5.1.3 — Test 5.B, Notes:**
> "An **error message is not sufficient** to communicate the expected format to pass this test."

(Verbatim from `refs/trusted-tester/sc-2.4.6-headings-and-labels.md`. The 12-character/symbol policy is disclosed only in the post-submit error, which this Note rules out.)

> **WCAG 2.2 Understanding — Headings and Labels, Benefits:**
> "Form input controls with labels that clearly and accurately describe the content that is expected to be entered helps users know how to successfully complete the form."

(Verbatim from `wcag-understanding/headings-and-labels.html`. "Choose something memorable" does not accurately describe the content expected — a 12-character password containing a symbol — so the user cannot know how to complete the form successfully.)
