# case-01 — DOB field: visible label "Date of birth (MM/DD/YYYY)" but accessible name "dob_1"

## Scenario
A patient-registration form on a healthcare portal. The date-of-birth field has a properly
associated `<label>` reading **"Date of birth (MM/DD/YYYY)"** — descriptive AND carrying the
data-format requirement that TT 5.B explicitly asks a label to convey. But the same `<input>`
carries `aria-label="dob_1"`, which **wins** the accessible-name computation over the associated
`<label>`. The computed accessible name is the bare slug **"dob_1"**. Sighted users get a perfect
label; screen-reader users hear "dob 1, edit text" — no purpose, no format.

## Attribute tuple
- **Content domain:** healthcare / patient portal
- **UI component / pattern:** native text input with associated `<label for>` + hint
- **Host-language construct:** `<input type="text" aria-label="…">` overriding `<label for>`
- **Locale / i18n:** en-US
- **Failure mechanism:** `aria-label` overrides a descriptive visible `<label>`; divergence type =
  **VISIBLE-DESCRIPTIVE / ANNOUNCED-VAGUE** (also strips the MM/DD/YYYY data-requirement)
- **ARIA anti-pattern (facets.json):** "aria-label overrides/contradicts the visible text label"

## Developer persona
An Angular team's end-to-end test suite queries form fields by `aria-label`, so a developer added
`aria-label="dob_1"` to the DOB input purely as a stable test selector hook. They did not realize
`aria-label` overrides the associated `<label>` in the accessible-name computation, so the
test-only slug became the user-facing accessible name.

## Element / selector carrying the issue
`input#dob` — visible label (via `for="dob"`) is "Date of birth (MM/DD/YYYY)", but
`aria-label="dob_1"` computes the accessible name. Verified in Chromium: `role=textbox`,
`accName="dob_1"`.

## Exact accessibility mechanism
Per the accessible-name computation, `aria-label` takes precedence over a `<label for>`
association. So although the field is correctly labelled for sighted users and for 3.3.2/4.1.2
purposes, AT announces only "dob 1". The visible surface and the announced surface **diverge in
descriptiveness**: the eye reads a clear, format-bearing label; the screen reader reads a
meaningless slug. A blind user does not learn that this field expects a date, nor in what format —
defeating the very thing the visible label communicates.

## Expected ACT-style outcome
**failed** — TT 5.B (`2.4.6-label-descriptive`) judges whether the label is "sufficiently clear and
descriptive, so users know what input data is expected"; the announced label "dob_1" is neither.
The other two fields (Full legal name, Email address) have no override and pass.

## Why automated tools miss it
The field HAS a non-empty accessible name ("dob_1") and a correctly associated `<label>`, so
axe/WAVE/Lighthouse 4.1.2 and label-presence checks all pass — verified: a full `axe.run` (default
ruleset + experimental `label-content-name-mismatch`) reports **0 violations** on this page. No rule
fires because nothing is missing or empty; deciding that "dob_1" fails to describe the field's
purpose (and drops the format requirement that the visible label carries) is a semantic judgment
about descriptiveness that no checker performs. There is no contained-text mismatch to detect because
this is a form field, not a control with a visible text node.

## Citation
> "It is possible for controls and inputs to have an appropriate accessible name (e.g. using
> `aria-label="…"`) and therefore pass Success Criterion 4.1.2, but to still fail this success
> criterion (if the label is inaccurate or insufficiently clear or descriptive)."
— WCAG 2.2 Understanding, *Headings and Labels*, Intent (`wcag-understanding/headings-and-labels.html`)
